using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using GitHubCopilotAPI.Data;
using GitHubCopilotAPI.Models;

namespace GitHubCopilotAPI.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly CopilotDbContext _context;
    private readonly IConfiguration _config;
    private readonly ILogger<AuthController> _logger;

    public AuthController(CopilotDbContext context, IConfiguration config, ILogger<AuthController> logger)
    {
        _context = context;
        _config = config;
        _logger = logger;
    }

    // ── POST /api/auth/login ──────────────────────────────────────────────────

    public record LoginRequest(string Username, string Password);
    public record LoginResponse(string Token, DateTime ExpiresAt, string Username, string DisplayName, string Role);

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Username) || string.IsNullOrWhiteSpace(req.Password))
            return BadRequest(new { error = "Usuario y contraseña requeridos." });

        var user = await _context.AppUsers
            .FirstOrDefaultAsync(u => u.Username == req.Username.Trim().ToLower());

        if (user == null || !VerifyPassword(req.Password, user.PasswordHash))
        {
            _logger.LogWarning("Login fallido para usuario: {Username}", req.Username);
            return Unauthorized(new { error = "Credenciales incorrectas." });
        }

        user.LastLogin = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        var token = GenerateJwt(user);
        _logger.LogInformation("Login exitoso: {Username}", user.Username);

        return Ok(new LoginResponse(token.Token, token.ExpiresAt, user.Username, user.DisplayName, user.Role));
    }

    // ── GET /api/auth/me ──────────────────────────────────────────────────────

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        var username = User.FindFirstValue(ClaimTypes.Name);
        var user = await _context.AppUsers.FirstOrDefaultAsync(u => u.Username == username);
        if (user == null) return Unauthorized();
        return Ok(new { user.Username, user.DisplayName, user.Role, user.LastLogin });
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private (string Token, DateTime ExpiresAt) GenerateJwt(AppUser user)
    {
        var secretKey = _config["Jwt:SecretKey"]
            ?? throw new InvalidOperationException("Jwt:SecretKey no configurada.");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expires = DateTime.UtcNow.AddHours(8);

        var claims = new[]
        {
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.GivenName, user.DisplayName),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };

        var token = new JwtSecurityToken(
            issuer: "copilot-analytics",
            audience: "copilot-frontend",
            claims: claims,
            expires: expires,
            signingCredentials: creds);

        return (new JwtSecurityTokenHandler().WriteToken(token), expires);
    }

    // ── Password helpers (PBKDF2 — solo BCL, sin paquetes externos) ──────────

    public static string HashPassword(string password)
    {
        byte[] salt = RandomNumberGenerator.GetBytes(16);
        byte[] hash = Rfc2898DeriveBytes.Pbkdf2(
            Encoding.UTF8.GetBytes(password),
            salt,
            iterations: 100_000,
            HashAlgorithmName.SHA256,
            outputLength: 32);
        return $"{Convert.ToBase64String(salt)}:{Convert.ToBase64String(hash)}";
    }

    public static bool VerifyPassword(string password, string stored)
    {
        var parts = stored.Split(':');
        if (parts.Length != 2) return false;
        byte[] salt         = Convert.FromBase64String(parts[0]);
        byte[] expectedHash = Convert.FromBase64String(parts[1]);
        byte[] actualHash   = Rfc2898DeriveBytes.Pbkdf2(
            Encoding.UTF8.GetBytes(password),
            salt,
            iterations: 100_000,
            HashAlgorithmName.SHA256,
            outputLength: 32);
        return CryptographicOperations.FixedTimeEquals(expectedHash, actualHash);
    }
}
