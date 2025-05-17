namespace CleanMyPosts.UI.Contracts.Services;

public interface IXWebViewScriptService
{
    Task ShowPostsAsync();
    Task DeletePostsAsync();

    Task ShowLikesAsync();
    Task DeleteStarredAsync();

    Task ShowFollowingAsync();
    Task DeleteFollowingAsync();

    Task<string> GetUserNameAsync();
}