using CleanMyPosts.UI.Contracts.Services;
using CleanMyPosts.UI.Models;
using CleanMyPosts.UI.ViewModels;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace CleanMyPosts.Tests.ViewModels;

[Trait("Category", "Unit")]
public class SettingsViewModelTests
{
    private readonly Mock<IThemeSelectorService> _themeSelectorServiceMock = new();
    private readonly Mock<IApplicationInfoService> _applicationInfoServiceMock = new();
    private readonly Mock<IAppSettingsService> _appSettingsServiceMock = new();
    private readonly Mock<IUpdateService> _updateServiceMock = new();
    private readonly Mock<ILogger<SettingsViewModel>> _loggerMock = new();

    private SettingsViewModel CreateViewModel() =>
        new(_themeSelectorServiceMock.Object,
            _loggerMock.Object,
            _applicationInfoServiceMock.Object,
            _appSettingsServiceMock.Object,
            _updateServiceMock.Object);

    [Fact]
    public void OnNavigatedTo_ShouldSetCurrentTheme_WhenThemeServiceReturnsTheme()
    {
        // Arrange
        _themeSelectorServiceMock.Setup(x => x.GetCurrentTheme()).Returns(AppTheme.Light);
        var viewModel = CreateViewModel();

        // Act
        viewModel.OnNavigatedTo(null);

        // Assert
        viewModel.Theme.Should().Be(AppTheme.Light);
    }

    [Fact]
    public void OnNavigatedTo_ShouldSetVersionDescription_WhenVersionIsProvided()
    {
        // Arrange
        var version = new Version(1, 2, 3);
        _applicationInfoServiceMock.Setup(x => x.GetVersion()).Returns(version);
        var viewModel = CreateViewModel();

        // Act
        viewModel.OnNavigatedTo(null);

        // Assert
        viewModel.VersionDescription.Should().Be($"CleanMyPosts - {version}");
    }

    [Fact]
    public void SetThemeCommand_ShouldInvokeThemeService_WithCorrectTheme()
    {
        // Arrange
        var viewModel = CreateViewModel();

        // Act
        viewModel.SetThemeCommand.Execute(AppTheme.Light.ToString());

        // Assert
        _themeSelectorServiceMock.Verify(x => x.SetTheme(AppTheme.Light), Times.Once);
    }
}
