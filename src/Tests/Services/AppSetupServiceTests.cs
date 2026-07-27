using CleanMyPosts.Hosting;
using CleanMyPosts.Logging;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace CleanMyPosts.Tests.Services;

[Trait("Category", "Unit")]
public class AppSetupServiceTests
{
    [Fact]
    public void CreateLogger_ShouldReturnNotNullLogger()
    {
        // Arrange
        var service = new AppSetupService();
        var config = new ConfigurationBuilder().Build();
        var logBuffer = new LogBuffer();

        // Act
        var logger = service.CreateLogger(config, logBuffer);

        // Assert
        logger.Should().NotBeNull();
    }

    [Fact]
    public void CreateLogger_WithSerilogSection_ShouldReturnConfiguredLogger()
    {
        // Arrange
        var inMemorySettings = new Dictionary<string, string> { { "Serilog:MinimumLevel:Default", "Debug" } };

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(inMemorySettings)
            .Build();

        var service = new AppSetupService();
        var logBuffer = new LogBuffer();

        // Act
        var logger = service.CreateLogger(config, logBuffer);

        // Assert
        logger.Should().NotBeNull();
    }
}
