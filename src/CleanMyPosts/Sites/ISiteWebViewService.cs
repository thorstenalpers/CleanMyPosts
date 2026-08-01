using Microsoft.UI.Xaml.Controls;

namespace CleanMyPosts.Sites;

/// <summary>
/// Lifecycle and transport for the WebView2 that renders the target site
/// (x.com / youtube.com). Orchestration (retries, URL building) lives in
/// <c>SiteActionOrchestrator</c>, not here.
/// </summary>
public interface ISiteWebViewService
{
    Uri? Source { get; set; }
    Task InitializeAsync(WebView2 webView);
    Task<string?> ExecuteScriptAsync(string script);
    void Reload();
    void Hide(bool hide);
    event EventHandler<NavigationCompletedEventArgs>? NavigationCompleted;

    /// <summary>Raw messages posted by the injected content-script.</summary>
    event EventHandler<WebMessageReceivedEventArgs>? WebMessageReceived;
}
