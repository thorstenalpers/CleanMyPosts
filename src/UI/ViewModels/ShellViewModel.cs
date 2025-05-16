using System.Collections.ObjectModel;
using System.Windows;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using MahApps.Metro.Controls;
using MahApps.Metro.IconPacks;
using XTweetCleaner.UI.Contracts.Services;
using XTweetCleaner.UI.Properties;

namespace XTweetCleaner.UI.ViewModels;

public partial class ShellViewModel : ObservableObject, IDisposable
{
    private readonly INavigationService _navigationService;
    private readonly IAppSettingsService _appSettingsService;
    private readonly HamburgerMenuItem _logMenuItem;

    public ShellViewModel(INavigationService navigationService, IAppSettingsService appSettingsService)
    {
        _navigationService = navigationService;
        _appSettingsService = appSettingsService;

        MenuItems =
        [
            new HamburgerMenuGlyphItem { Label = Resources.MainPage, Glyph = "\uE80F", TargetPageType = typeof(MainViewModel) },
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
        _appSettingsService.SettingChanged -= OnAppSettingChanged;
        _navigationService.Navigated -= OnNavigated;
        GC.SuppressFinalize(this);
    }
}
