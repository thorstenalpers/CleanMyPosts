using System.Windows.Controls;
using CleanMyPosts.UI.ViewModels;

namespace CleanMyPosts.UI.Views;
/// <summary>
/// Interaction logic for LogView.xaml
/// </summary>
public partial class LogPage : Page
{

    public LogPage(LogViewModel viewModel)
    {
        InitializeComponent();
        DataContext = viewModel;
    }
}
