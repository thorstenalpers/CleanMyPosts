using CleanMyPosts.Core.Contracts.Services;
using CleanMyPosts.UI.Models;
using CleanMyPosts.UI.Services;
using FluentAssertions;
using Moq;
using System.Windows;
using Xunit;

namespace CleanMyPosts.Tests.Services;

[Trait("Category", "Unit")]
public class UserSettingsServiceTests
{
    private readonly Mock<IFileService> _mockFileService;
    private readonly AppConfig _appConfig;
    private readonly UserSettingsService _userSettingsService;
    private readonly string _expectedSettingsPath;

    public UserSettingsServiceTests()
    {
        _mockFileService = new Mock<IFileService>();
        _appConfig = new AppConfig();
        _expectedSettingsPath = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            _appConfig.ConfigurationsFolder);
        _userSettingsService = new UserSettingsService(_mockFileService.Object, _appConfig);
    }

    [Fact]
    public void Initialize_ShouldLoadSettings_WhenCalled()
    {
        // Arrange
        var expectedSettings = new UserSettings
        {
            Theme = AppTheme.Dark,
            ShowLogs = true,
            ConfirmDeletion = false
        };
        _mockFileService.Setup(x => x.Read<UserSettings>(_expectedSettingsPath, _appConfig.AppPropertiesFileName))
                       .Returns(expectedSettings);

        // Act
        _userSettingsService.Initialize();

        // Assert
        _mockFileService.Verify(x => x.Read<UserSettings>(_expectedSettingsPath, _appConfig.AppPropertiesFileName), Times.Once);
        _userSettingsService.GetCurrentTheme().Should().Be(AppTheme.Dark);
        _userSettingsService.GetShowLogs().Should().BeTrue();
        _userSettingsService.GetConfirmDeletion().Should().BeFalse();
    }

    [Fact]
    public void Initialize_ShouldUseDefaultSettings_WhenFileServiceReturnsNull()
    {
        // Arrange
        _mockFileService.Setup(x => x.Read<UserSettings>(_expectedSettingsPath, _appConfig.AppPropertiesFileName))
                       .Returns((UserSettings)null);

        // Act
        _userSettingsService.Initialize();

        // Assert
        _userSettingsService.GetCurrentTheme().Should().Be(AppTheme.Default);
        _userSettingsService.GetShowLogs().Should().BeFalse();
        _userSettingsService.GetConfirmDeletion().Should().BeTrue();
    }

    [Fact]
    public void PersistData_ShouldSaveCurrentSettings()
    {
        // Arrange
        _mockFileService.Setup(x => x.Read<UserSettings>(_expectedSettingsPath, _appConfig.AppPropertiesFileName))
                       .Returns(new UserSettings());
        _userSettingsService.Initialize();

        // Act
        _userSettingsService.PersistData();

        // Assert
        _mockFileService.Verify(x => x.Save(_expectedSettingsPath, _appConfig.AppPropertiesFileName, It.IsAny<UserSettings>()), Times.Once);
    }

    [Fact]
    public void RestoreData_ShouldReloadSettings()
    {
        // Arrange
        var initialSettings = new UserSettings { Theme = AppTheme.Light };
        var restoredSettings = new UserSettings { Theme = AppTheme.Dark };
        
        _mockFileService.SetupSequence(x => x.Read<UserSettings>(_expectedSettingsPath, _appConfig.AppPropertiesFileName))
                       .Returns(initialSettings)
                       .Returns(restoredSettings);
        
        _userSettingsService.Initialize();
        _userSettingsService.GetCurrentTheme().Should().Be(AppTheme.Light);

        // Act
        _userSettingsService.RestoreData();

        // Assert
        _userSettingsService.GetCurrentTheme().Should().Be(AppTheme.Dark);
    }

    [Fact]
    public void SetTheme_ShouldUpdateThemeAndTriggerEvent()
    {
        // Arrange
        _mockFileService.Setup(x => x.Read<UserSettings>(_expectedSettingsPath, _appConfig.AppPropertiesFileName))
                       .Returns(new UserSettings());
        _userSettingsService.Initialize();

        string eventArg = null;
        _userSettingsService.SettingChanged += (sender, arg) => eventArg = arg;

        // Act
        _userSettingsService.SetTheme(AppTheme.Dark);

        // Assert
        _userSettingsService.GetCurrentTheme().Should().Be(AppTheme.Dark);
        eventArg.Should().Be(nameof(UserSettings.Theme));
        _mockFileService.Verify(x => x.Save(_expectedSettingsPath, _appConfig.AppPropertiesFileName, It.IsAny<UserSettings>()), Times.Once);
    }

    [Fact]
    public void SetShowLogs_ShouldUpdateSettingAndTriggerEvent()
    {
        // Arrange
        _mockFileService.Setup(x => x.Read<UserSettings>(_expectedSettingsPath, _appConfig.AppPropertiesFileName))
                       .Returns(new UserSettings());
        _userSettingsService.Initialize();

        string eventArg = null;
        _userSettingsService.SettingChanged += (sender, arg) => eventArg = arg;

        // Act
        _userSettingsService.SetShowLogs(true);

        // Assert
        _userSettingsService.GetShowLogs().Should().BeTrue();
        eventArg.Should().Be(nameof(UserSettings.ShowLogs));
    }

    [Fact]
    public void SetConfirmDeletion_ShouldUpdateSettingAndTriggerEvent()
    {
        // Arrange
        _mockFileService.Setup(x => x.Read<UserSettings>(_expectedSettingsPath, _appConfig.AppPropertiesFileName))
                       .Returns(new UserSettings());
        _userSettingsService.Initialize();

        string eventArg = null;
        _userSettingsService.SettingChanged += (sender, arg) => eventArg = arg;

        // Act
        _userSettingsService.SetConfirmDeletion(false);

        // Assert
        _userSettingsService.GetConfirmDeletion().Should().BeFalse();
        eventArg.Should().Be(nameof(UserSettings.ConfirmDeletion));
    }

    [Fact]
    public void GetSetting_ShouldReturnCorrectValue_ForTheme()
    {
        // Arrange
        _mockFileService.Setup(x => x.Read<UserSettings>(_expectedSettingsPath, _appConfig.AppPropertiesFileName))
                       .Returns(new UserSettings { Theme = AppTheme.Light });
        _userSettingsService.Initialize();

        // Act
        var result = _userSettingsService.GetSetting<AppTheme>(nameof(UserSettings.Theme));

        // Assert
        result.Should().Be(AppTheme.Light);
    }

    [Fact]
    public void GetSetting_ShouldReturnCorrectValue_ForShowLogs()
    {
        // Arrange
        _mockFileService.Setup(x => x.Read<UserSettings>(_expectedSettingsPath, _appConfig.AppPropertiesFileName))
                       .Returns(new UserSettings { ShowLogs = true });
        _userSettingsService.Initialize();

        // Act
        var result = _userSettingsService.GetSetting<bool>(nameof(UserSettings.ShowLogs));

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public void GetSetting_ShouldReturnCorrectValue_ForConfirmDeletion()
    {
        // Arrange
        _mockFileService.Setup(x => x.Read<UserSettings>(_expectedSettingsPath, _appConfig.AppPropertiesFileName))
                       .Returns(new UserSettings { ConfirmDeletion = false });
        _userSettingsService.Initialize();

        // Act
        var result = _userSettingsService.GetSetting<bool>(nameof(UserSettings.ConfirmDeletion));

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public void GetSetting_ShouldReturnDefaultValue_ForUnknownKey()
    {
        // Arrange
        _mockFileService.Setup(x => x.Read<UserSettings>(_expectedSettingsPath, _appConfig.AppPropertiesFileName))
                       .Returns(new UserSettings());
        _userSettingsService.Initialize();

        // Act
        var result = _userSettingsService.GetSetting("UnknownKey", "DefaultValue");

        // Assert
        result.Should().Be("DefaultValue");
    }

    [Fact]
    public void GetWindowSettings_ShouldReturnLoadedSettings()
    {
        // Arrange
        var expectedSettings = new WindowSettings
        {
            Top = 200,
            Left = 300,
            Width = 1000,
            Height = 800,
            WindowState = WindowState.Maximized
        };
        _mockFileService.Setup(x => x.Read<WindowSettings>(_expectedSettingsPath, "WindowSettings.json"))
                       .Returns(expectedSettings);

        // Act
        var result = _userSettingsService.GetWindowSettings();

        // Assert
        result.Should().BeEquivalentTo(expectedSettings);
    }

    [Fact]
    public void GetWindowSettings_ShouldReturnDefaultSettings_WhenFileServiceReturnsNull()
    {
        // Arrange
        _mockFileService.Setup(x => x.Read<WindowSettings>(_expectedSettingsPath, "WindowSettings.json"))
                       .Returns((WindowSettings)null);

        // Act
        var result = _userSettingsService.GetWindowSettings();

        // Assert
        result.Should().NotBeNull();
        result.Top.Should().Be(100);
        result.Left.Should().Be(100);
        result.Width.Should().Be(860);
        result.Height.Should().Be(600);
        result.WindowState.Should().Be(WindowState.Normal);
    }

    [Fact]
    public void SaveWindowsSettings_ShouldCallFileServiceSave()
    {
        // Arrange
        var settings = new WindowSettings
        {
            Top = 150,
            Left = 250,
            Width = 900,
            Height = 700,
            WindowState = WindowState.Minimized
        };

        // Act
        _userSettingsService.SaveWindowsSettings(settings);

        // Assert
        _mockFileService.Verify(x => x.Save(_expectedSettingsPath, "WindowSettings.json", settings), Times.Once);
    }

    [Fact]
    public void GetTimeoutSettings_ShouldReturnLoadedSettings()
    {
        // Arrange
        var expectedSettings = new TimeoutSettings
        {
            WaitAfterDelete = 1000,
            WaitBetweenRetryDeleteAttempts = 750,
            WaitAfterDocumentLoad = 5000
        };
        _mockFileService.Setup(x => x.Read<TimeoutSettings>(_expectedSettingsPath, "timeoutSettings.json"))
                       .Returns(expectedSettings);

        // Act
        var result = _userSettingsService.GetTimeoutSettings();

        // Assert
        result.Should().BeEquivalentTo(expectedSettings);
    }

    [Fact]
    public void GetTimeoutSettings_ShouldReturnDefaultSettings_WhenFileServiceReturnsNull()
    {
        // Arrange
        _mockFileService.Setup(x => x.Read<TimeoutSettings>(_expectedSettingsPath, "timeoutSettings.json"))
                       .Returns((TimeoutSettings)null);

        // Act
        var result = _userSettingsService.GetTimeoutSettings();

        // Assert
        result.Should().NotBeNull();
        result.WaitAfterDelete.Should().Be(500);
        result.WaitBetweenRetryDeleteAttempts.Should().Be(500);
        result.WaitAfterDocumentLoad.Should().Be(3000);
    }

    [Fact]
    public void SaveTimeoutSettings_ShouldCallFileServiceSave()
    {
        // Arrange
        var settings = new TimeoutSettings
        {
            WaitAfterDelete = 800,
            WaitBetweenRetryDeleteAttempts = 600,
            WaitAfterDocumentLoad = 4000
        };

        // Act
        _userSettingsService.SaveTimeoutSettings(settings);

        // Assert
        _mockFileService.Verify(x => x.Save(_expectedSettingsPath, "timeoutSettings.json", settings), Times.Once);
    }

    [Fact]
    public void GetCurrentTheme_ShouldReturnCurrentTheme_AfterInitialization()
    {
        // Arrange
        _mockFileService.Setup(x => x.Read<UserSettings>(_expectedSettingsPath, _appConfig.AppPropertiesFileName))
                       .Returns(new UserSettings { Theme = AppTheme.Light });

        // Act
        _userSettingsService.Initialize();
        var result = _userSettingsService.GetCurrentTheme();

        // Assert
        result.Should().Be(AppTheme.Light);
    }

    [Fact]
    public void GetShowLogs_ShouldReturnCurrentValue_AfterInitialization()
    {
        // Arrange
        _mockFileService.Setup(x => x.Read<UserSettings>(_expectedSettingsPath, _appConfig.AppPropertiesFileName))
                       .Returns(new UserSettings { ShowLogs = true });

        // Act
        _userSettingsService.Initialize();
        var result = _userSettingsService.GetShowLogs();

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public void GetConfirmDeletion_ShouldReturnCurrentValue_AfterInitialization()
    {
        // Arrange
        _mockFileService.Setup(x => x.Read<UserSettings>(_expectedSettingsPath, _appConfig.AppPropertiesFileName))
                       .Returns(new UserSettings { ConfirmDeletion = false });

        // Act
        _userSettingsService.Initialize();
        var result = _userSettingsService.GetConfirmDeletion();

        // Assert
        result.Should().BeFalse();
    }
}