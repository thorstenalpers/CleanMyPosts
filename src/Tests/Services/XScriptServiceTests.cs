using CleanMyPosts.UI.Contracts.Services;
using CleanMyPosts.UI.Models;
using CleanMyPosts.UI.Services;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace CleanMyPosts.UI.Tests.Services;

public class XScriptServiceTests
{
    private readonly Mock<ILogger<XScriptService>> _loggerMock = new();
    private readonly Mock<IWebViewHostService> _webViewHostServiceMock = new();
    private readonly Mock<IUserSettingsService> _userSettingsServiceMock = new();
    private readonly XScriptService _service;

    public XScriptServiceTests()
    {
        _userSettingsServiceMock.Setup(x => x.GetTimeoutSettings()).Returns(new TimeoutSettings
        {
            WaitAfterDocumentLoad = 500,
            WaitAfterDelete = 1,
            WaitBetweenRetryDeleteAttempts = 0
        });
        _service = new XScriptService(_loggerMock.Object, _webViewHostServiceMock.Object, _userSettingsServiceMock.Object);
        // Set _userName via reflection for tests that require it
        typeof(XScriptService).GetField("_userName", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)
            ?.SetValue(_service, "testuser");
    }

    [Fact]
    public async Task ShowPostsAsync_NavigatesToCorrectUrl()
    {
        _webViewHostServiceMock.SetupProperty(x => x.Source);
        _webViewHostServiceMock.Setup(x => x.ExecuteScriptAsync(It.IsAny<string>())).ReturnsAsync("\"complete\"");
        _webViewHostServiceMock.SetupAdd(x => x.NavigationCompleted += It.IsAny<EventHandler<NavigationCompletedEventArgs>>());

        var navigationCompletedArgs = new NavigationCompletedEventArgs { IsSuccess = true };
        _webViewHostServiceMock.Raise(x => x.NavigationCompleted += null, this, navigationCompletedArgs);

        var task = _service.ShowPostsAsync();
        await Task.Delay(10); // Let async code run

        Assert.Contains("x.com/search", _webViewHostServiceMock.Object.Source.ToString());
    }

    [Fact]
    public async Task ShowLikesAsync_NavigatesToCorrectUrl()
    {
        _webViewHostServiceMock.SetupProperty(x => x.Source);
        _webViewHostServiceMock.Setup(x => x.ExecuteScriptAsync(It.IsAny<string>())).ReturnsAsync("\"complete\"");
        _webViewHostServiceMock.SetupAdd(x => x.NavigationCompleted += It.IsAny<EventHandler<NavigationCompletedEventArgs>>());

        var navigationCompletedArgs = new NavigationCompletedEventArgs { IsSuccess = true };
        _webViewHostServiceMock.Raise(x => x.NavigationCompleted += null, this, navigationCompletedArgs);

        var task = _service.ShowLikesAsync();
        await Task.Delay(10);

        Assert.Contains("/likes", _webViewHostServiceMock.Object.Source.ToString());
    }

    [Fact]
    public async Task ShowFollowingAsync_NavigatesToCorrectUrl()
    {
        _webViewHostServiceMock.SetupProperty(x => x.Source);
        _webViewHostServiceMock.Setup(x => x.ExecuteScriptAsync(It.IsAny<string>())).ReturnsAsync("\"complete\"");
        _webViewHostServiceMock.SetupAdd(x => x.NavigationCompleted += It.IsAny<EventHandler<NavigationCompletedEventArgs>>());

        var navigationCompletedArgs = new NavigationCompletedEventArgs { IsSuccess = true };
        _webViewHostServiceMock.Raise(x => x.NavigationCompleted += null, this, navigationCompletedArgs);

        var task = _service.ShowFollowingAsync();
        await Task.Delay(10);

        Assert.Contains("following", _webViewHostServiceMock.Object.Source.ToString());
    }

    [Fact]
    public async Task PostsExistAsync_ReturnsTrueIfPostExists()
    {
        _webViewHostServiceMock.SetupSequence(x => x.ExecuteScriptAsync(It.IsAny<string>()))
            .ReturnsAsync("true");

        var result = await (Task<bool>)typeof(XScriptService)
            .GetMethod("PostsExistAsync", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)
            .Invoke(_service, null)!;

        Assert.True(result);
    }

    [Fact]
    public async Task PostsExistAsync_ReturnsFalseIfNoPost()
    {
        _webViewHostServiceMock.SetupSequence(x => x.ExecuteScriptAsync(It.IsAny<string>()))
            .ReturnsAsync("false")
            .ReturnsAsync("false")
            .ReturnsAsync("false")
            .ReturnsAsync("false")
            .ReturnsAsync("false");

        var result = await (Task<bool>)typeof(XScriptService)
            .GetMethod("PostsExistAsync", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)
            .Invoke(_service, null)!;

        Assert.False(result);
    }
}
