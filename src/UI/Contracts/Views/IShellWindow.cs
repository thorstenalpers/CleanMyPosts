using System.Windows.Controls;

namespace CleanMyPosts.UI.Contracts.Views;

public interface IShellWindow
{
    Frame GetNavigationFrame();
    void ShowWindow();
    void CloseWindow();
}
