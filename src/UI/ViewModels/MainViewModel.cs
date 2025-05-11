using System.Windows;
using System.Windows.Input;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using MahApps.Metro.Controls.Dialogs;
using XTweetCleaner.Core.Contracts.Services;
using XTweetCleaner.UI.Contracts.Services;

namespace XTweetCleaner.UI.ViewModels;

public partial class MainViewModel : ObservableObject
{
    private readonly IWebViewService _webViewService;
    private readonly IXService _xService;
    private Microsoft.Web.WebView2.Wpf.WebView2 _webView;
    public ICommand DeleteAllPostsCommand { get; }
    private readonly IDialogCoordinator _dialogCoordinator;

    private readonly Uri _source = new("https://x.com");
    private string _operationId;
    private string _screen_name;

    public MainViewModel(IWebViewService webViewService, IXService xService, IDialogCoordinator dialogCoordinator)
    {
        _webViewService = webViewService;
        _xService = xService;
        DeleteAllPostsCommand = new AsyncRelayCommand(ExecuteDeleteAllPostsAsync);
        _dialogCoordinator = dialogCoordinator;
    }

    public async Task InitializeAsync(Microsoft.Web.WebView2.Wpf.WebView2 webView)
    {
        _webView = webView;
        await _webView.EnsureCoreWebView2Async();
        await _webView.CoreWebView2.CallDevToolsProtocolMethodAsync("Network.enable", "{}");

        _webView.Source = _source;

        _webView.NavigationCompleted += async (s, e) =>
        {
            if (e.IsSuccess)
            {
                (_operationId, _screen_name) = await _webViewService.GetOperationIdsAsync(_webView);
            }
        };
    }


    private async Task ExecuteDeleteAllPostsAsync()
    {
        var (authToken, ct0) = await _webViewService.GetTwitterCookiesAsync(_webView);

        if (string.IsNullOrEmpty(authToken) || string.IsNullOrEmpty(ct0))
        {
            await ShowInfoDialogAsync("Login Required", "Please log in to continue.");
            return;
        }

        await _xService.DeleteAllTweetsAsync(authToken, ct0, _screen_name, _operationId);
    }

    private async Task ShowInfoDialogAsync(string title, string message)
    {
        _webView.Visibility = Visibility.Collapsed;
        await _dialogCoordinator.ShowMessageAsync(
            this,
            title,
            message,
            MessageDialogStyle.Affirmative);
        _webView.Visibility = Visibility.Visible;
    }

    public void ClearCookiesOnClose()
    {
        _webView?.CoreWebView2?.CookieManager?.DeleteAllCookies();
    }
}
