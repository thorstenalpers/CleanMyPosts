using CleanMyPosts.Infrastructure;
using Windows.UI.ViewManagement;

namespace CleanMyPosts.Settings;

public static class SettingsBridgeHandlers
{
    private static readonly UISettings UiSettings = new();

    public static void Register(HostBridge bridge, IUserSettingsService settingsService)
    {
        bridge.Register<object, AppSettingsDto>("settings.get", _ => Task.FromResult(BuildDto(settingsService)));

        bridge.Register<AppSettingsDto, object?>("settings.set", dto =>
        {
            settingsService.SetTheme(dto.Theme);
            settingsService.SetShowLogs(dto.ShowLogs);
            settingsService.SetConfirmDeletion(dto.ConfirmDeletion);
            settingsService.SetUseSystemAccent(dto.UseSystemAccent);

            // While following the system accent the UI is handed the resolved system
            // colour, so writing it back would overwrite the user's own pick.
            if (!dto.UseSystemAccent)
            {
                settingsService.SetAccentColor(dto.AccentColor);
            }

            settingsService.SaveTimeoutSettings(dto.Timeouts.ToModel());
            return Task.FromResult<object?>(null);
        });
    }

    private static AppSettingsDto BuildDto(IUserSettingsService settingsService)
    {
        var useSystemAccent = settingsService.GetUseSystemAccent();

        return new AppSettingsDto(
            settingsService.GetCurrentTheme(),
            settingsService.GetShowLogs(),
            settingsService.GetConfirmDeletion(),
            useSystemAccent ? SystemAccentHex() : settingsService.GetAccentColor(),
            useSystemAccent,
            TimeoutSettingsDto.From(settingsService.GetTimeoutSettings()));
    }

    private static string SystemAccentHex()
    {
        var color = UiSettings.GetColorValue(UIColorType.Accent);
        return $"#{color.R:X2}{color.G:X2}{color.B:X2}";
    }
}
