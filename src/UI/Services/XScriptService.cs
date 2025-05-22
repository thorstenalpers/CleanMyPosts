using System.Net;
using Ardalis.GuardClauses;
using CleanMyPosts.UI.Contracts.Services;
using CleanMyPosts.UI.Helpers;
using CleanMyPosts.UI.Models;
using Microsoft.Extensions.Logging;

namespace CleanMyPosts.UI.Services;

public class XScriptService(ILogger<XScriptService> logger, IWebViewHostService webViewHostService, IUserSettingsService userSettingsService) : IXScriptService
{
    private readonly ILogger<XScriptService> _logger = logger;
    private readonly IWebViewHostService _webViewHostService = webViewHostService;
    private readonly IUserSettingsService _userSettingsService = userSettingsService;
    private string _userName;

    public async Task ShowPostsAsync()
    {
        Guard.Against.Null(_userName);
        var searchQuery = $"from:{_userName}";
        var encodedQuery = WebUtility.UrlEncode(searchQuery);
        var url = new Uri($"https://x.com/search?q={encodedQuery}&src=typed_query");

        if (_webViewHostService.Source == url)
        {
            _webViewHostService.Reload();
        }
        else
        {
            _webViewHostService.Source = url;
        }

        if (!await WaitForFullDocumentReadyAsync())
        {
            _logger.LogWarning("Navigation to {Url} failed.", url);
        }

        _logger.LogInformation("Navigated to {Url}", url);
    }

    public async Task<int> DeletePostsAsync()
    {
        Guard.Against.Null(_userName);

        var searchQuery = $"from:{_userName}";
        var encodedQuery = WebUtility.UrlEncode(searchQuery);
        var url = new Uri($"https://x.com/search?q={encodedQuery}&src=typed_query");

        if (_webViewHostService.Source == url)
        {
            _webViewHostService.Reload();
        }
        else
        {
            _webViewHostService.Source = url;
        }
        if (!await WaitForFullDocumentReadyAsync())
        {
            _logger.LogWarning("Navigation to search page failed.");
            return 0;
        }
        var totalPosts = 0;
        var postNumber = 1;
        while (await PostsExistAsync())
        {
            var countBefore = await GetPostsCountAsync();
            if (postNumber == 1)
            {
                totalPosts = countBefore;
            }

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
        _webViewHostService.Reload();
        await WaitForFullDocumentReadyAsync();

        _logger.LogInformation("Deleted {TotalPosts} posts.", totalPosts);
        return totalPosts;
    }

    public async Task ShowLikesAsync()
    {
        Guard.Against.Null(_userName);

        var url = new Uri($"https://x.com/{WebUtility.UrlEncode(_userName)}/likes");

        if (_webViewHostService.Source == url)
        {
            _webViewHostService.Reload();
        }
        else
        {
            _webViewHostService.Source = url;
        }

        if (!await WaitForFullDocumentReadyAsync())
        {
            _logger.LogWarning("Navigation to {Url} failed.", url);
        }

        _logger.LogInformation("Navigated to {Url}", url);
    }

    public async Task<int> DeleteLikesAsync()
    {
        Guard.Against.Null(_userName);

        var url = new Uri($"https://x.com/{WebUtility.UrlEncode(_userName)}/likes");

        if (_webViewHostService.Source == url)
        {
            _webViewHostService.Reload();
        }
        else
        {
            _webViewHostService.Source = url;
        }
        if (!await WaitForFullDocumentReadyAsync())
        {
            _logger.LogWarning("Navigation to search page failed.");
            return 0;
        }

        int totalLikes = 0;

        var postNumber = 1;

        while (await LikesExistAsync())
        {
            var countBefore = await GetLikesCountAsync();
            if (postNumber == 1)
            {
                totalLikes = countBefore;
            }

            _logger.LogInformation("Found {Count} likes before deletion.", countBefore);

            try
            {
                _logger.LogInformation("Deleting like #{Number}...", postNumber);
                await DeleteSingleLikeAsync();

                if (await WaitForLikeDeletedAsync(countBefore))
                {
                    _logger.LogInformation("Like #{Number} deleted successfully.", postNumber);
                }
                else
                {
                    _logger.LogWarning("Like #{Number} was not deleted (DOM unchanged).", postNumber);
                    break;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting like #{Number}.", postNumber);
                break;
            }
            postNumber++;
        }

        _webViewHostService.Reload();
        await WaitForFullDocumentReadyAsync();

        _logger.LogInformation("Deleted {TotalLikes} Likes.", totalLikes);
        return totalLikes;
    }

    public async Task ShowFollowingAsync()
    {
        Guard.Against.Null(_userName);

        var url = new Uri($"https://x.com/{WebUtility.UrlEncode(_userName)}/following");

        if (_webViewHostService.Source == url)
        {
            _webViewHostService.Reload();
        }
        else
        {
            _webViewHostService.Source = url;
        }

        if (!await WaitForFullDocumentReadyAsync())
        {
            _logger.LogWarning("Navigation to {Url} failed.", url);
        }

        _logger.LogInformation("Navigated to {Url}", url);
    }

    public async Task<int> DeleteFollowingAsync()
    {
        Guard.Against.Null(_userName);

        var url = new Uri($"https://x.com/{WebUtility.UrlEncode(_userName)}/following");

        if (_webViewHostService.Source == url)
        {
            _webViewHostService.Reload();
        }
        else
        {
            _webViewHostService.Source = url;
        }
        if (!await WaitForFullDocumentReadyAsync())
        {
            _logger.LogWarning("Navigation to search page failed.");
            return 0;
        }

        int totalFollowings = 0;
        var postNumber = 1;
        while (await FollowingExistAsync())
        {
            var countBefore = await GetFollowingCountAsync();
            if (postNumber == 1)
            {
                totalFollowings = countBefore;
            }

            _logger.LogInformation("Found {Count} following before deletion.", countBefore);

            try
            {
                _logger.LogInformation("Deleting following #{Number}...", postNumber);
                await DeleteSingleFollowingAsync();

                if (await WaitForFollowingDeletedAsync(countBefore))
                {
                    _logger.LogInformation("Following #{Number} deleted successfully.", postNumber);
                }
                else
                {
                    _logger.LogWarning("Following #{Number} was not deleted (DOM unchanged).", postNumber);
                    break;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting following #{Number}.", postNumber);
                break;
            }
            postNumber++;
        }

        _webViewHostService.Reload();
        await WaitForFullDocumentReadyAsync();

        _logger.LogInformation("Deleted {TotalFollowings} Followings.", totalFollowings);
        return totalFollowings;
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

    private async Task<bool> FollowingExistAsync()
    {
        const string js = "document.querySelector('button[data-testid$=\"unfollow\"]') !== null";
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

    private async Task<bool> LikesExistAsync()
    {
        const string js = "document.querySelector('button[data-testid=\"unlike\"]') !== null";
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
        var timeout = _userSettingsService.GetTimeoutSettings();
        var waitAfterDelete = timeout.WaitAfterDelete;
        var waitBetweenDeleteAttempts = timeout.WaitBetweenRetryDeleteAttempts;

        var js = $@"
        (() => {{
            const caret = document.querySelector(""div[data-testid='primaryColumn'] section button[data-testid='caret']"");
            if (!caret) return;

            caret.click();

            setTimeout(() => {{
                const delays = [ {waitBetweenDeleteAttempts}, 
                                {waitBetweenDeleteAttempts * 2}, 
                                {waitBetweenDeleteAttempts * 3}, 
                                {waitBetweenDeleteAttempts * 4}, 
                                {waitBetweenDeleteAttempts * 5} ];

                function tryClickDelete(attempt = 0) {{
                    if (attempt >= delays.length) return;
                    setTimeout(() => {{
                        const menu = document.querySelector(""[role='menu']"");
                        if (menu && menu.style.display !== ""none"") {{
                            const items = document.querySelectorAll(""[role='menuitem']"");
                            for (const item of items) {{
                                const span = item.querySelector(""span"");
                                if (!span) continue;

                                const color = getComputedStyle(span).color;
                                const rgb = color.match(/\d+/g).map(Number);
                                const [r, g, b] = rgb;
                                if (r > 180 && g < 100 && b < 100) {{
                                    span.click();
                                    confirmDelete();
                                    return;
                                }}
                            }}
                            tryClickDelete(attempt + 1);
                        }} else {{
                            tryClickDelete(attempt + 1);
                        }}
                    }}, delays[attempt]);
                }}

                function confirmDelete(attempt = 0) {{
                    if (attempt >= delays.length) return;
                    setTimeout(() => {{
                        const confirmBtn = document.querySelector(""button[data-testid='confirmationSheetConfirm']"");
                        if (confirmBtn && confirmBtn.offsetParent !== null) {{
                            confirmBtn.click();
                            window.scrollBy(0, 300);
                        }} else {{
                            confirmDelete(attempt + 1);
                        }}
                    }}, delays[attempt]);
                }}

                tryClickDelete();
            }}, {waitAfterDelete});
        }})();";

        await _webViewHostService.ExecuteScriptAsync(js);
    }
    private async Task DeleteSingleLikeAsync()
    {
        var waitBeforeTryClickDelete = _userSettingsService.GetTimeoutSettings().WaitAfterDelete;

        var js = $@"
        (() => {{
            const unlikeButton = document.querySelector('button[data-testid=""unlike""]');
            if (unlikeButton) {{
                unlikeButton.click();
            }}
            window.scrollBy(0, 300);
        }})();";
        await Task.Delay(waitBeforeTryClickDelete);
        await _webViewHostService.ExecuteScriptAsync(js);
    }

    private async Task DeleteSingleFollowingAsync()
    {
        var timeout = _userSettingsService.GetTimeoutSettings();
        var waitBeforeTryClickDelete = timeout.WaitAfterDelete;
        var waitBetweenTryClickDeleteAttempts = timeout.WaitBetweenRetryDeleteAttempts;

        var js = $@"
    (() => {{
        const unfollowingButton = document.querySelector('button[data-testid$=""-unfollow""]');
        if (!unfollowingButton) return;

        unfollowingButton.click();

        const delays = [
            {waitBetweenTryClickDeleteAttempts},
            {waitBetweenTryClickDeleteAttempts * 2},
            {waitBetweenTryClickDeleteAttempts * 3},
            {waitBetweenTryClickDeleteAttempts * 4},
            {waitBetweenTryClickDeleteAttempts * 5}
        ];

        function tryClickConfirm(attempt = 0) {{
            if (attempt >= delays.length) return;
            setTimeout(() => {{
                const confirmBtn = document.querySelector('button[data-testid=""confirmationSheetConfirm""]');
                if (confirmBtn && confirmBtn.offsetParent !== null) {{
                    confirmBtn.click();
                    window.scrollBy(0, 300);
                }} else {{
                    tryClickConfirm(attempt + 1);
                }}
            }}, delays[attempt]);
        }}

        setTimeout(() => {{
            tryClickConfirm();
        }}, {waitBeforeTryClickDelete});
    }})();";

        await _webViewHostService.ExecuteScriptAsync(js);
    }


    private async Task<int> GetPostsCountAsync()
    {
        const string js = """
        (() => document.querySelectorAll('div[data-testid="primaryColumn"] section button[data-testid="caret"]').length)()
        """;

        var result = await _webViewHostService.ExecuteScriptAsync(js);
        return int.TryParse(result?.Trim('"'), out var count) ? count : 0;
    }

    private async Task<int> GetFollowingCountAsync()
    {
        const string js = """
        (() => document.querySelectorAll('button[data-testid$="-unfollow"]').length)()        
        """;

        var result = await _webViewHostService.ExecuteScriptAsync(js);
        return int.TryParse(result?.Trim('"'), out var count) ? count : 0;
    }

    private async Task<int> GetLikesCountAsync()
    {
        const string js = """
        (() => document.querySelectorAll('button[data-testid="unlike"]').length)()
        """;

        var result = await _webViewHostService.ExecuteScriptAsync(js);
        return int.TryParse(result?.Trim('"'), out var count) ? count : 0;
    }

    private async Task<bool> WaitForPostDeletedAsync(int beforeCount)
    {
        int elapsed = 0, interval = 200, timeout = 5000;
        while (elapsed < timeout)
        {
            if (await GetPostsCountAsync() < beforeCount)
            {
                return true;
            }
            await Task.Delay(interval);
            elapsed += interval;
        }
        return false;
    }

    private async Task<bool> WaitForFollowingDeletedAsync(int beforeCount)
    {
        int elapsed = 0, interval = 200, timeout = 5000;
        while (elapsed < timeout)
        {
            if (await GetFollowingCountAsync() < beforeCount)
            {
                return true;
            }
            await Task.Delay(interval);
            elapsed += interval;
        }
        return false;
    }

    private async Task<bool> WaitForLikeDeletedAsync(int beforeCount)
    {
        int elapsed = 0, interval = 200, timeout = 5000;
        while (elapsed < timeout)
        {
            if (await GetLikesCountAsync() < beforeCount)
            {
                return true;
            }
            await Task.Delay(interval);
            elapsed += interval;
        }
        return false;
    }

    public async Task<string> GetUserNameAsync()
    {
        await WaitForFullDocumentReadyAsync();

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

    private Task<bool> WaitForNavigationAsync()
    {
        var tcs = new TaskCompletionSource<bool>();

        EventHandler<NavigationCompletedEventArgs> handler = null;
        handler = async (s, e) =>
        {
            _webViewHostService.NavigationCompleted -= handler;
            await Task.Delay(300);
            tcs.TrySetResult(e.IsSuccess);
        };

        _webViewHostService.NavigationCompleted += handler;
        return tcs.Task;
    }

    private async Task<bool> WaitForFullDocumentReadyAsync()
    {
        if (!await WaitForNavigationAsync())
        {
            return false;
        }

        const int maxAttempts = 50;
        const int delayMs = 100;
        int waitAfterDocumentLoad = _userSettingsService.GetTimeoutSettings().WaitAfterDocumentLoad;

        for (var i = 0; i < maxAttempts; i++)
        {
            try
            {
                var readyStateJson = await _webViewHostService.ExecuteScriptAsync("document.readyState");
                var readyState = readyStateJson?.Trim('"').ToLowerInvariant();

                if (readyState == "complete")
                {
                    await Task.Delay(waitAfterDocumentLoad);
                    return true;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error checking document.readyState.");
            }
            await Task.Delay(delayMs);
        }
        _logger.LogWarning("Timed out waiting for document.readyState = complete.");
        return false;
    }
}
