using System.Windows;
using System.Windows.Input;

namespace CleanMyPosts.Views;

/// <summary>
// This window does not use MVVM because WebView2 renders as a separate HWND,
// which prevents WPF UserControls from appearing above it. A blocking overlay 
// must remain fully interactive and visually above the WebView2 content.
/// </summary>
public partial class OverlayPleaseWaitWindow : Window
{
    public OverlayPleaseWaitWindow()
    {
        InitializeComponent();
        ShowInTaskbar = false;
        Topmost = true;
    }

    public void ShowOverlay(bool hideOverlayUpdateProgress)
    {
        if (hideOverlayUpdateProgress)
        {
            Visibility = Visibility.Hidden;
        }
        Show();
        Activate();
    }

    private void Window_MouseDown(object sender, MouseButtonEventArgs e)
    {
        if (e.LeftButton == MouseButtonState.Pressed)
        {
            var mainWindow = Owner;
            if (mainWindow != null)
            {
                try
                {
                    mainWindow.DragMove();
                }
                catch (InvalidOperationException)
                {
                    // Ignore if DragMove fails
                }
            }
        }
    }
}