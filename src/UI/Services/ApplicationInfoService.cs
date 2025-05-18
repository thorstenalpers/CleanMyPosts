using System.Reflection;
using CleanMyPosts.UI.Contracts.Services;

namespace CleanMyPosts.UI.Services;

public class ApplicationInfoService : IApplicationInfoService
{
    public Version GetVersion()
    {
        var version = Assembly.GetExecutingAssembly().GetName().Version;
        var shortVersion = $"{version.Major}.{version.Minor}.{version.Build}";
        return new Version(shortVersion);
    }
}
