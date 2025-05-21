using CleanMyPosts.UI.ViewModels;
using FluentAssertions;
using Xunit;

namespace CleanMyPosts.Tests.ViewModels;

[Trait("Category", "Unit")]
public class LogViewModelTests
{
    [Fact]
    public void AppendLog_AddsMessageToLogEntries()
    {
        // Arrange
        var vm = new LogViewModel();
        var message = "Test log entry";

        // Act
        vm.AppendLog(message);

        // Assert
        vm.LogEntries.Should().ContainSingle().Which.Should().Be(message);
    }

    [Fact]
    public void ClearLog_RemovesAllLogEntries()
    {
        // Arrange
        var vm = new LogViewModel();
        vm.AppendLog("Entry 1");
        vm.AppendLog("Entry 2");

        // Act
        vm.ClearLogCommand.Execute(null);

        // Assert
        vm.LogEntries.Should().BeEmpty();
    }

    [Fact]
    public void SelectedLogEntry_CanBeSetAndRetrieved()
    {
        // Arrange
        var vm = new LogViewModel();
        var entry = "Some log entry";

        // Act
        vm.SelectedLogEntry = entry;

        // Assert
        vm.SelectedLogEntry.Should().Be(entry);
    }
}
