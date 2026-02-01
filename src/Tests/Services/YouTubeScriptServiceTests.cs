using System.Reflection;
using CleanMyPosts.Contracts.Services;
using CleanMyPosts.Models;
using CleanMyPosts.Services;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace CleanMyPosts.Tests.Services;

[Trait("Category", "Unit")]
public class YouTubeScriptServiceTests
{
    private readonly Mock<IFileService> _fileServiceMock = new();
    private readonly Mock<ILogger<YouTubeScriptService>> _loggerMock = new();
    private readonly YouTubeScriptService _service;
    private readonly Mock<IUserSettingsService> _userSettingsServiceMock = new();
    private readonly Mock<IWebViewHostService> _webViewHostServiceMock = new();
    private readonly AppConfig _appConfig = new();

    public YouTubeScriptServiceTests()
    {
        _userSettingsServiceMock.Setup(x => x.GetTimeoutSettings()).Returns(new TimeoutSettings
        {
            WaitAfterDocumentLoad = 10, WaitAfterDelete = 1, WaitBetweenRetryDeleteAttempts = 0
        });

        _webViewHostServiceMock.SetupProperty(x => x.Source);
        _webViewHostServiceMock.Setup(x => x.ExecuteScriptAsync("document.readyState"))
            .ReturnsAsync("\"complete\"");

        // Setup ExecuteScriptAsync for login check (default - logged in)
        _webViewHostServiceMock
            .Setup(x => x.ExecuteScriptAsync(It.Is<string>(s => s.Contains("listitem"))))
            .ReturnsAsync("\"logged_in\"");

        // Setup dummy for Reload (do nothing)
        _webViewHostServiceMock.Setup(x => x.Reload());

        _fileServiceMock.Setup(x => x.Read<string>(It.IsAny<string>(), It.IsAny<string>()))
            .Returns("// dummy js script");

        _service = new YouTubeScriptService(
            _loggerMock.Object,
            _webViewHostServiceMock.Object,
            _userSettingsServiceMock.Object,
            _fileServiceMock.Object,
            _appConfig
        );
    }

    [Fact]
    public async Task ShowPostsAsync_NavigatesToGoogleMyActivityUrl()
    {
        await _service.ShowPostsAsync();

        var source = _webViewHostServiceMock.Object.Source?.ToString();
        Assert.NotNull(source);
        Assert.Contains("myactivity.google.com", source);
        Assert.Contains("youtube_comments", source);
    }

    [Fact]
    public async Task GetChannelHandleAsync_ReturnsLoggedInWhenActivityItemsExist()
    {
        _webViewHostServiceMock
            .Setup(x => x.ExecuteScriptAsync(It.Is<string>(s => s.Contains("listitem"))))
            .ReturnsAsync("\"logged_in\"");

        var result = await _service.GetChannelHandleAsync();

        Assert.Equal("logged_in", result);
    }

    [Fact]
    public async Task GetChannelHandleAsync_ReturnsEmptyWhenNotLoggedIn()
    {
        _webViewHostServiceMock
            .Setup(x => x.ExecuteScriptAsync(It.Is<string>(s => s.Contains("listitem"))))
            .ReturnsAsync("\"\"");

        var result = await _service.GetChannelHandleAsync();

        Assert.Empty(result);
    }

    [Fact]
    public async Task NavigateAsync_SetsSourceWhenUrlIsDifferent()
    {
        var url = new Uri("https://myactivity.google.com/page?page=youtube_comments");
        _webViewHostServiceMock.Object.Source = new Uri("https://google.com");

        var navigateMethod = _service.GetType()
            .GetMethod("NavigateAsync", BindingFlags.NonPublic | BindingFlags.Instance);

        var result = await (Task<bool>)navigateMethod.Invoke(_service, new object[] { url });

        Assert.Equal(url, _webViewHostServiceMock.Object.Source);
        Assert.True(result);
    }

    [Fact]
    public async Task IsNoCommentsPresentAsync_ReturnsTrueWhenNoDeleteButtonsExist()
    {
        _webViewHostServiceMock.Setup(x => x.ExecuteScriptAsync(It.Is<string>(s => s.Contains("Delete activity item"))))
            .ReturnsAsync("true");

        var method = _service.GetType()
            .GetMethod("IsNoCommentsPresentAsync", BindingFlags.NonPublic | BindingFlags.Instance);
        var result = await (Task<bool>)method.Invoke(_service, null);

        Assert.True(result);
    }

    [Fact]
    public async Task IsNoCommentsPresentAsync_ReturnsFalseWhenDeleteButtonsExist()
    {
        _webViewHostServiceMock.Setup(x => x.ExecuteScriptAsync(It.Is<string>(s => s.Contains("Delete activity item"))))
            .ReturnsAsync("false");

        var method = _service.GetType()
            .GetMethod("IsNoCommentsPresentAsync", BindingFlags.NonPublic | BindingFlags.Instance);
        var result = await (Task<bool>)method.Invoke(_service, null);

        Assert.False(result);
    }

    [Fact]
    public async Task WaitForDocumentReadyAsync_ReturnsTrueWhenDocumentIsComplete()
    {
        _webViewHostServiceMock.Setup(x => x.ExecuteScriptAsync("document.readyState"))
            .ReturnsAsync("\"complete\"");

        var method = _service.GetType()
            .GetMethod("WaitForDocumentReadyAsync", BindingFlags.NonPublic | BindingFlags.Instance);
        var result = await (Task<bool>)method.Invoke(_service, null);

        Assert.True(result);
    }

    [Fact]
    public async Task DeletePostsAsync_NavigatesToGoogleMyActivityUrl()
    {
        // Setup to simulate no comments present (to exit loop immediately)
        _webViewHostServiceMock.Setup(x => x.ExecuteScriptAsync(It.Is<string>(s => s.Contains("Delete activity item"))))
            .ReturnsAsync("true");

        await _service.DeletePostsAsync();

        var source = _webViewHostServiceMock.Object.Source?.ToString();
        Assert.NotNull(source);
        Assert.Contains("myactivity.google.com", source);
    }
}
