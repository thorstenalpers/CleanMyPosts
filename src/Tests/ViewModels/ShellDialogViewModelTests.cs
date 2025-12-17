using CleanMyPosts.ViewModels;
using FluentAssertions;
using Xunit;

namespace CleanMyPosts.Tests.ViewModels;

[Trait("Category", "Unit")]
public class ShellDialogViewModelTests
{
    [Fact]
    public void CloseCommand_ShouldInvokeSetResultWithTrue()
    {
        // Arrange
        var vm = new ShellDialogViewModel();
        bool? receivedResult = null;
        vm.SetResult = result => receivedResult = result;

        // Act
        vm.CloseCommand.Execute(null);

        // Assert
        receivedResult.Should().BeTrue();
    }

    [Fact]
    public void CloseCommand_ShouldNotThrow_WhenSetResultIsNull()
    {
        // Arrange
        var vm = new ShellDialogViewModel();
        vm.SetResult = null;

        // Act & Assert
        var act = () => vm.CloseCommand.Execute(null);
        act.Should().NotThrow();
    }
}