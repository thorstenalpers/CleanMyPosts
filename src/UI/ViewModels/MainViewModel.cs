using System.Windows;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Microsoft.Extensions.Logging;
using Microsoft.Web.WebView2.Wpf;
using XTweetCleaner.UI.Contracts.Services;
using XTweetCleaner.UI.Models;
using XTweetCleaner.UI.Views;

namespace XTweetCleaner.UI.ViewModels;

public partial class MainViewModel : ObservableObject
{
    private readonly IWebViewHostService _webViewHostService;
    private readonly ILogger<MainViewModel> _logger;
    private readonly IXWebViewScriptService _xWebViewScriptService;
    private readonly IWindowManagerService _windowManagerService;
    private OverlayWindow _overlayWindow;

    private const string XBaseUrl = "https://x.com";

    [ObservableProperty]
    private bool _areButtonsEnabled;

    private bool _isInitialized = false;

    public MainViewModel(ILogger<MainViewModel> logger,
                         IWindowManagerService windowManagerService,
                         IWebViewHostService webViewHostService,
                         IXWebViewScriptService xWebViewScriptService)
    {
        _webViewHostService = webViewHostService ?? throw new ArgumentNullException(nameof(webViewHostService));
        _xWebViewScriptService = xWebViewScriptService ?? throw new ArgumentNullException(nameof(xWebViewScriptService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _windowManagerService = windowManagerService ?? throw new ArgumentNullException(nameof(windowManagerService));
        _xWebViewScriptService = xWebViewScriptService ?? throw new ArgumentNullException(nameof(xWebViewScriptService));
        _webViewHostService.NavigationCompleted += OnNavigationCompleted;
        _webViewHostService.WebMessageReceived += OnWebMessageReceived;
    }

    public async Task InitializeAsync(WebView2 webView)
    {
        if (_isInitialized)
        {
            return;
        }

        await _webViewHostService.InitializeAsync(webView);

        _webViewHostService.Source = new Uri(XBaseUrl);

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
            const int maxRetries = 5;
            const int delayMs = 500;

            var attempts = 0;
            while (attempts < maxRetries)
            {
                var userName = await _xWebViewScriptService.GetUserNameAsync();
                if (!string.IsNullOrEmpty(userName))
                {
                    _logger.LogInformation("User logged in.");
                    AreButtonsEnabled = true;
                    return;
                }
                attempts++;
                await Task.Delay(delayMs);
            }
            _logger.LogWarning("No username found.");
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
    private async Task ShowAllPosts()
    {
        var result = _windowManagerService.OpenInDialog(typeof(SettingsViewModel).FullName);
        if (result.HasValue)
        {
            return;
        }

        EnableUserInteractions(false);
        await Task.Delay(10000);
        //await _xWebViewScriptService.DeleteAllPostsAsync(_webView);
        EnableUserInteractions(true);
    }

    [RelayCommand]
    private async Task DeleteAllPosts()
    {
        EnableUserInteractions(false);
        await Task.Delay(10000);
        //await _xWebViewScriptService.DeleteAllPostsAsync(_webView);
        EnableUserInteractions(true);
    }

    [RelayCommand]
    private async Task ShowStarredPosts()
    {
        EnableUserInteractions(false);
        await Task.Delay(10000);
        //await _xWebViewScriptService.DeleteAllPostsAsync(_webView);
        EnableUserInteractions(true);
    }

    [RelayCommand]
    private async Task DeleteStarredPosts()
    {
        EnableUserInteractions(false);
        await Task.Delay(10000);
        //await _xWebViewScriptService.DeleteAllPostsAsync(_webView);
        EnableUserInteractions(true);
    }

    [RelayCommand]
    private async Task ShowFollowed()
    {
        EnableUserInteractions(false);
        await Task.Delay(10000);
        //await _xWebViewScriptService.DeleteAllPostsAsync(_webView);
        EnableUserInteractions(true);
    }

    [RelayCommand]
    private async Task DeleteFollowed()
    {
        EnableUserInteractions(false);
        await Task.Delay(10000);
        //await _xWebViewScriptService.DeleteAllPostsAsync(_webView);
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
