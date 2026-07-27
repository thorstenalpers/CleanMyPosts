using System.ComponentModel;
using System.IO;
using System.Windows;
using System.Windows.Controls;
using CleanMyPosts.Hosting;
using CleanMyPosts.Infrastructure;
using CleanMyPosts.Logging;
using CleanMyPosts.Settings;
using CleanMyPosts.Sites;
using CleanMyPosts.Updater;
using Microsoft.Extensions.Logging;

namespace CleanMyPosts.Views;

public partial class ShellWindow : Window, IShellWindow, IShellLayoutService
{
    private const double DefaultWidth = 1000;
    private const double DefaultHeight = 640;
    private const double SidebarExpandedWidth = 240;
    private const double SidebarCollapsedWidth = 56;

    private readonly IUserSettingsService _userSettingsService;
    private readonly IChromeWebViewService _chromeWebViewService;
    private readonly ISiteWebViewService _siteWebViewService;
    private readonly HostBridge _hostBridge;
    private readonly SiteActionOrchestrator _siteActionOrchestrator;
    private readonly ILogBuffer _logBuffer;
    private readonly AppConfig _appConfig;
    private readonly UpdaterConfig _updaterConfig;
    private readonly ILogger<ShellWindow> _logger;

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

        Loaded += OnLoadedAsync;
        Closing += OnClosing;
    }

    public void ShowWindow() => Show();

    public void CloseWindow() => Close();

    public void SetSidebarExpanded(bool expanded)
    {
        Dispatcher.Invoke(() =>
        {
            SidebarColumn.Width = new GridLength(expanded ? SidebarExpandedWidth : SidebarCollapsedWidth);
        });
    }

    public void SetSiteVisible(bool visible)
    {
        Dispatcher.Invoke(() =>
        {
            Grid.SetColumnSpan(chromeWebView, visible ? 1 : 2);
        });
    }

    private async void OnLoadedAsync(object sender, RoutedEventArgs e)
    {
        RestoreWindowBounds();

        var wwwRootPath = Path.Combine(AppContext.BaseDirectory, "wwwroot");
        var contentScriptPath = Path.Combine(AppContext.BaseDirectory, "Scripts", "content.js");

        // Bring the menu (chrome) up first so it paints before the heavier site
        // WebView; the site then loads hidden in the background so the logged-in
        // username is ready the first time the user opens X.
        await _chromeWebViewService.InitializeAsync(chromeWebView, wwwRootPath);
        await _siteWebViewService.InitializeAsync(siteWebView, contentScriptPath);

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
    }

    private void RestoreWindowBounds()
    {
        var settings = _userSettingsService.GetWindowSettings();

        Left = settings.Left >= 0 ? settings.Left : (SystemParameters.WorkArea.Width - DefaultWidth) / 2;
        Top = settings.Top >= 0 ? settings.Top : (SystemParameters.WorkArea.Height - DefaultHeight) / 2;
        Width = settings.Width > 0 ? settings.Width : DefaultWidth;
        Height = settings.Height > 0 ? settings.Height : DefaultHeight;
        WindowState = settings.WindowState;
    }

    private void OnClosing(object sender, CancelEventArgs e)
    {
        _userSettingsService.SaveWindowsSettings(new WindowSettings
        {
            Left = RestoreBounds.Left,
            Top = RestoreBounds.Top,
            Width = RestoreBounds.Width > 0 ? RestoreBounds.Width : Width,
            Height = RestoreBounds.Height > 0 ? RestoreBounds.Height : Height,
            WindowState = WindowState
        });
    }
}
