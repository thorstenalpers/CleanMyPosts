using System.Net.Http;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;
using Microsoft.Web.WebView2.Wpf;
using Newtonsoft.Json;
using XTweetCleaner.UI.Contracts.Services;

namespace XTweetCleaner.UI.Services;

public class WebViewService : IWebViewService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<WebViewService> _logger;

    public WebViewService(IHttpClientFactory httpClientFactory, ILogger<WebViewService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task<(string authToken, string ct0)> GetTwitterCookiesAsync(WebView2 webView)
    {
        if (webView == null)
        {
            _logger.LogError("WebView is null.");
            return (null, null);
        }

        var cookies = await webView.CoreWebView2.CookieManager.GetCookiesAsync("https://x.com");

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

    public async Task<(string deleteOperationId, string userByScreenNameOperationId)> GetOperationIdsAsync(WebView2 webView, CancellationToken cancellationToken = default)
    {
        try
        {
            const string jsScript = @"
                (() => {
                  const scripts = Array.from(document.querySelectorAll('script[src]'));
                  const mainJs = scripts.find(s => s.src.includes('main') && s.src.endsWith('.js'));
                  return mainJs ? mainJs.src : '';
                })()
                ";
            var resultRaw = await webView.ExecuteScriptAsync(jsScript);
            var url = JsonConvert.DeserializeObject<string>(resultRaw);

            if (string.IsNullOrWhiteSpace(url))
            {
                _logger.LogError("url is null.");
                return (null, null);
            }

            var client = _httpClientFactory.CreateClient();
            var jsContent = await client.GetStringAsync(url, cancellationToken);

            var deleteTweetMatch = Regex.Match(jsContent, @"queryId:\s*""(?<id>[a-zA-Z0-9]+)"",\s*operationName:\s*""DeleteTweet""");
            var userMatch = Regex.Match(jsContent, @"queryId:\s*""(?<userId>[a-zA-Z0-9]+)"",\s*operationName:\s*""UserByScreenName""");

            if (deleteTweetMatch.Success && userMatch.Success)
            {
                var deleteOperationId = deleteTweetMatch.Groups["id"].Value;
                var userByScreenNameOperationId = userMatch.Groups["userId"].Value;
                return (deleteOperationId, userByScreenNameOperationId);
            }
            _logger.LogError("OperationId not found.");
            return (null, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception");
            return (null, null);
        }
    }
}
