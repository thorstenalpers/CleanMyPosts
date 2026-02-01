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
    private readonly string _youTubeCommentsUrl = appConfig.YouTubeCommentsUrl;
    private readonly string _youTubeLikedVideosUrl = appConfig.YouTubeLikedVideosUrl;

    public async Task ShowCommentsAsync()
    {
        var url = new Uri(_youTubeCommentsUrl);
        await NavigateAsync(url);
    }

    public async Task<int> DeleteCommentsAsync()
    {
        var timeout = _userSettingsService.GetTimeoutSettings();

        return await RunDeleteScriptAsync(
            _youTubeCommentsUrl,
            "delete-all-youtube-posts.js",
            "youtubePostsDeletionDone",
            "deletedYouTubePosts",
            "DeleteAllYouTubePosts",
            IsNoCommentsPresentAsync,
            timeout.WaitAfterDelete, timeout.WaitBetweenRetryDeleteAttempts
        );
    }

    public async Task ShowLikesAsync()
    {
        var url = new Uri(_youTubeLikedVideosUrl);
        await NavigateAsync(url);
    }

    public async Task<int> DeleteLikesAsync()
    {
        var timeout = _userSettingsService.GetTimeoutSettings();

        return await RunDeleteScriptAsync(
            _youTubeLikedVideosUrl,
            "delete-all-youtube-likes.js",
            "youtubeLikesDeletionDone",
            "deletedYouTubeLikes",
            "DeleteAllYouTubeLikes",
            IsNoLikedVideosPresentAsync,
            timeout.WaitAfterDelete, timeout.WaitBetweenRetryDeleteAttempts
        );
    }

    public async Task<string> GetLoginStatusAsync()
    {
        await WaitForDocumentReadyAsync();

        // Check if user is logged in by looking for various indicators
        const string jsScript = @"
            (() => {
              // Check for YouTube avatar (logged in)
              const avatar = document.querySelector('button#avatar-btn img, yt-img-shadow#avatar img');
              if (avatar && avatar.src) {
                return 'logged_in';
              }
              
              // Check for sign-in button on YouTube (indicates NOT logged in)
              const ytSignIn = document.querySelector('a[href*=""accounts.google.com""], ytd-button-renderer a[href*=""ServiceLogin""]');
              if (ytSignIn) {
                return '';
              }
              
              // Check for Google My Activity indicators
              const activityItems = document.querySelectorAll('div[role=""listitem""]');
              if (activityItems.length > 0) {
                return 'logged_in';
              }
              
              const deleteButtons = document.querySelectorAll('button[aria-label^=""Delete activity item""]');
              if (deleteButtons.length > 0) {
                return 'logged_in';
              }
              
              const activityHeader = document.querySelector('[data-activity-collection-name]');
              if (activityHeader) {
                return 'logged_in';
              }
              
              // Check for liked videos playlist content
              const playlistVideos = document.querySelectorAll('ytd-playlist-video-renderer');
              if (playlistVideos.length > 0) {
                return 'logged_in';
              }
              
              return 'unknown';
            })()";

        var result = await _webViewHostService.ExecuteScriptAsync(jsScript);
        return result?.Contains("logged_in") == true ? "logged_in" : string.Empty;
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

    private async Task<bool> IsNoLikedVideosPresentAsync()
    {
        var script = @"
        (function() {
            const videos = document.querySelectorAll('ytd-playlist-video-renderer');
            return videos.length === 0;
        })();";

        var result = await _webViewHostService.ExecuteScriptAsync(script) == "true";
        if (result)
        {
            _logger.LogInformation("No liked videos present, nothing more to unlike.");
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
        string deletedVar, string functionName, Func<Task<bool>> isEmptyCheck, params object[] args)
    {
        var waitBetweenRetryDeleteAttempts = _userSettingsService.GetTimeoutSettings().WaitBetweenRetryDeleteAttempts;
        if (!await NavigateAsync(new Uri(url)))
        {
            return 0;
        }

        int retryCount = 0, deletedItems = 0;

        while (!await isEmptyCheck() && retryCount++ < 3)
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
