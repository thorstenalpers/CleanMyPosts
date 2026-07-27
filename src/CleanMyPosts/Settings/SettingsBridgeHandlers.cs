using CleanMyPosts.Infrastructure;

namespace CleanMyPosts.Settings;

public static class SettingsBridgeHandlers
{
    public static void Register(HostBridge bridge, IUserSettingsService settingsService)
    {
        bridge.Register<object, AppSettingsDto>("settings.get", _ => Task.FromResult(BuildDto(settingsService)));

        bridge.Register<AppSettingsDto, object>("settings.set", dto =>
        {
            settingsService.SetTheme(dto.Theme);
            settingsService.SetShowLogs(dto.ShowLogs);
            settingsService.SetConfirmDeletion(dto.ConfirmDeletion);
            settingsService.SaveTimeoutSettings(dto.Timeouts.ToModel());
            return Task.FromResult<object>(null);
        });
    }

    private static AppSettingsDto BuildDto(IUserSettingsService settingsService)
    {
        return new AppSettingsDto(
            settingsService.GetCurrentTheme(),
            settingsService.GetShowLogs(),
            settingsService.GetConfirmDeletion(),
            TimeoutSettingsDto.From(settingsService.GetTimeoutSettings()));
    }
}
