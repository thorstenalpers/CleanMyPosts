using System.Windows;
using System.Windows.Controls;

namespace XTweetCleaner.UI.Helpers;

public static class FrameExtensions
{
    public static object GetDataContext(this Frame frame)
    {
        if (frame.Content is FrameworkElement element)
        {
            return element.DataContext;
        }

        return null;
    }

    public static void CleanNavigation(this Frame frame)
    {
        while (frame.CanGoBack)
        {
            frame.RemoveBackEntry();
        }
    }
}
