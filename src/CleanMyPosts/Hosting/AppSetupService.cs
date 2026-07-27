using System.IO;
using Microsoft.Extensions.Configuration;
using Serilog;
using Serilog.Events;
using CleanMyPosts.Logging;

namespace CleanMyPosts.Hosting;

public class AppSetupService
{
    public IConfiguration BuildConfiguration()
    {
        return new ConfigurationBuilder()
            .AddEnvironmentVariables()
            .Build();
    }

    public ILogger CreateLogger(IConfiguration config, ILogBuffer logBuffer)
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
            .WriteTo.LogBufferSink(logBuffer)
            .Enrich.FromLogContext();

        return loggerConfig.CreateLogger();
    }
}