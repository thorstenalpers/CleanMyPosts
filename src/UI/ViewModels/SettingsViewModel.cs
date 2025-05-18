using CleanMyPosts.UI.Contracts.Services;
using CleanMyPosts.UI.Contracts.ViewModels;
using CleanMyPosts.UI.Models;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Microsoft.Extensions.Logging;

namespace CleanMyPosts.UI.ViewModels;

public partial class SettingsViewModel(IThemeSelectorService themeSelectorService,
    ILogger<SettingsViewModel> logger,
    IApplicationInfoService applicationInfoService,
    IAppSettingsService appSettingsService,
    IUpdateService updateService) : ObservableObject, INavigationAware
{
    private readonly ILogger<SettingsViewModel> _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    private readonly IThemeSelectorService _themeSelectorService = themeSelectorService ?? throw new ArgumentNullException(nameof(themeSelectorService));
    private readonly IApplicationInfoService _applicationInfoService = applicationInfoService ?? throw new ArgumentNullException(nameof(applicationInfoService));
    private readonly IAppSettingsService _appSettingsService = appSettingsService ?? throw new ArgumentNullException(nameof(appSettingsService));
    private readonly IUpdateService _updateService = updateService ?? throw new ArgumentNullException(nameof(updateService));

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

    [RelayCommand]
    private async Task CheckUpdatesAsync()
    {
        try
        {
            await _updateService.CheckForUpdatesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Check for updates failed.");
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
