using CleanMyPosts.Core.Contracts.Services;
using CleanMyPosts.Core.Services;
using CleanMyPosts.UI.Contracts.Services;
using CleanMyPosts.UI.Contracts.Views;
using CleanMyPosts.UI.Models;
using CleanMyPosts.UI.ViewModels;
using CleanMyPosts.UI.Views;
using MahApps.Metro.Controls.Dialogs;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Serilog;

namespace CleanMyPosts.UI.Services;

public class HostService : IHostService
{
    public IHost BuildHost(string[] args, IConfiguration config, LogViewModel logViewModel)
    {
        var host = Host.CreateDefaultBuilder(args)
            .ConfigureAppConfiguration(c => c.AddConfiguration(config))
            .ConfigureServices((context, services) =>
            {
                services.AddSingleton(logViewModel);
                services.AddHostedService<ApplicationHostService>();

                services.AddSingleton(DialogCoordinator.Instance);
                services.AddSingleton<IFileService, FileService>();
                services.AddSingleton<IUserSettingsService, UserSettingsService>();

                services.AddSingleton<IWindowManagerService, WindowManagerService>();
                services.AddSingleton<IPageService, PageService>();
                services.AddSingleton<INavigationService, NavigationService>();
                services.AddSingleton<IXScriptService, XScriptService>();
                services.AddSingleton<IWebViewHostService, WebViewHostService>();
                services.AddSingleton<IDeploymentService, DeploymentService>();

                services.AddTransient<IShellWindow, ShellWindow>();
                services.AddTransient<ShellViewModel>();
                services.AddSingleton<LogPage>();
                services.AddSingleton<XViewModel>();
                services.AddSingleton<XPage>();

                services.AddTransient<SettingsViewModel>();
                services.AddTransient<SettingsPage>();

                services.AddTransient<IShellDialogWindow, ShellDialogWindow>();
                services.AddTransient<ShellDialogViewModel>();

                services.AddHttpClient();

                // add configuration sections
                services.AddSingleton<AppConfig>();
                services.AddSingleton<UpdaterConfig>();
            })
            .UseSerilog()
            .Build();

        return host;
    }
}

