using System.Windows;
using System.Windows.Threading;
using CleanMyPosts.Core.Contracts.Services;
using CleanMyPosts.Core.Services;
using CleanMyPosts.UI.Contracts.Services;
using CleanMyPosts.UI.Contracts.Views;
using CleanMyPosts.UI.Helpers;
using CleanMyPosts.UI.Models;
using CleanMyPosts.UI.Services;
using CleanMyPosts.UI.ViewModels;
using CleanMyPosts.UI.Views;
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

        var config = new ConfigurationBuilder()
            .SetBasePath(appLocation)
            .AddJsonFile("appsettings.json", optional: true, reloadOnChange: false)
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
        services.AddSingleton<XViewModel>();
        services.AddSingleton<XPage>();

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
