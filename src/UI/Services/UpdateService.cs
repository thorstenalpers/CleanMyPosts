using Ardalis.GuardClauses;
using CleanMyPosts.UI.Contracts.Services;
using CleanMyPosts.UI.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using NetSparkleUpdater;
using NetSparkleUpdater.Interfaces;
using NetSparkleUpdater.SignatureVerifiers;

namespace CleanMyPosts.UI.Services;

public class UpdateService : IUpdateService
{
    private readonly SparkleUpdater _sparkle;
    private readonly ILogger<UpdateService> _logger;

    public UpdateService(IOptions<UpdaterOptions> options,
                         IUIFactory uIFactory,
                         ILogger<UpdateService> logger,
                         NetSparkleUpdater.Interfaces.ILogger netSparkleLogger)
    {
        _logger = logger;
        var opts = options.Value;

        Guard.Against.Null(opts);
        Guard.Against.NullOrWhiteSpace(opts.AppCastUrl);
        Guard.Against.NullOrWhiteSpace(opts.SecurityMode.ToString());

        var verifier = new DSAChecker(opts.SecurityMode);
        _sparkle = new SparkleUpdater(opts.AppCastUrl, verifier)
        {
            UIFactory = uIFactory,
            RelaunchAfterUpdate = true,
            UseNotificationToast = true,
            LogWriter = netSparkleLogger
        };
    }

    public async Task CheckForUpdatesAsync()
    {
        try
        {
            await _sparkle.CheckForUpdatesAtUserRequest();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error while checking for updates.");
        }
    }
}
