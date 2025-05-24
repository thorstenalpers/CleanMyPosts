namespace CleanMyPosts.UI.Models;


public class UpdaterConfig
{
    public string UpdateUrlInstaller { get; init; } = "https://raw.githubusercontent.com/thorstenalpers/CleanMyPosts/refs/heads/update-feed/update-installer.xml";
    public string UpdateUrlSingle { get; init; } = "https://raw.githubusercontent.com/thorstenalpers/CleanMyPosts/refs/heads/update-feed/update-single.xml";
    public string IconUri { get; init; } = "pack://application:,,,/CleanMyPosts;component/Assets/logo.ico";
}
