using System.Runtime.InteropServices;
using Microsoft.UI;
using Microsoft.UI.Windowing;

namespace CleanMyPosts.Infrastructure;

public static partial class NativeMethods
{
    private const uint MbIconError = 0x00000010;

    // The resource id MSBuild assigns to <ApplicationIcon>.
    private const int MainIconResourceId = 32512;

    /// <summary>
    /// Used only on start-up failure paths, where no window — and therefore no
    /// <c>XamlRoot</c> for a ContentDialog — exists yet.
    /// </summary>
    public static void ShowError(string message, string caption) =>
        MessageBox(IntPtr.Zero, message, caption, MbIconError);

    /// <summary>Reuses the icon already compiled into the executable, so no loose .ico has to ship.</summary>
    public static void ApplyExecutableIcon(AppWindow appWindow)
    {
        var icon = LoadIcon(GetModuleHandle(null), MainIconResourceId);
        if (icon != IntPtr.Zero)
        {
            appWindow.SetIcon(Win32Interop.GetIconIdFromIcon(icon));
        }
    }

    [LibraryImport("user32.dll", EntryPoint = "MessageBoxW", StringMarshalling = StringMarshalling.Utf16)]
    private static partial int MessageBox(IntPtr hWnd, string text, string caption, uint type);

    [LibraryImport("user32.dll", EntryPoint = "LoadIconW")]
    private static partial IntPtr LoadIcon(IntPtr hInstance, IntPtr lpIconName);

    [LibraryImport("kernel32.dll", EntryPoint = "GetModuleHandleW", StringMarshalling = StringMarshalling.Utf16)]
    private static partial IntPtr GetModuleHandle(string? lpModuleName);
}
