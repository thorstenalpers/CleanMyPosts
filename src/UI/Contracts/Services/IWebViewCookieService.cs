using Microsoft.Web.WebView2.Core;

namespace XTweetCleaner.UI.Contracts.Services;

public interface IWebViewCookieService
{
    Task<(string authToken, string ct0)> GetTwitterCookiesAsync(CoreWebView2 webView);
}