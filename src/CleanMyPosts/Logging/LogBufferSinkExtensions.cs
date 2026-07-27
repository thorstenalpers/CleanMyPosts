using Serilog;
using Serilog.Configuration;

namespace CleanMyPosts.Logging;

public static class LogBufferSinkExtensions
{
    public static LoggerConfiguration LogBufferSink(this LoggerSinkConfiguration loggerConfiguration, ILogBuffer logBuffer)
    {
        return loggerConfiguration.Sink(new LogBufferSink(logBuffer));
    }
}
