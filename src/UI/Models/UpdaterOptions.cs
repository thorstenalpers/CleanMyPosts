using NetSparkleUpdater.Enums;

namespace CleanMyPosts.UI.Models;

public class UpdaterOptions
{
    public string AppCastUrlSingle { get; set; }
    public string AppCastUrlInstaller { get; set; }
    public SecurityMode? SecurityMode { get; set; }
    public string IconUri { get; set; }
}