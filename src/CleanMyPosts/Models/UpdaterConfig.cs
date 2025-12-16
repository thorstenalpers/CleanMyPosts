namespace CleanMyPosts.Models;


public class UpdaterConfig
{
    public string UpdateUrl { get; init; } = "https://raw.githubusercontent.com/thorstenalpers/CleanMyPosts/refs/heads/update-feed/update-installer.xml";
    public string IconUri { get; init; } = "pack://application:,,,/CleanMyPosts;component/Assets/logo.ico";
}
