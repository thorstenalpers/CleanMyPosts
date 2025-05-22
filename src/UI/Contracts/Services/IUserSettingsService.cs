using CleanMyPosts.UI.Models;

namespace CleanMyPosts.UI.Contracts.Services;

public interface IUserSettingsService
{
    void SetShowLogs(bool show);
    bool GetShowLogs();

    event EventHandler<string> SettingChanged;


    void SetTheme(AppTheme theme);
    AppTheme GetCurrentTheme();

    void Initialize();
    void RestoreData();
    void PersistData();
    T GetSetting<T>(string key, T defaultValue = default);
    void SetSetting<T>(string key, T value);
    int GetWaitBeforeTryClickDelete();
    int GetWaitBetweenTryClickDeleteAttempts();
    void SetConfirmDeletion(bool value);
    bool GetConfirmDeletion();
    WindowSettings GetWindowSettings();
    void SaveWindowsSettings(WindowSettings settings);
}
