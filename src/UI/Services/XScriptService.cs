using System.Net;
using Ardalis.GuardClauses;
using CleanMyPosts.UI.Contracts.Services;
using CleanMyPosts.UI.Helpers;
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
        await EnsureUserNameAsync();
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

        if (!await WaitForDocumentReadyAsync())
        {
            _logger.LogWarning("Navigation to {Url} failed.", url);
        }

        _logger.LogInformation("Navigated to {Url}", url);
    }

    public async Task<int> DeletePostsAsync()
    {
        await EnsureUserNameAsync();
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
        if (!await WaitForDocumentReadyAsync())
        {
            _logger.LogWarning("Navigation to search page failed.");
            return 0;
        }
        var postNumber = 1;
        var deletedItems = 0;
        var retryCount = 0;
        while (await PostsExistAsync() || retryCount < 3)
        {
            var countBefore = await GetPostsCountAsync();

            _logger.LogInformation("Found {Count} posts before deletion.", countBefore);

            try
            {
                _logger.LogInformation("Deleting post #{Number}...", postNumber);
                await DeleteSinglePostAsync();

                if (await WaitForPostDeletedAsync(countBefore))
                {
                    _logger.LogInformation("Post #{Number} cleaned successfully.", postNumber);
                    deletedItems++;
                    retryCount = 0;
                }
                else
                {
                    _logger.LogWarning("Post #{Number} was not deleted (DOM unchanged).", postNumber);
                    retryCount++;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting post #{Number}.", postNumber);
                retryCount++;
            }
            postNumber++;
        }
        _webViewHostService.Reload();
        await WaitForDocumentReadyAsync();

        _logger.LogInformation("Deleted {TotalPosts} posts.", postNumber);
        return deletedItems;
    }

    public async Task ShowLikesAsync()
    {
        await EnsureUserNameAsync();
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

        if (!await WaitForDocumentReadyAsync())
        {
            _logger.LogWarning("Navigation to {Url} failed.", url);
        }

        _logger.LogInformation("Navigated to {Url}", url);
    }

    public async Task<int> DeleteLikesAsync()
    {
        await EnsureUserNameAsync();
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
        if (!await WaitForDocumentReadyAsync())
        {
            _logger.LogWarning("Navigation to search page failed.");
            return 0;
        }

        var postNumber = 1;
        var deletedItems = 0;
        var retryCount = 0;

        while (await LikesExistAsync() || retryCount < 3)
        {
            var countBefore = await GetLikesCountAsync();

            _logger.LogInformation("Found {Count} likes before deletion.", countBefore);

            try
            {
                _logger.LogInformation("Deleting like #{Number}...", postNumber);
                await DeleteSingleLikeAsync();

                if (await WaitForLikeDeletedAsync(countBefore))
                {
                    _logger.LogInformation("Like #{Number} cleaned successfully.", postNumber);
                    deletedItems++;
                    retryCount = 0;
                }
                else
                {
                    _logger.LogWarning("Like #{Number} was not cleaned (DOM unchanged).", postNumber);
                    retryCount++;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting like #{Number}.", postNumber);
                retryCount++;
            }
            postNumber++;
        }

        _webViewHostService.Reload();
        await WaitForDocumentReadyAsync();

        _logger.LogInformation("Deleted {TotalLikes} Likes.", postNumber);
        return deletedItems;
    }

    public async Task ShowFollowingAsync()
    {
        await EnsureUserNameAsync();
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

        if (!await WaitForDocumentReadyAsync())
        {
            _logger.LogWarning("Navigation to {Url} failed.", url);
        }

        _logger.LogInformation("Navigated to {Url}", url);
    }

    public async Task<int> DeleteFollowingAsync()
    {
        await EnsureUserNameAsync();
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
        if (!await WaitForDocumentReadyAsync())
        {
            _logger.LogWarning("Navigation to search page failed.");
            return 0;
        }

        var postNumber = 1;
        var deletedItems = 0;
        var retryCount = 0;
        while (await FollowingExistAsync() || retryCount < 3)
        {
            var countBefore = await GetFollowingCountAsync();

            _logger.LogInformation("Found {Count} following before deletion.", countBefore);

            try
            {
                _logger.LogInformation("Deleting following #{Number}...", postNumber);
                await DeleteSingleFollowingAsync();

                if (await WaitForFollowingDeletedAsync(countBefore))
                {
                    _logger.LogInformation("Following #{Number} cleaned successfully.", postNumber);
                    deletedItems++;
                    retryCount = 0;
                }
                else
                {
                    _logger.LogWarning("Following #{Number} was not cleaned (DOM unchanged).", postNumber);
                    retryCount++;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting following #{Number}.", postNumber);
                retryCount++;
            }
            postNumber++;
        }

        _webViewHostService.Reload();
        await WaitForDocumentReadyAsync();

        _logger.LogInformation("Deleted {DeletedItems} Followings.", deletedItems);
        return deletedItems;
    }

    private async Task<bool> PostsExistAsync()
    {
        const string js = "document.querySelector('div[data-testid=\"primaryColumn\"] section button[data-testid=\"caret\"]') !== null";
        var timeout = _userSettingsService.GetTimeoutSettings();
        var waitAfterDocumentLoad = timeout.WaitAfterDocumentLoad;
        for (var i = 0; i < 5; i++)
        {
            await Task.Delay(waitAfterDocumentLoad);
            if (await _webViewHostService.ExecuteScriptAsync(js) == "true")
            {
                return true;
            }
        }
        return false;
    }

    private async Task<bool> FollowingExistAsync()
    {
        const string js = "document.querySelector('button[data-testid$=\"unfollow\"]') !== null";
        var timeout = _userSettingsService.GetTimeoutSettings();
        var waitAfterDocumentLoad = timeout.WaitAfterDocumentLoad;
        for (var i = 0; i < 5; i++)
        {
            await Task.Delay(waitAfterDocumentLoad);
            if (await _webViewHostService.ExecuteScriptAsync(js) == "true")
            {
                return true;
            }
        }
        return false;
    }

    private async Task<bool> LikesExistAsync()
    {
        const string js = "document.querySelector('button[data-testid=\"unlike\"]') !== null";
        var timeout = _userSettingsService.GetTimeoutSettings();
        var waitAfterDocumentLoad = timeout.WaitAfterDocumentLoad;
        await Task.Delay(500);
        for (var i = 0; i < 5; i++)
        {
            await Task.Delay(waitAfterDocumentLoad);
            if (await _webViewHostService.ExecuteScriptAsync(js) == "true")
            {
                return true;
            }
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
                            window.scrollBy(0, 3000);
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
    console.log('Attempting to find an unlike button...');
    const delay = ms => new Promise(res => setTimeout(res, ms));
    async function unlike() {{
        const unlikeButton = document.querySelector('button[data-testid=""unlike""]');
        if (!unlikeButton) {{
            console.log('No unlike button found.');
            return false;
        }}
        console.log('Found unlike button, clicking...');
        unlikeButton.click();

        // Wait a bit to allow the UI to update
        await delay({waitBeforeTryClickDelete});

        // Check if the button disappeared (like removed)
        const stillExists = document.querySelector('button[data-testid=""unlike""]');
        if (stillExists) {{
            console.log('Unlike button still present, retrying...');
            return false;
        }}

        console.log('Unlike successful! Scrolling down...');
        window.scrollBy(0, 3000);
        return true;
    }}

    // Retry logic: try up to 5 times with 2 sec delay between attempts
    async function tryUnlike(attempts = 5) {{
        for (let i = 1; i <= attempts; i++) {{
            const result = await unlike();
            if (result) {{
                console.log(`Unlike succeeded on attempt #${{i}}`);
                return true;
            }}
            console.log(`Attempt #${{i}} failed, waiting before retry...`);
            await delay(2000);
        }}
        console.log('Failed to unlike after max attempts.');
        return false;
    }}

    return tryUnlike();
}})();";

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
                    window.scrollBy(0, 3000);
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
        await WaitForDocumentReadyAsync();

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

    private async Task<bool> WaitForDocumentReadyAsync()
    {
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

    private async Task EnsureUserNameAsync()
    {
        if (string.IsNullOrEmpty(_userName))
        {
            await GetUserNameAsync();
        }

        // check for updated username due to login of other account
        const string jsScript = @"
            (() => {
              const el = document.querySelector('a[data-testid=""AppTabBar_Profile_Link""]');
              const href = el?.getAttribute('href');
              return href?.split('/')[1] ?? '';
            })()";

        var userName = await _webViewHostService.ExecuteScriptAsync(jsScript);
        if (string.IsNullOrEmpty(userName))
        {
            _logger.LogInformation("Username is null {Username}, posssible because of not fully loaded html", userName);
            return;
        }
        if (userName == _userName)
        {
            return;
        }
        _logger.LogInformation("Username has changed to {Username}", userName);
        _userName = Helper.CleanJsonResult(userName);
    }
}
