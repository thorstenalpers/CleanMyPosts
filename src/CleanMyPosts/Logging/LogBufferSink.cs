using Serilog.Core;
using Serilog.Events;
using CleanMyPosts.Infrastructure;

namespace CleanMyPosts.Logging;

public class LogBufferSink(ILogBuffer logBuffer) : ILogEventSink
{
    public void Emit(LogEvent logEvent)
    {
        var message = logEvent.RenderMessage();
        if (logEvent.Exception != null)
        {
            message += Environment.NewLine + logEvent.Exception;
        }

        logBuffer.Append(new LogEntryDto(logEvent.Timestamp, ToLogLevel(logEvent.Level), message));
    }

    private static LogLevel ToLogLevel(LogEventLevel level) => level switch
    {
        LogEventLevel.Warning => LogLevel.Warning,
        LogEventLevel.Error or LogEventLevel.Fatal => LogLevel.Error,
        _ => LogLevel.Info
    };
}
