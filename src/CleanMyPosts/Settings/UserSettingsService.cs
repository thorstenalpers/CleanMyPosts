using System.IO;
using CleanMyPosts.Hosting;

namespace CleanMyPosts.Settings;

public class UserSettingsService(IFileService fileService, AppConfig appConfig) : IUserSettingsService
{
    private readonly IFileService _fileService = fileService;
    private readonly string _settingsFile = appConfig.AppPropertiesFileName;

    private readonly string _settingsPath = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        appConfig.ConfigurationsFolder);

    private UserSettings _settings;

    public event EventHandler<string> SettingChanged;

    public void Initialize()
    {
        _settings = LoadSettings();
    }

    public void PersistData()
    {
        _fileService.Save(_settingsPath, _settingsFile, _settings);
    }

    public void RestoreData()
    {
        _settings = LoadSettings();
    }

    public AppTheme GetCurrentTheme()
    {
        return _settings.Theme;
    }

    public void SetTheme(AppTheme theme)
    {
        _settings.Theme = theme;
        SettingChanged?.Invoke(this, nameof(_settings.Theme));
        PersistData();
    }

    public bool GetShowLogs()
    {
        return _settings.ShowLogs;
    }

    public void SetShowLogs(bool showLogs)
    {
        _settings.ShowLogs = showLogs;
        SettingChanged?.Invoke(this, nameof(_settings.ShowLogs));
        PersistData();
    }

    public bool GetConfirmDeletion()
    {
        return _settings.ConfirmDeletion;
    }

    public void SetConfirmDeletion(bool value)
    {
        _settings.ConfirmDeletion = value;
        SettingChanged?.Invoke(this, nameof(_settings.ConfirmDeletion));
        PersistData();
    }

    public WindowSettings GetWindowSettings()
    {
        var fileName = "WindowSettings.json";
        var loaded = _fileService.Read<WindowSettings>(_settingsPath, fileName);
        return loaded ?? new WindowSettings();
    }

    public void SaveWindowsSettings(WindowSettings settings)
    {
        var fileName = "WindowSettings.json";
        _fileService.Save(_settingsPath, fileName, settings);
    }

    public TimeoutSettings GetTimeoutSettings()
    {
        var fileName = "timeoutSettings.json";
        var loaded = _fileService.Read<TimeoutSettings>(_settingsPath, fileName);
        return loaded ?? new TimeoutSettings();
    }

    public void SaveTimeoutSettings(TimeoutSettings settings)
    {
        var fileName = "timeoutSettings.json";
        _fileService.Save(_settingsPath, fileName, settings);
    }

    public T GetSetting<T>(string key, T defaultValue = default)
    {
        return key switch
        {
            nameof(UserSettings.Theme) => (T)(object)_settings.Theme,
            nameof(UserSettings.ShowLogs) => (T)(object)_settings.ShowLogs,
            nameof(UserSettings.ConfirmDeletion) => (T)(object)_settings.ConfirmDeletion,
            _ => defaultValue
        };
    }

    private UserSettings LoadSettings()
    {
        var loaded = _fileService.Read<UserSettings>(_settingsPath, _settingsFile);
        return loaded ?? new UserSettings();
    }
}
