using Microsoft.Web.WebView2.Wpf;
using XTweetCleaner.UI.Models;

namespace XTweetCleaner.UI.Contracts.Services;

public interface IWebViewHostService
{
    Task InitializeAsync(WebView2 webView);
    Task<string> ExecuteScriptAsync(string script);
    Uri Source { get; set; }
    event EventHandler<NavigationCompletedEventArgs> NavigationCompleted;
    event EventHandler<WebMessageReceivedEventArgs> WebMessageReceived;
}
