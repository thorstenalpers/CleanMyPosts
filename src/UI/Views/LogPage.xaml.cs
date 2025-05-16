using System.Windows.Controls;
using XTweetCleaner.UI.ViewModels;

namespace XTweetCleaner.UI.Views;
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
