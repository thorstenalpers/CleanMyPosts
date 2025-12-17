using CleanMyPosts.Models;

namespace CleanMyPosts.Contracts.Services;

public interface IUserSettingsService
{
    void SetShowLogs(bool showLogs);
    bool GetShowLogs();

    event EventHandler<string> SettingChanged;

    void Initialize();
    void RestoreData();
    void PersistData();

    void SetConfirmDeletion(bool value);
    bool GetConfirmDeletion();

    void SetTheme(AppTheme theme);
    AppTheme GetCurrentTheme();

    WindowSettings GetWindowSettings();
    void SaveWindowsSettings(WindowSettings settings);

    TimeoutSettings GetTimeoutSettings();
    void SaveTimeoutSettings(TimeoutSettings settings);
}