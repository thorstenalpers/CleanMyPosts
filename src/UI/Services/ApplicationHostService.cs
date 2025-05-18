using CleanMyPosts.UI.Contracts.Activation;
using CleanMyPosts.UI.Contracts.Services;
using CleanMyPosts.UI.Contracts.Views;
using CleanMyPosts.UI.ViewModels;
using Microsoft.Extensions.Hosting;

namespace CleanMyPosts.UI.Services;

public class ApplicationHostService(IServiceProvider serviceProvider,
                                    IEnumerable<IActivationHandler> activationHandlers,
                                    INavigationService navigationService,
                                    IThemeSelectorService themeSelectorService,
                                    IPersistAndRestoreService persistAndRestoreService) : IHostedService
{
    private readonly IServiceProvider _serviceProvider = serviceProvider;
    private readonly INavigationService _navigationService = navigationService;
    private readonly IPersistAndRestoreService _persistAndRestoreService = persistAndRestoreService;
    private readonly IThemeSelectorService _themeSelectorService = themeSelectorService;
    private readonly IEnumerable<IActivationHandler> _activationHandlers = activationHandlers;
    private bool _isInitialized;

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        await InitializeAsync();
        await HandleActivationAsync();
        await StartupAsync();
        _isInitialized = true;
    }

    public async Task StopAsync(CancellationToken cancellationToken)
    {
        _persistAndRestoreService.PersistData();
        await Task.CompletedTask;
    }

    private async Task InitializeAsync()
    {
        if (!_isInitialized)
        {
            _persistAndRestoreService.RestoreData();
            _themeSelectorService.InitializeTheme();
            await Task.CompletedTask;
        }
    }

    private async Task StartupAsync()
    {
        if (!_isInitialized)
        {
            await Task.CompletedTask;
        }
    }

    private async Task HandleActivationAsync()
    {
        var activationHandler = _activationHandlers.FirstOrDefault(h => h.CanHandle());

        if (activationHandler != null)
        {
            await activationHandler.HandleAsync();
        }

        await Task.CompletedTask;

        if (!System.Windows.Application.Current.Windows.OfType<IShellWindow>().Any())
        {
            var shellWindow = _serviceProvider.GetService(typeof(IShellWindow)) as IShellWindow;
            _navigationService.Initialize(shellWindow.GetNavigationFrame());
            shellWindow.ShowWindow();
            _navigationService.NavigateTo(typeof(XViewModel).FullName);
            await Task.CompletedTask;
        }
    }
}
