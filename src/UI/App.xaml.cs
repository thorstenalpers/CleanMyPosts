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
            .ConfigureServices((context, services) => services.AddCleanMyPosts(context.Configuration))
            .ConfigureLogging(loggingBuilder =>
            {
                loggingBuilder.ClearProviders();
                loggingBuilder.AddSerilog(dispose: true);
            })
            .Build();

            var logViewModel = _host.Services.GetRequiredService<LogViewModel>();

            Log.Logger = new LoggerConfiguration()
                .ReadFrom.Configuration(config)
                .WriteTo.Debug()
                .WriteTo.LogViewModelSink(logViewModel)
                .CreateLogger();

            await _host.StartAsync();

            var logger = _host.Services.GetRequiredService<ILogger<App>>();
            logger.LogInformation("Application started.");
        }
        catch (Exception ex)
        {
            Log.Fatal(ex, "Application start-up failed.");
            throw new CleanMyPostsException("Application start-up failed.", ex);
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
