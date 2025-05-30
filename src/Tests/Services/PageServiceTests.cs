using System.Windows.Controls;
using CleanMyPosts.UI.Services;
using CleanMyPosts.UI.ViewModels;
using CleanMyPosts.UI.Views;
using FluentAssertions;
using Moq;
using Xunit;

namespace CleanMyPosts.Tests.Services;

[Trait("Category", "Unit")]
public class PageServiceTests
{
    private readonly Mock<IServiceProvider> _mockServiceProvider;
    private readonly PageService _pageService;

    public PageServiceTests()
    {
        _mockServiceProvider = new Mock<IServiceProvider>();
        _pageService = new PageService(_mockServiceProvider.Object);
    }

    [Fact]
    public void GetPageType_ShouldReturnCorrectType_ForXViewModel()
    {
        // Arrange
        var key = typeof(XViewModel).FullName;

        // Act
        var result = _pageService.GetPageType(key);

        // Assert
        result.Should().Be(typeof(XPage));
    }

    [Fact]
    public void GetPageType_ShouldReturnCorrectType_ForLogViewModel()
    {
        // Arrange
        var key = typeof(LogViewModel).FullName;

        // Act
        var result = _pageService.GetPageType(key);

        // Assert
        result.Should().Be(typeof(LogPage));
    }

    [Fact]
    public void GetPageType_ShouldReturnCorrectType_ForSettingsViewModel()
    {
        // Arrange
        var key = typeof(SettingsViewModel).FullName;

        // Act
        var result = _pageService.GetPageType(key);

        // Assert
        result.Should().Be(typeof(SettingsPage));
    }

    [Fact]
    public void GetPageType_ShouldThrowArgumentException_ForUnknownKey()
    {
        // Arrange
        var unknownKey = "UnknownViewModel";

        // Act & Assert
        var action = () => _pageService.GetPageType(unknownKey);
        action.Should().Throw<ArgumentException>()
              .WithMessage($"Page not found: {unknownKey}. Did you forget to call PageService.Configure?");
    }

    [Fact]
    public void GetPage_ShouldReturnPageFromServiceProvider()
    {
        // Arrange
        var key = typeof(XViewModel).FullName;
        var expectedPage = new Mock<Page>().Object;
        _mockServiceProvider.Setup(x => x.GetService(typeof(XPage)))
                           .Returns(expectedPage);

        // Act
        var result = _pageService.GetPage(key);

        // Assert
        result.Should().Be(expectedPage);
        _mockServiceProvider.Verify(x => x.GetService(typeof(XPage)), Times.Once);
    }

    [Fact]
    public void GetPage_ShouldReturnNull_WhenServiceProviderReturnsNull()
    {
        // Arrange
        var key = typeof(LogViewModel).FullName;
        _mockServiceProvider.Setup(x => x.GetService(typeof(LogPage)))
                           .Returns(null);

        // Act
        var result = _pageService.GetPage(key);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public void GetPage_ShouldReturnNull_WhenServiceProviderReturnsNonPageType()
    {
        // Arrange
        var key = typeof(SettingsViewModel).FullName;
        var nonPageObject = new object();
        _mockServiceProvider.Setup(x => x.GetService(typeof(SettingsPage)))
                           .Returns(nonPageObject);

        // Act
        var result = _pageService.GetPage(key);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public void GetPage_ShouldThrowArgumentException_ForUnknownKey()
    {
        // Arrange
        var unknownKey = "UnknownViewModel";

        // Act & Assert
        var action = () => _pageService.GetPage(unknownKey);
        action.Should().Throw<ArgumentException>()
              .WithMessage($"Page not found: {unknownKey}. Did you forget to call PageService.Configure?");
    }

    [Fact]
    public void Constructor_ShouldConfigureAllExpectedPages()
    {
        // Act & Assert - Constructor should not throw and all expected pages should be configured
        var xViewModelKey = typeof(XViewModel).FullName;
        var logViewModelKey = typeof(LogViewModel).FullName;
        var settingsViewModelKey = typeof(SettingsViewModel).FullName;

        // These should not throw
        var action1 = () => _pageService.GetPageType(xViewModelKey);
        var action2 = () => _pageService.GetPageType(logViewModelKey);
        var action3 = () => _pageService.GetPageType(settingsViewModelKey);

        action1.Should().NotThrow();
        action2.Should().NotThrow();
        action3.Should().NotThrow();

        _pageService.GetPageType(xViewModelKey).Should().Be(typeof(XPage));
        _pageService.GetPageType(logViewModelKey).Should().Be(typeof(LogPage));
        _pageService.GetPageType(settingsViewModelKey).Should().Be(typeof(SettingsPage));
    }
}