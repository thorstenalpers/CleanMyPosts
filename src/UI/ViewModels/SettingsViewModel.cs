using System.Diagnostics;
using CleanMyPosts.UI.Contracts.Services;
using CleanMyPosts.UI.Contracts.ViewModels;
using CleanMyPosts.UI.Helpers;
using CleanMyPosts.UI.Models;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Microsoft.Extensions.Logging;

namespace CleanMyPosts.UI.ViewModels;

public partial class SettingsViewModel(ILogger<SettingsViewModel> logger,
    IUserSettingsService userSettingsService,
    IUpdateService updateService) : ObservableObject, INavigationAware
{
    private readonly ILogger<SettingsViewModel> _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    private readonly IUserSettingsService _userSettingsService = userSettingsService ?? throw new ArgumentNullException(nameof(userSettingsService));
    private readonly IUpdateService _updateService = updateService ?? throw new ArgumentNullException(nameof(updateService));

    [ObservableProperty]
    private string _versionDescription;

    [ObservableProperty]
    private AppTheme _theme;

    [ObservableProperty]
    private bool _showLogs;

    [ObservableProperty]
    private bool _confirmDeletion;

    [ObservableProperty]
    private int _waitAfterDelete;

    [ObservableProperty]
    private int _waitAfterDocumentLoad;

    [ObservableProperty]
    private int _waitBetweenRetryDeleteAttempts;

    [RelayCommand]
    private void SetTheme(string themeName)
    {
        if (Enum.TryParse<AppTheme>(themeName, out var theme))
        {
            _userSettingsService.SetTheme(theme);
        }
    }

    [RelayCommand]
    private void OpenLicense()
    {
        Process.Start(new ProcessStartInfo
        {
            FileName = "license.txt",
            UseShellExecute = true
        });
    }

    [RelayCommand]
    private void OpenHomepage()
    {
        Process.Start(new ProcessStartInfo
        {
            FileName = "https://github.com/thorstenalpers/CleanMyPosts/blob/main/THIRD_PARTY_LICENSES.txt",
            UseShellExecute = true
        });
    }

    [RelayCommand]
    private void OpenReportBug()
    {
        Process.Start(new ProcessStartInfo
        {
            FileName = "https://github.com/thorstenalpers/CleanMyPosts/issues",
            UseShellExecute = true
        });
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
    partial void OnThemeChanged(AppTheme value)
    {
        _userSettingsService.SetTheme(value);
    }

    partial void OnShowLogsChanged(bool value)
    {
        _userSettingsService.SetShowLogs(value);
    }

    partial void OnConfirmDeletionChanged(bool value)
    {
        _userSettingsService.SetConfirmDeletion(value);
    }

    partial void OnWaitAfterDeleteChanged(int value)
    {
        _userSettingsService.SaveTimeoutSettings(new TimeoutSettings
        {
            WaitAfterDelete = WaitAfterDelete,
            WaitAfterDocumentLoad = WaitAfterDocumentLoad,
            WaitBetweenRetryDeleteAttempts = WaitBetweenRetryDeleteAttempts
        });
    }

    partial void OnWaitBetweenRetryDeleteAttemptsChanged(int value)
    {
        _userSettingsService.SaveTimeoutSettings(new TimeoutSettings
        {
            WaitAfterDelete = WaitAfterDelete,
            WaitAfterDocumentLoad = WaitAfterDocumentLoad,
            WaitBetweenRetryDeleteAttempts = WaitBetweenRetryDeleteAttempts
        });
    }

    partial void OnWaitAfterDocumentLoadChanged(int value)
    {
        _userSettingsService.SaveTimeoutSettings(new TimeoutSettings
        {
            WaitAfterDelete = WaitAfterDelete,
            WaitAfterDocumentLoad = WaitAfterDocumentLoad,
            WaitBetweenRetryDeleteAttempts = WaitBetweenRetryDeleteAttempts
        });
    }

    public void OnNavigatedTo(object parameter)
    {
        VersionDescription = $"{Properties.Resources.AppDisplayName} - {Helper.GetVersion()}";
        Theme = _userSettingsService.GetCurrentTheme();
        ShowLogs = _userSettingsService.GetShowLogs();
        ConfirmDeletion = _userSettingsService.GetConfirmDeletion();

        var timeoutSettings = _userSettingsService.GetTimeoutSettings();
        WaitAfterDocumentLoad = timeoutSettings.WaitAfterDocumentLoad;
        WaitAfterDelete = timeoutSettings.WaitAfterDelete;
        WaitBetweenRetryDeleteAttempts = timeoutSettings.WaitBetweenRetryDeleteAttempts;
    }
}
