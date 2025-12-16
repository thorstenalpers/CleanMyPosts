using System.Windows;
using System.Windows.Threading;
using CleanMyPosts.Services;
using CleanMyPosts.ViewModels;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Serilog;

namespace CleanMyPosts;

public partial class App : Application
{
    private IHost _host;
    private readonly AppSetupService _appSetupService;
    private readonly HostService _hostService;

    public App()
    {
        _appSetupService = new AppSetupService();
        _hostService = new HostService();
    }

    private async void OnStartup(object sender, StartupEventArgs e)
    {
        var config = _appSetupService.BuildConfiguration();
        var logViewModel = new LogViewModel();
        Log.Logger = _appSetupService.CreateLogger(config, logViewModel);

        try
        {
            _host = _hostService.BuildHost(e.Args, config, logViewModel);
            await _host.StartAsync();
            var logger = _host.Services.GetRequiredService<ILogger<App>>();
            logger.LogInformation("Application started.");
        }
        catch (Exception ex)
        {
            Log.Fatal(ex, "Application start-up failed.");
            MessageBox.Show("Failed to start application.", "Startup Error", MessageBoxButton.OK, MessageBoxImage.Error);
            Environment.Exit(1);
        }
    }

    private async void OnExit(object sender, ExitEventArgs e)
    {
        if (_host == null)
        {
            return;
        }

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
