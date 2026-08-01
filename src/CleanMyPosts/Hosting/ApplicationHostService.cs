using CleanMyPosts.Settings;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace CleanMyPosts.Hosting;

public class ApplicationHostService(
    IServiceProvider serviceProvider,
    IUserSettingsService userSettingsService) : IHostedService
{
    public Task StartAsync(CancellationToken cancellationToken)
    {
        userSettingsService.Initialize();
        serviceProvider.GetRequiredService<IShellWindow>().ShowWindow();
        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        userSettingsService.PersistData();
        return Task.CompletedTask;
    }
}
