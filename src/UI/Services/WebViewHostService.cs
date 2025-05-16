using Microsoft.Web.WebView2.Wpf;
using XTweetCleaner.UI.Contracts.Services;
using XTweetCleaner.UI.Models;

namespace XTweetCleaner.UI.Services;

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

        _webView.CoreWebView2InitializationCompleted += (_, e) =>
        {
            if (e.IsSuccess)
            {
                _webView.CoreWebView2.WebMessageReceived += (_, msgEvent) =>
                {
                    var message = msgEvent.TryGetWebMessageAsString();
                    WebMessageReceived?.Invoke(this, new WebMessageReceivedEventArgs { Message = message });
                };
            }
        };

        await _webView.EnsureCoreWebView2Async();
    }

    public Task<string> ExecuteScriptAsync(string script)
    {
        return _webView?.CoreWebView2 != null ? _webView.ExecuteScriptAsync(script) : Task.FromResult<string>(null);
    }
}
