using System.Text.Json;
using System.Windows;
using CleanMyPosts.Contracts.Services;
using CleanMyPosts.Models;
using CleanMyPosts.Views;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using MahApps.Metro.Controls.Dialogs;
using Microsoft.Extensions.Logging;
using Microsoft.Web.WebView2.Wpf;

namespace CleanMyPosts.ViewModels;

public partial class XViewModel : ObservableObject
{
    private readonly IDialogCoordinator _dialogCoordinator;
    private readonly ILogger<XViewModel> _logger;
    private readonly IUserSettingsService _userSettingsService;
    private readonly IWebViewHostService _webViewHostService;

    private readonly string _xBaseUrl;
    private readonly IXScriptService _xWebViewScriptService;

    [ObservableProperty] private bool _areButtonsEnabled;

    private bool _isInitialized;

    [ObservableProperty] private bool _isNotificationOpen;

    [ObservableProperty] private bool _isWebViewEnabled = true;

    [ObservableProperty] private string _notificationMessage;

    private OverlayPleaseWaitWindow _overlayPleaseWaitWindow;
    private string _userName;

    public XViewModel(ILogger<XViewModel> logger,
        IUserSettingsService userSettingsService,
        IWebViewHostService webViewHostService,
        IDialogCoordinator dialogCoordinator,
        AppConfig appConfig,
        IXScriptService xWebViewScriptService)
    {
        _webViewHostService = webViewHostService ?? throw new ArgumentNullException(nameof(webViewHostService));
        _userSettingsService = userSettingsService ?? throw new ArgumentNullException(nameof(userSettingsService));
        _dialogCoordinator = dialogCoordinator ?? throw new ArgumentNullException(nameof(dialogCoordinator));
        _xWebViewScriptService =
            xWebViewScriptService ?? throw new ArgumentNullException(nameof(xWebViewScriptService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));

        _xBaseUrl = appConfig.XBaseUrl;
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
        _isInitialized = true;
    }

    private async void OnNavigationCompleted(object sender, NavigationCompletedEventArgs e)
    {
        if (e.IsSuccess)
        {
            var jsLoggerPatch = @"
              (() => {
                function attachLogger() {
                  const originalConsole = {
                    log: console.log,
                    warn: console.warn,
                    error: console.error,
                  };

                  function sendLog(level, args) {
                    const message = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' ');

                    // Optional: filter out unwanted logs here
                    if (message.includes('[GSI_LOGGER]')) {
                      return; // Skip unwanted logs
                    }

                    chrome.webview.postMessage(JSON.stringify({
                      level,
                      message
                    }));
                  }

                  console.log = function (...args) {
                    sendLog('info', args);
                    originalConsole.log.apply(console, args);
                  };

                  console.warn = function (...args) {
                    sendLog('warn', args);
                    originalConsole.warn.apply(console, args);
                  };

                  console.error = function (...args) {
                    sendLog('error', args);
                    originalConsole.error.apply(console, args);
                  };

                  window.onerror = function (message, source, lineno, colno, error) {
                    sendLog('error', [`JS Error: ${message} at ${source}:${lineno}:${colno}`]);
                  };
                }

                if (document.readyState === 'complete' || document.readyState === 'interactive') {
                  attachLogger();
                } else {
                  document.addEventListener('DOMContentLoaded', attachLogger);
                }
              })();
            ";


            await _webViewHostService.ExecuteScriptAsync(jsLoggerPatch);

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
            var jsonDoc = JsonDocument.Parse(e.Message);
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

                    attempts++;
                    await Task.Delay(delayInMilliseconds);
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
            EnableUserInteractions(false, true, true);

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
            EnableUserInteractions(false, true, true);
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
                    var deletedItems = await _xWebViewScriptService.DeleteLikesAsync();
                    await ShowNotificationAsync($"{deletedItems} like(s) cleaned.", TimeSpan.FromSeconds(3));
                }
            }
            else
            {
                var deletedItems = await _xWebViewScriptService.DeleteLikesAsync();
                await ShowNotificationAsync($"{deletedItems} like(s) cleaned.", TimeSpan.FromSeconds(3));
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
            EnableUserInteractions(false, true, true);

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
                    await ShowNotificationAsync($"{deletetCnt} following(s) cleaned successfully.",
                        TimeSpan.FromSeconds(3));
                }
            }
            else
            {
                var deletetCnt = await _xWebViewScriptService.DeleteFollowingAsync();
                await ShowNotificationAsync($"{deletetCnt} following(s) cleaned successfully.",
                    TimeSpan.FromSeconds(3));
            }
        }
        finally
        {
            EnableUserInteractions(true);
        }
    }


    [RelayCommand]
    private async Task ShowReposts()
    {
        try
        {
            EnableUserInteractions(false);
            await _xWebViewScriptService.ShowRepostsAsync();
        }
        finally
        {
            EnableUserInteractions(true);
        }
    }

    [RelayCommand]
    private async Task DeleteReposts()
    {
        try
        {
            EnableUserInteractions(false, true, true);

            if (_userSettingsService.GetConfirmDeletion())
            {
                _webViewHostService.Hide(true);
                var result = await _dialogCoordinator.ShowMessageAsync(
                    this,
                    "Confirm Deletion",
                    "Are you sure you want to delete all reposts?",
                    MessageDialogStyle.AffirmativeAndNegative);
                _webViewHostService.Hide(false);

                if (result == MessageDialogResult.Affirmative)
                {
                    var deletetCnt = await _xWebViewScriptService.DeleteRepostsAsync();
                    await ShowNotificationAsync($"{deletetCnt} repost(s) cleaned successfully.",
                        TimeSpan.FromSeconds(3));
                }
            }
            else
            {
                var deletetCnt = await _xWebViewScriptService.DeleteRepostsAsync();
                await ShowNotificationAsync($"{deletetCnt} repost(s) cleaned successfully.", TimeSpan.FromSeconds(3));
            }
        }
        finally
        {
            EnableUserInteractions(true);
        }
    }


    [RelayCommand]
    private async Task ShowReplies()
    {
        try
        {
            EnableUserInteractions(false);
            await _xWebViewScriptService.ShowRepliesAsync();
        }
        finally
        {
            EnableUserInteractions(true);
        }
    }

    [RelayCommand]
    private async Task DeleteReplies()
    {
        try
        {
            EnableUserInteractions(false, true, true);

            if (_userSettingsService.GetConfirmDeletion())
            {
                _webViewHostService.Hide(true);
                var result = await _dialogCoordinator.ShowMessageAsync(
                    this,
                    "Confirm Deletion",
                    "Are you sure you want to delete all replies?",
                    MessageDialogStyle.AffirmativeAndNegative);
                _webViewHostService.Hide(false);

                if (result == MessageDialogResult.Affirmative)
                {
                    var deletetCnt = await _xWebViewScriptService.DeleteRepliesAsync();
                    await ShowNotificationAsync($"{deletetCnt} replie(s) cleaned successfully.",
                        TimeSpan.FromSeconds(3));
                }
            }
            else
            {
                var deletetCnt = await _xWebViewScriptService.DeleteFollowingAsync();
                await ShowNotificationAsync($"{deletetCnt} replie(s) cleaned successfully.", TimeSpan.FromSeconds(3));
            }
        }
        finally
        {
            EnableUserInteractions(true);
        }
    }

    private void EnableUserInteractions(bool enableUserInteractions, bool useOverlay = true,
        bool showOverlayUpdateProgress = false)
    {
        if (enableUserInteractions)
        {
            IsWebViewEnabled = true;
            AreButtonsEnabled = true;
            if (_overlayPleaseWaitWindow != null)
            {
                var mainWindow = Application.Current?.MainWindow;
                if (mainWindow != null)
                {
                    mainWindow.LocationChanged -= MainWindowOnLocationOrSizeChanged;
                    mainWindow.SizeChanged -= MainWindowOnLocationOrSizeChanged;
                }

                _overlayPleaseWaitWindow.Close();
                _overlayPleaseWaitWindow = null;
            }
        }
        else
        {
            IsWebViewEnabled = false;
            AreButtonsEnabled = false;

            if (useOverlay && _overlayPleaseWaitWindow == null)
            {
                _overlayPleaseWaitWindow = new OverlayPleaseWaitWindow
                {
                    WindowStartupLocation = WindowStartupLocation.Manual, Owner = Application.Current?.MainWindow
                };
                UpdateOverlayPosition();
                var mainWindow = Application.Current?.MainWindow;
                if (mainWindow != null)
                {
                    mainWindow.LocationChanged += MainWindowOnLocationOrSizeChanged;
                    mainWindow.SizeChanged += MainWindowOnLocationOrSizeChanged;
                }

                _overlayPleaseWaitWindow.ShowOverlay(showOverlayUpdateProgress);
            }
        }
    }

    private void MainWindowOnLocationOrSizeChanged(object sender, EventArgs e)
    {
        UpdateOverlayPosition();
    }

    private void UpdateOverlayPosition()
    {
        if (_overlayPleaseWaitWindow == null)
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

            _overlayPleaseWaitWindow.Left = topLeftInWpfUnits.X;
            _overlayPleaseWaitWindow.Top = topLeftInWpfUnits.Y;
            _overlayPleaseWaitWindow.Width = mainWindow.ActualWidth;
            _overlayPleaseWaitWindow.Height = mainWindow.ActualHeight;
        }
        else
        {
            _overlayPleaseWaitWindow.Left = topLeft.X;
            _overlayPleaseWaitWindow.Top = topLeft.Y;
            _overlayPleaseWaitWindow.Width = mainWindow.ActualWidth;
            _overlayPleaseWaitWindow.Height = mainWindow.ActualHeight;
        }
    }
}