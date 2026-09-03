# ── Etapa 1: Build ────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["GitHubCopilotAPI/GitHubCopilotAPI.csproj", "GitHubCopilotAPI/"]
RUN dotnet restore "GitHubCopilotAPI/GitHubCopilotAPI.csproj"

COPY . .
WORKDIR "/src/GitHubCopilotAPI"
RUN dotnet publish "GitHubCopilotAPI.csproj" -c Release -o /app/publish /p:UseAppHost=false

# ── Etapa 2: Runtime ──────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# curl para el healthcheck; sin cache de apt
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

# Usuario no-root explícito.
# uid 1001 evita colisiones con el uid 1000 que Podman rootless suele asignar
# al primer usuario en el sub-UID map.
RUN groupadd -g 1001 appgroup \
 && useradd  -u 1001 -g appgroup -s /sbin/nologin -d /app appuser

COPY --from=build /app/publish .

# Directorios de datos con propiedad del usuario de la app.
# Podman además aplicará :U en los bind-mounts del compose para mantener
# la propiedad correcta en el host rootless.
RUN mkdir -p /app/data /app/use-cases \
 && chown -R appuser:appgroup /app/data /app/use-cases

USER appuser

EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ConnectionStrings__DefaultConnection="Data Source=/app/data/copilot.db"

ENTRYPOINT ["dotnet", "GitHubCopilotAPI.dll"]
