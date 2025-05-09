using System.Windows.Controls;

namespace XTweetCleaner.UI.Contracts.Views;

public interface IShellWindow
{
    Frame GetNavigationFrame();

    void ShowWindow();

    void CloseWindow();
}
