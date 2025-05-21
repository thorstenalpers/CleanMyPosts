using System.IO;
using CleanMyPosts.UI.Contracts.Services;
using CleanMyPosts.UI.Extensions;
using CleanMyPosts.UI.ViewModels;
using Microsoft.Extensions.Configuration;
using Serilog;

namespace CleanMyPosts.UI.Services;

public class AppSetupService : IAppSetupService
{
    public IConfiguration BuildConfiguration()
    {
        var defaultSettings = new Dictionary<string, string>
        {
            ["AppConfig:configurationsFolder"] = "CleanMyPosts\\Configurations",
            ["AppConfig:appPropertiesFileName"] = "AppProperties.json",
            ["AppConfig:XBaseUrl"] = "https://x.com",
            ["Updater:AppCastUrlInstaller"] = "https://raw.githubusercontent.com/thorstenalpers/CleanMyPosts/refs/heads/update-feed/appcast-installer.xml",
            ["Updater:AppCastUrlSingle"] = "https://raw.githubusercontent.com/thorstenalpers/CleanMyPosts/refs/heads/update-feed/appcast-single.xml",
            ["Updater:SecurityMode"] = "Unsafe",
            ["Updater:IconUri"] = "pack://application:,,,/CleanMyPosts;component/Assets/logo.ico"
        };
        return new ConfigurationBuilder()
            .AddInMemoryCollection(defaultSettings)
            .AddJsonFile("appsettings.json", optional: true)
            .AddEnvironmentVariables()
            .Build();
    }

    public ILogger CreateLogger(IConfiguration config, LogViewModel logViewModel)
    {
        var loggerConfig = new LoggerConfiguration();

        var serilogSection = config.GetSection("Serilog");
        if (serilogSection.Exists())
        {
            loggerConfig = loggerConfig.ReadFrom.Configuration(config);
        }

        loggerConfig
            .WriteTo.Console()
            .WriteTo.File(
                path: Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                    "CleanMyPosts",
                    "Logs",
                    "log-.txt"),
                rollingInterval: RollingInterval.Day,
                shared: true,
                outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}")
            .WriteTo.LogViewModelSink(logViewModel)
            .Enrich.FromLogContext();

        return loggerConfig.CreateLogger();
    }
}
