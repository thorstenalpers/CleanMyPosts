using System.IO;
using System.Net;
using Ardalis.GuardClauses;
using CleanMyPosts.Core.Contracts.Services;
using CleanMyPosts.UI.Contracts.Services;
using CleanMyPosts.UI.Helpers;
using Microsoft.Extensions.Logging;

namespace CleanMyPosts.UI.Services;

public class XScriptService(ILogger<XScriptService> logger, IWebViewHostService webViewHostService, IUserSettingsService userSettingsService, IFileService fileService) : IXScriptService
{
    private readonly ILogger<XScriptService> _logger = logger;
    private readonly IWebViewHostService _webViewHostService = webViewHostService;
    private readonly IUserSettingsService _userSettingsService = userSettingsService;
    private readonly IFileService _fileService = fileService;
    private string _userName;

    public async Task ShowRepostsAsync()
    {
        await EnsureUserNameAsync();
        Guard.Against.Null(_userName);

        var url = new Uri($"https://x.com/{WebUtility.UrlEncode(_userName)}");

        await NavigateAsync(url);
    }

    public async Task ShowPostsAsync()
    {
        await EnsureUserNameAsync();
        Guard.Against.Null(_userName);
        var searchQuery = $"from:{_userName}";
        var encodedQuery = WebUtility.UrlEncode(searchQuery);
        var url = new Uri($"https://x.com/search?q={encodedQuery}&src=typed_query");

        await NavigateAsync(url);
    }

    public async Task ShowRepliesAsync()
    {
        await EnsureUserNameAsync();
        Guard.Against.Null(_userName);

        var url = new Uri($"https://x.com/{WebUtility.UrlEncode(_userName)}/with_replies");

        await NavigateAsync(url);
    }

    public async Task ShowLikesAsync()
    {
        await EnsureUserNameAsync();
        Guard.Against.Null(_userName);

        var url = new Uri($"https://x.com/{WebUtility.UrlEncode(_userName)}/likes");

        await NavigateAsync(url);
    }

    public async Task ShowFollowingAsync()
    {
        await EnsureUserNameAsync();
        Guard.Against.Null(_userName);

        var url = new Uri($"https://x.com/{WebUtility.UrlEncode(_userName)}/following");

        await NavigateAsync(url);
    }
    public async Task<int> DeletePostsAsync()
    {
        await EnsureUserNameAsync();
        Guard.Against.Null(_userName);

        var query = $"from:{_userName}";
        var url = $"https://x.com/search?q={WebUtility.UrlEncode(query)}&src=typed_query";
        var timeout = _userSettingsService.GetTimeoutSettings();

        return await RunDeleteScriptAsync(
            url,
            isArticle: true,
            scriptName: "delete-all-posts.js",
            scriptDoneVar: "postsDeletionDone",
            deletedVar: "deletedPosts",
            functionName: "DeleteAllPosts",
            timeout.WaitAfterDelete, timeout.WaitBetweenRetryDeleteAttempts
        );
    }


    public async Task<int> DeleteRepostsAsync()
    {
        await EnsureUserNameAsync();
        Guard.Against.Null(_userName);

        var url = $"https://x.com/{WebUtility.UrlEncode(_userName)}";
        var timeout = _userSettingsService.GetTimeoutSettings();

        return await RunDeleteScriptAsync(
            url,
            isArticle: true,
            scriptName: "delete-all-reposts.js",
            scriptDoneVar: "repostsDeletionDone",
            deletedVar: "deletedReposts",
            functionName: "DeleteAllRepost",
            timeout.WaitBetweenRetryDeleteAttempts
        );
    }

    public async Task<int> DeleteRepliesAsync()
    {
        await EnsureUserNameAsync();
        Guard.Against.Null(_userName);

        var url = $"https://x.com/{WebUtility.UrlEncode(_userName)}/with_replies";
        var timeout = _userSettingsService.GetTimeoutSettings();

        return await RunDeleteScriptAsync(
            url,
            isArticle: true,
            scriptName: "delete-all-replies.js",
            scriptDoneVar: "repliesDeletionDone",
            deletedVar: "deletedReplies",
            functionName: "DeleteAllReplies",
            _userName, timeout.WaitAfterDelete, timeout.WaitBetweenRetryDeleteAttempts
        );
    }

    public async Task<int> DeleteLikesAsync()
    {
        await EnsureUserNameAsync();
        Guard.Against.Null(_userName);

        var url = $"https://x.com/{WebUtility.UrlEncode(_userName)}/likes";
        var timeout = _userSettingsService.GetTimeoutSettings();

        return await RunDeleteScriptAsync(
            url,
            isArticle: false,
            scriptName: "delete-all-likes.js",
            scriptDoneVar: "likesDeletionDone",
            deletedVar: "deletedLikes",
            functionName: "DeleteAllLikes",
            timeout.WaitBetweenRetryDeleteAttempts
        );
    }
    public async Task<int> DeleteFollowingAsync()
    {
        await EnsureUserNameAsync();
        Guard.Against.Null(_userName);

        var url = $"https://x.com/{WebUtility.UrlEncode(_userName)}/following";
        var timeout = _userSettingsService.GetTimeoutSettings();

        return await RunDeleteScriptAsync(
            url,
            isArticle: false,
            scriptName: "delete-all-following.js",
            scriptDoneVar: "followingDeletionDone",
            deletedVar: "deletedFollowing",
            functionName: "DeleteAllFollowing",
            timeout.WaitAfterDelete, timeout.WaitBetweenRetryDeleteAttempts
        );
    }

    private async Task<bool> IsEmptyMessagePresentAsync()
    {
        var script = @"
        (function() {
            return document.querySelector('[data-testid=""emptyState""]') !== null;
        })();";

        var result = await _webViewHostService.ExecuteScriptAsync(script) == "true";
        if (result)
        {
            _logger.LogInformation("Empty state present, nothing more to delete.");
        }
        return result;
    }

    private async Task<bool> IsAnArticlePresentAsync()
    {
        var script = @"
        (function() {
            return document.querySelector('article') !== null;
        })();";

        var isAnArticlePresent = await _webViewHostService.ExecuteScriptAsync(script) == "true";
        if (!isAnArticlePresent)
        {
            _logger.LogInformation("No article present, nothing more to delete.");
        }
        return isAnArticlePresent;
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
        var newUserName = Helper.CleanJsonResult(userName);
        if (_userName != newUserName)
        {
            _logger.LogInformation("Username has changed from {OldUserName} to {NewUserName}", _userName, userName);
            _userName = newUserName;
        }
    }

    private async Task<bool> NavigateAsync(Uri url)
    {
        bool urlChanged = false;
        if (_webViewHostService.Source != url)
        {
            _webViewHostService.Source = url;
            urlChanged = true;
        }

        var ready = await WaitForDocumentReadyAsync();
        if (!ready)
        {
            _logger.LogWarning("Navigation to {Url} failed.", url);
            return false;
        }

        if (urlChanged)
        {
            _logger.LogInformation("Navigated to {Url}", url);
        }
        return true;
    }

    private async Task<int> RunDeleteScriptAsync(string url, bool isArticle, string scriptName, string scriptDoneVar, string deletedVar, string functionName, params object[] args)
    {
        var waitBetweenRetryDeleteAttempts = _userSettingsService.GetTimeoutSettings().WaitBetweenRetryDeleteAttempts;
        if (!await NavigateAsync(new Uri(url)))
        {
            return 0;
        }

        var timeout = _userSettingsService.GetTimeoutSettings();
        int retryCount = 0, deletedItems = 0;

        while ((isArticle ? await IsAnArticlePresentAsync() : !await IsEmptyMessagePresentAsync()) && retryCount++ < 5)
        {
            try
            {
                string scriptPath = Path.Combine(AppContext.BaseDirectory, "Scripts", scriptName);
                string jsCode = _fileService.ReadFile(scriptPath);

                string argsList = string.Join(", ", args.Select(arg =>
                {
                    if (arg == null)
                    {
                        return "null";
                    }
                    if (arg is string s)
                    {
                        return $"\"{s.Replace("\"", "\\\"")}\"";
                    }
                    if (arg is bool b)
                    {
                        return b ? "true" : "false";
                    }

                    return arg.ToString();
                }));

                string wrappedScript = $@"
                (function() {{
                    window.{scriptDoneVar} = false;
                    {jsCode}
                    if (typeof {functionName} === 'function') {{
                        {functionName}({argsList});
                    }} else {{
                        console.log('{functionName} not defined');
                        window.{scriptDoneVar} = true;
                    }}
                }})();";

                await _webViewHostService.ExecuteScriptAsync(wrappedScript);

                for (int i = 0; i < TimeSpan.FromHours(10).TotalSeconds; i++)
                {
                    var result = await _webViewHostService.ExecuteScriptAsync($"window.{scriptDoneVar};");
                    if (string.Equals(result?.ToLower(), "true"))
                    {
                        var deletedResult = await _webViewHostService.ExecuteScriptAsync($"window.{deletedVar};");
                        if (int.TryParse(deletedResult, out var deleted))
                        {
                            if (deleted > 0)
                            {
                                retryCount = 0;
                                deletedItems += deleted;
                            }
                        }

                        break;
                    }
                    await Task.Delay(waitBetweenRetryDeleteAttempts);
                }

                _webViewHostService.Reload();
                await WaitForDocumentReadyAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting via {Script}", scriptName);
            }
        }

        _logger.LogInformation("Deleted items via {Script}", scriptName);
        return deletedItems;
    }
}
