using Microsoft.Extensions.Logging;
using CleanMyPosts.Hosting;
using CleanMyPosts.Logging;
using CleanMyPosts.Settings;
using CleanMyPosts.Sites;
using CleanMyPosts.Updater;

namespace CleanMyPosts.Infrastructure;

public static class BridgeRegistrar
{
    public static void RegisterAll(
        HostBridge bridge,
        IUserSettingsService userSettingsService,
        SiteActionOrchestrator siteActionOrchestrator,
        IShellLayoutService shellLayoutService,
        ILogBuffer logBuffer,
        AppConfig appConfig,
        UpdaterConfig updaterConfig,
        ILogger updaterLogger)
    {
        SettingsBridgeHandlers.Register(bridge, userSettingsService);
        SiteBridgeHandlers.Register(bridge, siteActionOrchestrator);
        LayoutBridgeHandlers.Register(bridge, shellLayoutService);
        LogBridgeHandlers.Register(bridge, logBuffer);
        AppInfoBridgeHandlers.Register(bridge, appConfig);
        UpdaterBridgeHandlers.Register(bridge, updaterConfig, updaterLogger);
        SystemBridgeHandlers.Register(bridge);
    }
}
