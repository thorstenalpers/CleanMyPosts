using System.Windows.Controls;

namespace CleanMyPosts.Contracts.Views;

public interface IShellWindow
{
    Frame GetNavigationFrame();
    void ShowWindow();
    void CloseWindow();
}