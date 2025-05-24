using System.IO;
using System.Windows;
using CleanMyPosts.Core.Contracts.Services;
using CleanMyPosts.UI.Contracts.Services;
using CleanMyPosts.UI.Models;
using ControlzEx.Theming;
using MahApps.Metro.Theming;

namespace CleanMyPosts.UI.Services;

public class UserSettingsService(IFileService fileService, AppConfig appConfig) : IUserSettingsService
{
    private readonly IFileService _fileService = fileService;
    private readonly string _settingsPath = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        appConfig.ConfigurationsFolder);
    private readonly string _settingsFile = appConfig.AppPropertiesFileName;

    private UserSettings _settings;

    public event EventHandler<string> SettingChanged;

    public void Initialize()
    {
        AddCustomThemes();
        _settings = LoadSettings();
        ApplyTheme(_settings.Theme); // Applies visual theme
    }

    private UserSettings LoadSettings()
    {
        var loaded = _fileService.Read<UserSettings>(_settingsPath, _settingsFile);
        return loaded ?? new UserSettings();
    }

    public void PersistData()
    {
        _fileService.Save(_settingsPath, _settingsFile, _settings);
    }

    public void RestoreData()
    {
        _settings = LoadSettings();
        ApplyTheme(_settings.Theme); // In case it needs to update UI again
    }

    public AppTheme GetCurrentTheme() => _settings.Theme;
    public void SetTheme(AppTheme theme)
    {
        ConfigureThemeSyncMode(theme);
        ApplyTheme(theme);
        _settings.Theme = theme;
        SettingChanged?.Invoke(this, nameof(_settings.Theme));
        PersistData();
    }

    public bool GetShowLogs() => _settings.ShowLogs;
    public void SetShowLogs(bool value)
    {
        _settings.ShowLogs = value;
        SettingChanged?.Invoke(this, nameof(_settings.ShowLogs));
    }

    public bool GetConfirmDeletion() => _settings.ConfirmDeletion;
    public void SetConfirmDeletion(bool value)
    {
        _settings.ConfirmDeletion = value;
        SettingChanged?.Invoke(this, nameof(_settings.ConfirmDeletion));
    }

    private static void AddCustomThemes()
    {
        ThemeManager.Current.AddLibraryTheme(new LibraryTheme(
            new Uri("pack://application:,,,/Styles/Themes/HC.Dark.Blue.xaml"),
            MahAppsLibraryThemeProvider.DefaultInstance));
        ThemeManager.Current.AddLibraryTheme(new LibraryTheme(
            new Uri("pack://application:,,,/Styles/Themes/HC.Light.Blue.xaml"),
            MahAppsLibraryThemeProvider.DefaultInstance));
    }

    private static void ConfigureThemeSyncMode(AppTheme theme)
    {
        ThemeManager.Current.ThemeSyncMode =
            theme == AppTheme.Default ? ThemeSyncMode.SyncAll : ThemeSyncMode.SyncWithHighContrast;
        ThemeManager.Current.SyncTheme();
    }

    private static void ApplyTheme(AppTheme theme)
    {
        if (theme != AppTheme.Default)
        {
            ThemeManager.Current.ChangeTheme(Application.Current, $"{theme}.Blue", SystemParameters.HighContrast);
        }
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
}
