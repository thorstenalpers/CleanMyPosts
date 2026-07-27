using System.Windows;
using Microsoft.Extensions.Hosting;
using CleanMyPosts.Settings;

namespace CleanMyPosts.Hosting;

public class ApplicationHostService(
    IServiceProvider serviceProvider,
    IUserSettingsService userSettingsService) : IHostedService
{
    private readonly IServiceProvider _serviceProvider = serviceProvider;
    private readonly IUserSettingsService _userSettingsService = userSettingsService;
    private bool _isInitialized;

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        await InitializeAsync();
        ShowShellWindow();
        _isInitialized = true;
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        _userSettingsService.PersistData();
        return Task.CompletedTask;
    }

    private async Task InitializeAsync()
    {
        if (!_isInitialized)
        {
            _userSettingsService.RestoreData();
            _userSettingsService.Initialize();
            await Task.CompletedTask;
        }
    }

    private void ShowShellWindow()
    {
        if (!Application.Current.Windows.OfType<IShellWindow>().Any())
        {
            var shellWindow = _serviceProvider.GetService(typeof(IShellWindow)) as IShellWindow;
            shellWindow?.ShowWindow();
        }
    }
}
