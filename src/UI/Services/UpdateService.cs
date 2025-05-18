using System.Windows.Media.Imaging;
using CleanMyPosts.UI.Contracts.Services;
using CleanMyPosts.UI.Models;
using Microsoft.Extensions.Options;
using NetSparkleUpdater;
using NetSparkleUpdater.SignatureVerifiers;
using NetSparkleUpdater.UI.WPF;

namespace CleanMyPosts.UI.Services;

public class UpdateService : IUpdateService
{
    private readonly SparkleUpdater _sparkle;

    public UpdateService(IOptions<UpdaterOptions> options)
    {
        var uri = new Uri(options.Value.IconUri, UriKind.Absolute);
        var imageSource = new BitmapImage(uri);

        var verifier = new DSAChecker(options.Value.SecurityMode);
        _sparkle = new SparkleUpdater(options.Value.AppCastUrl, verifier)
        {
            UIFactory = new UIFactory(imageSource),
            RelaunchAfterUpdate = true,
            UseNotificationToast = true
        };
    }

    public async Task CheckForUpdatesAsync()
    {
        await _sparkle.CheckForUpdatesAtUserRequest();
    }
}