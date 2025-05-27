using CleanMyPosts.Core.Contracts.Services;
using CleanMyPosts.UI.Contracts.Services;
using CleanMyPosts.UI.Models;
using CleanMyPosts.UI.Services;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace CleanMyPosts.UI.Tests.Services
{
    public class XScriptServiceTests
    {
        private readonly Mock<ILogger<XScriptService>> _loggerMock = new();
        private readonly Mock<IWebViewHostService> _webViewHostServiceMock = new();
        private readonly Mock<IUserSettingsService> _userSettingsServiceMock = new();
        private readonly Mock<IFileService> _fileServiceMock = new();
        private readonly XScriptService _service;

        public XScriptServiceTests()
        {
            _userSettingsServiceMock.Setup(x => x.GetTimeoutSettings()).Returns(new TimeoutSettings
            {
                WaitAfterDocumentLoad = 10,
                WaitAfterDelete = 1,
                WaitBetweenRetryDeleteAttempts = 0
            });

            _webViewHostServiceMock.SetupProperty(x => x.Source);
            _webViewHostServiceMock.Setup(x => x.ExecuteScriptAsync("document.readyState"))
                .ReturnsAsync("\"complete\"");

            // Setup ExecuteScriptAsync for username retrieval (default)
            _webViewHostServiceMock.Setup(x => x.ExecuteScriptAsync(It.Is<string>(s => s.Contains("AppTabBar_Profile_Link"))))
                .ReturnsAsync("\"testuser\"");

            // Setup dummy for Reload (do nothing)
            _webViewHostServiceMock.Setup(x => x.Reload());

            _fileServiceMock.Setup(x => x.Read<string>(It.IsAny<string>(), It.IsAny<string>()))
                .Returns("// dummy js script");

            _service = new XScriptService(
                _loggerMock.Object,
                _webViewHostServiceMock.Object,
                _userSettingsServiceMock.Object,
                _fileServiceMock.Object
            );

            // Pre-set _userName to "testuser" to avoid fetching it from JS during most tests
            typeof(XScriptService).GetField("_userName", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)
                ?.SetValue(_service, "testuser");
        }

        [Fact]
        public async Task ShowRepostsAsync_NavigatesToCorrectUrl()
        {
            await _service.ShowRepostsAsync();

            Assert.NotNull(_webViewHostServiceMock.Object.Source);
            Assert.Contains("https://x.com/testuser", _webViewHostServiceMock.Object.Source.ToString());
        }

        [Fact]
        public async Task ShowRepliesAsync_NavigatesToCorrectUrl()
        {
            await _service.ShowRepliesAsync();

            Assert.NotNull(_webViewHostServiceMock.Object.Source);
            Assert.Contains("https://x.com/testuser/with_replies", _webViewHostServiceMock.Object.Source.ToString());
        }

        [Fact]
        public async Task GetUserNameAsync_ReturnsCleanUserName()
        {
            var fakeJsResult = "\"\\\"testuser\\\"\""; // double quoted JSON string
            _webViewHostServiceMock.Setup(x => x.ExecuteScriptAsync(It.Is<string>(s => s.Contains("AppTabBar_Profile_Link"))))
                .ReturnsAsync(fakeJsResult);

            var username = await _service.GetUserNameAsync();

            Assert.Equal("testuser", username);
        }

        [Fact]
        public async Task NavigateAsync_SetsSourceWhenUrlIsDifferent()
        {
            var url = new Uri("https://x.com/differentuser");
            _webViewHostServiceMock.Object.Source = new Uri("https://x.com/testuser");

            var navigateMethod = _service.GetType()
                .GetMethod("NavigateAsync", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);

            var result = await (Task<bool>)navigateMethod.Invoke(_service, new object[] { url });

            Assert.Equal(url, _webViewHostServiceMock.Object.Source);
            Assert.True(result);
        }
    }
}
