using System.Windows.Controls;
using XTweetCleaner.UI.ViewModels;

namespace XTweetCleaner.UI.Views;

public partial class SettingsPage : Page
{
    public SettingsPage(SettingsViewModel viewModel)
    {
        InitializeComponent();
        DataContext = viewModel;
    }
}
