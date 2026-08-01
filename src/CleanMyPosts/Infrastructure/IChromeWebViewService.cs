using CleanMyPosts.Sites;
using Microsoft.UI.Xaml.Controls;

namespace CleanMyPosts.Infrastructure;

/// <summary>Lifecycle and transport for the WebView2 that hosts the Svelte shell UI.</summary>
public interface IChromeWebViewService
{
    Task InitializeAsync(WebView2 webView);
    void PostMessage(string json);
    event EventHandler<WebMessageReceivedEventArgs> MessageReceived;
}
