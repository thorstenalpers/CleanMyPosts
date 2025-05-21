using CleanMyPosts.UI;
using CleanMyPosts.UI.Services;
using FluentAssertions;
using Xunit;

namespace CleanMyPosts.Tests.Services;

[Trait("Category", "Unit")]
public class ApplicationInfoServiceTests
{
    [Fact]
    public void GetVersion_ShouldReturnVersionMatchingAssembly()
    {
        // Arrange
        var service = new ApplicationInfoService();
        var expected = typeof(App).Assembly.GetName().Version;
        var expectedShort = new Version($"{expected.Major}.{expected.Minor}.{expected.Build}");

        // Act
        var actual = service.GetVersion();

        // Assert
        actual.Should().Be(expectedShort);
    }

    [Fact]
    public void GetVersion_ShouldReturnNonNullAndValidVersion()
    {
        // Arrange
        var service = new ApplicationInfoService();

        // Act
        var version = service.GetVersion();

        // Assert
        version.Should().NotBeNull();
        version.Major.Should().BeGreaterThanOrEqualTo(0);
    }
}