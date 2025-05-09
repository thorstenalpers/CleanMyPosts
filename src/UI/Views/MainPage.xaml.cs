using System.Windows.Controls;
using XTweetCleaner.UI.ViewModels;

namespace XTweetCleaner.UI.Views;

public partial class MainPage : Page
{
    private readonly MainViewModel _viewModel;

    public MainPage(MainViewModel viewModel)
    {
        InitializeComponent();
        DataContext = viewModel;
        _viewModel = viewModel;
        _viewModel.Initialize(webView);
    }
}
