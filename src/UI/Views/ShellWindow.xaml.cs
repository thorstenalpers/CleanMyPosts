using System.Windows.Controls;
using MahApps.Metro.Controls;
using CleanMyPosts.UI.Contracts.Views;
using CleanMyPosts.UI.ViewModels;

namespace CleanMyPosts.UI.Views;

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
