using System.Windows;
using System.Windows.Input;

namespace CleanMyPosts.UI.Views;

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