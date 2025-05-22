using System.Windows;
using System.Windows.Media.Imaging;
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
using Microsoft.Extensions.Options;
using NetSparkleUpdater.Interfaces;
using NetSparkleUpdater.UI.WPF;
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
                services.AddTransient<NetSparkleUpdater.Interfaces.ILogger, NetSparkleLogger>();
                services.AddSingleton<IUserSettingsService, UserSettingsService>();
                services.AddSingleton<IUIFactory>(sp =>
                {
                    UIFactory factory = null;
                    Application.Current.Dispatcher.Invoke(() =>
                    {
                        var options = sp.GetRequiredService<IOptions<UpdaterOptions>>().Value;
                        var uri = new Uri(options.IconUri, UriKind.Absolute);
                        var imageSource = new BitmapImage(uri);
                        factory = new UIFactory(imageSource);
                    });
                    return factory;
                });

                services.AddSingleton<IWindowManagerService, WindowManagerService>();
                services.AddSingleton<IPageService, PageService>();
                services.AddSingleton<INavigationService, NavigationService>();
                services.AddSingleton<IXScriptService, XScriptService>();
                services.AddSingleton<IWebViewHostService, WebViewHostService>();
                services.AddSingleton<IUpdateService, UpdateService>();
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

                services.Configure<AppConfig>(context.Configuration.GetSection(nameof(AppConfig)));
                services.Configure<UpdaterOptions>(context.Configuration.GetSection("Updater"));
            })
            .UseSerilog()
            .Build();

        return host;
    }
}

