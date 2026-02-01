using System.IO;
using CleanMyPosts.Contracts.Services;
using CleanMyPosts.Models;
using Microsoft.Extensions.Logging;

namespace CleanMyPosts.Services;

public class YouTubeScriptService(
    ILogger<YouTubeScriptService> logger,
    IWebViewHostService webViewHostService,
    IUserSettingsService userSettingsService,
    IFileService fileService,
    AppConfig appConfig) : IYouTubeScriptService
{
    private readonly IFileService _fileService = fileService;
    private readonly ILogger<YouTubeScriptService> _logger = logger;
    private readonly IUserSettingsService _userSettingsService = userSettingsService;
    private readonly IWebViewHostService _webViewHostService = webViewHostService;
    private readonly string _youTubeCommentsUrl = appConfig.YouTubeBaseUrl;
    private bool _isLoggedIn;

    public async Task ShowPostsAsync()
    {
        var url = new Uri(_youTubeCommentsUrl);
        await NavigateAsync(url);
    }

    public async Task<int> DeletePostsAsync()
    {
        var timeout = _userSettingsService.GetTimeoutSettings();

        return await RunDeleteScriptAsync(
            _youTubeCommentsUrl,
            "delete-all-youtube-posts.js",
            "youtubePostsDeletionDone",
            "deletedYouTubePosts",
            "DeleteAllYouTubePosts",
            timeout.WaitAfterDelete, timeout.WaitBetweenRetryDeleteAttempts
        );
    }

    public async Task<string> GetChannelHandleAsync()
    {
        await WaitForDocumentReadyAsync();

        // Check if user is logged in by looking for activity items on Google My Activity
        const string jsScript = @"
            (() => {
              const activityItems = document.querySelectorAll('div[role=""listitem""]');
              if (activityItems.length > 0) {
                return 'logged_in';
              }
              const signInButton = document.querySelector('a[href*=""accounts.google.com""]');
              if (signInButton) {
                return '';
              }
              return 'unknown';
            })()";

        var result = await _webViewHostService.ExecuteScriptAsync(jsScript);
        _isLoggedIn = result?.Contains("logged_in") == true;
        return _isLoggedIn ? "logged_in" : string.Empty;
    }

    private async Task<bool> IsNoCommentsPresentAsync()
    {
        var script = @"
        (function() {
            const deleteButtons = document.querySelectorAll('button[aria-label^=""Delete activity item""]');
            return deleteButtons.length === 0;
        })();";

        var result = await _webViewHostService.ExecuteScriptAsync(script) == "true";
        if (result)
        {
            _logger.LogInformation("No comments present, nothing more to delete.");
        }

        return result;
    }

    private async Task<bool> WaitForDocumentReadyAsync()
    {
        const int maxAttempts = 50;
        const int delayMs = 100;
        var waitAfterDocumentLoad = _userSettingsService.GetTimeoutSettings().WaitAfterDocumentLoad;

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

    private async Task<bool> NavigateAsync(Uri url)
    {
        var urlChanged = false;
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

    private async Task<int> RunDeleteScriptAsync(string url, string scriptName, string scriptDoneVar,
        string deletedVar, string functionName, params object[] args)
    {
        var waitBetweenRetryDeleteAttempts = _userSettingsService.GetTimeoutSettings().WaitBetweenRetryDeleteAttempts;
        if (!await NavigateAsync(new Uri(url)))
        {
            return 0;
        }

        int retryCount = 0, deletedItems = 0;

        while (!await IsNoCommentsPresentAsync() && retryCount++ < 3)
        {
            try
            {
                var scriptPath = Path.Combine(AppContext.BaseDirectory, "Scripts", scriptName);
                var jsCode = _fileService.ReadFile(scriptPath);

                var argsList = string.Join(", ", args.Select(arg =>
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

                var wrappedScript = $@"
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

                for (var i = 0; i < TimeSpan.FromHours(10).TotalSeconds; i++)
                {
                    var result = await _webViewHostService.ExecuteScriptAsync($"window.{scriptDoneVar};");
                    if (string.Equals(result?.ToLower(), "true"))
                    {
                        var deletedResult = await _webViewHostService.ExecuteScriptAsync($"window.{deletedVar};");
                        if (int.TryParse(deletedResult, out var deleted) && deleted > 0)
                        {
                            retryCount = 0;
                            deletedItems += deleted;
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
