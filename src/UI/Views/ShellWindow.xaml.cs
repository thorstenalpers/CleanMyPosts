using System.Windows;
using System.Windows.Controls;
using CleanMyPosts.UI.Contracts.Services;
using CleanMyPosts.UI.Contracts.Views;
using CleanMyPosts.UI.Models;
using CleanMyPosts.UI.ViewModels;
using MahApps.Metro.Controls;

namespace CleanMyPosts.UI.Views;

public partial class ShellWindow : MetroWindow, IShellWindow
{
    private readonly IUserSettingsService _userSettingsService;
    private bool _settingsLoaded = false;

    private const double DefaultWidth = 860;
    private const double DefaultHeight = 600;
    public ShellWindow(ShellViewModel viewModel, IUserSettingsService userSettingsService)
    {
        _userSettingsService = userSettingsService ?? throw new ArgumentNullException(nameof(userSettingsService));
        InitializeComponent();
        DataContext = viewModel;

        Loaded += OnLoaded;
        Closing += OnClosing;
    }

    private static double GetCenteredLeft()
    {
        var screenWidth = SystemParameters.WorkArea.Width;
        return (screenWidth - DefaultWidth) / 2;
    }

    private static double GetCenteredTop()
    {
        var screenHeight = SystemParameters.WorkArea.Height;
        return (screenHeight - DefaultHeight) / 2;
    }

    private WindowSettings _lastNormalBounds;

    private void OnLoaded(object sender, RoutedEventArgs e)
    {
        var settings = _userSettingsService.GetWindowSettings();

        if (settings.WindowState == WindowState.Maximized)
        {
            Left = settings.Left >= 0 ? settings.Left : GetCenteredLeft();
            Top = settings.Top >= 0 ? settings.Top : GetCenteredTop();
            Width = settings.Width > 0 ? settings.Width : DefaultWidth;
            Height = settings.Height > 0 ? settings.Height : DefaultHeight;

            WindowState = WindowState.Maximized;
        }
        else
        {
            Left = settings.Left >= 0 ? settings.Left : GetCenteredLeft();
            Top = settings.Top >= 0 ? settings.Top : GetCenteredTop();
            Width = settings.Width > 0 ? settings.Width : DefaultWidth;
            Height = settings.Height > 0 ? settings.Height : DefaultHeight;
            WindowState = WindowState.Normal;
        }

        _lastNormalBounds = new WindowSettings
        {
            Left = Left,
            Top = Top,
            Width = Width,
            Height = Height,
            WindowState = WindowState.Normal
        };

        _settingsLoaded = true;
        StateChanged += ShellWindow_StateChanged;
    }


    private void ShellWindow_StateChanged(object sender, EventArgs e)
    {
        if (!_settingsLoaded)
        {
            return;
        }

        if (WindowState == WindowState.Normal)
        {
            // User restored window from maximized or minimized -> reset to default size/position

            var settings = _userSettingsService.GetWindowSettings();
            Left = settings.Left >= 0 ? settings.Left : GetCenteredLeft();
            Top = settings.Top >= 0 ? settings.Top : GetCenteredTop();
            Width = DefaultWidth;
            Height = DefaultHeight;

            // Update _lastNormalBounds accordingly
            _lastNormalBounds.Left = Left;
            _lastNormalBounds.Top = Top;
            _lastNormalBounds.Width = Width;
            _lastNormalBounds.Height = Height;
        }
        else if (WindowState == WindowState.Maximized)
        {
            // Do nothing special here
        }
    }

    private void OnClosing(object sender, System.ComponentModel.CancelEventArgs e)
    {
        if (!_settingsLoaded)
        {
            return;
        }

        var settings = new WindowSettings();

        if (WindowState == WindowState.Maximized)
        {
            settings.WindowState = WindowState.Maximized;

            // Save the last known normal bounds, _not_ the maximized bounds
            settings.Left = _lastNormalBounds.Left;
            settings.Top = _lastNormalBounds.Top;
            settings.Width = _lastNormalBounds.Width;
            settings.Height = _lastNormalBounds.Height;
        }
        else
        {
            // Normal state, save current bounds as last known normal
            settings.WindowState = WindowState.Normal;
            settings.Left = Left;
            settings.Top = Top;
            settings.Width = Width;
            settings.Height = Height;

            _lastNormalBounds = settings;
        }

        _userSettingsService.SaveWindowsSettings(settings);
    }


    public Frame GetNavigationFrame()
        => shellFrame;

    public void ShowWindow()
        => Show();

    public void CloseWindow()
        => Close();
}
