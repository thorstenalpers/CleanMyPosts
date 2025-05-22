namespace CleanMyPosts.UI.Models;

public class TimeoutSettings
{
    public int WaitAfterDelete { get; set; } = 100;
    public int WaitBetweenRetryDeleteAttempts { get; set; } = 1000;
    public int WaitAfterDocumentLoad { get; set; } = 500;
}