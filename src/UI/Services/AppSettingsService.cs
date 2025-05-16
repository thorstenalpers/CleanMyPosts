using System.Windows;
using XTweetCleaner.UI.Contracts.Services;

namespace XTweetCleaner.UI.Services;

public class AppSettingsService : IAppSettingsService
{
    private const string ShowLogsKey = "ShowLogs";
    public event EventHandler<string> SettingChanged;

    public void SetShowLogs(bool show)
    {
        Application.Current.Properties[ShowLogsKey] = show;
        SettingChanged?.Invoke(this, ShowLogsKey);
    }

    public bool GetShowLogs()
    {
        return Application.Current.Properties.Contains(ShowLogsKey) && Application.Current.Properties[ShowLogsKey] is bool value && value;
    }
}
