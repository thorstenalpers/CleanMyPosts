using CleanMyPosts.Logging;
using FluentAssertions;
using Serilog;
using Xunit;

namespace CleanMyPosts.Tests.Extensions;

[Trait("Category", "Unit")]
public class LogBufferSinkExtensionsTests
{
    [Fact]
    public void LogBufferSink_WiresSinkSoLogEventsReachTheBuffer()
    {
        var buffer = new LogBuffer();
        var logger = new LoggerConfiguration().WriteTo.LogBufferSink(buffer).CreateLogger();

        logger.Information("wired up");

        buffer.GetEntries().Should().ContainSingle().Which.Message.Should().Be("wired up");
    }
}
