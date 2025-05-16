using System.Windows;
using System.Windows.Controls;
using System.Windows.Navigation;
using MahApps.Metro.Controls;
using XTweetCleaner.UI.Contracts.Services;
using XTweetCleaner.UI.Contracts.ViewModels;
using XTweetCleaner.UI.Contracts.Views;
using XTweetCleaner.UI.Helpers;

namespace XTweetCleaner.UI.Services;

public class WindowManagerService(IServiceProvider serviceProvider, IPageService pageService) : IWindowManagerService
{
    private readonly IServiceProvider _serviceProvider = serviceProvider;
    private readonly IPageService _pageService = pageService;
    public Window MainWindow => Application.Current.MainWindow;

    public void OpenInNewWindow(string key, object parameter = null)
    {
        var existingWindow = GetWindow(key);
        if (existingWindow is not null)
        {
            existingWindow.Activate();
            return;
        }

        var frame = new Frame
        {
            Focusable = false,
            NavigationUIVisibility = NavigationUIVisibility.Hidden
        };

        var newWindow = new MetroWindow
        {
            Title = "X-Tweet-Cleaner",
            Style = Application.Current.FindResource("CustomMetroWindow") as Style,
            Content = frame
        };

        frame.Navigated += OnNavigated;
        newWindow.Closed += OnWindowClosed;
        frame.Navigate(_pageService.GetPage(key), parameter);
        newWindow.Show();
    }

    public bool? OpenInDialog(string key, object parameter = null)
    {
        if (_serviceProvider.GetService(typeof(IShellDialogWindow)) is not IShellDialogWindow shellWindow)
        {
            return null;
        }

        var frame = shellWindow.GetDialogFrame();
        frame.Navigated += OnNavigated;

        ((Window)shellWindow).Closed += OnWindowClosed;
        frame.Navigate(_pageService.GetPage(key), parameter);

        return ((Window)shellWindow).ShowDialog();
    }

    public Window GetWindow(string key)
    {
        foreach (Window window in Application.Current.Windows)
        {
            var dataContext = window.GetDataContext();
            if (dataContext?.GetType().FullName == key)
            {
                return window;
            }
        }
        return null;
    }

    private void OnNavigated(object sender, NavigationEventArgs e)
    {
        if (sender is Frame frame &&
            frame.GetDataContext() is INavigationAware navigationAware)
        {
            navigationAware.OnNavigatedTo(e.ExtraData);
        }
    }

    private void OnWindowClosed(object sender, EventArgs e)
    {
        if (sender is Window window && window.Content is Frame frame)
        {
            frame.Navigated -= OnNavigated;
            window.Closed -= OnWindowClosed;
        }
    }
}