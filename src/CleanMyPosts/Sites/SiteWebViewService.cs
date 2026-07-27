using System.IO;
using System.Windows;
using Microsoft.Extensions.Logging;
using Microsoft.Web.WebView2.Wpf;
using CleanMyPosts.Infrastructure;

namespace CleanMyPosts.Sites;

public class SiteWebViewService(ILogger<SiteWebViewService> logger, WebView2EnvironmentProvider environmentProvider)
    : ISiteWebViewService
{
    private readonly ILogger<SiteWebViewService> _logger = logger;
    private readonly WebView2EnvironmentProvider _environmentProvider = environmentProvider;
    private WebView2 _webView;

    public event EventHandler<NavigationCompletedEventArgs> NavigationCompleted;
    public event EventHandler<WebMessageReceivedEventArgs> WebMessageReceived;

    public Uri Source
    {
        get => _webView?.Source;
        set => _webView.Source = value;
    }

    public async Task InitializeAsync(WebView2 webView, string contentScriptPath)
    {
        if (_webView != null && _webView == webView && _webView.CoreWebView2 != null)
        {
            return;
        }

        _webView = webView ?? throw new ArgumentNullException(nameof(webView));

        _webView.NavigationCompleted += (_, e) =>
            NavigationCompleted?.Invoke(this, new NavigationCompletedEventArgs { IsSuccess = e.IsSuccess });

        var env = await _environmentProvider.GetEnvironmentAsync();
        await _webView.EnsureCoreWebView2Async(env);

        // Persists across every subsequent navigation of this CoreWebView2 —
        // registered once, not re-injected per page load.
        var contentScript = await File.ReadAllTextAsync(contentScriptPath);
        await _webView.CoreWebView2.AddScriptToExecuteOnDocumentCreatedAsync(contentScript);

        // The content-script posts plain objects (`postMessage({...})`), not pre-stringified
        // JSON, so this must read them via TryGetWebMessageAsJson — TryGetWebMessageAsString
        // throws (silently, inside this WebView2-native event pump) for anything but a string.
        _webView.CoreWebView2.WebMessageReceived += (_, msgEvent) =>
        {
            var message = msgEvent.WebMessageAsJson;
            WebMessageReceived?.Invoke(this, new WebMessageReceivedEventArgs { Message = message });
        };
    }

    public Task<string> ExecuteScriptAsync(string script)
    {
        return _webView?.CoreWebView2 != null ? _webView.ExecuteScriptAsync(script) : Task.FromResult<string>(null);
    }

    public void Reload()
    {
        _webView.Reload();
        _logger.LogInformation("Site page reloaded");
    }

    public void Hide(bool hide)
    {
        _webView.Visibility = hide ? Visibility.Hidden : Visibility.Visible;
    }
}
