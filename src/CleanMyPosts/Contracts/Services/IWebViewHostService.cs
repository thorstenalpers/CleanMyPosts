using CleanMyPosts.Models;
using Microsoft.Web.WebView2.Wpf;

namespace CleanMyPosts.Contracts.Services;

public interface IWebViewHostService
{
    Uri Source { get; set; }
    Task InitializeAsync(WebView2 webView);
    Task<string> ExecuteScriptAsync(string script);
    void Reload();
    void Hide(bool hide);
    event EventHandler<NavigationCompletedEventArgs> NavigationCompleted;
    event EventHandler<WebMessageReceivedEventArgs> WebMessageReceived;
}