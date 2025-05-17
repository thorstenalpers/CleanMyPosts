using System.Net;
using Microsoft.Extensions.Logging;
using CleanMyPosts.UI.Contracts.Services;
using CleanMyPosts.UI.Helpers;
using CleanMyPosts.UI.Models;

namespace CleanMyPosts.UI.Services;

public class XWebViewScriptService(ILogger<XWebViewScriptService> logger, IWebViewHostService webViewHostService) : IXWebViewScriptService
{
    private readonly ILogger<XWebViewScriptService> _logger = logger;
    private readonly IWebViewHostService _webViewHostService = webViewHostService;
    private string _userName;

    public async Task<string> GetUserNameAsync()
    {
        const string jsScript = @"
        (() => { 
            const el = document.querySelector('a[data-testid=""AppTabBar_Profile_Link""]');
            const href = el?.getAttribute('href');
            return href?.split('/')[1] ?? '';
        })()";
        var userName = await _webViewHostService.ExecuteScriptAsync(jsScript);
        _userName = Helper.CleanJsonResult(userName);
        return _userName;
    }

    public async Task DeleteAllPostsAsync()
    {
        var userName = await GetUserNameAsync();
        if (string.IsNullOrWhiteSpace(userName))
        {
            _logger.LogWarning("Unable to retrieve username.");
            return;
        }

        var searchQuery = $"from:{userName} since:2000-01-01";
        var encodedQuery = WebUtility.UrlEncode(searchQuery);
        var url = new Uri($"https://x.com/search?q={encodedQuery}&src=typed_query");

        if (_webViewHostService.Source != url)
        {
            _webViewHostService.Source = url;
            if (!await WaitForNavigationAsync())
            {
                _logger.LogWarning("Navigation to search page failed.");
                return;
            }
        }
        var postNumber = 1;
        while (await PostsExistAsync())
        {
            var countBefore = await GetCaretCountAsync();
            _logger.LogInformation("Found {Count} posts before deletion.", countBefore);

            try
            {
                _logger.LogInformation("Deleting post #{Number}...", postNumber);
                await DeleteSinglePostAsync();

                if (await WaitForPostDeletedAsync(countBefore))
                {
                    _logger.LogInformation("Post #{Number} deleted successfully.", postNumber);
                }
                else
                {
                    _logger.LogWarning("Post #{Number} was not deleted (DOM unchanged).", postNumber);
                    break;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting post #{Number}.", postNumber);
                break;
            }
            postNumber++;
        }
        _logger.LogInformation("No more posts found.");
    }

    private async Task<bool> PostsExistAsync()
    {
        const string js = "document.querySelector('div[data-testid=\"primaryColumn\"] section button[data-testid=\"caret\"]') !== null";
        for (var i = 0; i < 5; i++)
        {
            if (await _webViewHostService.ExecuteScriptAsync(js) == "true")
            {
                return true;
            }
            await Task.Delay(500);
        }
        return false;
    }

    private async Task DeleteSinglePostAsync()
    {
        const string js = """
        (() => {
            const caret = document.querySelector('div[data-testid="primaryColumn"] section button[data-testid="caret"]');
            if (!caret) return;

            caret.click();

            const delays = [10, 100, 200, 500, 1000];

            function tryClickDelete(attempt = 0) {
                if (attempt >= delays.length) return;
                setTimeout(() => {
                    const menu = document.querySelector('[role="menu"]');
                    if (menu && menu.style.display !== 'none') {
                        const items = document.querySelectorAll('[role="menuitem"]');
                        for (const item of items) {
                            const span = item.querySelector('span');
                            if (!span) continue;

                            const color = getComputedStyle(span).color;
                            const [r, g, b] = color.match(/\d+/g).map(Number);
                            if (r > 180 && g < 100 && b < 100) {
                                span.click();
                                confirmDelete();
                                return;
                            }
                        }
                        tryClickDelete(attempt + 1);
                    } else {
                        tryClickDelete(attempt + 1);
                    }
                }, delays[attempt]);
            }

            function confirmDelete(attempt = 0) {
                if (attempt >= delays.length) return;
                setTimeout(() => {
                    const confirmBtn = document.querySelector('button[data-testid="confirmationSheetConfirm"]');
                    if (confirmBtn && confirmBtn.offsetParent !== null) {
                        confirmBtn.click();
                        window.scrollBy(0, 300);
                    } else {
                        confirmDelete(attempt + 1);
                    }
                }, delays[attempt]);
            }

            tryClickDelete();
        })();
        """;
        await _webViewHostService.ExecuteScriptAsync(js);
    }

    private async Task<int> GetCaretCountAsync()
    {
        const string js = """
        (() => document.querySelectorAll('div[data-testid="primaryColumn"] section button[data-testid="caret"]').length)()
        """;

        var result = await _webViewHostService.ExecuteScriptAsync(js);
        return int.TryParse(result?.Trim('"'), out var count) ? count : 0;
    }

    private async Task<bool> WaitForPostDeletedAsync(int beforeCount)
    {
        int elapsed = 0, interval = 200, timeout = 5000;
        while (elapsed < timeout)
        {
            if (await GetCaretCountAsync() < beforeCount)
            {
                return true;
            }
            await Task.Delay(interval);
            elapsed += interval;
        }
        return false;
    }

    private Task<bool> WaitForNavigationAsync()
    {
        var tcs = new TaskCompletionSource<bool>();

        void Handler(object s, NavigationCompletedEventArgs e)
        {
            _webViewHostService.NavigationCompleted -= Handler;
            tcs.SetResult(e.IsSuccess);
        }
        _webViewHostService.NavigationCompleted += Handler;
        return tcs.Task;
    }
}
