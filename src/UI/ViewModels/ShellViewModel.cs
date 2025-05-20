using System.Collections.ObjectModel;
using System.Windows;
using CleanMyPosts.UI.Contracts.Services;
using CleanMyPosts.UI.Properties;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using MahApps.Metro.Controls;
using MahApps.Metro.IconPacks;

namespace CleanMyPosts.UI.ViewModels;

public partial class ShellViewModel : ObservableObject, IDisposable
{
    private readonly INavigationService _navigationService;
    private readonly IAppSettingsService _appSettingsService;
    private readonly HamburgerMenuItem _logMenuItem;
    private bool _disposed;

    public ShellViewModel(INavigationService navigationService, IAppSettingsService appSettingsService)
    {
        _navigationService = navigationService;
        _appSettingsService = appSettingsService;

        MenuItems =
        [
            new HamburgerMenuIconItem
            {
                Label = Resources.XPage,
                Icon = new PackIconFontAwesome  { Kind = PackIconFontAwesomeKind.XTwitterBrands },
                TargetPageType = typeof(XViewModel)
            },
        ];

        _logMenuItem = new HamburgerMenuIconItem
        {
            Label = Resources.LogPage,
            Icon = new PackIconMaterial { Kind = PackIconMaterialKind.MathLog },
            TargetPageType = typeof(LogViewModel)
        };

        if (_appSettingsService.GetShowLogs())
        {
            MenuItems.Add(_logMenuItem);
        }

        OptionMenuItems =
        [
            new HamburgerMenuGlyphItem { Label = Resources.ShellSettingsPage, Glyph = "\uE713", TargetPageType = typeof(SettingsViewModel) }
        ];
        _appSettingsService.SettingChanged += OnAppSettingChanged;
    }
    ~ShellViewModel()
    {
        Dispose(false);
    }

    [ObservableProperty]
    private HamburgerMenuItem _selectedMenuItem;

    [ObservableProperty]
    private HamburgerMenuItem _selectedOptionsMenuItem;

    public ObservableCollection<HamburgerMenuItem> MenuItems { get; }
    public ObservableCollection<HamburgerMenuItem> OptionMenuItems { get; }

    [RelayCommand]
    public void OnLoaded()
    {
        _navigationService.Navigated += OnNavigated;
    }

    [RelayCommand]
    public void OnUnloaded()
    {
        _navigationService.Navigated -= OnNavigated;
    }

    [RelayCommand(CanExecute = nameof(CanGoBack))]
    private void GoBack()
    {
        _navigationService.GoBack();
    }

    private bool CanGoBack() => _navigationService.CanGoBack;

    [RelayCommand]
    private void MenuItemInvoked()
    {
        NavigateTo(SelectedMenuItem?.TargetPageType);
    }

    [RelayCommand]
    private void OptionsMenuItemInvoked()
    {
        NavigateTo(SelectedOptionsMenuItem?.TargetPageType);
    }

    private void NavigateTo(Type targetViewModel)
    {
        if (targetViewModel != null)
        {
            _navigationService.NavigateTo(targetViewModel.FullName);
        }
    }

    private void OnNavigated(object sender, string viewModelName)
    {
        SelectedMenuItem = MenuItems.FirstOrDefault(i => viewModelName == i.TargetPageType?.FullName);
        if (SelectedMenuItem == null)
        {
            SelectedOptionsMenuItem = OptionMenuItems.FirstOrDefault(i => viewModelName == i.TargetPageType?.FullName);
        }
        GoBackCommand.NotifyCanExecuteChanged();
    }

    private void OnAppSettingChanged(object sender, string key)
    {
        if (key == "ShowLogs")
        {
            Application.Current.Dispatcher.Invoke(() =>
            {
                if (_appSettingsService.GetShowLogs())
                {
                    if (!MenuItems.Contains(_logMenuItem))
                    {
                        MenuItems.Insert(1, _logMenuItem!);
                    }
                }
                else
                {
                    MenuItems.Remove(_logMenuItem!);
                }
            });
        }
    }
    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }
    protected virtual void Dispose(bool disposing)
    {
        if (_disposed)
        {
            return;
        }

        if (disposing)
        {
            _appSettingsService.SettingChanged -= OnAppSettingChanged;
            _navigationService.Navigated -= OnNavigated;
        }

        _disposed = true;
    }
}
