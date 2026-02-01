using System.IO;
using Ardalis.GuardClauses;
using CleanMyPosts.Contracts.Services;
using CleanMyPosts.Helpers;
using Microsoft.Extensions.Logging;

namespace CleanMyPosts.Services;

public class YouTubeScriptService(
    ILogger<YouTubeScriptService> logger,
    IWebViewHostService webViewHostService,
    IUserSettingsService userSettingsService,
    IFileService fileService) : IYouTubeScriptService
{
    private readonly IFileService _fileService = fileService;
    private readonly ILogger<YouTubeScriptService> _logger = logger;
    private readonly IUserSettingsService _userSettingsService = userSettingsService;
    private readonly IWebViewHostService _webViewHostService = webViewHostService;
    private string _channelHandle;

    public async Task ShowPostsAsync()
    {
        await EnsureChannelHandleAsync();
        Guard.Against.Null(_channelHandle);

        var url = new Uri($"https://www.youtube.com/{_channelHandle}/community");
        await NavigateAsync(url);
    }

    public async Task<int> DeletePostsAsync()
    {
        await EnsureChannelHandleAsync();
        Guard.Against.Null(_channelHandle);

        var url = $"https://www.youtube.com/{_channelHandle}/community";
        var timeout = _userSettingsService.GetTimeoutSettings();

        return await RunDeleteScriptAsync(
            url,
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

        const string jsScript = @"
            (() => {
              const el = document.querySelector('a#endpoint[href*=""/@""]');
              if (el) {
                const href = el.getAttribute('href');
                const match = href.match(/@[\w-]+/);
                return match ? match[0] : '';
              }
              const channelLink = document.querySelector('yt-formatted-string#channel-handle');
              if (channelLink) {
                return channelLink.textContent.trim();
              }
              return '';
            })()";

        var handle = await _webViewHostService.ExecuteScriptAsync(jsScript);
        _channelHandle = Helper.CleanJsonResult(handle);
        return _channelHandle;
    }

    private async Task<bool> IsNoPostsPresentAsync()
    {
        var script = @"
        (function() {
            const posts = document.querySelectorAll('ytd-backstage-post-thread-renderer');
            return posts.length === 0;
        })();";

        var result = await _webViewHostService.ExecuteScriptAsync(script) == "true";
        if (result)
        {
            _logger.LogInformation("No posts present, nothing more to delete.");
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

    private async Task EnsureChannelHandleAsync()
    {
        if (string.IsNullOrEmpty(_channelHandle))
        {
            await GetChannelHandleAsync();
        }

        const string jsScript = @"
            (() => {
              const el = document.querySelector('a#endpoint[href*=""/@""]');
              if (el) {
                const href = el.getAttribute('href');
                const match = href.match(/@[\w-]+/);
                return match ? match[0] : '';
              }
              const channelLink = document.querySelector('yt-formatted-string#channel-handle');
              if (channelLink) {
                return channelLink.textContent.trim();
              }
              return '';
            })()";

        var handle = await _webViewHostService.ExecuteScriptAsync(jsScript);
        if (string.IsNullOrEmpty(handle))
        {
            _logger.LogInformation("Channel handle is null {Handle}, possibly because HTML is not fully loaded", handle);
            return;
        }

        var newHandle = Helper.CleanJsonResult(handle);
        if (_channelHandle != newHandle)
        {
            _logger.LogInformation("Channel handle has changed from {OldHandle} to {NewHandle}", _channelHandle, newHandle);
            _channelHandle = newHandle;
        }
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

        while (!await IsNoPostsPresentAsync() && retryCount++ < 3)
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
