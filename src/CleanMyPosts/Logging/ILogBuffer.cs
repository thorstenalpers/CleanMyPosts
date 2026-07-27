using CleanMyPosts.Infrastructure;

namespace CleanMyPosts.Logging;

/// <summary>In-memory ring buffer of app log entries, pushed live to the chrome WebView2's Log view.</summary>
public interface ILogBuffer
{
    void Append(LogEntryDto entry);
    IReadOnlyList<LogEntryDto> GetEntries();
    event EventHandler<LogEntryDto> EntryAdded;
}
