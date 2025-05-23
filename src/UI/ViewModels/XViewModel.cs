using System.Windows;
using CleanMyPosts.UI.Contracts.Services;
using CleanMyPosts.UI.Models;
using CleanMyPosts.UI.Views;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using MahApps.Metro.Controls.Dialogs;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.Web.WebView2.Wpf;

namespace CleanMyPosts.UI.ViewModels;

public partial class XViewModel : ObservableObject
{
    private readonly IWebViewHostService _webViewHostService;
    private readonly ILogger<XViewModel> _logger;
    private readonly IXScriptService _xWebViewScriptService;
    private readonly IDialogCoordinator _dialogCoordinator;
    private readonly IUserSettingsService _userSettingsService;
    private OverlayWindow _overlayWindow;

    private readonly string _xBaseUrl;

    [ObservableProperty]
    private bool _areButtonsEnabled;

    [ObservableProperty]
    private bool _isNotificationOpen;

    [ObservableProperty]
    private string _notificationMessage;

    [ObservableProperty]
    private bool _isWebViewEnabled = true;

    private bool _isInitialized = false;
    private string _userName;

    public XViewModel(ILogger<XViewModel> logger,
                         IUserSettingsService userSettingsService,
                         IWebViewHostService webViewHostService,
                         IDialogCoordinator dialogCoordinator,
                         IOptions<AppConfig> options,
                         IXScriptService xWebViewScriptService)
    {
        _webViewHostService = webViewHostService ?? throw new ArgumentNullException(nameof(webViewHostService));
        _userSettingsService = userSettingsService ?? throw new ArgumentNullException(nameof(userSettingsService));
        _dialogCoordinator = dialogCoordinator ?? throw new ArgumentNullException(nameof(dialogCoordinator));
        _xWebViewScriptService = xWebViewScriptService ?? throw new ArgumentNullException(nameof(xWebViewScriptService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));

        _xBaseUrl = options.Value.XBaseUrl;
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

        _webViewHostService.Source = new Uri(_xBaseUrl);

        // logging JS errors and warnings to ILogger
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
        try
        {
            EnableUserInteractions(false);
            await _xWebViewScriptService.ShowPostsAsync();
        }
        finally
        {
            EnableUserInteractions(true);
        }
    }

    [RelayCommand]
    private async Task DeletePosts()
    {
        try
        {
            EnableUserInteractions(false, false);

            if (_userSettingsService.GetConfirmDeletion())
            {
                _webViewHostService.Hide(true);
                var result = await _dialogCoordinator.ShowMessageAsync(
                this,
                "Confirm Deletion",
                "Are you sure you want to delete all posts?",
                MessageDialogStyle.AffirmativeAndNegative);
                _webViewHostService.Hide(false);

                if (result == MessageDialogResult.Affirmative)
                {
                    var deletetCnt = await _xWebViewScriptService.DeletePostsAsync();
                    await ShowNotificationAsync($"{deletetCnt} post(s) cleaned successfully.", TimeSpan.FromSeconds(3));
                }
            }
            else
            {
                var deletetCnt = await _xWebViewScriptService.DeletePostsAsync();
                await ShowNotificationAsync($"{deletetCnt} post(s) cleaned successfully.", TimeSpan.FromSeconds(3));
            }
        }
        finally
        {
            EnableUserInteractions(true);
        }
    }

    private async Task ShowNotificationAsync(string msg, TimeSpan delay)
    {
        NotificationMessage = msg;
        IsNotificationOpen = true;
        await Task.Delay(delay);
        IsNotificationOpen = false;
    }

    [RelayCommand]
    private async Task ShowLikes()
    {
        try
        {
            EnableUserInteractions(false);
            await _xWebViewScriptService.ShowLikesAsync();
        }
        finally
        {
            EnableUserInteractions(true);
        }
    }

    [RelayCommand]
    private async Task DeleteLikes()
    {
        try
        {
            EnableUserInteractions(false, false);
            if (_userSettingsService.GetConfirmDeletion())
            {
                _webViewHostService.Hide(true);
                var result = await _dialogCoordinator.ShowMessageAsync(
                this,
                "Confirm Deletion",
                "Are you sure you want to delete all likes?",
                MessageDialogStyle.AffirmativeAndNegative);
                _webViewHostService.Hide(false);

                if (result == MessageDialogResult.Affirmative)
                {
                    var deletetCnt = await _xWebViewScriptService.DeleteLikesAsync();
                    await ShowNotificationAsync($"{deletetCnt} like(s) cleaned successfully.", TimeSpan.FromSeconds(3));
                }
            }
            else
            {
                var deletetCnt = await _xWebViewScriptService.DeleteLikesAsync();
                await ShowNotificationAsync($"{deletetCnt} like(s) cleaned successfully.", TimeSpan.FromSeconds(3));
            }
        }
        finally
        {
            EnableUserInteractions(true);
        }
    }

    [RelayCommand]
    private async Task ShowFollowing()
    {
        try
        {
            EnableUserInteractions(false);
            await _xWebViewScriptService.ShowFollowingAsync();
        }
        finally
        {
            EnableUserInteractions(true);
        }
    }

    [RelayCommand]
    private async Task DeleteFollowing()
    {
        try
        {
            EnableUserInteractions(false, false);

            if (_userSettingsService.GetConfirmDeletion())
            {
                _webViewHostService.Hide(true);
                var result = await _dialogCoordinator.ShowMessageAsync(
                    this,
                    "Confirm Deletion",
                    "Are you sure you want to delete all following?",
                    MessageDialogStyle.AffirmativeAndNegative);
                _webViewHostService.Hide(false);

                if (result == MessageDialogResult.Affirmative)
                {
                    var deletetCnt = await _xWebViewScriptService.DeleteFollowingAsync();
                    await ShowNotificationAsync($"{deletetCnt} following(s) cleaned successfully.", TimeSpan.FromSeconds(3));
                }
            }
            else
            {
                var deletetCnt = await _xWebViewScriptService.DeleteFollowingAsync();
                await ShowNotificationAsync($"{deletetCnt} following(s) cleaned successfully.", TimeSpan.FromSeconds(3));
            }
        }
        finally
        {
            EnableUserInteractions(true);
        }
    }

    private void EnableUserInteractions(bool enable, bool showOverlay = true)
    {
        if (enable)
        {
            IsWebViewEnabled = true;
            AreButtonsEnabled = true;
            if (_overlayWindow != null)
            {
                var mainWindow = Application.Current?.MainWindow;
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
            IsWebViewEnabled = false;
            AreButtonsEnabled = false;

            if (showOverlay && _overlayWindow == null)
            {
                _overlayWindow = new OverlayWindow
                {
                    WindowStartupLocation = WindowStartupLocation.Manual,
                    Owner = Application.Current?.MainWindow
                };
                UpdateOverlayPosition();
                var mainWindow = Application.Current?.MainWindow;
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

        var mainWindow = Application.Current?.MainWindow;
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
