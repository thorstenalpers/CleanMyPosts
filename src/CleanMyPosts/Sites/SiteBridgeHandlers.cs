using CleanMyPosts.Infrastructure;

namespace CleanMyPosts.Sites;

public static class SiteBridgeHandlers
{
    public static void Register(HostBridge bridge, SiteActionOrchestrator orchestrator)
    {
        bridge.Register<SiteNavigateParams, SiteNavigateResult>("site.navigate", orchestrator.NavigateAsync);
        bridge.Register<SiteRunActionParams, ActionResultDto>("site.runAction", orchestrator.RunActionAsync);
        bridge.Register<SiteCancelActionParams, object>("site.cancelAction", async p =>
        {
            await orchestrator.CancelAction(p);
            return null;
        });
        bridge.Register<SiteHideParams, object>("site.hide", async p =>
        {
            await orchestrator.HideAsync(p.Hide);
            return null;
        });
        bridge.Register<object, object>("site.reload", async _ =>
        {
            await orchestrator.ReloadAsync();
            return null;
        });
    }
}
