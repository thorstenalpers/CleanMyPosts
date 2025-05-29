namespace CleanMyPosts.UI.Models;


public class AppConfig
{
    public string ConfigurationsFolder { get; init; } = "CleanMyPosts\\Configurations";
    public string AppPropertiesFileName { get; init; } = "AppProperties.json";
    public string DarkStyleUri { get; init; } = "pack://application:,,,/Styles/Themes/HC.Dark.Blue.xaml";
    public string LightStyleUri { get; init; } = "pack://application:,,,/Styles/Themes/HC.Light.Blue.xaml";

    public string XBaseUrl { get; init; } = "https://x.com";
    public string ReportIssueUrl { get; init; } = "https://github.com/thorstenalpers/CleanMyPosts/issues";
    public string ThirdPartyUrl { get; init; } = "https://github.com/thorstenalpers/CleanMyPosts/blob/main/THIRD_PARTY_LICENSES.txt";
}