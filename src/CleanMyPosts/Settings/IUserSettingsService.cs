namespace CleanMyPosts.Settings;

public interface IUserSettingsService
{
    event EventHandler<string> SettingChanged;

    void Initialize();
    void PersistData();

    void SetShowLogs(bool showLogs);
    bool GetShowLogs();

    void SetConfirmDeletion(bool value);
    bool GetConfirmDeletion();

    void SetTheme(AppTheme theme);
    AppTheme GetCurrentTheme();

    void SetAccentColor(string accentColor);
    string GetAccentColor();

    void SetUseSystemAccent(bool useSystemAccent);
    bool GetUseSystemAccent();

    WindowSettings GetWindowSettings();
    void SaveWindowsSettings(WindowSettings settings);

    TimeoutSettings GetTimeoutSettings();
    void SaveTimeoutSettings(TimeoutSettings settings);
}
