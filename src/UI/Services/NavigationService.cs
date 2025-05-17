using System.Windows.Controls;
using System.Windows.Navigation;
using CleanMyPosts.UI.Contracts.Services;
using CleanMyPosts.UI.Contracts.ViewModels;
using CleanMyPosts.UI.Helpers;

namespace CleanMyPosts.UI.Services;

public class NavigationService(IPageService pageService) : INavigationService
{
    private readonly IPageService _pageService = pageService;
    private Frame _frame;
    private object _lastParameterUsed;
    public event EventHandler<string> Navigated;
    public bool CanGoBack => _frame.CanGoBack;

    public void Initialize(Frame shellFrame)
    {
        if (_frame == null)
        {
            _frame = shellFrame;
            _frame.Navigated += OnNavigated;
        }
    }

    public void UnsubscribeNavigation()
    {
        _frame.Navigated -= OnNavigated;
        _frame = null;
    }

    public void GoBack()
    {
        if (_frame.CanGoBack)
        {
            _frame.GoBack();
        }
    }

    public bool NavigateTo(string pageKey, object parameter = null, bool clearNavigation = false)
    {
        var pageType = _pageService.GetPageType(pageKey);

        if (_frame.Content?.GetType() != pageType || parameter != null && !parameter.Equals(_lastParameterUsed))
        {
            _frame.Tag = clearNavigation;
            var page = _pageService.GetPage(pageKey);
            var navigated = _frame.Navigate(page, parameter);
            if (navigated)
            {
                _lastParameterUsed = parameter;
            }
            return navigated;
        }
        return false;
    }

    public void CleanNavigation()
        => _frame.CleanNavigation();

    private void OnNavigated(object sender, NavigationEventArgs e)
    {
        if (sender is Frame frame)
        {
            var clearNavigation = (bool)frame.Tag;
            if (clearNavigation)
            {
                frame.CleanNavigation();
            }

            var dataContext = frame.GetDataContext();
            if (dataContext is INavigationAware navigationAware)
            {
                navigationAware.OnNavigatedTo(e.ExtraData);
            }
            Navigated?.Invoke(sender, dataContext.GetType().FullName);
        }
    }
}
