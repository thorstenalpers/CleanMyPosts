using Ardalis.GuardClauses;
using CleanMyPosts.UI.Contracts.Services;
using CleanMyPosts.UI.Models;
using Microsoft.Extensions.Options;
using NetSparkleUpdater;
using NetSparkleUpdater.Interfaces;
using NetSparkleUpdater.SignatureVerifiers;

namespace CleanMyPosts.UI.Services;

public class UpdateService : IUpdateService
{
    private readonly SparkleUpdater _sparkle;

    public UpdateService(IOptions<UpdaterOptions> options, IUIFactory uIFactory)
    {
        var opts = options.Value;

        Guard.Against.Null(opts, nameof(options));
        Guard.Against.NullOrWhiteSpace(opts.AppCastUrl, nameof(opts.AppCastUrl));
        Guard.Against.NullOrWhiteSpace(opts.SecurityMode.ToString(), nameof(opts.SecurityMode));

        var verifier = new DSAChecker(opts.SecurityMode);
        _sparkle = new SparkleUpdater(opts.AppCastUrl, verifier)
        {
            UIFactory = uIFactory,
            RelaunchAfterUpdate = true,
            UseNotificationToast = true
        };
    }

    public async Task CheckForUpdatesAsync()
    {
        await _sparkle.CheckForUpdatesAtUserRequest();
    }
}