using System.IO;
using CleanMyPosts.Hosting;

namespace CleanMyPosts.Settings;

public class UserSettingsService(IFileService fileService, AppConfig appConfig) : IUserSettingsService
{
    private const string WindowSettingsFile = "WindowSettings.json";
    private const string TimeoutSettingsFile = "timeoutSettings.json";

    private readonly string _settingsFile = appConfig.AppPropertiesFileName;

    private readonly string _settingsPath = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        appConfig.ConfigurationsFolder);

    private UserSettings _settings = new();

    public event EventHandler<string>? SettingChanged;

    public void Initialize() => _settings = fileService.Read<UserSettings>(_settingsPath, _settingsFile) ?? new UserSettings();

    public void PersistData() => fileService.Save(_settingsPath, _settingsFile, _settings);

    public AppTheme GetCurrentTheme() => _settings.Theme;

    public void SetTheme(AppTheme theme) => Apply(() => _settings.Theme = theme, nameof(UserSettings.Theme));

    public bool GetShowLogs() => _settings.ShowLogs;

    public void SetShowLogs(bool showLogs) => Apply(() => _settings.ShowLogs = showLogs, nameof(UserSettings.ShowLogs));

    public bool GetConfirmDeletion() => _settings.ConfirmDeletion;

    public void SetConfirmDeletion(bool value) => Apply(() => _settings.ConfirmDeletion = value, nameof(UserSettings.ConfirmDeletion));

    public string GetAccentColor() => _settings.AccentColor;

    public void SetAccentColor(string accentColor) => Apply(() => _settings.AccentColor = accentColor, nameof(UserSettings.AccentColor));

    public bool GetUseSystemAccent() => _settings.UseSystemAccent;

    public void SetUseSystemAccent(bool useSystemAccent) => Apply(() => _settings.UseSystemAccent = useSystemAccent, nameof(UserSettings.UseSystemAccent));

    public WindowSettings GetWindowSettings() =>
        fileService.Read<WindowSettings>(_settingsPath, WindowSettingsFile) ?? new WindowSettings();

    public void SaveWindowsSettings(WindowSettings settings) =>
        fileService.Save(_settingsPath, WindowSettingsFile, settings);

    public TimeoutSettings GetTimeoutSettings() =>
        fileService.Read<TimeoutSettings>(_settingsPath, TimeoutSettingsFile) ?? new TimeoutSettings();

    public void SaveTimeoutSettings(TimeoutSettings settings) =>
        fileService.Save(_settingsPath, TimeoutSettingsFile, settings);

    private void Apply(Action mutate, string settingName)
    {
        mutate();
        SettingChanged?.Invoke(this, settingName);
        PersistData();
    }
}
