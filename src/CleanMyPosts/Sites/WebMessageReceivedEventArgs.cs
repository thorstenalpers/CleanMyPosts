namespace CleanMyPosts.Sites;

public class WebMessageReceivedEventArgs : EventArgs
{
    public required string Message { get; init; }
}