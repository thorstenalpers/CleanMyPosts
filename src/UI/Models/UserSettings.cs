namespace CleanMyPosts.UI.Models;

public class UserSettings
{
    public AppTheme Theme { get; set; } = AppTheme.Default;
    public bool ShowLogs { get; set; } = false;
    public bool ConfirmDeletion { get; set; } = true;
    public int WaitBeforeTryClickDelete { get; set; } = 100;
    public int WaitBetweenTryClickDeleteAttempts { get; set; } = 1000;
}