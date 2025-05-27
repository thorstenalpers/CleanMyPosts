using System.Diagnostics;
using System.Drawing;
using System.Windows;
using System.Windows.Resources;
using AutoUpdaterDotNET;
using CleanMyPosts.UI.Contracts.Services;
using CleanMyPosts.UI.Contracts.ViewModels;
using CleanMyPosts.UI.Helpers;
using CleanMyPosts.UI.Models;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Microsoft.Extensions.Logging;

namespace CleanMyPosts.UI.ViewModels;

public partial class SettingsViewModel(ILogger<SettingsViewModel> logger,
    UpdaterConfig updaterConfig,
    AppConfig appConfig,
    IUserSettingsService userSettingsService) : ObservableObject, INavigationAware
{
    private readonly ILogger<SettingsViewModel> _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    private readonly IUserSettingsService _userSettingsService = userSettingsService ?? throw new ArgumentNullException(nameof(userSettingsService));
    private readonly UpdaterConfig _updaterConfig = updaterConfig ?? throw new ArgumentNullException(nameof(updaterConfig));
    private readonly AppConfig _appConfig = appConfig ?? throw new ArgumentNullException(nameof(appConfig));

    [ObservableProperty]
    private bool _isNotificationOpen;

    [ObservableProperty]
    private string _notificationMessage;

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
    private static void OpenLicense()
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
            FileName = _appConfig.ThirdPartyUrl,
            UseShellExecute = true
        });
    }

    [RelayCommand]
    private void OpenReportBug()
    {
        Process.Start(new ProcessStartInfo
        {
            FileName = _appConfig.ReportIssueUrl,
            UseShellExecute = true
        });
    }

    [RelayCommand]
    private void CheckUpdates()
    {
        try
        {
            Uri iconUri = new Uri(_updaterConfig.IconUri, UriKind.Absolute);
            StreamResourceInfo sri = Application.GetResourceStream(iconUri);

            if (sri != null)
            {
                using var stream = sri.Stream;
                using var icon = new Icon(stream);
                AutoUpdater.Icon = icon.ToBitmap();
            }
        }
        catch
        {
            /* Ignore errors loading icon */
        }

        try
        {
            var url = _updaterConfig.UpdateUrl;
            AutoUpdater.CheckForUpdateEvent += AutoUpdaterOnCheckForUpdateEvent;
            AutoUpdater.Start(url);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Check for updates failed.");
        }
    }

    private async void AutoUpdaterOnCheckForUpdateEvent(UpdateInfoEventArgs args)
    {
        if (args == null)
        {
            _logger.LogWarning("Unable to check for updates at this time.");
            return;
        }

        if (args.IsUpdateAvailable)
        {
            AutoUpdater.ShowUpdateForm(args);
        }
        else
        {
            await ShowNotificationAsync("No updates available.", TimeSpan.FromSeconds(3));
        }
    }

    private async Task ShowNotificationAsync(string msg, TimeSpan delay)
    {
        NotificationMessage = msg;
        IsNotificationOpen = true;
        await Task.Delay(delay);
        IsNotificationOpen = false;
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
