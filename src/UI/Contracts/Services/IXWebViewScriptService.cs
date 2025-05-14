
using Microsoft.Web.WebView2.Wpf;

namespace XTweetCleaner.UI.Contracts.Services;

public interface IXWebViewScriptService
{
    Task DeleteAllPostsAsync(WebView2 webView);
    Task<(string deleteTweetOperationId, string userByScreenNameOperationId)> GetOperationIdsAsync(WebView2 webView, CancellationToken cancellationToken = default);
    Task<string> GetTweetCountFromProfile(WebView2 webView);
    Task<(string authToken, string ct0)> GetTwitterCookiesAsync(WebView2 webView);
    Task<string> GetUserNameAsync(WebView2 webView);
}