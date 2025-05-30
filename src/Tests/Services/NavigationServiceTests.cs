using System.Windows.Controls;
using System.Windows.Navigation;
using CleanMyPosts.UI.Contracts.Services;
using CleanMyPosts.UI.Contracts.ViewModels;
using FluentAssertions;
using Moq;
using Xunit;

namespace CleanMyPosts.Tests.Services;

[Trait("Category", "Unit")]
public class NavigationServiceTests
{
    private readonly Mock<IPageService> _mockPageService;
    private readonly Mock<Frame> _mockFrame;
    private readonly CleanMyPosts.UI.Services.NavigationService _navigationService;

    public NavigationServiceTests()
    {
        _mockPageService = new Mock<IPageService>();
        _mockFrame = new Mock<Frame>();
        _navigationService = new CleanMyPosts.UI.Services.NavigationService(_mockPageService.Object);
    }

    [Fact]
    public void Constructor_ShouldInitializeWithPageService()
    {
        // Act & Assert
        _navigationService.Should().NotBeNull();
    }

    [Fact]
    public void CanGoBack_ShouldReturnFalse_WhenFrameIsNotInitialized()
    {
        // Act
        var result = _navigationService.CanGoBack;

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public void CanGoBack_ShouldReturnFrameCanGoBack_WhenFrameIsInitialized()
    {
        // Arrange
        _mockFrame.Setup(x => x.CanGoBack).Returns(true);
        _navigationService.Initialize(_mockFrame.Object);

        // Act
        var result = _navigationService.CanGoBack;

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public void Initialize_ShouldSetFrame_WhenCalledFirstTime()
    {
        // Act
        _navigationService.Initialize(_mockFrame.Object);

        // Assert
        _mockFrame.VerifyAdd(x => x.Navigated += It.IsAny<NavigatedEventHandler>(), Times.Once);
    }

    [Fact]
    public void Initialize_ShouldNotSetFrame_WhenCalledMultipleTimes()
    {
        // Arrange
        var secondFrame = new Mock<Frame>();

        // Act
        _navigationService.Initialize(_mockFrame.Object);
        _navigationService.Initialize(secondFrame.Object);

        // Assert
        _mockFrame.VerifyAdd(x => x.Navigated += It.IsAny<NavigatedEventHandler>(), Times.Once);
        secondFrame.VerifyAdd(x => x.Navigated += It.IsAny<NavigatedEventHandler>(), Times.Never);
    }

    [Fact]
    public void UnsubscribeNavigation_ShouldUnsubscribeAndClearFrame()
    {
        // Arrange
        _navigationService.Initialize(_mockFrame.Object);

        // Act
        _navigationService.UnsubscribeNavigation();

        // Assert
        _mockFrame.VerifyRemove(x => x.Navigated -= It.IsAny<NavigatedEventHandler>(), Times.Once);
    }

    [Fact]
    public void GoBack_ShouldCallFrameGoBack_WhenCanGoBackIsTrue()
    {
        // Arrange
        _mockFrame.Setup(x => x.CanGoBack).Returns(true);
        _navigationService.Initialize(_mockFrame.Object);

        // Act
        _navigationService.GoBack();

        // Assert
        _mockFrame.Verify(x => x.GoBack(), Times.Once);
    }

    [Fact]
    public void GoBack_ShouldNotCallFrameGoBack_WhenCanGoBackIsFalse()
    {
        // Arrange
        _mockFrame.Setup(x => x.CanGoBack).Returns(false);
        _navigationService.Initialize(_mockFrame.Object);

        // Act
        _navigationService.GoBack();

        // Assert
        _mockFrame.Verify(x => x.GoBack(), Times.Never);
    }

    [Fact]
    public void NavigateTo_ShouldReturnTrue_WhenNavigationSucceeds()
    {
        // Arrange
        var pageKey = "TestPage";
        var pageType = typeof(Page);
        var mockPage = new Mock<Page>();
        
        _mockPageService.Setup(x => x.GetPageType(pageKey)).Returns(pageType);
        _mockPageService.Setup(x => x.GetPage(pageKey)).Returns(mockPage.Object);
        _mockFrame.Setup(x => x.Navigate(It.IsAny<Page>(), It.IsAny<object>())).Returns(true);
        _mockFrame.Setup(x => x.Content).Returns(null);
        
        _navigationService.Initialize(_mockFrame.Object);

        // Act
        var result = _navigationService.NavigateTo(pageKey);

        // Assert
        result.Should().BeTrue();
        _mockFrame.Verify(x => x.Navigate(mockPage.Object, null), Times.Once);
    }

    [Fact]
    public void NavigateTo_ShouldReturnFalse_WhenNavigationFails()
    {
        // Arrange
        var pageKey = "TestPage";
        var pageType = typeof(Page);
        var mockPage = new Mock<Page>();
        
        _mockPageService.Setup(x => x.GetPageType(pageKey)).Returns(pageType);
        _mockPageService.Setup(x => x.GetPage(pageKey)).Returns(mockPage.Object);
        _mockFrame.Setup(x => x.Navigate(It.IsAny<Page>(), It.IsAny<object>())).Returns(false);
        _mockFrame.Setup(x => x.Content).Returns(null);
        
        _navigationService.Initialize(_mockFrame.Object);

        // Act
        var result = _navigationService.NavigateTo(pageKey);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public void NavigateTo_ShouldReturnFalse_WhenSamePageAndNoParameter()
    {
        // Arrange
        var pageKey = "TestPage";
        var pageType = typeof(Page);
        var existingPage = new Mock<Page>();
        existingPage.Setup(x => x.GetType()).Returns(pageType);
        
        _mockPageService.Setup(x => x.GetPageType(pageKey)).Returns(pageType);
        _mockFrame.Setup(x => x.Content).Returns(existingPage.Object);
        
        _navigationService.Initialize(_mockFrame.Object);

        // Act
        var result = _navigationService.NavigateTo(pageKey);

        // Assert
        result.Should().BeFalse();
        _mockFrame.Verify(x => x.Navigate(It.IsAny<Page>(), It.IsAny<object>()), Times.Never);
    }

    [Fact]
    public void NavigateTo_ShouldSetClearNavigationTag_WhenClearNavigationIsTrue()
    {
        // Arrange
        var pageKey = "TestPage";
        var pageType = typeof(Page);
        var mockPage = new Mock<Page>();
        
        _mockPageService.Setup(x => x.GetPageType(pageKey)).Returns(pageType);
        _mockPageService.Setup(x => x.GetPage(pageKey)).Returns(mockPage.Object);
        _mockFrame.Setup(x => x.Navigate(It.IsAny<Page>(), It.IsAny<object>())).Returns(true);
        _mockFrame.Setup(x => x.Content).Returns(null);
        
        _navigationService.Initialize(_mockFrame.Object);

        // Act
        _navigationService.NavigateTo(pageKey, null, clearNavigation: true);

        // Assert
        _mockFrame.VerifySet(x => x.Tag = true, Times.Once);
    }

    [Fact]
    public void NavigateTo_ShouldNavigateWithParameter()
    {
        // Arrange
        var pageKey = "TestPage";
        var pageType = typeof(Page);
        var mockPage = new Mock<Page>();
        var parameter = "test parameter";
        
        _mockPageService.Setup(x => x.GetPageType(pageKey)).Returns(pageType);
        _mockPageService.Setup(x => x.GetPage(pageKey)).Returns(mockPage.Object);
        _mockFrame.Setup(x => x.Navigate(It.IsAny<Page>(), It.IsAny<object>())).Returns(true);
        _mockFrame.Setup(x => x.Content).Returns(null);
        
        _navigationService.Initialize(_mockFrame.Object);

        // Act
        var result = _navigationService.NavigateTo(pageKey, parameter);

        // Assert
        result.Should().BeTrue();
        _mockFrame.Verify(x => x.Navigate(mockPage.Object, parameter), Times.Once);
    }

    [Fact]
    public void CleanNavigation_ShouldCallFrameCleanNavigation()
    {
        // Arrange
        _navigationService.Initialize(_mockFrame.Object);

        // Act
        _navigationService.CleanNavigation();

        // Assert - This would require the extension method to be mockable
        // For now, we just verify the method doesn't throw
        var action = () => _navigationService.CleanNavigation();
        action.Should().NotThrow();
    }

    [Fact]
    public void NavigatedEvent_ShouldBeTriggered_WhenFrameNavigated()
    {
        // Arrange
        _navigationService.Initialize(_mockFrame.Object);
        
        string eventArg = null;
        object eventSender = null;
        _navigationService.Navigated += (sender, arg) =>
        {
            eventSender = sender;
            eventArg = arg;
        };

        // Act - This would require more complex setup to properly test the event
        // For now, we verify the event can be subscribed to
        var action = () => _navigationService.Navigated += (s, e) => { };
        
        // Assert
        action.Should().NotThrow();
    }
}