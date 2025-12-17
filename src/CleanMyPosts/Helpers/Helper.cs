using System.Reflection;

namespace CleanMyPosts.Helpers;

public static class Helper
{
    public static string CleanJsonResult(string json)
    {
        return json.Replace("\\\"", "\"").Trim('\"');
    }

    public static Version GetVersion()
    {
        var version = Assembly.GetExecutingAssembly().GetName().Version;
        var shortVersion = $"{version.Major}.{version.Minor}.{version.Build}";
        return new Version(shortVersion);
    }
}