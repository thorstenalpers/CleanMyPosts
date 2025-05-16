namespace XTweetCleaner.UI.Contracts.Services;

public interface IAppSettingsService
{
    void SetShowLogs(bool show);
    bool GetShowLogs();

    event EventHandler<string> SettingChanged;

}
