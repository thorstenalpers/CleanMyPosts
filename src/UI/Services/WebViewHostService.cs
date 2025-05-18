using System.IO;
using CleanMyPosts.UI.Contracts.Services;
using CleanMyPosts.UI.Models;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.Wpf;

namespace CleanMyPosts.UI.Services;

public class WebViewHostService : IWebViewHostService
{
    private WebView2 _webView;

    public event EventHandler<NavigationCompletedEventArgs> NavigationCompleted;
    public event EventHandler<WebMessageReceivedEventArgs> WebMessageReceived;

    public Uri Source
    {
        get => _webView?.Source;
        set => _webView.Source = value;
    }

    public async Task InitializeAsync(WebView2 webView)
    {
        _webView = webView ?? throw new ArgumentNullException(nameof(webView));

        _webView.NavigationCompleted += (_, e) =>
            NavigationCompleted?.Invoke(this, new NavigationCompletedEventArgs { IsSuccess = e.IsSuccess });

        var userDataFolder = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), System.Reflection.Assembly.GetExecutingAssembly().GetName().Name, "WebView2");

        Directory.CreateDirectory(userDataFolder);

        var env = await CoreWebView2Environment.CreateAsync(null, userDataFolder);

        await _webView.EnsureCoreWebView2Async(env);

        _webView.CoreWebView2.WebMessageReceived += (_, msgEvent) =>
        {
            var message = msgEvent.TryGetWebMessageAsString();
            WebMessageReceived?.Invoke(this, new WebMessageReceivedEventArgs { Message = message });
        };
    }

    public Task<string> ExecuteScriptAsync(string script)
    {
        return _webView?.CoreWebView2 != null ? _webView.ExecuteScriptAsync(script) : Task.FromResult<string>(null);
    }
}
