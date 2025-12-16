namespace CleanMyPosts.Models;

public class UserSettings
{
    public AppTheme Theme { get; set; } = AppTheme.Default;
    public bool ShowLogs { get; set; } = false;
    public bool ConfirmDeletion { get; set; } = true;
}