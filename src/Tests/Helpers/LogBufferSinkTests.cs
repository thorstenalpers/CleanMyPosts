using CleanMyPosts.Infrastructure;
using CleanMyPosts.Logging;
using FluentAssertions;
using Serilog;
using Serilog.Events;
using Xunit;

namespace CleanMyPosts.Tests.Helpers;

[Trait("Category", "Unit")]
public class LogBufferSinkTests
{
    [Fact]
    public void Emit_AppendsRenderedMessageToBuffer()
    {
        var buffer = new LogBuffer();
        var sink = new LogBufferSink(buffer);
        var logger = new LoggerConfiguration().WriteTo.Sink(sink).CreateLogger();

        logger.Information("Hello {Name}", "World");

        var entry = buffer.GetEntries().Should().ContainSingle().Subject;
        entry.Message.Should().Be("Hello \"World\"");
        entry.Level.Should().Be(LogLevel.Info);
    }

    [Theory]
    [InlineData(LogEventLevel.Verbose, LogLevel.Info)]
    [InlineData(LogEventLevel.Debug, LogLevel.Info)]
    [InlineData(LogEventLevel.Information, LogLevel.Info)]
    [InlineData(LogEventLevel.Warning, LogLevel.Warning)]
    [InlineData(LogEventLevel.Error, LogLevel.Error)]
    [InlineData(LogEventLevel.Fatal, LogLevel.Error)]
    public void Emit_MapsSerilogLevelToBridgeLogLevel(LogEventLevel serilogLevel, LogLevel expected)
    {
        var buffer = new LogBuffer();
        var sink = new LogBufferSink(buffer);
        var logger = new LoggerConfiguration()
            .MinimumLevel.Verbose()
            .WriteTo.Sink(sink)
            .CreateLogger();

        logger.Write(serilogLevel, "message");

        buffer.GetEntries().Single().Level.Should().Be(expected);
    }

    [Fact]
    public void Emit_AppendsExceptionDetailsWhenPresent()
    {
        var buffer = new LogBuffer();
        var sink = new LogBufferSink(buffer);
        var logger = new LoggerConfiguration().WriteTo.Sink(sink).CreateLogger();

        logger.Error(new InvalidOperationException("boom"), "failed");

        buffer.GetEntries().Single().Message.Should().Contain("boom");
    }
}
