#nullable enable
using CleanMyPosts.Infrastructure;
using CleanMyPosts.Logging;
using FluentAssertions;
using Xunit;

namespace CleanMyPosts.Tests.Services;

[Trait("Category", "Unit")]
public class LogBufferTests
{
    [Fact]
    public void Append_AddsEntryToBuffer()
    {
        var buffer = new LogBuffer();
        var entry = new LogEntryDto(DateTimeOffset.Now, LogLevel.Info, "hello");

        buffer.Append(entry);

        buffer.GetEntries().Should().ContainSingle().Which.Should().Be(entry);
    }

    [Fact]
    public void Append_RaisesEntryAddedEvent()
    {
        var buffer = new LogBuffer();
        LogEntryDto? raised = null;
        buffer.EntryAdded += (_, e) => raised = e;

        var entry = new LogEntryDto(DateTimeOffset.Now, LogLevel.Warning, "careful");
        buffer.Append(entry);

        raised.Should().Be(entry);
    }

    [Fact]
    public void GetEntries_PreservesInsertionOrder()
    {
        var buffer = new LogBuffer();
        buffer.Append(new LogEntryDto(DateTimeOffset.Now, LogLevel.Info, "first"));
        buffer.Append(new LogEntryDto(DateTimeOffset.Now, LogLevel.Info, "second"));
        buffer.Append(new LogEntryDto(DateTimeOffset.Now, LogLevel.Info, "third"));

        buffer.GetEntries().Select(e => e.Message).Should().Equal("first", "second", "third");
    }

    [Fact]
    public void Append_DropsOldestEntryOnceOverCapacity()
    {
        var buffer = new LogBuffer();

        for (var i = 0; i < 2001; i++)
        {
            buffer.Append(new LogEntryDto(DateTimeOffset.Now, LogLevel.Info, $"entry-{i}"));
        }

        var entries = buffer.GetEntries();
        entries.Should().HaveCount(2000);
        entries.First().Message.Should().Be("entry-1");
        entries.Last().Message.Should().Be("entry-2000");
    }
}
