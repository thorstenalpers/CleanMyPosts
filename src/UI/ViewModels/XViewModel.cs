using System.Windows;
using CleanMyPosts.UI.Contracts.Services;
using CleanMyPosts.UI.Models;
using CleanMyPosts.UI.Views;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.Web.WebView2.Wpf;

namespace CleanMyPosts.UI.ViewModels;

public partial class XViewModel : ObservableObject
{
    private readonly IWebViewHostService _webViewHostService;
    private readonly ILogger<XViewModel> _logger;
    private readonly IXWebViewScriptService _xWebViewScriptService;
    private OverlayWindow _overlayWindow;

    private readonly string xBaseUrl;

    [ObservableProperty]
    private bool _areButtonsEnabled;

    private bool _isInitialized = false;
    private string _userName;

    public XViewModel(ILogger<XViewModel> logger,
                         IWebViewHostService webViewHostService,
                         IOptions<AppConfig> options,
                         IXWebViewScriptService xWebViewScriptService)
    {
        _webViewHostService = webViewHostService ?? throw new ArgumentNullException(nameof(webViewHostService));
        _xWebViewScriptService = xWebViewScriptService ?? throw new ArgumentNullException(nameof(xWebViewScriptService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _webViewHostService.NavigationCompleted += OnNavigationCompleted;
        _webViewHostService.WebMessageReceived += OnWebMessageReceived;
        xBaseUrl = options.Value.XBaseUrl;
    }

    public async Task InitializeAsync(WebView2 webView)
    {
        if (_isInitialized)
        {
            return;
        }

        await _webViewHostService.InitializeAsync(webView);

        _webViewHostService.Source = new Uri(xBaseUrl);

        var jsScript = @"
                window.onerror = function(message, source, lineno, colno, error) {
                    chrome.webview.postMessage(JSON.stringify({
                        level: 'error',
                        message: `JS Error: ${message} at ${source}:${lineno}:${colno}`
                    }));
                };
            ";

        await _webViewHostService.ExecuteScriptAsync(jsScript);

        _isInitialized = true;
    }

    private async void OnNavigationCompleted(object sender, NavigationCompletedEventArgs e)
    {
        if (e.IsSuccess)
        {
            if (!string.IsNullOrEmpty(_userName))
            {
                return;
            }

            const int maxRetries = 5;
            const int delayMs = 500;

            var attempts = 0;
            while (attempts < maxRetries)
            {
                _userName = await _xWebViewScriptService.GetUserNameAsync();
                if (!string.IsNullOrEmpty(_userName))
                {
                    _logger.LogInformation("User logged in.");
                    AreButtonsEnabled = true;
                    return;
                }
                attempts++;
                await Task.Delay(delayMs);
            }
            _logger.LogInformation("User not logged in.");
        }
    }

    private void OnWebMessageReceived(object sender, WebMessageReceivedEventArgs e)
    {
        try
        {
            var jsonDoc = System.Text.Json.JsonDocument.Parse(e.Message);
            var root = jsonDoc.RootElement;
            var level = root.GetProperty("level").GetString();
            var message = root.GetProperty("message").GetString();

            if (level == "error")
            {
                _logger.LogError("JS Error: {Message}", message);
            }
            else if (level == "warning")
            {
                _logger.LogWarning("JS Warning: {Message}", message);
            }
            else
            {
                _logger.LogInformation("JS: {Message}", message);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Malformed JS message: {Raw}", e.Message);
        }
    }

    private EventHandler<NavigationCompletedEventArgs> IsUserLoggedInEventHandler()
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
                    userName = await _xWebViewScriptService.GetUserNameAsync();
                    if (!string.IsNullOrEmpty(userName))
                    {
                        AreButtonsEnabled = true;
                        _webViewHostService.NavigationCompleted -= IsUserLoggedInEventHandler();
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

    [RelayCommand]
    private async Task ShowPosts()
    {
        EnableUserInteractions(false);
        await _xWebViewScriptService.ShowPostsAsync();
        EnableUserInteractions(true);
    }

    [RelayCommand]
    private async Task DeletePosts()
    {
        EnableUserInteractions(false);
        await _xWebViewScriptService.DeletePostsAsync();
        EnableUserInteractions(true);
    }

    [RelayCommand]
    private async Task ShowLikes()
    {
        EnableUserInteractions(false);
        await _xWebViewScriptService.ShowLikesAsync();
        EnableUserInteractions(true);
    }

    [RelayCommand]
    private async Task DeleteLikes()
    {
        EnableUserInteractions(false);
        await Task.Delay(10002);
        EnableUserInteractions(true);
    }

    [RelayCommand]
    private async Task ShowFollowing()
    {
        EnableUserInteractions(false);
        await _xWebViewScriptService.ShowFollowingAsync();
        EnableUserInteractions(true);
    }

    [RelayCommand]
    private async Task DeleteFollowing()
    {
        EnableUserInteractions(false);
        await Task.Delay(10001);
        EnableUserInteractions(true);
    }

    private void EnableUserInteractions(bool enable)
    {
        if (enable)
        {
            AreButtonsEnabled = true;
            if (_overlayWindow != null)
            {
                var mainWindow = Application.Current.MainWindow;
                if (mainWindow != null)
                {
                    mainWindow.LocationChanged -= MainWindowOnLocationOrSizeChanged;
                    mainWindow.SizeChanged -= MainWindowOnLocationOrSizeChanged;
                }

                _overlayWindow.Close();
                _overlayWindow = null;
            }
        }
        else
        {
            AreButtonsEnabled = false;

            if (_overlayWindow == null)
            {
                _overlayWindow = new OverlayWindow
                {
                    WindowStartupLocation = WindowStartupLocation.Manual,
                    Owner = Application.Current.MainWindow
                };
                UpdateOverlayPosition();
                var mainWindow = Application.Current.MainWindow;
                if (mainWindow != null)
                {
                    mainWindow.LocationChanged += MainWindowOnLocationOrSizeChanged;
                    mainWindow.SizeChanged += MainWindowOnLocationOrSizeChanged;
                }
                _overlayWindow.Show();
            }
        }
    }

    private void MainWindowOnLocationOrSizeChanged(object sender, EventArgs e)
    {
        UpdateOverlayPosition();
    }

    private void UpdateOverlayPosition()
    {
        if (_overlayWindow == null)
        {
            return;
        }

        var mainWindow = Application.Current.MainWindow;
        if (mainWindow == null)
        {
            return;
        }

        var topLeft = mainWindow.PointToScreen(new Point(0, 0));

        var presentationSource = PresentationSource.FromVisual(mainWindow);
        if (presentationSource?.CompositionTarget != null)
        {
            var transform = presentationSource.CompositionTarget.TransformFromDevice;
            var topLeftInWpfUnits = transform.Transform(topLeft);

            _overlayWindow.Left = topLeftInWpfUnits.X;
            _overlayWindow.Top = topLeftInWpfUnits.Y;
            _overlayWindow.Width = mainWindow.ActualWidth;
            _overlayWindow.Height = mainWindow.ActualHeight;
        }
        else
        {
            _overlayWindow.Left = topLeft.X;
            _overlayWindow.Top = topLeft.Y;
            _overlayWindow.Width = mainWindow.ActualWidth;
            _overlayWindow.Height = mainWindow.ActualHeight;
        }
    }
}
