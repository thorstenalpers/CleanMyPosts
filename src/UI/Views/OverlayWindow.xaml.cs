using System.Windows;
using System.Windows.Input;

namespace CleanMyPosts.UI.Views;
/// <summary>
/// Interaction logic for OverlayWindow.xaml
/// </summary>
public partial class OverlayWindow : Window
{
    public OverlayWindow()
    {
        InitializeComponent();
    }

    private void Window_MouseDown(object sender, MouseButtonEventArgs e)
    {
        if (e.LeftButton == MouseButtonState.Pressed)
        {
            var mainWindow = this.Owner;
            if (mainWindow != null)
            {
                try
                {
                    // Try dragging the main window instead
                    mainWindow.DragMove();
                }
                catch (InvalidOperationException)
                {
                    // DragMove can throw if mouse not down properly
                }
            }
        }
    }
}