using System.Windows.Controls;
using CleanMyPosts.ViewModels;

namespace CleanMyPosts.Views;

public partial class SettingsPage : Page
{
    public SettingsPage(SettingsViewModel viewModel)
    {
        InitializeComponent();
        DataContext = viewModel;
    }
}
