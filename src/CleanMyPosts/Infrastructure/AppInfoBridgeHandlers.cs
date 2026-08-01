using System.Reflection;
using CleanMyPosts.Hosting;

namespace CleanMyPosts.Infrastructure;

public static class AppInfoBridgeHandlers
{
    public static void Register(HostBridge bridge, AppConfig appConfig, IShellLayoutService shellLayoutService)
    {
        bridge.Register<object, AppInfoDto>("app.getInfo", _ => Task.FromResult(
            new AppInfoDto(GetVersion(), appConfig.GitRepoUrl, appConfig.ReportIssueUrl)));

        bridge.Register<object, object?>("app.ready", _ =>
        {
            shellLayoutService.HideSkeleton();
            return Task.FromResult<object?>(null);
        });
    }

    private static string GetVersion()
    {
        var version = Assembly.GetExecutingAssembly().GetName().Version;
        return version is null ? "0.0.0" : $"{version.Major}.{version.Minor}.{version.Build}";
    }
}
