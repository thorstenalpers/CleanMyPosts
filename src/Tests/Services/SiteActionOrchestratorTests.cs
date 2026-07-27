#nullable enable
using CleanMyPosts.Hosting;
using CleanMyPosts.Infrastructure;
using CleanMyPosts.Settings;
using CleanMyPosts.Sites;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Xunit;

namespace CleanMyPosts.Tests.Services;

public class FakeShellLayoutService : IShellLayoutService
{
    public bool? LastSidebarExpanded { get; private set; }
    public bool? LastSiteVisible { get; private set; }

    public void SetSidebarExpanded(bool expanded) => LastSidebarExpanded = expanded;

    public void SetSiteVisible(bool visible) => LastSiteVisible = visible;
}

[Trait("Category", "Unit")]
public class SiteActionOrchestratorTests
{
    private readonly Mock<ISiteWebViewService> _siteWebViewMock = new();
    private readonly Mock<IChromeWebViewService> _chromeWebViewMock = new();
    private readonly Mock<IUserSettingsService> _userSettingsMock = new();
    private readonly AppConfig _appConfig = new();
    private Uri? _currentSource;

    private SiteActionOrchestrator CreateOrchestrator()
    {
        _userSettingsMock.Setup(x => x.GetTimeoutSettings()).Returns(new TimeoutSettings { WaitAfterDocumentLoad = 0 });

        // Safe default for the fire-and-forget login-status check NavigateAsync kicks off; individual tests
        // override the getUserName/getLoginStatus setups when they care about the resolved value.
        _siteWebViewMock.Setup(x => x.ExecuteScriptAsync(It.Is<string>(s => s.Contains("getLoginStatus")))).ReturnsAsync("''");

        _siteWebViewMock.SetupGet(x => x.Source).Returns(() => _currentSource!);
        _siteWebViewMock.SetupSet(x => x.Source = It.IsAny<Uri>()).Callback<Uri>(uri =>
        {
            _currentSource = uri;
            _siteWebViewMock.Raise(x => x.NavigationCompleted += null, _siteWebViewMock.Object,
                new NavigationCompletedEventArgs { IsSuccess = true });
        });
        // Real WebView2 fires NavigationCompleted asynchronously well after Reload() returns; the orchestrator
        // relies on that and only subscribes *after* calling Reload(). Raising synchronously here (like the
        // Source setter above) would fire before that subscription exists and hang the test forever, so this
        // defers the raise instead.
        _siteWebViewMock.Setup(x => x.Reload()).Callback(() =>
            Task.Run(() => _siteWebViewMock.Raise(x => x.NavigationCompleted += null, _siteWebViewMock.Object,
                new NavigationCompletedEventArgs { IsSuccess = true })));

        return new SiteActionOrchestrator(
            NullLogger<SiteActionOrchestrator>.Instance,
            _siteWebViewMock.Object,
            _chromeWebViewMock.Object,
            _userSettingsMock.Object,
            _appConfig);
    }

    [Fact]
    public async Task NavigateAsync_ForYouTube_NavigatesToConfiguredUrlWithoutNeedingAUserName()
    {
        var orchestrator = CreateOrchestrator();

        var result = await orchestrator.NavigateAsync(new SiteNavigateParams(Platform.Youtube, "showComments"));

        result.Ok.Should().BeTrue();
        _currentSource.Should().Be(new Uri(_appConfig.YouTubeCommentsUrl));
    }

    [Fact]
    public async Task NavigateAsync_ForX_ResolvesUserNameThenNavigatesToUserScopedUrl()
    {
        _siteWebViewMock.Setup(x => x.ExecuteScriptAsync(It.Is<string>(s => s.Contains("getUserName"))))
            .ReturnsAsync("\"someuser\"");

        var orchestrator = CreateOrchestrator();

        var result = await orchestrator.NavigateAsync(new SiteNavigateParams(Platform.X, "showLikes"));

        result.Ok.Should().BeTrue();
        _currentSource!.ToString().Should().Be("https://x.com/someuser/likes");
    }

    [Fact]
    public async Task NavigateAsync_ForX_FailsWhenNoUserNameCanBeResolved()
    {
        _siteWebViewMock.Setup(x => x.ExecuteScriptAsync(It.Is<string>(s => s.Contains("getUserName"))))
            .ReturnsAsync("\"\"");

        var orchestrator = CreateOrchestrator();

        var result = await orchestrator.NavigateAsync(new SiteNavigateParams(Platform.X, "showPosts"));

        result.Ok.Should().BeFalse();
    }

    [Fact]
    public async Task HideAsync_HidesTheSiteWebViewAndUpdatesTheAttachedLayoutService()
    {
        var orchestrator = CreateOrchestrator();
        var layoutService = new FakeShellLayoutService();
        orchestrator.AttachLayoutService(layoutService);

        await orchestrator.HideAsync(true);

        _siteWebViewMock.Verify(x => x.Hide(true), Times.Once);
        layoutService.LastSiteVisible.Should().BeFalse();
    }

    [Fact]
    public async Task RunActionAsync_ReturnsZero_WhenAlreadyEmpty()
    {
        _siteWebViewMock.Setup(x => x.ExecuteScriptAsync(It.Is<string>(s => s.Contains("isEmpty"))))
            .ReturnsAsync("true");

        var orchestrator = CreateOrchestrator();

        var result = await orchestrator.RunActionAsync(new SiteRunActionParams(
            "req-2",
            Platform.Youtube,
            "deleteLikes",
            new TimeoutSettingsDto(0, 0, 0)));

        result.DeletedCount.Should().Be(0);
        _siteWebViewMock.Verify(x => x.ExecuteScriptAsync(It.Is<string>(s => s.Contains("__cmp.run"))), Times.Never);
    }
}
