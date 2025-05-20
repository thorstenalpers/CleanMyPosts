using CleanMyPosts.UI.Contracts.Services;
using CleanMyPosts.UI.ViewModels;
using CleanMyPosts.UI.Views;
using FluentAssertions;
using Microsoft.Extensions.Hosting;
using Xunit;

namespace CleanMyPosts.Tests;

public class PagesTests
{
    private readonly IHost _host;

    public PagesTests()
    {
        _host = TestHelper.SetUpHost();
    }

    [Fact]
    public void TestWebViewViewModelCreation()
    {
        var vm = _host.Services.GetService(typeof(XViewModel));
        vm.Should().NotBeNull();
    }

    [Fact]
    public void TestGetMainPageType()
    {
        var pageService = _host.Services.GetService(typeof(IPageService)) as IPageService;
        pageService.Should().NotBeNull();

        var pageType = pageService.GetPageType(typeof(XViewModel).FullName);
        pageType.Should().Be<XPage>();
    }

    [Fact]
    public void TestSettingsViewModelCreation()
    {
        var vm = _host.Services.GetService(typeof(SettingsViewModel));
        vm.Should().NotBeNull();
    }

    [Fact]
    public void TestGetSettingsPageType()
    {
        var pageService = _host.Services.GetService(typeof(IPageService)) as IPageService;
        pageService.Should().NotBeNull();

        var pageType = pageService.GetPageType(typeof(SettingsViewModel).FullName);
        pageType.Should().Be<SettingsPage>();
    }
}

