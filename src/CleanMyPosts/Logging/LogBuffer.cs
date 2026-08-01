using CleanMyPosts.Infrastructure;

namespace CleanMyPosts.Logging;

public class LogBuffer : ILogBuffer
{
    private const int MaxEntries = 2000;
    private readonly Lock _lock = new();
    private readonly LinkedList<LogEntryDto> _entries = new();

    public event EventHandler<LogEntryDto>? EntryAdded;

    public void Append(LogEntryDto entry)
    {
        lock (_lock)
        {
            _entries.AddLast(entry);
            if (_entries.Count > MaxEntries)
            {
                _entries.RemoveFirst();
            }
        }

        EntryAdded?.Invoke(this, entry);
    }

    public IReadOnlyList<LogEntryDto> GetEntries()
    {
        lock (_lock)
        {
            return [.. _entries];
        }
    }
}
