using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using GitHubCopilotAPI.Controllers;
using GitHubCopilotAPI.Data;
using GitHubCopilotAPI.Models;
using GitHubCopilotAPI.Services;

var builder = WebApplication.CreateBuilder(args);

// ── Controllers ───────────────────────────────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// ── Swagger con soporte Bearer ────────────────────────────────────────────────
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "GitHub Copilot Analytics API",
        Version = "v1",
        Description = "API para análisis de GitHub Copilot Premium Requests"
    });
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        In = ParameterLocation.Header,
        Description = "Ingresa el token JWT: Bearer {token}",
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } },
            Array.Empty<string>()
        }
    });
});

// ── Database ──────────────────────────────────────────────────────────────────
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Data Source=/app/data/copilot.db";

builder.Services.AddDbContext<CopilotDbContext>(options =>
    options.UseSqlite(connectionString));

// ── JWT Authentication ────────────────────────────────────────────────────────
var jwtKey = builder.Configuration["Jwt:SecretKey"]
    ?? throw new InvalidOperationException("Jwt:SecretKey no configurada en appsettings o variables de entorno.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer           = true,
            ValidateAudience         = true,
            ValidateLifetime         = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer              = "copilot-analytics",
            ValidAudience            = "copilot-frontend",
            IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ClockSkew                = TimeSpan.FromMinutes(1),
        };
    });

builder.Services.AddAuthorization();

// ── App Services ──────────────────────────────────────────────────────────────
builder.Services.AddScoped<ICsvParserService, CsvParserService>();
builder.Services.AddScoped<IMetricsService, MetricsService>();
builder.Services.AddScoped<IUsageQuotaService, UsageQuotaService>();
builder.Services.AddMemoryCache();
builder.Services.AddScoped<AIReportService>();
builder.Services.AddScoped<AIAuditService>();

// ── CORS ──────────────────────────────────────────────────────────────────────
var corsOriginsEnv = builder.Configuration["CORS:AllowedOrigins"];
var corsOrigins = !string.IsNullOrEmpty(corsOriginsEnv)
    ? corsOriginsEnv.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
    : builder.Configuration.GetSection("CORS:AllowedOrigins").Get<string[]>()
        ?? new[] { "http://localhost:8081", "http://localhost:5173" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(corsOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// ── Pipeline ──────────────────────────────────────────────────────────────────
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "GitHub Copilot Analytics API v1");
        options.RoutePrefix = "swagger";
    });
}

app.UseCors("AllowFrontend");
app.UseAuthentication();   // <-- orden importa: Authentication antes que Authorization
app.UseAuthorization();
app.MapControllers();

// ── Health check (público) ────────────────────────────────────────────────────
app.MapGet("/health", () => Results.Ok(new
{
    status    = "healthy",
    timestamp = DateTime.UtcNow,
    database  = File.Exists("/app/data/copilot.db") ? "connected" : "initializing"
})).AllowAnonymous();

// ── Inicialización de base de datos y seed de usuario admin ──────────────────
using (var scope = app.Services.CreateScope())
{
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<CopilotDbContext>();
        db.Database.EnsureCreated();

        // Tabla manual para usage_quota_rules (pre-existente, se conserva)
        db.Database.ExecuteSqlRaw(@"CREATE TABLE IF NOT EXISTS usage_quota_rules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            year INTEGER NOT NULL,
            month INTEGER NOT NULL,
            monthly_quota INTEGER NOT NULL,
            quota_label TEXT NOT NULL DEFAULT 'IA credits',
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );");
        db.Database.ExecuteSqlRaw(@"CREATE UNIQUE INDEX IF NOT EXISTS IX_UsageQuotaRules_Year_Month ON usage_quota_rules (year, month);");

        // Tabla de usuarios de la aplicación
        db.Database.ExecuteSqlRaw(@"CREATE TABLE IF NOT EXISTS AppUsers (
            Id INTEGER PRIMARY KEY AUTOINCREMENT,
            Username TEXT NOT NULL,
            DisplayName TEXT NOT NULL DEFAULT '',
            PasswordHash TEXT NOT NULL,
            Role TEXT NOT NULL DEFAULT 'admin',
            CreatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            LastLogin TEXT
        );");
        db.Database.ExecuteSqlRaw(@"CREATE UNIQUE INDEX IF NOT EXISTS IX_AppUsers_Username ON AppUsers (Username);");

        // Seed: crear usuario admin si no existe
        // Contraseña inicial: Copilot2025! — cambiar después del primer login
        var adminExists = db.AppUsers.Any(u => u.Username == "admin");
        if (!adminExists)
        {
            var initialPassword = builder.Configuration["Jwt:AdminInitialPassword"] ?? "Copilot2025!";
            db.AppUsers.Add(new AppUser
            {
                Username     = "admin",
                DisplayName  = "Administrador",
                PasswordHash = AuthController.HashPassword(initialPassword),
                Role         = "admin",
                CreatedAt    = DateTime.UtcNow,
            });
            db.SaveChanges();
            Console.WriteLine("✅ Usuario admin creado. Contraseña inicial: " + initialPassword);
        }

        Console.WriteLine("✅ Database initialized successfully");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Database initialization failed: {ex.Message}");
    }
}

Console.WriteLine($"🚀 Starting API on {builder.Configuration["ASPNETCORE_URLS"]}");
app.Run();
