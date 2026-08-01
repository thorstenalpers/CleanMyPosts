using CleanMyPosts.Infrastructure;
using CleanMyPosts.Logging;
using CleanMyPosts.Settings;
using CleanMyPosts.Sites;
using CleanMyPosts.Updater;
using CleanMyPosts.Views;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Serilog;

namespace CleanMyPosts.Hosting;

public static class HostService
{
    public static IHost BuildHost(string[] args, IConfiguration config, ILogBuffer logBuffer)
    {
        var host = Host.CreateDefaultBuilder(args)
            .ConfigureAppConfiguration(c => c.AddConfiguration(config))
            .ConfigureServices((context, services) =>
            {
                services.AddSingleton(logBuffer);
                services.AddHostedService<ApplicationHostService>();

                services.AddSingleton<IFileService, FileService>();
                services.AddSingleton<IUserSettingsService, UserSettingsService>();

                services.AddSingleton<WebView2EnvironmentProvider>();
                services.AddSingleton<WebAssetProvider>();
                services.AddSingleton<ISiteWebViewService, SiteWebViewService>();
                services.AddSingleton<IChromeWebViewService, ChromeWebViewService>();
                services.AddSingleton<HostBridge>();
                services.AddSingleton<SiteActionOrchestrator>();

                services.AddSingleton<ShellWindow>();
                services.AddSingleton<IShellWindow>(sp => sp.GetRequiredService<ShellWindow>());

                services.AddHttpClient();

                services.AddSingleton<AppConfig>();
                services.AddSingleton<UpdaterConfig>();
            })
            .UseSerilog()
            .Build();

        return host;
    }
}
