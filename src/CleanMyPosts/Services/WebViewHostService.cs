using System.IO;
using System.Reflection;
using System.Windows;
using CleanMyPosts.Contracts.Services;
using CleanMyPosts.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.Wpf;

namespace CleanMyPosts.Services;

public class WebViewHostService(ILogger<WebViewHostService> logger) : IWebViewHostService
{
    private readonly ILogger<WebViewHostService> _logger = logger;
    private CoreWebView2Environment _env;
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
        if (_webView != null && _webView == webView && _webView.CoreWebView2 != null)
        {
            return;
        }

        _webView = webView ?? throw new ArgumentNullException(nameof(webView));

        _webView.NavigationCompleted += (_, e) =>
            NavigationCompleted?.Invoke(this, new NavigationCompletedEventArgs { IsSuccess = e.IsSuccess });

        if (_env == null)
        {
            var userDataFolder = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                Assembly.GetExecutingAssembly().GetName().Name,
                "WebView-XPage");

            Directory.CreateDirectory(userDataFolder);

            var options = new CoreWebView2EnvironmentOptions(null, "en-US");
            _env = await CoreWebView2Environment.CreateAsync(null, userDataFolder, options);
        }

        await _webView.EnsureCoreWebView2Async(_env);

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

    public void Reload()
    {
        _webView.Reload();
        _logger.LogInformation("Page reloaded");
    }

    public void Hide(bool hide)
    {
        _webView.Visibility = hide ? Visibility.Hidden : Visibility.Visible;
    }
}