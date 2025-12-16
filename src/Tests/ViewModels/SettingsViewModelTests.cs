using CleanMyPosts.Contracts.Services;
using CleanMyPosts.Models;
using CleanMyPosts.ViewModels;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace CleanMyPosts.Tests.ViewModels;

[Trait("Category", "Unit")]
public class SettingsViewModelTests
{
    private readonly Mock<IUserSettingsService> _userSettingsServiceMock = new();
    private readonly Mock<UpdaterConfig> _updaterConfigMock = new();
    private readonly Mock<AppConfig> _appConfigMock = new();
    private readonly Mock<ILogger<SettingsViewModel>> _loggerMock = new();

    private SettingsViewModel CreateViewModel() =>
        new(_loggerMock.Object,
            _updaterConfigMock.Object,
            _appConfigMock.Object,
            _userSettingsServiceMock.Object);

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
