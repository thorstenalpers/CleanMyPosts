using System.Windows;
using System.Windows.Media.Imaging;
using CleanMyPosts.Core.Contracts.Services;
using CleanMyPosts.Core.Services;
using CleanMyPosts.UI.Contracts.Services;
using CleanMyPosts.UI.Contracts.Views;
using CleanMyPosts.UI.Models;
using CleanMyPosts.UI.Services;
using CleanMyPosts.UI.ViewModels;
using CleanMyPosts.UI.Views;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using NetSparkleUpdater.Interfaces;
using NetSparkleUpdater.UI.WPF;

namespace CleanMyPosts.UI.Helpers;

public static class ServiceCollectionExtensions
{
    public static void AddCleanMyPosts(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddHostedService<ApplicationHostService>();

        services.AddSingleton<IFileService, FileService>();
        services.AddTransient<NetSparkleUpdater.Interfaces.ILogger, NetSparkleLogger>();
        services.AddSingleton<IAppSettingsService, AppSettingsService>();
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
        services.AddSingleton<IApplicationInfoService, ApplicationInfoService>();
        services.AddSingleton<IPersistAndRestoreService, PersistAndRestoreService>();
        services.AddSingleton<IThemeSelectorService, ThemeSelectorService>();
        services.AddSingleton<IPageService, PageService>();
        services.AddSingleton<INavigationService, NavigationService>();
        services.AddSingleton<IXWebViewScriptService, XWebViewScriptService>();
        services.AddSingleton<IWebViewHostService, WebViewHostService>();
        services.AddSingleton<IUpdateService, UpdateService>();

        services.AddTransient<IShellWindow, ShellWindow>();
        services.AddTransient<ShellViewModel>();
        services.AddSingleton<LogPage>();
        services.AddSingleton<LogViewModel>();
        services.AddSingleton<XViewModel>();
        services.AddSingleton<XPage>();

        services.AddTransient<SettingsViewModel>();
        services.AddTransient<SettingsPage>();

        services.AddTransient<IShellDialogWindow, ShellDialogWindow>();
        services.AddTransient<ShellDialogViewModel>();

        services.AddHttpClient();

        services.Configure<AppConfig>(configuration.GetSection(nameof(AppConfig)));
        services.Configure<UpdaterOptions>(configuration.GetSection("Updater"));
    }
}
