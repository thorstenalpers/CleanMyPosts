namespace CleanMyPosts.Contracts.Services;

public interface IYouTubeScriptService
{
    Task ShowCommentsAsync();
    Task<int> DeleteCommentsAsync();
    Task ShowLikesAsync();
    Task<int> DeleteLikesAsync();
    Task<string> GetLoginStatusAsync();
}
