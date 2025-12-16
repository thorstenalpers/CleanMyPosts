namespace CleanMyPosts.Models;

public class TimeoutSettings
{
    public int WaitAfterDelete { get; set; } = 500;
    public int WaitBetweenRetryDeleteAttempts { get; set; } = 500;
    public int WaitAfterDocumentLoad { get; set; } = 3000;
}