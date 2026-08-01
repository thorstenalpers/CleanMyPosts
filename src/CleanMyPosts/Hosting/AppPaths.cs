using System.IO;

namespace CleanMyPosts.Hosting;

/// <summary>
/// Every path the app writes to at run time. Nothing is ever written next to the
/// executable — an installed app lives in a folder the user cannot write to.
/// </summary>
public static class AppPaths
{
    // Pinned, not derived from the assembly name: renaming the assembly must not
    // orphan the WebView2 profile (cookies/logins) by moving its folder.
    private const string AppFolderName = "CleanMyPosts";

    public static string Root { get; } = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        AppFolderName);

    public static string WebView2UserData { get; } = Path.Combine(Root, "WebView2");

    public static string Logs { get; } = Path.Combine(Root, "Logs");

    public static string Configurations { get; } = Path.Combine(Root, "Configurations");
}
