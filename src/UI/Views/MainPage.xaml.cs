using System.Windows;
using System.Windows.Controls;
using CleanMyPosts.UI.ViewModels;

namespace CleanMyPosts.UI.Views;

public partial class MainPage : Page
{
    private readonly MainViewModel _viewModel;

    public MainPage(MainViewModel viewModel)
    {
        InitializeComponent();
        _viewModel = viewModel;

        DataContext = viewModel;
        Loaded += MainPage_LoadedAsync;
    }

    private async void MainPage_LoadedAsync(object sender, RoutedEventArgs e)
    {
        await _viewModel.InitializeAsync(webView);
    }
}
