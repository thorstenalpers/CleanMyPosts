using System.Windows.Controls;
using MahApps.Metro.Controls;
using CleanMyPosts.UI.Contracts.Views;
using CleanMyPosts.UI.ViewModels;

namespace CleanMyPosts.UI.Views;

public partial class ShellDialogWindow : MetroWindow, IShellDialogWindow
{
    public ShellDialogWindow(ShellDialogViewModel viewModel)
    {
        InitializeComponent();
        viewModel.SetResult = OnSetResult;
        DataContext = viewModel;
    }

    public Frame GetDialogFrame()
        => dialogFrame;

    private void OnSetResult(bool? result)
    {
        DialogResult = result;
        Close();
    }
}
