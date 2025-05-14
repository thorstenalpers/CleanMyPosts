using System.Windows;
using System.Windows.Input;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using MahApps.Metro.Controls.Dialogs;
using XTweetCleaner.UI.Contracts.Services;

namespace XTweetCleaner.UI.ViewModels;

public partial class MainViewModel : ObservableObject
{
    private readonly IXWebViewScriptService _xWebViewScriptService;
    private Microsoft.Web.WebView2.Wpf.WebView2 _webView;
    public ICommand DeleteAllPostsCommand { get; }
    private readonly IDialogCoordinator _dialogCoordinator;

    private const string _source = "https://x.com";
    private string _deleteTweetOperationId;
    private string _userByScreenNameOperationId;
    private string _userName;

    [ObservableProperty]
    private bool _isInitialized;

    public MainViewModel(IXWebViewScriptService xWebViewScriptService, IDialogCoordinator dialogCoordinator)
    {
        _xWebViewScriptService = xWebViewScriptService;
        DeleteAllPostsCommand = new AsyncRelayCommand(ExecuteDeleteAllPostsAsync);
        _dialogCoordinator = dialogCoordinator;
    }

    public async Task InitializeAsync(Microsoft.Web.WebView2.Wpf.WebView2 webView)
    {
        _webView = webView;
        await _webView.EnsureCoreWebView2Async();
        await _webView.CoreWebView2.CallDevToolsProtocolMethodAsync("Network.enable", "{}");
        await _webView.CoreWebView2.CallDevToolsProtocolMethodAsync("Console.enable", "{}");

        _webView.Source = new Uri(_source);

        _webView.NavigationCompleted += async (s, e) =>
        {
            if (e.IsSuccess)
            {
                (_deleteTweetOperationId, _userByScreenNameOperationId) = await _xWebViewScriptService.GetOperationIdsAsync(_webView);
                _userName = await _xWebViewScriptService.GetUserName(_webView);
                IsInitialized = true;
            }
        };
    }


    private async Task ExecuteDeleteAllPostsAsync()
    {
        var (authToken, ct0) = await _xWebViewScriptService.GetTwitterCookiesAsync(_webView);

        if (string.IsNullOrEmpty(authToken) || string.IsNullOrEmpty(ct0))
        {
            await ShowInfoDialogAsync("Login Required", "Please log in to continue.");
            return;
        }

        //await _xService.DeleteAllTweetsAsync(authToken, ct0, _userByScreenNameOperationId, _deleteTweetOperationId);
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
}
