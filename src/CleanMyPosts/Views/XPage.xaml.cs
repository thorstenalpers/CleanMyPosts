using System.Windows;
using System.Windows.Controls;
using CleanMyPosts.ViewModels;
using MahApps.Metro.Controls.Dialogs;

namespace CleanMyPosts.Views;

public partial class XPage : Page
{
    private readonly XViewModel _viewModel;

    public XPage(XViewModel viewModel)
    {
        foreach (var key in Application.Current.Resources.Keys)
        {
            Console.WriteLine(key);
        }
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
