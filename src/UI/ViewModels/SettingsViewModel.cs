using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using XTweetCleaner.UI.Contracts.Services;
using XTweetCleaner.UI.Contracts.ViewModels;
using XTweetCleaner.UI.Models;

namespace XTweetCleaner.UI.ViewModels;

public partial class SettingsViewModel(IThemeSelectorService themeSelectorService,
    IApplicationInfoService applicationInfoService,
    IAppSettingsService appSettingsService) : ObservableObject, INavigationAware
{
    private readonly IThemeSelectorService _themeSelectorService = themeSelectorService ?? throw new ArgumentNullException(nameof(themeSelectorService));
    private readonly IApplicationInfoService _applicationInfoService = applicationInfoService ?? throw new ArgumentNullException(nameof(applicationInfoService));
    private readonly IAppSettingsService _appSettingsService = appSettingsService ?? throw new ArgumentNullException(nameof(appSettingsService));

    [ObservableProperty]
    private AppTheme _theme;

    [ObservableProperty]
    private string _versionDescription;

    [ObservableProperty]
    private bool _showLogs = false;

    [RelayCommand]
    private void SetTheme(string themeName)
    {
        if (Enum.TryParse<AppTheme>(themeName, out var theme))
        {
            _themeSelectorService.SetTheme(theme);
        }
    }

    partial void OnShowLogsChanged(bool value)
    {
        _appSettingsService.SetShowLogs(value);
    }

    public void OnNavigatedTo(object parameter)
    {
        VersionDescription = $"{Properties.Resources.AppDisplayName} - {_applicationInfoService.GetVersion()}";
        Theme = _themeSelectorService.GetCurrentTheme();
        ShowLogs = _appSettingsService.GetShowLogs();
    }
}
