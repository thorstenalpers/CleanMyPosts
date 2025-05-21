using CleanMyPosts.UI.Services;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace CleanMyPosts.Tests.Services;

[Trait("Category", "Unit")]
public class NetSparkleLoggerTests
{
    [Fact]
    public void PrintMessage_FormatsMessageAndLogsInformation()
    {
        // Arrange
        var mockLogger = new Mock<ILogger<NetSparkleLogger>>();
        var netSparkleLogger = new NetSparkleLogger(mockLogger.Object);
        var message = "Hello {0}";
        var arg = "World";
        var expectedFormattedMessage = "Hello World";

        // Act
        netSparkleLogger.PrintMessage(message, arg);

        // Assert
        mockLogger.Verify(
            logger => logger.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString().Contains(expectedFormattedMessage)),
                null,
                It.IsAny<Func<It.IsAnyType, System.Exception, string>>()),
            Times.Once);
    }

    [Fact]
    public void Constructor_NullLogger_ThrowsArgumentNullException()
    {
        // Arrange & Act & Assert
        Assert.Throws<ArgumentNullException>(() => new NetSparkleLogger(null));
    }
}