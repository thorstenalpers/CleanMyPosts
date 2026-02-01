namespace CleanMyPosts.Contracts.Services;

public interface IYouTubeScriptService
{
    Task ShowPostsAsync();
    Task<int> DeletePostsAsync();
    Task<string> GetChannelHandleAsync();
}
