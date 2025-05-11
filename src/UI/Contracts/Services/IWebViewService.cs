
using Microsoft.Web.WebView2.Wpf;

namespace XTweetCleaner.UI.Contracts.Services;

public interface IWebViewService
{
    Task<(string deleteOperationId, string userByScreenNameOperationId)> GetOperationIdsAsync(WebView2 webView, CancellationToken cancellationToken = default);
    //Task<string> GetScreenNameAsync(WebView2 webView, CancellationToken cancellationToken = default);
    Task<(string authToken, string ct0)> GetTwitterCookiesAsync(WebView2 webView);
}