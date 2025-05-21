using CleanMyPosts.UI.ViewModels;
using Serilog.Core;
using Serilog.Events;

namespace CleanMyPosts.Tests.Helpers;

public class LogViewModelSink : ILogEventSink
{
    private readonly LogViewModel _logViewModel;

    public LogViewModelSink(LogViewModel logViewModel)
    {
        _logViewModel = logViewModel;
    }

    public void Emit(LogEvent logEvent)
    {
        var rendered = $"[{logEvent.Timestamp:HH:mm:ss} {logEvent.Level}] {logEvent.RenderMessage()}";
        _logViewModel.AppendLog(rendered);
    }
}