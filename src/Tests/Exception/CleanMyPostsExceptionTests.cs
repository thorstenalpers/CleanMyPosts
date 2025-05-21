using CleanMyPosts.Core.Exception;
using FluentAssertions;
using Xunit;

namespace CleanMyPosts.Tests.Exception;

[Trait("Category", "Unit")]
public class CleanMyPostsExceptionTests
{
    [Fact]
    public void DefaultConstructor_ShouldCreateException()
    {
        // Act
        var exception = new CleanMyPostsException();

        // Assert
        exception.Should().NotBeNull();
        exception.Message.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public void Constructor_WithMessage_ShouldSetMessage()
    {
        // Arrange
        var message = "Test error message";

        // Act
        var exception = new CleanMyPostsException(message);

        // Assert
        exception.Message.Should().Be(message);
    }

    [Fact]
    public void Constructor_WithMessageAndInnerException_ShouldSetProperties()
    {
        // Arrange
        var message = "Test error message";
        var innerException = new System.Exception("Inner exception");

        // Act
        var exception = new CleanMyPostsException(message, innerException);

        // Assert
        exception.Message.Should().Be(message);
        exception.InnerException.Should().Be(innerException);
    }
}