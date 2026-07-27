namespace CleanMyPosts.Infrastructure;

public interface IShellLayoutService
{
    /// <summary>Widens or narrows the left sidebar column (icon rail vs. icons + labels).</summary>
    void SetSidebarExpanded(bool expanded);

    /// <summary>Collapses the site column (chrome spans the full window) or restores it alongside the sidebar.</summary>
    void SetSiteVisible(bool visible);
}
