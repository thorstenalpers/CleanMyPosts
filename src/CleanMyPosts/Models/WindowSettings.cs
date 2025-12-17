using System.Windows;

namespace CleanMyPosts.Models;

public class WindowSettings
{
    public double Top { get; set; } = 100;
    public double Left { get; set; } = 100;
    public double Width { get; set; } = 860;
    public double Height { get; set; } = 600;
    public WindowState WindowState { get; set; } = WindowState.Normal;
}