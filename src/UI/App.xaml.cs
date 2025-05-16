using System.IO;
using System.Reflection;
using System.Windows;
using System.Windows.Threading;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Serilog;
using XTweetCleaner.Core.Contracts.Services;
using XTweetCleaner.Core.Services;
using XTweetCleaner.UI.Contracts.Services;
using XTweetCleaner.UI.Contracts.Views;
using XTweetCleaner.UI.Helpers;
using XTweetCleaner.UI.Models;
using XTweetCleaner.UI.Services;
using XTweetCleaner.UI.ViewModels;
using XTweetCleaner.UI.Views;

namespace XTweetCleaner.UI;

public partial class App : Application
{
    private IHost _host;

    public App()
    {
        DispatcherUnhandledException += OnDispatcherUnhandledException;
    }

    private async void OnStartup(object sender, StartupEventArgs e)
    {
        var appLocation = Path.GetDirectoryName(Assembly.GetEntryAssembly().Location);

        var config = new ConfigurationBuilder()
            .SetBasePath(appLocation)
            .AddJsonFile("appsettings.json", optional: true, reloadOnChange: true)
            .AddEnvironmentVariables()
            .Build();

        try
        {
            _host = Host.CreateDefaultBuilder(e.Args)
                .ConfigureAppConfiguration(c =>
                {
                    c.SetBasePath(appLocation);
                    c.AddConfiguration(config);
                })
                .ConfigureServices(ConfigureServices)
                .ConfigureLogging(loggingBuilder =>
                {
                    loggingBuilder.ClearProviders();
                    loggingBuilder.AddSerilog(dispose: true);
                })
                .Build();

            // 🔧 LogViewModel must be resolved **after** the host is built
            var logViewModel = _host.Services.GetRequiredService<LogViewModel>();

            Log.Logger = new LoggerConfiguration()
                .ReadFrom.Configuration(config)
                .WriteTo.Debug()
                .WriteTo.LogViewModelSink(logViewModel) // custom sink
                .CreateLogger();

            await _host.StartAsync();

            var logger = _host.Services.GetRequiredService<ILogger<App>>();
            logger.LogInformation("Application started.");
        }
        catch (Exception ex)
        {
            Log.Fatal(ex, "Application start-up failed.");
            throw;
        }
    }

    internal static void ConfigureServices(HostBuilderContext context, IServiceCollection services)
    {
        // Your existing registrations
        services.AddHostedService<ApplicationHostService>();

        services.AddSingleton<IFileService, FileService>();
        services.AddSingleton<IAppSettingsService, AppSettingsService>();

        services.AddSingleton<IWindowManagerService, WindowManagerService>();
        services.AddSingleton<IApplicationInfoService, ApplicationInfoService>();
        services.AddSingleton<IPersistAndRestoreService, PersistAndRestoreService>();
        services.AddSingleton<IThemeSelectorService, ThemeSelectorService>();
        services.AddSingleton<IPageService, PageService>();
        services.AddSingleton<INavigationService, NavigationService>();
        services.AddSingleton<IXWebViewScriptService, XWebViewScriptService>();
        services.AddSingleton<IWebViewHostService, WebViewHostService>();

        services.AddTransient<IShellWindow, ShellWindow>();
        services.AddTransient<ShellViewModel>();
        services.AddSingleton<LogPage>();
        services.AddSingleton<LogViewModel>();
        services.AddSingleton<MainViewModel>();
        services.AddSingleton<MainPage>();

        services.AddTransient<SettingsViewModel>();
        services.AddTransient<SettingsPage>();

        services.AddTransient<IShellDialogWindow, ShellDialogWindow>();
        services.AddTransient<ShellDialogViewModel>();

        services.AddHttpClient();

        services.Configure<AppConfig>(context.Configuration.GetSection(nameof(AppConfig)));
    }

    private async void OnExit(object sender, ExitEventArgs e)
    {
        var logger = _host.Services.GetRequiredService<ILogger<App>>();
        logger.LogInformation("Application is stopping.");
        await _host.StopAsync();
        _host.Dispose();
        Log.CloseAndFlush();
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
