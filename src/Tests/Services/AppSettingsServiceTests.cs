using System.Windows;
using CleanMyPosts.UI.Services;
using FluentAssertions;
using Xunit;

namespace CleanMyPosts.Tests.Services;

[Trait("Category", "Unit")]
public class AppSettingsServiceTests
{
    public AppSettingsServiceTests()
    {
        // Ensure Application.Current exists for testing
        if (Application.Current == null)
        {
            new Application(); // WPF Application instance required for Application.Current.Properties
        }

        Application.Current.Properties.Clear(); // Clean state before each test
    }

    [Fact]
    public void SetShowLogs_ShouldStoreValueInApplicationProperties()
    {
        // Arrange
        var service = new AppSettingsService();

        // Act
        service.SetShowLogs(true);

        // Assert
        Application.Current.Properties.Contains("ShowLogs").Should().BeTrue();
        Application.Current.Properties["ShowLogs"].Should().Be(true);
    }

    [Fact]
    public void GetShowLogs_ShouldReturnTrueWhenSet()
    {
        // Arrange
        var service = new AppSettingsService();
        service.SetShowLogs(true);

        // Act
        var result = service.GetShowLogs();

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public void GetShowLogs_ShouldReturnFalseWhenNotSet()
    {
        // Arrange
        var service = new AppSettingsService();

        // Act
        var result = service.GetShowLogs();

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public void SetShowLogs_ShouldTriggerSettingChangedEvent()
    {
        // Arrange
        var service = new AppSettingsService();
        string eventKey = null;
        service.SettingChanged += (sender, key) => eventKey = key;

        // Act
        service.SetShowLogs(true);

        // Assert
        eventKey.Should().Be("ShowLogs");
    }
}