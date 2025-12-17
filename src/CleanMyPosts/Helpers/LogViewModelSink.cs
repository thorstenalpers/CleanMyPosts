using System.Text;
using CleanMyPosts.ViewModels;
using Serilog.Core;
using Serilog.Events;

namespace CleanMyPosts.Helpers;

public class LogViewModelSink(LogViewModel logViewModel) : ILogEventSink
{
    private readonly LogViewModel _logViewModel = logViewModel;

    public void Emit(LogEvent logEvent)
    {
        var renderedMessage = logEvent.RenderMessage();
        var timestamp = logEvent.Timestamp.ToString("HH:mm:ss");
        var level = logEvent.Level;

        var fullLog = $"[{timestamp} {level}] {renderedMessage}";

        if (logEvent.Exception != null)
        {
            fullLog += Environment.NewLine + FormatException(logEvent.Exception);
        }

        _logViewModel.AppendLog(fullLog);
    }

    private static string FormatException(Exception ex)
    {
        var sb = new StringBuilder();
        while (ex != null)
        {
            sb.AppendLine($"Exception: {ex.GetType().Name}: {ex.Message}");
            sb.AppendLine(ex.StackTrace);
            ex = ex.InnerException;
            if (ex != null)
            {
                sb.AppendLine("Inner exception:");
            }
        }

        return sb.ToString();
    }
}