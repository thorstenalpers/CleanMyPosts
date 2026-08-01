namespace CleanMyPosts.Infrastructure;

public interface IShellLayoutService
{
    /// <summary>Widens or narrows the left sidebar column (icon rail vs. icons + labels).</summary>
    void SetSidebarExpanded(bool expanded);

    /// <summary>Collapses the site column (chrome spans the full window) or restores it alongside the sidebar.</summary>
    void SetSiteVisible(bool visible);

    /// <summary>Drops the startup skeleton once the Svelte UI reports it has rendered.</summary>
    void HideSkeleton();

    /// <summary>Asks the user whether to install an available update.</summary>
    Task<bool> ConfirmUpdateAsync(string availableVersion, string installedVersion, string? changelogUrl);
}
