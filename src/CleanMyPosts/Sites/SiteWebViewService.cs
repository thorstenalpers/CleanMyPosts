using CleanMyPosts.Infrastructure;
using Microsoft.Extensions.Logging;
using Microsoft.UI.Xaml.Controls;

namespace CleanMyPosts.Sites;

public class SiteWebViewService(
    ILogger<SiteWebViewService> logger,
    WebView2EnvironmentProvider environmentProvider,
    WebAssetProvider assetProvider) : ISiteWebViewService
{
    private WebView2? _webView;

    public event EventHandler<NavigationCompletedEventArgs>? NavigationCompleted;
    public event EventHandler<WebMessageReceivedEventArgs>? WebMessageReceived;

    public Uri? Source
    {
        get => _webView?.Source;
        set
        {
            if (_webView is not null && value is not null)
            {
                _webView.Source = value;
            }
        }
    }

    public async Task InitializeAsync(WebView2 webView)
    {
        ArgumentNullException.ThrowIfNull(webView);

        if (_webView == webView && _webView.CoreWebView2 is not null)
        {
            return;
        }

        _webView = webView;

        _webView.NavigationCompleted += (_, e) =>
            NavigationCompleted?.Invoke(this, new NavigationCompletedEventArgs { IsSuccess = e.IsSuccess });

        var env = await environmentProvider.GetEnvironmentAsync();
        await _webView.EnsureCoreWebView2Async(env);

        // Persists across every subsequent navigation of this CoreWebView2 —
        // registered once, not re-injected per page load.
        var contentScript = await assetProvider.ReadTextAsync("content.js");
        await _webView.CoreWebView2.AddScriptToExecuteOnDocumentCreatedAsync(contentScript);

        // The content-script posts plain objects (`postMessage({...})`), not pre-stringified
        // JSON, so this must read them via TryGetWebMessageAsJson — TryGetWebMessageAsString
        // throws (silently, inside this WebView2-native event pump) for anything but a string.
        _webView.CoreWebView2.WebMessageReceived += (_, msgEvent) =>
            WebMessageReceived?.Invoke(this, new WebMessageReceivedEventArgs { Message = msgEvent.WebMessageAsJson });
    }

    public async Task<string?> ExecuteScriptAsync(string script) =>
        _webView?.CoreWebView2 is not null ? await _webView.ExecuteScriptAsync(script) : null;

    public void Reload()
    {
        _webView?.Reload();
        logger.LogInformation("Site page reloaded");
    }

    /// <summary>
    /// Opacity, not Visibility: a collapsed WebView2 stops rendering and would never
    /// finish the background sign-in load that makes the username available up front.
    /// </summary>
    public void Hide(bool hide)
    {
        if (_webView is null)
        {
            return;
        }

        _webView.Opacity = hide ? 0 : 1;
        _webView.IsHitTestVisible = !hide;
    }
}
