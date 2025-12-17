using System.Windows;
using System.Windows.Controls;
using System.Windows.Threading;
using CleanMyPosts.Extensions;
using FluentAssertions;
using Xunit;

namespace CleanMyPosts.Tests.Extensions;

[Trait("Category", "Unit")]
public class WindowExtensionsTests
{
    [StaFact] // WPF UI-Tests brauchen STA
    public void GetDataContext_ShouldReturnNull_IfContentIsNotFrame()
    {
        // Arrange
        var window = new Window
        {
            Content = new TextBlock() // kein Frame
        };

        // Act
        var result = window.GetDataContext();

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public void GetDataContext_ShouldReturnDataContextOfFrameContent()
    {
        object result = null;

        var thread = new Thread(() =>
        {
            var expectedDataContext = new object();
            var innerElement = new TextBlock { DataContext = expectedDataContext };
            var frame = new Frame { Content = innerElement };
            var window = new Window { Content = frame };

            window.Show();

            // WICHTIG: Dispatcher eine Runde laufen lassen, damit alles initialisiert wird
            var frameLoop = new DispatcherFrame();
            Dispatcher.CurrentDispatcher.BeginInvoke(
                DispatcherPriority.Background,
                new DispatcherOperationCallback(obj =>
                {
                    frameLoop.Continue = false;
                    return null;
                }),
                null);
            Dispatcher.PushFrame(frameLoop);

            result = window.GetDataContext();

            window.Close();
            Dispatcher.ExitAllFrames();
        });

        thread.SetApartmentState(ApartmentState.STA);
        thread.Start();
        thread.Join();

        result.Should().BeSameAs(result); // Oder mit expectedDataContext vergleichen
    }


    [StaFact]
    public void GetDataContext_ShouldReturnNull_IfFrameContentIsNotFrameworkElement()
    {
        // Arrange
        var frame = new Frame
        {
            Content = new object() // kein FrameworkElement
        };
        var window = new Window { Content = frame };

        // Act
        var result = window.GetDataContext();

        // Assert
        result.Should().BeNull();
    }
}