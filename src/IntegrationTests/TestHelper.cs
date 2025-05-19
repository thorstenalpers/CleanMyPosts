using CleanMyPosts.UI.Helpers;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Moq;
using NetSparkleUpdater.Interfaces;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace CleanMyPosts.IntegrationTests;

internal static class TestHelper
{
    public static IHost SetUpHost()
    {
        JsonConvert.DefaultSettings = () => new JsonSerializerSettings
        {
            Converters = { new StringEnumConverter() },
            Formatting = Formatting.Indented
        };

        var cfgBuilder = new ConfigurationBuilder();
        cfgBuilder.AddInMemoryCollection(new Dictionary<string, string>
        {
            ["Updater:AppCastUrlInstaller"] = "https://example.com/appcast.xml",
            ["Updater:AppCastUrlSingle"] = "https://example.com/appcast.xml",
            ["Updater:SecurityMode"] = "Unsafe",
            ["Updater:IconUri"] = "https://raw.githubusercontent.com/thorstenalpers/CleanMyPosts/refs/heads/main/src/UI/Assets/logo.ico"
        });
        cfgBuilder.AddUserSecrets<PagesTests>();
        cfgBuilder.AddEnvironmentVariables();
        var cfg = cfgBuilder.Build();

        var host = Host.CreateDefaultBuilder()
            .ConfigureAppConfiguration((context, config) => config.AddConfiguration(cfg))
            .ConfigureServices((context, services) =>
            {
                services.AddCleanMyPosts(cfg);
                var mockUIFactory = new Mock<IUIFactory>();
                services.AddSingleton(mockUIFactory.Object);
            })
            .ConfigureLogging(logging =>
            {
                logging.ClearProviders();
                logging.AddConsole();
                logging.SetMinimumLevel(LogLevel.Information);
                logging.AddFilter("System.Net.Http.HttpClient", LogLevel.Warning);
                logging.AddFilter("CleanMyPosts", LogLevel.Information);

                logging.AddSimpleConsole(options =>
                {
                    options.UseUtcTimestamp = true;
                    options.SingleLine = true;
                    options.ColorBehavior = Microsoft.Extensions.Logging.Console.LoggerColorBehavior.Enabled;
                });
            })
            .Build();

        return host;
    }
}
