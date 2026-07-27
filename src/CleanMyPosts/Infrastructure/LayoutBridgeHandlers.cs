using CleanMyPosts.Sites;

namespace CleanMyPosts.Infrastructure;

public static class LayoutBridgeHandlers
{
    public static void Register(HostBridge bridge, IShellLayoutService shellLayoutService)
    {
        bridge.Register<SetSidebarExpandedParams, object>("layout.setSidebarExpanded", p =>
        {
            shellLayoutService.SetSidebarExpanded(p.Expanded);
            return Task.FromResult<object>(null);
        });
    }
}
