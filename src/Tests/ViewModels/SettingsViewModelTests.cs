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
    private readonly Mock<IUserSettingsService> _userSettingsServiceMock = new();
    private readonly Mock<IUpdateService> _updateServiceMock = new();
    private readonly Mock<ILogger<SettingsViewModel>> _loggerMock = new();

    private SettingsViewModel CreateViewModel() =>
        new(_loggerMock.Object,
            _userSettingsServiceMock.Object,
            _updateServiceMock.Object);

    [Fact]
    public void OnNavigatedTo_ShouldSetCurrentTheme_WhenThemeServiceReturnsTheme()
    {
        // Arrange
        _userSettingsServiceMock.Setup(x => x.GetCurrentTheme()).Returns(AppTheme.Light);
        var viewModel = CreateViewModel();

        // Act
        viewModel.OnNavigatedTo(null);

        // Assert
        viewModel.Theme.Should().Be(AppTheme.Light);
    }

    [Fact]
    public void SetThemeCommand_ShouldInvokeThemeService_WithCorrectTheme()
    {
        // Arrange
        var viewModel = CreateViewModel();

        // Act
        viewModel.SetThemeCommand.Execute(AppTheme.Light.ToString());

        // Assert
        _userSettingsServiceMock.Verify(x => x.SetTheme(AppTheme.Light), Times.Once);
    }
}
