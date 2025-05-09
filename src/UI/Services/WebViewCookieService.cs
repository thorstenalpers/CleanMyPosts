using Microsoft.Web.WebView2.Core;
using XTweetCleaner.UI.Contracts.Services;

namespace XTweetCleaner.UI.Services;

public class WebViewCookieService : IWebViewCookieService
{
    public async Task<(string authToken, string ct0)> GetTwitterCookiesAsync(CoreWebView2 webView)
    {
        if (webView == null)
        {
            throw new ArgumentNullException(nameof(webView), "WebView cannot be null.");
        }

        var cookies = await webView.CookieManager.GetCookiesAsync("https://x.com");

        string authToken = null;
        string ct0 = null;

        foreach (var cookie in cookies)
        {
            if (cookie.Name == "auth_token")
            {
                authToken = cookie.Value;
            }
            else if (cookie.Name == "ct0")
            {
                ct0 = cookie.Value;
            }
        }

        return (authToken, ct0);
    }
}
