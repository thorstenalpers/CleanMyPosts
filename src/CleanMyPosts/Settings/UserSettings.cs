namespace CleanMyPosts.Settings;

public class UserSettings
{
    public AppTheme Theme { get; set; } = AppTheme.Default;
    public bool ShowLogs { get; set; }
    public bool ConfirmDeletion { get; set; } = true;

    /// <summary>Hex accent colour, used only when <see cref="UseSystemAccent"/> is off.</summary>
    public string AccentColor { get; set; } = "#3B82F6";

    public bool UseSystemAccent { get; set; } = true;
}
