using System.Net;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using CleanMyPosts.Exceptions;
using CleanMyPosts.Hosting;
using CleanMyPosts.Infrastructure;
using CleanMyPosts.Settings;

namespace CleanMyPosts.Sites;

/// <summary>
/// Owns everything that must survive a page navigation/reload: URL building,
/// the retry-across-reloads loop, and login detection. The actual DOM
/// click/confirm/retry loop for a single page load lives in the TS content
/// script (`CleanMyPosts.UI/src/lib/engine`) and is invoked here as one
/// fire-and-forget call per attempt, awaited via a `TaskCompletionSource`
/// resolved from its `done`/`error` postMessage — no polling.
/// </summary>
public sealed class SiteActionOrchestrator : IDisposable
{
    private const int MaxRetriesPerAction = 3;

    private readonly ILogger<SiteActionOrchestrator> _logger;
    private readonly ISiteWebViewService _siteWebViewService;
    private readonly IChromeWebViewService _chromeWebViewService;
    private readonly IUserSettingsService _userSettingsService;
    private readonly AppConfig _appConfig;

    private readonly Dictionary<string, TaskCompletionSource<ContentMessageDto>> _pendingRuns = new();
    private readonly Dictionary<string, int> _progressBase = new();
    private readonly Dictionary<string, CancellationTokenSource> _cancellations = new();
    private readonly Dictionary<string, Action> _activityResetters = new();
    private readonly HashSet<Platform> _loginConfirmed = [];

    // Set once via AttachLayoutService — ShellWindow (which implements IShellLayoutService)
    // itself depends on this orchestrator, so constructor injection would be circular.
    private IShellLayoutService _shellLayoutService;

    private string _xUserName;

    public SiteActionOrchestrator(
        ILogger<SiteActionOrchestrator> logger,
        ISiteWebViewService siteWebViewService,
        IChromeWebViewService chromeWebViewService,
        IUserSettingsService userSettingsService,
        AppConfig appConfig)
    {
        _logger = logger;
        _siteWebViewService = siteWebViewService;
        _chromeWebViewService = chromeWebViewService;
        _userSettingsService = userSettingsService;
        _appConfig = appConfig;

        _siteWebViewService.WebMessageReceived += OnSiteWebMessageReceived;
    }

    public void AttachLayoutService(IShellLayoutService shellLayoutService)
    {
        _shellLayoutService = shellLayoutService;
    }

    public void Dispose()
    {
        _siteWebViewService.WebMessageReceived -= OnSiteWebMessageReceived;
    }

    public async Task<SiteNavigateResult> NavigateAsync(SiteNavigateParams request)
    {
        // Navigation must never be gated on login — the user has to reach the site to
        // sign in manually. Without a detected user the action URL can't be built, so
        // fall back to the X home page; the UI keeps the delete/show buttons disabled
        // until login is confirmed.
        var url = await BuildUrlAsync(request.Platform, request.Action)
                  ?? (request.Platform == Platform.X ? _appConfig.XBaseUrl : null);
        if (url == null)
        {
            return new SiteNavigateResult(false);
        }

        var ok = await NavigateToUrlAsync(url);
        if (ok)
        {
            _ = CheckLoginStatusAsync(request.Platform);
        }

        return new SiteNavigateResult(ok);
    }

    public async Task<ActionResultDto> RunActionAsync(SiteRunActionParams request)
    {
        using var cts = new CancellationTokenSource();
        _cancellations[request.RequestId] = cts;
        try
        {
            return await RunActionCoreAsync(request, cts.Token);
        }
        finally
        {
            _cancellations.Remove(request.RequestId);
        }
    }

    /// <summary>Cancels an in-flight <see cref="RunActionAsync"/> so a long, destructive run can be stopped from the UI.</summary>
    public Task CancelAction(SiteCancelActionParams request)
    {
        if (_cancellations.TryGetValue(request.RequestId, out var cts))
        {
            cts.Cancel();
        }

        return Task.CompletedTask;
    }

    private async Task<ActionResultDto> RunActionCoreAsync(SiteRunActionParams request, CancellationToken cancellationToken)
    {
        var url = await BuildUrlAsync(request.Platform, request.Action);
        if (url == null || !await NavigateToUrlAsync(url))
        {
            return new ActionResultDto(0);
        }

        if (!await IsScriptReadyAsync())
        {
            throw new CleanMyPostsException(
                "Could not reach the delete engine on the page. The site may have changed its layout or blocked the injected script.");
        }

        var deletedTotal = 0;
        var retryCount = 0;

        while (retryCount < MaxRetriesPerAction
               && !cancellationToken.IsCancellationRequested
               && !await IsEmptyAsync(request.Platform, request.Action))
        {
            _progressBase[request.RequestId] = deletedTotal;

            int deletedThisRound;
            try
            {
                deletedThisRound = await RunOnceAsync(request.Platform, request.Action, request.RequestId, request.Timeouts, cancellationToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }

            if (deletedThisRound > 0)
            {
                deletedTotal += deletedThisRound;
                retryCount = 0;
            }
            else
            {
                retryCount++;
            }

            if (cancellationToken.IsCancellationRequested)
            {
                break;
            }

            _siteWebViewService.Reload();
            await WaitForNavigationAsync();
            try
            {
                await Task.Delay(request.Timeouts.WaitAfterDocumentLoad, cancellationToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }

        _progressBase.Remove(request.RequestId);
        _logger.LogInformation("Action {Action} on {Platform} deleted {Count} item(s)", request.Action, request.Platform, deletedTotal);
        return new ActionResultDto(deletedTotal);
    }

    public Task HideAsync(bool hide)
    {
        _siteWebViewService.Hide(hide);
        _shellLayoutService?.SetSiteVisible(!hide);
        return Task.CompletedTask;
    }

    public Task ReloadAsync()
    {
        _siteWebViewService.Reload();
        return Task.CompletedTask;
    }

    private async Task<bool> NavigateToUrlAsync(string url)
    {
        var uri = new Uri(url);
        var alreadyThere = _siteWebViewService.Source == uri;

        if (!alreadyThere)
        {
            var navigationTask = WaitForNavigationAsync();
            _siteWebViewService.Source = uri;
            var success = await navigationTask;
            if (!success)
            {
                _logger.LogWarning("Navigation to {Url} failed.", url);
                return false;
            }
        }

        await Task.Delay(_userSettingsService.GetTimeoutSettings().WaitAfterDocumentLoad);
        return true;
    }

    private Task<bool> WaitForNavigationAsync()
    {
        var tcs = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);

        void Handler(object sender, NavigationCompletedEventArgs e)
        {
            _siteWebViewService.NavigationCompleted -= Handler;
            tcs.TrySetResult(e.IsSuccess);
        }

        _siteWebViewService.NavigationCompleted += Handler;
        return tcs.Task;
    }

    /// <summary>True once the injected content script has attached <c>window.__cmp</c> to the page.</summary>
    private async Task<bool> IsScriptReadyAsync()
    {
        var result = await _siteWebViewService.ExecuteScriptAsync("(typeof window.__cmp)");
        return string.Equals(ScriptResult.Unwrap(result), "object", StringComparison.OrdinalIgnoreCase);
    }

    private async Task<bool> IsEmptyAsync(Platform platform, string action)
    {
        var script = $"(window.__cmp ? window.__cmp.isEmpty({ToJs(platform)}, {ToJs(action)}) : true)";
        var result = await _siteWebViewService.ExecuteScriptAsync(script);
        return string.Equals(result?.Trim(), "true", StringComparison.OrdinalIgnoreCase);
    }

    private async Task<int> RunOnceAsync(
        Platform platform, string action, string requestId, TimeoutSettingsDto timeouts, CancellationToken cancellationToken)
    {
        var tcs = new TaskCompletionSource<ContentMessageDto>(TaskCreationOptions.RunContinuationsAsynchronously);
        _pendingRuns[requestId] = tcs;

        // A single page load can legitimately take a while, so guard against a *stalled* run (a lost
        // done/error, e.g. the JS context torn down by a navigation) with an inactivity timeout that
        // every progress event pushes back — rather than a flat cap that would cut off slow deletions.
        var inactivityMs = InactivityLimitMs(timeouts);
        using var inactivityCts = new CancellationTokenSource(inactivityMs);
        _activityResetters[requestId] = () => inactivityCts.CancelAfter(inactivityMs);

        using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, inactivityCts.Token);
        await using var registration = linkedCts.Token.Register(() => tcs.TrySetCanceled(linkedCts.Token));

        try
        {
            var runParams = new
            {
                requestId,
                waitAfterDelete = timeouts.WaitAfterDelete,
                waitBetweenRetryDeleteAttempts = timeouts.WaitBetweenRetryDeleteAttempts,
                userName = platform == Platform.X ? _xUserName : null
            };
            var paramsJson = JsonSerializer.Serialize(runParams, BridgeJson.Options);

            var script = $"window.__cmp && window.__cmp.run({ToJs(platform)}, {ToJs(action)}, {ToJs(paramsJson)})";
            await _siteWebViewService.ExecuteScriptAsync(script);

            ContentMessageDto message;
            try
            {
                message = await tcs.Task;
            }
            catch (OperationCanceledException ex)
            {
                if (inactivityCts.IsCancellationRequested && !cancellationToken.IsCancellationRequested)
                {
                    _logger.LogWarning(ex, "Action {Action} stalled for {Ms}ms with no progress; aborting.", action, inactivityMs);
                }

                throw;
            }

            if (message.Type == "error")
            {
                _logger.LogWarning("Action {Action} reported an error: {Message}", action, message.Message);
                return 0;
            }

            return message.DeletedCount ?? 0;
        }
        finally
        {
            _pendingRuns.Remove(requestId);
            _activityResetters.Remove(requestId);
        }
    }

    private static int InactivityLimitMs(TimeoutSettingsDto timeouts) =>
        30_000 + timeouts.WaitAfterDelete + timeouts.WaitAfterDocumentLoad;

    private async Task<string> BuildUrlAsync(Platform platform, string action)
    {
        if (platform == Platform.Youtube)
        {
            return action switch
            {
                "showComments" or "deleteComments" => _appConfig.YouTubeCommentsUrl,
                "showLikes" or "deleteLikes" => _appConfig.YouTubeLikedVideosUrl,
                _ => null
            };
        }

        var userName = await EnsureXUserNameAsync();
        if (string.IsNullOrEmpty(userName))
        {
            _logger.LogWarning("Cannot build a x.com URL for {Action}: no logged-in user detected yet.", action);
            return null;
        }

        var encodedUser = WebUtility.UrlEncode(userName);
        return action switch
        {
            "showPosts" or "deletePosts" => $"https://x.com/search?q={WebUtility.UrlEncode($"from:{userName}")}&src=typed_query",
            "showReplies" or "deleteReplies" => $"https://x.com/{encodedUser}/with_replies",
            "showReposts" or "deleteReposts" => $"https://x.com/{encodedUser}",
            "showLikes" or "deleteLikes" => $"https://x.com/{encodedUser}/likes",
            "showFollowing" or "deleteFollowing" => $"https://x.com/{encodedUser}/following",
            _ => null
        };
    }

    private async Task<string> EnsureXUserNameAsync()
    {
        // Re-read on every call rather than caching for the session: the user may sign out and back in
        // as a different account, and a stale name would build URLs for the wrong profile. The last
        // known name is kept only as a fallback for the moments the page can't resolve it yet.
        var raw = await _siteWebViewService.ExecuteScriptAsync("window.__cmp ? window.__cmp.getUserName() : ''");
        var resolved = ScriptResult.Unwrap(raw);
        if (!string.IsNullOrEmpty(resolved))
        {
            _xUserName = resolved;
        }

        return _xUserName ?? string.Empty;
    }

    private async Task CheckLoginStatusAsync(Platform platform)
    {
        if (_loginConfirmed.Contains(platform))
        {
            PushLoginStatus(platform, true);
            return;
        }

        const int maxAttempts = 5;
        const int delayMs = 500;

        for (var attempt = 0; attempt < maxAttempts; attempt++)
        {
            var loggedIn = platform == Platform.X
                ? !string.IsNullOrEmpty(await EnsureXUserNameAsync())
                : await IsYouTubeLoggedInAsync();

            if (loggedIn)
            {
                _loginConfirmed.Add(platform);
                PushLoginStatus(platform, true);
                return;
            }

            await Task.Delay(delayMs);
        }

        _logger.LogInformation("Could not confirm login for {Platform} after {Attempts} attempts.", platform, maxAttempts);
        PushLoginStatus(platform, false);
    }

    private async Task<bool> IsYouTubeLoggedInAsync()
    {
        var result = await _siteWebViewService.ExecuteScriptAsync("window.__cmp ? window.__cmp.getLoginStatus() : ''");
        return ScriptResult.Unwrap(result).Contains("logged_in", StringComparison.OrdinalIgnoreCase);
    }

    private void PushLoginStatus(Platform platform, bool loggedIn)
    {
        var payload = new SiteLoginPayloadDto(platform, loggedIn);
        var json = JsonSerializer.Serialize(new { @event = "siteLogin", payload }, BridgeJson.Options);
        _chromeWebViewService.PostMessage(json);
    }

    private void OnSiteWebMessageReceived(object sender, WebMessageReceivedEventArgs e)
    {
        ContentMessageDto message;
        try
        {
            message = JsonSerializer.Deserialize<ContentMessageDto>(e.Message, BridgeJson.Options);
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "Malformed content-script message: {Raw}", e.Message);
            return;
        }

        if (message == null)
        {
            return;
        }

        switch (message.Type)
        {
            case "log":
                LogContentMessage(message);
                break;

            case "progress":
                if (message.RequestId != null)
                {
                    if (_activityResetters.TryGetValue(message.RequestId, out var reset))
                    {
                        reset();
                    }

                    var basis = _progressBase.GetValueOrDefault(message.RequestId);
                    var payload = new ProgressPayloadDto(message.RequestId, basis + (message.DeletedCount ?? 0), message.Message);
                    var json = JsonSerializer.Serialize(new { @event = "progress", payload }, BridgeJson.Options);
                    _chromeWebViewService.PostMessage(json);
                }

                break;

            case "done" or "error":
                if (message.RequestId != null && _pendingRuns.TryGetValue(message.RequestId, out var tcs))
                {
                    tcs.TrySetResult(message);
                }

                break;
        }
    }

    private void LogContentMessage(ContentMessageDto message)
    {
        switch (message.Level)
        {
            case "error":
                _logger.LogError("JS: {Message}", message.Message);
                break;
            case "warning":
                _logger.LogWarning("JS: {Message}", message.Message);
                break;
            default:
                _logger.LogInformation("JS: {Message}", message.Message);
                break;
        }
    }

    private static string ToJs(object value) => JsonSerializer.Serialize(value, BridgeJson.Options);
}
