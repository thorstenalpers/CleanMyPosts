namespace XTweetCleaner.UI.Contracts.Services;

public interface IXWebViewScriptService
{
    Task DeleteAllPostsAsync();
    Task<string> GetUserNameAsync();
}