using System.Windows;
using System.Windows.Controls;
using System.Windows.Threading;
using CleanMyPosts.Extensions;
using FluentAssertions;
using Xunit;

namespace CleanMyPosts.Tests.Extensions;

[Trait("Category", "Unit")]
public class FrameExtensionsTests
{
    [StaFact]
    public void GetDataContext_WhenContentIsFrameworkElement_ReturnsDataContext()
    {
        object result = null;
        var thread = new Thread(() =>
        {
            var frame = new Frame();
            var element = new Grid();
            var expectedDataContext = new object();
            element.DataContext = expectedDataContext;

            var window = new Window
            {
                Content = frame,
                Width = 200,
                Height = 200,
                ShowInTaskbar = false,
                WindowStyle = WindowStyle.None
            };

            window.Show();

            frame.Content = element;

            // Force dispatcher to process
            Dispatcher.CurrentDispatcher.Invoke(() => { }, DispatcherPriority.ApplicationIdle);

            result = frame.GetDataContext();

            window.Close();
            Dispatcher.CurrentDispatcher.InvokeShutdown();
        });

        thread.SetApartmentState(ApartmentState.STA);
        thread.Start();
        thread.Join();

        result.Should().NotBeNull();
    }

    [StaFact]
    public void GetDataContext_WhenContentIsNotFrameworkElement_ReturnsNull()
    {
        // Arrange
        var frame = new Frame();
        frame.Content = new object();

        // Act
        var dataContext = frame.GetDataContext();

        // Assert
        dataContext.Should().BeNull();
    }
}