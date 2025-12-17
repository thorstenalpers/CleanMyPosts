using System.Diagnostics;
using System.Drawing;
using System.Windows;
using AutoUpdaterDotNET;
using CleanMyPosts.Contracts.Services;
using CleanMyPosts.Contracts.ViewModels;
using CleanMyPosts.Helpers;
using CleanMyPosts.Models;
using CleanMyPosts.Properties;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Microsoft.Extensions.Logging;

namespace CleanMyPosts.ViewModels;

public partial class SettingsViewModel(
    ILogger<SettingsViewModel> logger,
    UpdaterConfig updaterConfig,
    AppConfig appConfig,
    IUserSettingsService userSettingsService) : ObservableObject, INavigationAware
{
    private readonly AppConfig _appConfig = appConfig ?? throw new ArgumentNullException(nameof(appConfig));
    private readonly ILogger<SettingsViewModel> _logger = logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly UpdaterConfig _updaterConfig =
        updaterConfig ?? throw new ArgumentNullException(nameof(updaterConfig));

    private readonly IUserSettingsService _userSettingsService =
        userSettingsService ?? throw new ArgumentNullException(nameof(userSettingsService));

    [ObservableProperty] private bool _confirmDeletion;

    [ObservableProperty] private bool _isNotificationOpen;

    [ObservableProperty] private string _notificationMessage;

    [ObservableProperty] private bool _showLogs;

    [ObservableProperty] private AppTheme _theme;

    [ObservableProperty] private string _versionDescription;

    [ObservableProperty] private int _waitAfterDelete;

    [ObservableProperty] private int _waitAfterDocumentLoad;

    [ObservableProperty] private int _waitBetweenRetryDeleteAttempts;

    public void OnNavigatedTo(object parameter)
    {
        VersionDescription = $"{Resources.AppDisplayName} - {Helper.GetVersion()}";
        Theme = _userSettingsService.GetCurrentTheme();
        ShowLogs = _userSettingsService.GetShowLogs();
        ConfirmDeletion = _userSettingsService.GetConfirmDeletion();

        var timeoutSettings = _userSettingsService.GetTimeoutSettings();
        WaitAfterDocumentLoad = timeoutSettings.WaitAfterDocumentLoad;
        WaitAfterDelete = timeoutSettings.WaitAfterDelete;
        WaitBetweenRetryDeleteAttempts = timeoutSettings.WaitBetweenRetryDeleteAttempts;
    }

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
        Process.Start(new ProcessStartInfo { FileName = "license.txt", UseShellExecute = true });
    }

    [RelayCommand]
    private void OpenHomepage()
    {
        Process.Start(new ProcessStartInfo { FileName = _appConfig.GitRepoUrl, UseShellExecute = true });
    }

    [RelayCommand]
    private void OpenReportBug()
    {
        Process.Start(new ProcessStartInfo { FileName = _appConfig.ReportIssueUrl, UseShellExecute = true });
    }

    [RelayCommand]
    private void CheckUpdates()
    {
#pragma warning disable S2696 // Instance members should not write to "static" fields
        try
        {
            var iconUri = new Uri(_updaterConfig.IconUri, UriKind.Absolute);
            var sri = Application.GetResourceStream(iconUri);

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
#pragma warning restore S2696 // Instance members should not write to "static" fields

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
}