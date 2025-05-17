using Serilog.Core;
using Serilog.Events;
using CleanMyPosts.UI.ViewModels;

namespace CleanMyPosts.UI.Helpers;

public class LogViewModelSink(LogViewModel logViewModel) : ILogEventSink
{
    private readonly LogViewModel _logViewModel = logViewModel;

    public void Emit(LogEvent logEvent)
    {
        var rendered = $"[{logEvent.Timestamp:HH:mm:ss} {logEvent.Level}] {logEvent.RenderMessage()}";
        _logViewModel.AppendLog(rendered);
    }
}