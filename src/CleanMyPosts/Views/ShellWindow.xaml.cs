using CleanMyPosts.Hosting;
using CleanMyPosts.Infrastructure;
using CleanMyPosts.Logging;
using CleanMyPosts.Settings;
using CleanMyPosts.Sites;
using CleanMyPosts.Updater;
using Microsoft.Extensions.Logging;
using Microsoft.UI;
using Microsoft.UI.Windowing;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml.Media;
using Windows.Graphics;

namespace CleanMyPosts.Views;

public sealed partial class ShellWindow : Window, IShellWindow, IShellLayoutService
{
    private const int DefaultWidth = 1000;
    private const int DefaultHeight = 640;
    private const int SidebarExpandedWidth = 240;
    private const int SidebarCollapsedWidth = 56;

    // If the UI never reports ready the skeleton would hide the app forever.
    private static readonly TimeSpan SkeletonTimeout = TimeSpan.FromSeconds(15);

    private readonly IUserSettingsService _userSettingsService;
    private readonly IChromeWebViewService _chromeWebViewService;
    private readonly ISiteWebViewService _siteWebViewService;
    private readonly HostBridge _hostBridge;
    private readonly SiteActionOrchestrator _siteActionOrchestrator;
    private readonly ILogBuffer _logBuffer;
    private readonly AppConfig _appConfig;
    private readonly UpdaterConfig _updaterConfig;
    private readonly ILogger<ShellWindow> _logger;

    private bool _shuttingDown;

    public ShellWindow(
        IUserSettingsService userSettingsService,
        IChromeWebViewService chromeWebViewService,
        ISiteWebViewService siteWebViewService,
        HostBridge hostBridge,
        SiteActionOrchestrator siteActionOrchestrator,
        ILogBuffer logBuffer,
        AppConfig appConfig,
        UpdaterConfig updaterConfig,
        ILogger<ShellWindow> logger)
    {
        _userSettingsService = userSettingsService;
        _chromeWebViewService = chromeWebViewService;
        _siteWebViewService = siteWebViewService;
        _hostBridge = hostBridge;
        _siteActionOrchestrator = siteActionOrchestrator;
        _logBuffer = logBuffer;
        _appConfig = appConfig;
        _updaterConfig = updaterConfig;
        _logger = logger;

        InitializeComponent();
        _siteActionOrchestrator.AttachLayoutService(this);

        SystemBackdrop = new MicaBackdrop();
        ExtendsContentIntoTitleBar = true;
        SetTitleBar(DragRegion);
        NativeMethods.ApplyExecutableIcon(AppWindow);

        RestoreWindowBounds();
        ApplyAppearance();
        _userSettingsService.SettingChanged += OnSettingChanged;
        AppWindow.Closing += OnClosing;
    }

    public void ShowWindow() => Activate();

    public void CloseWindow() => Close();

    public void SetSidebarExpanded(bool expanded) => Enqueue(() =>
        SidebarColumn.Width = new GridLength(expanded ? SidebarExpandedWidth : SidebarCollapsedWidth));

    public void SetSiteVisible(bool visible) => Enqueue(() =>
        Grid.SetColumnSpan(ChromeWebView, visible ? 1 : 2));

    public void HideSkeleton() => Enqueue(() => SkeletonLayer.Visibility = Visibility.Collapsed);

    public async Task<bool> ConfirmUpdateAsync(string availableVersion, string installedVersion, string? changelogUrl)
    {
        var body = new StackPanel { Spacing = 8 };
        body.Children.Add(new TextBlock
        {
            Text = $"Version {availableVersion} is available. You are running {installedVersion}.",
            TextWrapping = TextWrapping.Wrap
        });

        if (!string.IsNullOrWhiteSpace(changelogUrl))
        {
            var link = new HyperlinkButton { Content = "View changelog", NavigateUri = new Uri(changelogUrl) };
            body.Children.Add(link);
        }

        var dialog = new ContentDialog
        {
            XamlRoot = RootGrid.XamlRoot,
            Title = "Update available",
            Content = body,
            PrimaryButtonText = "Update now",
            CloseButtonText = "Later",
            DefaultButton = ContentDialogButton.Primary
        };

        return await dialog.ShowAsync() == ContentDialogResult.Primary;
    }

    private async void OnLoaded(object sender, RoutedEventArgs e)
    {
        try
        {
            // Bring the menu (chrome) up first so it paints before the heavier site
            // WebView; the site then loads hidden in the background so the logged-in
            // username is ready the first time the user opens X.
            await _chromeWebViewService.InitializeAsync(ChromeWebView);
            await _siteWebViewService.InitializeAsync(SiteWebView);

            BridgeRegistrar.RegisterAll(
                _hostBridge,
                _userSettingsService,
                _siteActionOrchestrator,
                this,
                _logBuffer,
                _appConfig,
                _updaterConfig,
                _logger);
            _hostBridge.AttachTo(_chromeWebViewService);

            SetSiteVisible(false);
            _siteWebViewService.Hide(true);
            _siteWebViewService.Source = new Uri(_appConfig.XBaseUrl);

            StartSkeletonFallback();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Shell initialisation failed.");
            HideSkeleton();
        }
    }

    private void StartSkeletonFallback()
    {
        var timer = DispatcherQueue.CreateTimer();
        timer.Interval = SkeletonTimeout;
        timer.IsRepeating = false;
        timer.Tick += (t, _) =>
        {
            t.Stop();
            if (SkeletonLayer.Visibility == Visibility.Visible)
            {
                _logger.LogWarning("UI never reported ready; dropping the startup skeleton.");
                SkeletonLayer.Visibility = Visibility.Collapsed;
            }
        };
        timer.Start();
    }

    private void OnSettingChanged(object? sender, string settingName)
    {
        if (settingName is nameof(UserSettings.Theme) or nameof(UserSettings.AccentColor) or nameof(UserSettings.UseSystemAccent))
        {
            Enqueue(ApplyAppearance);
        }
    }

    private void ApplyAppearance()
    {
        var theme = _userSettingsService.GetCurrentTheme() switch
        {
            AppTheme.Light => ElementTheme.Light,
            AppTheme.Dark => ElementTheme.Dark,
            _ => ElementTheme.Default
        };

        RootGrid.RequestedTheme = theme;

        var isDark = theme == ElementTheme.Dark
                     || (theme == ElementTheme.Default && Application.Current.RequestedTheme == ApplicationTheme.Dark);

        var titleBar = AppWindow.TitleBar;
        titleBar.ButtonBackgroundColor = Colors.Transparent;
        titleBar.ButtonInactiveBackgroundColor = Colors.Transparent;
        titleBar.ButtonForegroundColor = isDark ? Colors.White : Colors.Black;
        titleBar.ButtonHoverForegroundColor = isDark ? Colors.White : Colors.Black;
        titleBar.ButtonHoverBackgroundColor = isDark
            ? Windows.UI.Color.FromArgb(32, 255, 255, 255)
            : Windows.UI.Color.FromArgb(24, 0, 0, 0);

        // The chrome WebView paints its own background; keeping it transparent lets Mica through.
        ChromeWebView.DefaultBackgroundColor = Colors.Transparent;
    }

    private void RestoreWindowBounds()
    {
        var settings = _userSettingsService.GetWindowSettings();
        var workArea = DisplayArea.GetFromWindowId(AppWindow.Id, DisplayAreaFallback.Primary).WorkArea;

        var width = settings.Width > 0 ? settings.Width : DefaultWidth;
        var height = settings.Height > 0 ? settings.Height : DefaultHeight;
        var left = settings.Left >= 0 ? settings.Left : workArea.X + ((workArea.Width - width) / 2);
        var top = settings.Top >= 0 ? settings.Top : workArea.Y + ((workArea.Height - height) / 2);

        var bounds = new RectInt32(left, top, width, height);
        if (!IsOnAnyDisplay(bounds))
        {
            bounds = new RectInt32(
                workArea.X + ((workArea.Width - width) / 2),
                workArea.Y + ((workArea.Height - height) / 2),
                width,
                height);
        }

        AppWindow.MoveAndResize(bounds);

        if (AppWindow.Presenter is OverlappedPresenter presenter)
        {
            switch (settings.WindowState)
            {
                case ShellWindowState.Maximized:
                    presenter.Maximize();
                    break;
                case ShellWindowState.Minimized:
                    presenter.Minimize();
                    break;
                default:
                    presenter.Restore();
                    break;
            }
        }
    }

    private static bool IsOnAnyDisplay(RectInt32 bounds)
    {
        var area = DisplayArea.GetFromRect(bounds, DisplayAreaFallback.None);
        return area is not null;
    }

    private async void OnClosing(AppWindow sender, AppWindowClosingEventArgs args)
    {
        if (_shuttingDown)
        {
            return;
        }

        // Closing the window would tear the process down mid-await, cutting off the
        // host shutdown and the log flush — so cancel, drain, then close for real.
        args.Cancel = true;
        _shuttingDown = true;

        _userSettingsService.SettingChanged -= OnSettingChanged;
        SaveWindowBounds();

        if (Application.Current is App app)
        {
            await app.ShutdownAsync();
        }

        Close();
    }

    private void SaveWindowBounds()
    {
        var state = AppWindow.Presenter is OverlappedPresenter { State: OverlappedPresenterState.Maximized }
            ? ShellWindowState.Maximized
            : ShellWindowState.Normal;

        // A maximized window reports the maximized rectangle, which would be restored as
        // a "normal" size on the next start — keep the last known restored bounds instead.
        var settings = state == ShellWindowState.Maximized
            ? _userSettingsService.GetWindowSettings()
            : new WindowSettings
            {
                Left = AppWindow.Position.X,
                Top = AppWindow.Position.Y,
                Width = AppWindow.Size.Width,
                Height = AppWindow.Size.Height
            };

        settings.WindowState = state;
        _userSettingsService.SaveWindowsSettings(settings);
    }

    private void Enqueue(Action action)
    {
        if (DispatcherQueue.HasThreadAccess)
        {
            action();
            return;
        }

        DispatcherQueue.TryEnqueue(() => action());
    }
}
