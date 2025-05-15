
using Microsoft.Web.WebView2.Wpf;

namespace XTweetCleaner.UI.Contracts.Services;

public interface IXWebViewScriptService
{
    Task DeleteAllPostsAsync(WebView2 webView);
    Task<string> GetUserNameAsync(WebView2 webView);
}