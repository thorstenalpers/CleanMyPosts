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

        return new ConfigurationBuilder()
            .AddEnvironmentVariables()
            .Build();
    }

    public ILogger CreateLogger(IConfiguration config, LogViewModel logViewModel)
    {
        var loggerConfig = new LoggerConfiguration()
            .WriteTo.Console()
            .MinimumLevel.Information()
            .MinimumLevel.Override("Microsoft", Serilog.Events.LogEventLevel.Warning)
            .MinimumLevel.Override("System", Serilog.Events.LogEventLevel.Warning)
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
