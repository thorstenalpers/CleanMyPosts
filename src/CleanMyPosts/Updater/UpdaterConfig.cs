namespace CleanMyPosts.Updater;

public class UpdaterConfig
{
    public string UpdateUrl { get; init; } =
        "https://raw.githubusercontent.com/thorstenalpers/CleanMyPosts/refs/heads/update-feed/update-installer.xml";
}
