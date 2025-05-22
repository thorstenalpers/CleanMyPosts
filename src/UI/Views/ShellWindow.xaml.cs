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

    public ShellWindow(ShellViewModel viewModel, IUserSettingsService userSettingsService)
    {
        _userSettingsService = userSettingsService ?? throw new ArgumentNullException(nameof(userSettingsService));
        InitializeComponent();
        DataContext = viewModel;

        Loaded += OnLoaded;
        Closing += OnClosing;
    }

    private void OnLoaded(object sender, RoutedEventArgs e)
    {
        var settings = _userSettingsService.GetWindowSettings();

        // Basic screen bounds check
        if (settings.Left >= 0 && settings.Top >= 0)
        {
            Left = settings.Left;
            Top = settings.Top;
        }

        Width = settings.Width;
        Height = settings.Height;
        WindowState = settings.WindowState;

        _settingsLoaded = true;
    }

    private void OnClosing(object sender, System.ComponentModel.CancelEventArgs e)
    {
        if (!_settingsLoaded)
        {
            return;
        }

        var settings = new WindowSettings
        {
            Top = Top,
            Left = Left,
            Width = Width,
            Height = Height,
            WindowState = this.WindowState
        };

        _userSettingsService.SaveWindowsSettings(settings);
    }

    public Frame GetNavigationFrame()
        => shellFrame;

    public void ShowWindow()
        => Show();

    public void CloseWindow()
        => Close();
}
