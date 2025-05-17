using System.Diagnostics;
using System.Reflection;
using CleanMyPosts.UI.Contracts.Services;

namespace CleanMyPosts.UI.Services;

public class ApplicationInfoService : IApplicationInfoService
{
    public Version GetVersion()
    {
        var assemblyLocation = Assembly.GetExecutingAssembly().Location;
        var version = FileVersionInfo.GetVersionInfo(assemblyLocation).FileVersion;
        return new Version(version);
    }
}
