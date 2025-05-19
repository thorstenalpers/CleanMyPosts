using System.IO;
using System.Windows;
using System.Windows.Threading;
using CleanMyPosts.Core.Exception;
using CleanMyPosts.UI.Helpers;
using CleanMyPosts.UI.ViewModels;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Serilog;

namespace CleanMyPosts.UI;

public partial class App : Application
{
    private IHost _host;

    public App()
    {
        DispatcherUnhandledException += OnDispatcherUnhandledException;
    }

    private async void OnStartup(object sender, StartupEventArgs e)
    {
        var appLocation = AppContext.BaseDirectory;

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

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(defaultSettings) // 1. Defaults
            .AddJsonFile("appsettings.json", optional: true) // 2. Optional override
            .AddEnvironmentVariables()
            .Build();

        var logViewModel = new LogViewModel();

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
                shared: true,
                rollingInterval: RollingInterval.Day,
                outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}")
            .WriteTo.LogViewModelSink(logViewModel)
            .Enrich.FromLogContext();

        Log.Logger = loggerConfig.CreateLogger();

        try
        {
            _host = Host.CreateDefaultBuilder(e.Args)
                .ConfigureAppConfiguration(c => c.AddConfiguration(config))
                .ConfigureServices((context, services) =>
                {
                    services.AddSingleton(logViewModel);
                    services.AddCleanMyPosts(context.Configuration);
                })
                .UseSerilog()
                .Build();

            await _host.StartAsync();

            var logger = _host.Services.GetRequiredService<ILogger<App>>();
            logger.LogInformation("Application started.");
        }
        catch (Exception ex)
        {
            Log.Fatal(ex, $"Application start-up failed {ex}.");
            throw new CleanMyPostsException($"Application start-up failed  {ex}.", ex);
        }
    }

    private async void OnExit(object sender, ExitEventArgs e)
    {
        var logger = _host.Services.GetRequiredService<ILogger<App>>();
        logger.LogInformation("Application is stopping.");
        await _host.StopAsync();
        _host.Dispose();
        await Log.CloseAndFlushAsync();
        _host = null;
    }

    private void OnDispatcherUnhandledException(object sender, DispatcherUnhandledExceptionEventArgs e)
    {
        var logger = _host?.Services.GetService<ILogger<App>>();
        logger?.LogError(e.Exception, "Unhandled UI exception");
        MessageBox.Show($"Unhandled UI exception: {e.Exception.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
        e.Handled = true;
    }
}
