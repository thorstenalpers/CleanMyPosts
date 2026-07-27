using Microsoft.Web.WebView2.Wpf;
using CleanMyPosts.Sites;

namespace CleanMyPosts.Infrastructure;

/// <summary>Lifecycle and transport for the WebView2 that hosts the Svelte shell UI.</summary>
public interface IChromeWebViewService
{
    Task InitializeAsync(WebView2 webView, string wwwRootPath);
    void PostMessage(string json);
    event EventHandler<WebMessageReceivedEventArgs> MessageReceived;
}
