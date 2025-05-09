using System.Windows.Controls;
using MahApps.Metro.Controls;
using XTweetCleaner.UI.Contracts.Views;
using XTweetCleaner.UI.ViewModels;

namespace XTweetCleaner.UI.Views;

public partial class ShellWindow : MetroWindow, IShellWindow
{
    public ShellWindow(ShellViewModel viewModel)
    {
        InitializeComponent();
        DataContext = viewModel;
    }

    public Frame GetNavigationFrame()
        => shellFrame;

    public void ShowWindow()
        => Show();

    public void CloseWindow()
        => Close();
}
