namespace CleanMyPosts.UI.Helpers;
public static class Helper
{
    public static string CleanJsonResult(string json)
    {
        return json.Replace("\\\"", "\"").Trim('\"');
    }

    public static bool IsInstalledVersion()
    {
        var exePath = System.Reflection.Assembly.GetExecutingAssembly().Location;
        var pf = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles);
        var pf86 = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86);

        return exePath.StartsWith(pf, StringComparison.OrdinalIgnoreCase) ||
               exePath.StartsWith(pf86, StringComparison.OrdinalIgnoreCase);
    }
}
