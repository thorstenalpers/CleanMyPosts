using Moq;

using NUnit.Framework;
using XTweetCleaner.UI.Contracts.Services;
using XTweetCleaner.UI.Models;
using XTweetCleaner.UI.ViewModels;

namespace XTweetCleaner.Tests;

[Category("Unit")]
public class SettingsViewModelTests
{
    public SettingsViewModelTests()
    {
    }

    [Test]
    public void TestSettingsViewModel_SetCurrentTheme()
    {
        Mock<IThemeSelectorService> mockThemeSelectorService = new();
        mockThemeSelectorService.Setup(mock => mock.GetCurrentTheme()).Returns(AppTheme.Light);
        Mock<IApplicationInfoService> mockApplicationInfoService = new();

        var settingsVm = new SettingsViewModel(mockThemeSelectorService.Object, mockApplicationInfoService.Object);
        settingsVm.OnNavigatedTo(null);

        Assert.That(AppTheme.Light, Is.EqualTo(settingsVm.Theme));
    }

    [Test]
    public void TestSettingsViewModel_SetCurrentVersion()
    {
        Mock<IThemeSelectorService> mockThemeSelectorService = new();
        Mock<IApplicationInfoService> mockApplicationInfoService = new();
        Version testVersion = new(1, 2, 3, 4);
        mockApplicationInfoService.Setup(mock => mock.GetVersion()).Returns(testVersion);

        var settingsVm = new SettingsViewModel(mockThemeSelectorService.Object, mockApplicationInfoService.Object);
        settingsVm.OnNavigatedTo(null);

        Assert.That($"XTweetCleaner - {testVersion}", Is.EqualTo(settingsVm.VersionDescription));
    }

    [Test]
    public void TestSettingsViewModel_SetThemeCommand()
    {
        Mock<IThemeSelectorService> mockThemeSelectorService = new();
        Mock<IApplicationInfoService> mockApplicationInfoService = new();

        var settingsVm = new SettingsViewModel(mockThemeSelectorService.Object, mockApplicationInfoService.Object);
        settingsVm.SetThemeCommand.Execute(AppTheme.Light.ToString());

        mockThemeSelectorService.Verify(mock => mock.SetTheme(AppTheme.Light));
    }
}
