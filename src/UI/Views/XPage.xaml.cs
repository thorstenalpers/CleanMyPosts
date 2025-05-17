using System.Windows;
using System.Windows.Controls;
using CleanMyPosts.UI.ViewModels;

namespace CleanMyPosts.UI.Views;

public partial class XPage : Page
{
    private readonly XViewModel _viewModel;

    public XPage(XViewModel viewModel)
    {
        InitializeComponent();
        _viewModel = viewModel;

        DataContext = viewModel;
        Loaded += Page_LoadedAsync;
    }

    private async void Page_LoadedAsync(object sender, RoutedEventArgs e)
    {
        await _viewModel.InitializeAsync(webView);
    }
}
