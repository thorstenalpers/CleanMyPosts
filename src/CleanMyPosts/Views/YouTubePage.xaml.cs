using System.Windows;
using System.Windows.Controls;
using CleanMyPosts.ViewModels;
using MahApps.Metro.Controls.Dialogs;

namespace CleanMyPosts.Views;

public partial class YouTubePage : Page
{
    private readonly YouTubeViewModel _viewModel;

    public YouTubePage(YouTubeViewModel viewModel)
    {
        InitializeComponent();
        _viewModel = viewModel;
        DataContext = viewModel;
        DialogParticipation.SetRegister(this, viewModel);

        Loaded += Page_LoadedAsync;
    }

    private async void Page_LoadedAsync(object sender, RoutedEventArgs e)
    {
        await _viewModel.InitializeAsync(webView);
    }
}
