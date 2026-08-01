using CleanMyPosts.Hosting;
using CleanMyPosts.Infrastructure;
using CleanMyPosts.Logging;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.UI.Xaml;
using Serilog;

namespace CleanMyPosts;

public partial class App : Application
{
    private IHost? _host;

    public App()
    {
        // Must happen before any WebView2 control is realised, otherwise WebView2 falls
        // back to a "<exe>.WebView2" folder next to the executable, which an installed
        // app cannot write to.
        Environment.SetEnvironmentVariable("WEBVIEW2_USER_DATA_FOLDER", AppPaths.WebView2UserData);

        InitializeComponent();
        UnhandledException += OnUnhandledException;
    }

    protected override async void OnLaunched(LaunchActivatedEventArgs args)
    {
        var config = AppSetupService.BuildConfiguration();
        var logBuffer = new LogBuffer();
        Log.Logger = AppSetupService.CreateLogger(config, logBuffer);

        try
        {
            _host = HostService.BuildHost(Environment.GetCommandLineArgs()[1..], config, logBuffer);
            await _host.StartAsync();
            _host.Services.GetRequiredService<ILogger<App>>().LogInformation("Application started.");
        }
        catch (Exception ex)
        {
            Log.Fatal(ex, "Application start-up failed.");
            NativeMethods.ShowError("Failed to start application.", "Startup Error");
            Environment.Exit(1);
        }
    }

    /// <summary>Called by the shell window as it closes — WinUI has no application Exit event.</summary>
    public async Task ShutdownAsync()
    {
        if (_host is null)
        {
            return;
        }

        _host.Services.GetRequiredService<ILogger<App>>().LogInformation("Application is stopping.");
        await _host.StopAsync();
        _host.Dispose();
        _host = null;
        await Log.CloseAndFlushAsync();
    }

    private void OnUnhandledException(object sender, Microsoft.UI.Xaml.UnhandledExceptionEventArgs e)
    {
        _host?.Services.GetService<ILogger<App>>()?.LogError(e.Exception, "Unhandled UI exception");
        NativeMethods.ShowError($"Unhandled UI exception: {e.Message}", "Error");
        e.Handled = true;
    }
}
