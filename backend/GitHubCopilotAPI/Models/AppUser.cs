namespace GitHubCopilotAPI.Models;

public class AppUser
{
    public int Id { get; set; }
    public string Username { get; set; } = "";
    public string DisplayName { get; set; } = "";
    public string PasswordHash { get; set; } = "";   // PBKDF2: "base64salt:base64hash"
    public string Role { get; set; } = "admin";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLogin { get; set; }
}
