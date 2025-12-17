namespace CleanMyPosts.Models;

public class NavigationCompletedEventArgs : EventArgs
{
    public bool IsSuccess { get; set; }
}