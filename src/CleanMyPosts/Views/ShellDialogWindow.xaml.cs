using System.Windows.Controls;
using CleanMyPosts.Contracts.Views;
using CleanMyPosts.ViewModels;
using MahApps.Metro.Controls;

namespace CleanMyPosts.Views;

public partial class ShellDialogWindow : MetroWindow, IShellDialogWindow
{
    public ShellDialogWindow(ShellDialogViewModel viewModel)
    {
        InitializeComponent();
        viewModel.SetResult = OnSetResult;
        DataContext = viewModel;
    }

    public Frame GetDialogFrame()
    {
        return dialogFrame;
    }

    private void OnSetResult(bool? result)
    {
        DialogResult = result;
        Close();
    }
}