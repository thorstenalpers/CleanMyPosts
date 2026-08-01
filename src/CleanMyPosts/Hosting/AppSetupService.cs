using System.Globalization;
using System.IO;
using Microsoft.Extensions.Configuration;
using Serilog;
using Serilog.Events;
using CleanMyPosts.Logging;

namespace CleanMyPosts.Hosting;

public static class AppSetupService
{
    public static IConfiguration BuildConfiguration()
    {
        return new ConfigurationBuilder()
            .AddEnvironmentVariables()
            .Build();
    }

    public static ILogger CreateLogger(IConfiguration config, ILogBuffer logBuffer)
    {
        var loggerConfig = new LoggerConfiguration()
            .WriteTo.Console(formatProvider: CultureInfo.InvariantCulture)
            .MinimumLevel.Information()
            .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
            .MinimumLevel.Override("System", LogEventLevel.Warning)
            .WriteTo.File(
                Path.Combine(AppPaths.Logs, "log-.txt"),
                formatProvider: CultureInfo.InvariantCulture,
                rollingInterval: RollingInterval.Day,
                shared: true,
                outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}")
            .WriteTo.LogBufferSink(logBuffer)
            .Enrich.FromLogContext();

        return loggerConfig.CreateLogger();
    }
}