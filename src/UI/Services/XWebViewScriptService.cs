using System.Net;
using Microsoft.Extensions.Logging;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.Wpf;
using XTweetCleaner.UI.Contracts.Services;

namespace XTweetCleaner.UI.Services;

public class XWebViewScriptService(ILogger<XWebViewScriptService> logger) : IXWebViewScriptService
{
    private readonly ILogger<XWebViewScriptService> _logger = logger;

    public async Task<string> GetUserNameAsync(WebView2 webView)
    {
        var jsScript = @"
        (() => { 
            const element = document.querySelector('a[data-testid=""AppTabBar_Profile_Link""]');
            if (element) {
                const href = element.getAttribute('href');
                const username = href ? href.split('/')[1] : '';
                return username;
            }
            return '';
        })()";

        var userName = await webView.ExecuteScriptAsync(jsScript);

        return userName?.Replace("\\\"", "\"")?.Trim('\"');
    }

    public async Task DeleteAllPostsAsync(WebView2 webView)
    {
        const int maxPosts = 1;

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
                    break;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception while deleting post #{PostNumber}.", i + 1);
                break;
            }
        }
    }

    private async Task<bool> PostExistsAsync(WebView2 webView)
    {
        const int maxRetries = 5;
        const int delayInMilliseconds = 500;
        var attempts = 0;

        while (attempts < maxRetries)
        {
            var result = await webView.ExecuteScriptAsync("document.querySelector('div[data-testid=\"primaryColumn\"] section button[data-testid=\"caret\"]') !== null");

            if (result == "true")
            {
                return true;
            }

            attempts++;
            await Task.Delay(delayInMilliseconds);
        }
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
                        tryClickDelete(attempt + 1);
                    }
                }, delays[attempt]);
            }

            function retryConfirm(attempt = 0) {
                if (attempt >= delays.length) return;

                setTimeout(() => {
                    const confirmBtn = document.querySelector('button[data-testid=""confirmationSheetConfirm""]');
                    if (confirmBtn && confirmBtn.offsetParent !== null) {
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
            {
                return true;
            }

            await Task.Delay(interval);
            elapsed += interval;
        }
        return false;
    }
}
