using System.Windows.Input;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Microsoft.Web.WebView2.Core;
using XTweetCleaner.UI.Contracts.Services;

namespace XTweetCleaner.UI.ViewModels;

public partial class MainViewModel : ObservableObject
{
    private readonly IXWebViewScriptService _xWebViewScriptService;
    private Microsoft.Web.WebView2.Wpf.WebView2 _webView;
    public ICommand DeleteAllPostsCommand { get; }
    private const string XBaseUrl = "https://x.com";

    [ObservableProperty]
    private bool _isDeleteButtonEnabled;

    public MainViewModel(IXWebViewScriptService xWebViewScriptService)
    {
        _xWebViewScriptService = xWebViewScriptService;
        DeleteAllPostsCommand = new AsyncRelayCommand(ExecuteDeleteAllPostsAsync);
    }

    public async Task InitializeAsync(Microsoft.Web.WebView2.Wpf.WebView2 webView)
    {
        _webView = webView;
        await _webView.EnsureCoreWebView2Async();

#if DEBUG
        await _webView.CoreWebView2.CallDevToolsProtocolMethodAsync("Console.enable", "{}");
#endif

        _webView.Source = new Uri(XBaseUrl);
        _webView.NavigationCompleted += IsUserLoggedInEventHandler();
    }

    private EventHandler<CoreWebView2NavigationCompletedEventArgs> IsUserLoggedInEventHandler()
    {
        return async (s, e) =>
        {
            if (e.IsSuccess)
            {
                var maxRetries = 5;
                var delayInMilliseconds = 500;
                var attempts = 0;
                string userName = null;

                while (attempts < maxRetries)
                {
                    userName = await _xWebViewScriptService.GetUserNameAsync(_webView);
                    if (!string.IsNullOrEmpty(userName))
                    {
                        IsDeleteButtonEnabled = true;
                        return;
                    }
                    else
                    {
                        attempts++;
                        await Task.Delay(delayInMilliseconds);
                    }
                }
            }
        };
    }

    private async Task ExecuteDeleteAllPostsAsync()
    {
        IsDeleteButtonEnabled = false;
        _webView.NavigationCompleted -= IsUserLoggedInEventHandler();
        await _xWebViewScriptService.DeleteAllPostsAsync(_webView);
        IsDeleteButtonEnabled = true;
    }
}
