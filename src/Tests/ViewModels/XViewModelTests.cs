using System.Reflection;
using CleanMyPosts.Contracts.Services;
using CleanMyPosts.Models;
using CleanMyPosts.ViewModels;
using CommunityToolkit.Mvvm.Input;
using MahApps.Metro.Controls.Dialogs;
using Microsoft.Extensions.Logging;
using Microsoft.Web.WebView2.Wpf;
using Moq;
using Xunit;

namespace CleanMyPosts.Tests.ViewModels;

[Trait("Category", "Unit")]
public class XViewModelTests
{
    private readonly Mock<AppConfig> _appConfigMock;
    private readonly Mock<IDialogCoordinator> _dialogCoordinatorMock;
    private readonly Mock<ILogger<XViewModel>> _loggerMock;
    private readonly Mock<IUserSettingsService> _userSettingsServiceMock;
    private readonly Mock<IWebViewHostService> _webViewHostServiceMock;
    private readonly Mock<IXScriptService> _xWebViewScriptServiceMock;

    public XViewModelTests()
    {
        _webViewHostServiceMock = new Mock<IWebViewHostService>();
        _loggerMock = new Mock<ILogger<XViewModel>>();
        _userSettingsServiceMock = new Mock<IUserSettingsService>();
        _xWebViewScriptServiceMock = new Mock<IXScriptService>();
        _dialogCoordinatorMock = new Mock<IDialogCoordinator>();
        _appConfigMock = new Mock<AppConfig>();
    }

    private XViewModel CreateViewModel()
    {
        return new XViewModel(
            _loggerMock.Object,
            _userSettingsServiceMock.Object,
            _webViewHostServiceMock.Object,
            _dialogCoordinatorMock.Object,
            _appConfigMock.Object,
            _xWebViewScriptServiceMock.Object
        );
    }

    private static void InvokePrivateMethod(object obj, string methodName, params object[] parameters)
    {
        var method = obj.GetType().GetMethod(methodName, BindingFlags.NonPublic | BindingFlags.Instance);
        method.Invoke(obj, parameters);
    }

    [StaFact]
    public async Task OnNavigationCompleted_UserLoggedIn_EnablesButtons()
    {
        var viewModel = CreateViewModel();
        _xWebViewScriptServiceMock.SetupSequence(x => x.GetUserNameAsync())
            .ReturnsAsync((string)null)
            .ReturnsAsync("user");

        var args = new NavigationCompletedEventArgs { IsSuccess = true };

        await viewModel.InitializeAsync(new WebView2());
        InvokePrivateMethod(viewModel, "OnNavigationCompleted", this, args);

        await Task.Delay(600); // Wait for async handler

        Assert.True(viewModel.AreButtonsEnabled);
    }

    [Fact]
    public void OnWebMessageReceived_LogsErrorWarningInfo()
    {
        var viewModel = CreateViewModel();
        var errorMsg = "{\"level\":\"error\",\"message\":\"err\"}";
        var warnMsg = "{\"level\":\"warning\",\"message\":\"warn\"}";
        var infoMsg = "{\"level\":\"info\",\"message\":\"info\"}";

        var errorArgs = new WebMessageReceivedEventArgs { Message = errorMsg };
        var warnArgs = new WebMessageReceivedEventArgs { Message = warnMsg };
        var infoArgs = new WebMessageReceivedEventArgs { Message = infoMsg };

        InvokePrivateMethod(viewModel, "OnWebMessageReceived", this, errorArgs);
        InvokePrivateMethod(viewModel, "OnWebMessageReceived", this, warnArgs);
        InvokePrivateMethod(viewModel, "OnWebMessageReceived", this, infoArgs);

        _loggerMock.Verify(l => l.Log(
            LogLevel.Error, It.IsAny<EventId>(), It.Is<It.IsAnyType>((v, t) => v.ToString().Contains("err")), null,
            It.IsAny<Func<It.IsAnyType, Exception, string>>()), Times.Once);
        _loggerMock.Verify(l => l.Log(
            LogLevel.Warning, It.IsAny<EventId>(), It.Is<It.IsAnyType>((v, t) => v.ToString().Contains("warn")), null,
            It.IsAny<Func<It.IsAnyType, Exception, string>>()), Times.Once);
        _loggerMock.Verify(l => l.Log(
            LogLevel.Information, It.IsAny<EventId>(), It.Is<It.IsAnyType>((v, t) => v.ToString().Contains("info")),
            null, It.IsAny<Func<It.IsAnyType, Exception, string>>()), Times.Once);
    }


    [StaFact]
    public async Task ShowPostsCommand_CallsShowPostsAsync_EnablesUserInteractions()
    {
        // Arrange
        var viewModel = CreateViewModel();
        var command = viewModel.GetType().GetProperty("ShowPostsCommand").GetValue(viewModel) as IAsyncRelayCommand;

        // Act
        await command.ExecuteAsync(null);

        // Assert
        _xWebViewScriptServiceMock.Verify(x => x.ShowPostsAsync(), Times.Once);
        Assert.True(viewModel.AreButtonsEnabled);
    }

    [StaFact]
    public async Task ShowLikesCommand_CallsShowLikesAsync_EnablesUserInteractions()
    {
        // Arrange
        var viewModel = CreateViewModel();
        var command = viewModel.GetType().GetProperty("ShowLikesCommand").GetValue(viewModel) as IAsyncRelayCommand;

        // Act
        await command.ExecuteAsync(null);

        // Assert
        _xWebViewScriptServiceMock.Verify(x => x.ShowLikesAsync(), Times.Once);
        Assert.True(viewModel.AreButtonsEnabled);
    }

    [StaFact]
    public async Task ShowFollowingCommand_CallsShowFollowingAsync_EnablesUserInteractions()
    {
        // Arrange
        var viewModel = CreateViewModel();
        var command = viewModel.GetType().GetProperty("ShowFollowingCommand").GetValue(viewModel) as IAsyncRelayCommand;

        // Act
        await command.ExecuteAsync(null);

        // Assert
        _xWebViewScriptServiceMock.Verify(x => x.ShowFollowingAsync(), Times.Once);
        Assert.True(viewModel.AreButtonsEnabled);
    }
}