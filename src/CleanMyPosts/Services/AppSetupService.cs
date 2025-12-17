using System.IO;
using CleanMyPosts.Contracts.Services;
using CleanMyPosts.Extensions;
using CleanMyPosts.ViewModels;
using Microsoft.Extensions.Configuration;
using Serilog;
using Serilog.Events;

namespace CleanMyPosts.Services;

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
            .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
            .MinimumLevel.Override("System", LogEventLevel.Warning)
            .WriteTo.File(
                Path.Combine(
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