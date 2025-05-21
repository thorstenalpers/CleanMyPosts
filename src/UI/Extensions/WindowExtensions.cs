using System.Windows;
using System.Windows.Controls;

namespace CleanMyPosts.UI.Extensions;

public static class WindowExtensions
{
    public static object GetDataContext(this Window window)
    {
        return window.Content is Frame frame ? frame.GetDataContext() : null;
    }
}
