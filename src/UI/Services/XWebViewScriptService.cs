using System.Net;
using System.Net.Http;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.Wpf;
using Newtonsoft.Json;
using XTweetCleaner.UI.Contracts.Services;

namespace XTweetCleaner.UI.Services;

public class XWebViewScriptService : IXWebViewScriptService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<XWebViewScriptService> _logger;

    public XWebViewScriptService(IHttpClientFactory httpClientFactory, ILogger<XWebViewScriptService> logger)
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

    public async Task<(string deleteTweetOperationId, string userByScreenNameOperationId)> GetOperationIdsAsync(WebView2 webView, CancellationToken cancellationToken = default)
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

    public async Task<string> GetTweetCountFromProfile(WebView2 webView)
    {
        const string jsScript = @"
            (() => {
                const el = document.querySelector('[data-testid=""primaryColumn""] > div > div > div');
                if (!el) return null;

                const match = el.textContent.match(/((\d|,|\.|K)+) (\w+)$/);
                if (!match) return null;

                return match[1]
                    .replace(/\.(\d+)K/, '$1'.padEnd(4, '0'))
                    .replace('K', '000')
                    .replace(',', '')
                    .replace('.', '');
            })();
        ";

        var result = await webView.ExecuteScriptAsync(jsScript);
        var tweetCount = JsonConvert.DeserializeObject<string>(result);
        return tweetCount;
    }

    public async Task<string> GetUserNameAsync(WebView2 webView)
    {
        var jsScript = @"
        (() => { 
            const element = document.querySelector('a[data-testid=""AppTabBar_Profile_Link""]');
            if (element) {
                const href = element.getAttribute('href');
                // Extract username from the href (assuming it's after the first '/')
                const username = href ? href.split('/')[1] : '';
                return username;
            }
            return '';
        })()";

        var userName = await webView.ExecuteScriptAsync(jsScript);

        // Clean up and return the username
        return userName?.Replace("\\\"", "\"")?.Trim('\"');
    }

    public async Task DeleteAllPostsAsync(WebView2 webView)
    {
        const int maxPosts = 10_000; // or your desired limit

        var userName = await GetUserNameAsync(webView);
        var query = $"from:{userName} since:2000-01-01";
        var encodedQuery = WebUtility.UrlEncode(query);
        var url = $"https://x.com/search?q={encodedQuery}&src=typed_query";
        webView.Source = new Uri(url);

        var navigationCompletedTcs = new TaskCompletionSource<bool>();
        EventHandler<CoreWebView2NavigationCompletedEventArgs> handler = null!;
        handler = (s, e) =>
        {
            webView.NavigationCompleted -= handler;
            navigationCompletedTcs.SetResult(e.IsSuccess);
        };
        webView.NavigationCompleted += handler;
        var navigationSuccess = await navigationCompletedTcs.Task;

        if (!navigationSuccess)
        {
            _logger.LogWarning("Failed to navigate to the URL.");
            return;
        }

        for (var i = 0; i < maxPosts; i++)
        {
            var exists = await PostExistsAsync(webView);
            if (!exists)
            {
                _logger.LogInformation("No more posts found.");
                break;
            }

            var countBefore = await GetCaretCountAsync(webView);
            _logger.LogInformation("Found {CaretCount} posts before delete.", countBefore);

            try
            {
                _logger.LogInformation("Attempting to delete post #{PostNumber}...", i + 1);
                await DeleteSinglePostAsync(webView);

                var deleted = await WaitForPostDeletedAsync(webView, countBefore);
                if (deleted)
                {
                    _logger.LogInformation("Successfully deleted post #{PostNumber}", i + 1);
                }
                else
                {
                    _logger.LogWarning("Post #{PostNumber} was not deleted (DOM didn't update).", i + 1);
                    break; // or retry, up to you
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception while deleting post #{PostNumber}.", i + 1);
                break;
            }
        }
    }

    //public async Task DeleteAllPostsAsync(WebView2 webView)
    //{
    //    //var maxPosts = 10_000_000;
    //    var maxPosts = 2;

    //    var userName = await GetUserNameAsync(webView);
    //    var query = $"from:{userName} since:2000-01-01";
    //    var encodedQuery = WebUtility.UrlEncode(query);
    //    var url = $"https://x.com/search?q={encodedQuery}&src=typed_query";
    //    webView.Source = new Uri(url);
    //    var navigationCompletedTcs = new TaskCompletionSource<bool>();

    //    webView.NavigationCompleted += IsNavigationCompleted(navigationCompletedTcs);
    //    var navigationSuccess = await navigationCompletedTcs.Task;
    //    webView.NavigationCompleted -= IsNavigationCompleted(navigationCompletedTcs);

    //    if (!navigationSuccess)
    //    {
    //        _logger.LogWarning("Failed to navigate to the URL.");
    //        return;
    //    }

    //    for (var i = 0; i < maxPosts; i++)
    //    {
    //        var exists = await PostExistsAsync(webView);
    //        if (!exists)
    //        {
    //            _logger.LogInformation("No more posts found.");
    //            break;
    //        }
    //        try
    //        {
    //            await DeleteSinglePostAsync(webView);
    //            _logger.LogInformation("Successfully deleted post #{PostNumber}", i + 1);
    //        }
    //        catch (Exception ex)
    //        {
    //            _logger.LogError(ex, "Failed to delete post #{PostNumber}.", i + 1);
    //        }
    //    }
    //    _logger.LogInformation("No more posts found.");
    //}

    private static EventHandler<Microsoft.Web.WebView2.Core.CoreWebView2NavigationCompletedEventArgs> IsNavigationCompleted(TaskCompletionSource<bool> navigationCompletedTcs)
    {
        return (sender, args) =>
        {
            if (args.IsSuccess)
            {
                navigationCompletedTcs.SetResult(true);
            }
            else
            {
                navigationCompletedTcs.SetResult(false);
            }
        };
    }

    private async Task<bool> PostExistsAsync(WebView2 webView)
    {
        const int maxRetries = 5; // Maximum retry count
        const int delayInMilliseconds = 500; // Delay between retries
        var attempts = 0;

        while (attempts < maxRetries)
        {
            var result = await webView.ExecuteScriptAsync("document.querySelector('div[data-testid=\"primaryColumn\"] section button[data-testid=\"caret\"]') !== null");

            if (result == "true")
            {
                return true; // Post exists
            }

            attempts++;
            // Wait before retrying
            await Task.Delay(delayInMilliseconds);
        }

        // If we've exhausted retries and still didn't find the button, return false
        return false;
    }

    private async Task DeleteSinglePostAsync(WebView2 webView)
    {
        const string jsScript = @"
            document.querySelector('div[data-testid=""primaryColumn""] section button[data-testid=""caret""]')?.click();

            const delays = [100, 200, 500, 1000];

            function tryClickDelete(attempt = 0) {
                if (attempt >= delays.length) return;

                setTimeout(() => {
                    const menu = document.querySelector('[role=""menu""]');
                    if (menu && menu.style.display !== 'none') {
                        const menuItems = document.querySelectorAll('[role=""menuitem""]');
                        let deleteClicked = false;

                        for (const item of menuItems) {
                            const span = item.querySelector('span');
                            if (!span) continue;

                            const color = getComputedStyle(span).color;
                            const match = color.match(/rgb\((\d+), (\d+), (\d+)\)/);

                            if (match) {
                                const [r, g, b] = match.slice(1).map(Number);
                                if (r > 180 && g < 100 && b < 100) {
                                    span.click();
                                    deleteClicked = true;

                                    retryConfirm();
                                    break;
                                }
                            }
                        }

                        if (!deleteClicked) {
                            tryClickDelete(attempt + 1);
                        }
                    } else {
                        console.log('Menu not visible yet, retrying...');
                        tryClickDelete(attempt + 1); // Retry if menu is not visible
                    }
                }, delays[attempt]);
            }

            function retryConfirm(attempt = 0) {
                if (attempt >= delays.length) return;

                setTimeout(() => {
                    const confirmBtn = document.querySelector('button[data-testid=""confirmationSheetConfirm""]');
                    if (confirmBtn && confirmBtn.offsetParent !== null) { // Ensure the button is visible
                        confirmBtn.click();
                        console.log('Delete confirmed.');
                    } else {
                        console.log('Confirmation button not found or not visible, retrying...');
                        retryConfirm(attempt + 1);
                    }
                }, delays[attempt]);
            }

            tryClickDelete();";

        await webView.ExecuteScriptAsync(jsScript);
    }

    private async Task<int> GetCaretCountAsync(WebView2 webView)
    {
        var js = @"(() => {
            return document.querySelectorAll('div[data-testid=""primaryColumn""] section button[data-testid=""caret""]').length;
        })()";

        var result = await webView.ExecuteScriptAsync(js);
        return int.TryParse(result?.Trim('"'), out var count) ? count : 0;
    }

    private async Task<bool> WaitForPostDeletedAsync(WebView2 webView, int previousCount, int timeoutMs = 5000)
    {
        var interval = 200;
        var elapsed = 0;

        while (elapsed < timeoutMs)
        {
            var currentCount = await GetCaretCountAsync(webView);
            if (currentCount < previousCount)
                return true;

            await Task.Delay(interval);
            elapsed += interval;
        }

        return false;
    }

    //private async Task DeleteSinglePostAsync(WebView2 webView)
    //{
    //    const string jsScript = @"
    //    document.querySelector('button[data-testid=""caret""]')?.click();

    //    const delays = [100, 200, 500, 1000];

    //    function tryClickDelete(attempt = 0) {
    //        if (attempt >= delays.length) return;

    //        setTimeout(() => {
    //            const menuItems = document.querySelectorAll('[role=""menuitem""]');
    //            let deleteClicked = false;

    //            for (const item of menuItems) {
    //                const span = item.querySelector('span');
    //                if (!span) continue;

    //                const color = getComputedStyle(span).color;
    //                const match = color.match(/rgb\((\d+), (\d+), (\d+)\)/);

    //                if (match) {
    //                    const [r, g, b] = match.slice(1).map(Number);
    //                    if (r > 180 && g < 100 && b < 100) {
    //                        span.click();
    //                        deleteClicked = true;

    //                        // Retry logic for confirmation button
    //                        retryConfirm(attempt);
    //                        break;
    //                    }
    //                }
    //            }

    //            if (!deleteClicked) {
    //                tryClickDelete(attempt + 1);
    //            }
    //        }, delays[attempt]);
    //    }

    //    function retryConfirm(attempt = 0) {
    //        if (attempt >= delays.length) return;

    //        setTimeout(() => {
    //            const confirmBtn = document.querySelector('button[data-testid=""confirmationSheetConfirm""]');
    //            if (confirmBtn) {
    //                confirmBtn.click();
    //                console.log('Delete confirmed.');
    //            } else {
    //                retryConfirm(attempt + 1);
    //            }
    //        }, delays[attempt]);
    //    }

    //    tryClickDelete();";

    //    await webView.ExecuteScriptAsync(jsScript);
    //}


}
