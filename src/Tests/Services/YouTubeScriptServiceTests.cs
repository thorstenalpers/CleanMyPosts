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

    public YouTubeScriptServiceTests()
    {
        _userSettingsServiceMock.Setup(x => x.GetTimeoutSettings()).Returns(new TimeoutSettings
        {
            WaitAfterDocumentLoad = 10, WaitAfterDelete = 1, WaitBetweenRetryDeleteAttempts = 0
        });

        _webViewHostServiceMock.SetupProperty(x => x.Source);
        _webViewHostServiceMock.Setup(x => x.ExecuteScriptAsync("document.readyState"))
            .ReturnsAsync("\"complete\"");

        // Setup ExecuteScriptAsync for channel handle retrieval (default)
        _webViewHostServiceMock
            .Setup(x => x.ExecuteScriptAsync(It.Is<string>(s => s.Contains("channel-handle") || s.Contains("/@"))))
            .ReturnsAsync("\"@testchannel\"");

        // Setup dummy for Reload (do nothing)
        _webViewHostServiceMock.Setup(x => x.Reload());

        _fileServiceMock.Setup(x => x.Read<string>(It.IsAny<string>(), It.IsAny<string>()))
            .Returns("// dummy js script");

        _service = new YouTubeScriptService(
            _loggerMock.Object,
            _webViewHostServiceMock.Object,
            _userSettingsServiceMock.Object,
            _fileServiceMock.Object
        );

        // Pre-set _channelHandle to "@testchannel" to avoid fetching it from JS during most tests
        typeof(YouTubeScriptService).GetField("_channelHandle", BindingFlags.NonPublic | BindingFlags.Instance)
            ?.SetValue(_service, "@testchannel");
    }

    [Fact]
    public async Task ShowPostsAsync_NavigatesToCommunityUrl()
    {
        await _service.ShowPostsAsync();

        var source = _webViewHostServiceMock.Object.Source?.ToString();
        Assert.NotNull(source);
        Assert.Contains("https://www.youtube.com/@testchannel/community", source);
    }

    [Fact]
    public async Task GetChannelHandleAsync_ReturnsCleanChannelHandle()
    {
        var fakeJsResult = "\"\\\"@testchannel\\\"\""; // double quoted JSON string
        _webViewHostServiceMock
            .Setup(x => x.ExecuteScriptAsync(It.Is<string>(s => s.Contains("channel-handle") || s.Contains("/@"))))
            .ReturnsAsync(fakeJsResult);

        var handle = await _service.GetChannelHandleAsync();

        Assert.Equal("@testchannel", handle);
    }

    [Fact]
    public async Task NavigateAsync_SetsSourceWhenUrlIsDifferent()
    {
        var url = new Uri("https://www.youtube.com/@differentchannel/community");
        _webViewHostServiceMock.Object.Source = new Uri("https://www.youtube.com/@testchannel/community");

        var navigateMethod = _service.GetType()
            .GetMethod("NavigateAsync", BindingFlags.NonPublic | BindingFlags.Instance);

        var result = await (Task<bool>)navigateMethod.Invoke(_service, new object[] { url });

        Assert.Equal(url, _webViewHostServiceMock.Object.Source);
        Assert.True(result);
    }

    [Fact]
    public async Task EnsureChannelHandleAsync_UpdatesChannelHandleIfChanged()
    {
        typeof(YouTubeScriptService).GetField("_channelHandle", BindingFlags.NonPublic | BindingFlags.Instance)
            ?.SetValue(_service, "@oldchannel");

        _webViewHostServiceMock
            .Setup(x => x.ExecuteScriptAsync(It.Is<string>(s => s.Contains("channel-handle") || s.Contains("/@"))))
            .ReturnsAsync("\"@newchannel\"");

        var method = _service.GetType()
            .GetMethod("EnsureChannelHandleAsync", BindingFlags.NonPublic | BindingFlags.Instance);
        await (Task)method.Invoke(_service, null);

        var updatedChannelHandle = typeof(YouTubeScriptService)
            .GetField("_channelHandle", BindingFlags.NonPublic | BindingFlags.Instance)
            ?.GetValue(_service);

        Assert.Equal("@newchannel", updatedChannelHandle);
    }

    [Fact]
    public async Task IsNoPostsPresentAsync_ReturnsTrueWhenNoPostsExist()
    {
        _webViewHostServiceMock.Setup(x => x.ExecuteScriptAsync(It.Is<string>(s => s.Contains("ytd-backstage-post-thread-renderer"))))
            .ReturnsAsync("true");

        var method = _service.GetType()
            .GetMethod("IsNoPostsPresentAsync", BindingFlags.NonPublic | BindingFlags.Instance);
        var result = await (Task<bool>)method.Invoke(_service, null);

        Assert.True(result);
    }

    [Fact]
    public async Task IsNoPostsPresentAsync_ReturnsFalseWhenPostsExist()
    {
        _webViewHostServiceMock.Setup(x => x.ExecuteScriptAsync(It.Is<string>(s => s.Contains("ytd-backstage-post-thread-renderer"))))
            .ReturnsAsync("false");

        var method = _service.GetType()
            .GetMethod("IsNoPostsPresentAsync", BindingFlags.NonPublic | BindingFlags.Instance);
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
    public async Task DeletePostsAsync_NavigatesToCommunityUrl()
    {
        // Setup to simulate no posts present (to exit loop immediately)
        _webViewHostServiceMock.Setup(x => x.ExecuteScriptAsync(It.Is<string>(s => s.Contains("ytd-backstage-post-thread-renderer"))))
            .ReturnsAsync("true");

        await _service.DeletePostsAsync();

        var source = _webViewHostServiceMock.Object.Source?.ToString();
        Assert.NotNull(source);
        Assert.Contains("https://www.youtube.com/@testchannel/community", source);
    }
}
