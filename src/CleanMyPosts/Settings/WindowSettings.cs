namespace CleanMyPosts.Settings;

/// <summary>Member names match the legacy WPF <c>WindowState</c> so existing files stay readable.</summary>
public enum ShellWindowState
{
    Normal,
    Minimized,
    Maximized
}

/// <summary>Physical pixels — <c>AppWindow</c> positions and sizes in device units, not DIPs.</summary>
public class WindowSettings
{
    public int Top { get; set; } = -1;
    public int Left { get; set; } = -1;
    public int Width { get; set; }
    public int Height { get; set; }
    public ShellWindowState WindowState { get; set; } = ShellWindowState.Normal;
}
