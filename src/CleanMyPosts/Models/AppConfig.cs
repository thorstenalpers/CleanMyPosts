namespace CleanMyPosts.Models;

public class AppConfig
{
    public string ConfigurationsFolder { get; init; } = "CleanMyPosts\\Configurations";
    public string AppPropertiesFileName { get; init; } = "AppProperties.json";
    public string DarkStyleUri { get; init; } = "pack://application:,,,/Styles/Themes/HC.Dark.Blue.xaml";
    public string LightStyleUri { get; init; } = "pack://application:,,,/Styles/Themes/HC.Light.Blue.xaml";

    public string XBaseUrl { get; init; } = "https://x.com";
    public string YouTubeBaseUrl { get; init; } = "https://www.youtube.com/feed/you";
    public string YouTubeCommentsUrl { get; init; } = "https://myactivity.google.com/page?hl=en&page=youtube_comments";
    public string YouTubeLikedVideosUrl { get; init; } = "https://www.youtube.com/playlist?list=LL";
    public string ReportIssueUrl { get; init; } = "https://github.com/thorstenalpers/CleanMyPosts/issues";
    public string GitRepoUrl { get; init; } = "https://github.com/thorstenalpers/CleanMyPosts";
}