using CleanMyPosts.UI.Contracts.Services;
using CleanMyPosts.UI.ViewModels;
using CleanMyPosts.UI.Views;
using Microsoft.Extensions.Hosting;
using NUnit.Framework;

namespace CleanMyPosts.Tests;

[Category("Integration")]
public class PagesTests
{
    private IHost _host;

    [SetUp]
    public void Setup()
    {
        _host = TestHelper.SetUpHost();
    }

    [Test]
    public void TestWebViewViewModelCreation()
    {
        var vm = _host.Services.GetService(typeof(XViewModel));
        Assert.That(vm, Is.Not.Null);
    }

    [Test]
    public void TestGetMainPageType()
    {
        var pageService = _host.Services.GetService(typeof(IPageService)) as IPageService;
        Assert.That(pageService, Is.Not.Null);

        var pageType = pageService.GetPageType(typeof(XViewModel).FullName);
        Assert.That(typeof(XPage), Is.EqualTo(pageType));
    }

    [Test]
    public void TestSettingsViewModelCreation()
    {
        var vm = _host.Services.GetService(typeof(SettingsViewModel));
        Assert.That(vm, Is.Not.Null);
    }

    [Test]
    public void TestGetSettingsPageType()
    {
        var pageService = _host.Services.GetService(typeof(IPageService)) as IPageService;
        Assert.That(pageService, Is.Not.Null);

        var pageType = pageService.GetPageType(typeof(SettingsViewModel).FullName);
        Assert.That(typeof(SettingsPage), Is.EqualTo(pageType));
    }
}
