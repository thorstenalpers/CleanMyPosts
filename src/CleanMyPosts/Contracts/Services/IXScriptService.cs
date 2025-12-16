namespace CleanMyPosts.Contracts.Services;

public interface IXScriptService
{
    Task ShowPostsAsync();
    Task<int> DeletePostsAsync();

    Task ShowLikesAsync();
    Task<int> DeleteLikesAsync();

    Task ShowFollowingAsync();
    Task<int> DeleteFollowingAsync();

    Task<string> GetUserNameAsync();
    Task ShowRepostsAsync();
    Task ShowRepliesAsync();
    Task<int> DeleteRepliesAsync();
    Task<int> DeleteRepostsAsync();
}