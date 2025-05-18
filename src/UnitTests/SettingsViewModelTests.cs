using CleanMyPosts.UI.Contracts.Services;
using CleanMyPosts.UI.Models;
using CleanMyPosts.UI.ViewModels;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;

namespace CleanMyPosts.Tests;

[Category("Unit")]
public class SettingsViewModelTests
{

    [Test]
    public void TestSettingsViewModel_SetCurrentTheme()
    {
        Mock<IThemeSelectorService> mockThemeSelectorService = new();
        mockThemeSelectorService.Setup(mock => mock.GetCurrentTheme()).Returns(AppTheme.Light);
        Mock<IApplicationInfoService> mockApplicationInfoService = new();
        Mock<IAppSettingsService> mockAppSettingsService = new();
        Mock<IUpdateService> mockUpdateService = new();
        Mock<ILogger<SettingsViewModel>> mockLogger = new();

        var settingsVm = new SettingsViewModel(mockThemeSelectorService.Object,
                                               mockLogger.Object,
                                               mockApplicationInfoService.Object,
                                               mockAppSettingsService.Object,
                                               mockUpdateService.Object);
        settingsVm.OnNavigatedTo(null);

        Assert.That(AppTheme.Light, Is.EqualTo(settingsVm.Theme));
    }

    [Test]
    public void TestSettingsViewModel_SetCurrentVersion()
    {
        Mock<IThemeSelectorService> mockThemeSelectorService = new();
        Mock<IApplicationInfoService> mockApplicationInfoService = new();
        Mock<IAppSettingsService> mockAppSettingsService = new();
        Mock<IUpdateService> mockUpdateService = new();
        Mock<ILogger<SettingsViewModel>> mockLogger = new();

        Version testVersion = new(1, 2, 3, 4);
        mockApplicationInfoService.Setup(mock => mock.GetVersion()).Returns(testVersion);

        var settingsVm = new SettingsViewModel(mockThemeSelectorService.Object,
                                               mockLogger.Object,
                                               mockApplicationInfoService.Object,
                                               mockAppSettingsService.Object,
                                               mockUpdateService.Object);
        settingsVm.OnNavigatedTo(null);

        Assert.That($"CleanMyPosts - {testVersion}", Is.EqualTo(settingsVm.VersionDescription));
    }

    [Test]
    public void TestSettingsViewModel_SetThemeCommand()
    {
        Mock<IThemeSelectorService> mockThemeSelectorService = new();
        Mock<IApplicationInfoService> mockApplicationInfoService = new();
        Mock<IAppSettingsService> mockAppSettingsService = new();
        Mock<IUpdateService> mockUpdateService = new();
        Mock<ILogger<SettingsViewModel>> mockLogger = new();

        var settingsVm = new SettingsViewModel(mockThemeSelectorService.Object,
                                               mockLogger.Object,
                                               mockApplicationInfoService.Object,
                                               mockAppSettingsService.Object,
                                               mockUpdateService.Object);
        settingsVm.SetThemeCommand.Execute(AppTheme.Light.ToString());

        mockThemeSelectorService.Verify(mock => mock.SetTheme(AppTheme.Light));
    }
}
