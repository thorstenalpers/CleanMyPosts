using System.Diagnostics;
using System.IO;

namespace CleanMyPosts.Infrastructure;

public static class SystemBridgeHandlers
{
    public static void Register(HostBridge bridge)
    {
        bridge.Register<SystemOpenUrlParams, object>("system.openUrl", p =>
        {
            Process.Start(new ProcessStartInfo { FileName = p.Url, UseShellExecute = true });
            return Task.FromResult<object>(null);
        });

        bridge.Register<object, object>("system.openLicense", _ =>
        {
            var licensePath = Path.Combine(AppContext.BaseDirectory, "THIRD_PARTY_LICENSES.txt");
            Process.Start(new ProcessStartInfo { FileName = licensePath, UseShellExecute = true });
            return Task.FromResult<object>(null);
        });
    }
}
