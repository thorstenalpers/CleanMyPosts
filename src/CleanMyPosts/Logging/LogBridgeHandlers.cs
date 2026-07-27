using CleanMyPosts.Infrastructure;

namespace CleanMyPosts.Logging;

public static class LogBridgeHandlers
{
    public static void Register(HostBridge bridge, ILogBuffer logBuffer)
    {
        bridge.Register<object, IReadOnlyList<LogEntryDto>>("log.getBuffer", _ => Task.FromResult(logBuffer.GetEntries()));
    }
}
