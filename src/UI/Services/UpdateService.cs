using Ardalis.GuardClauses;
using CleanMyPosts.UI.Contracts.Services;
using CleanMyPosts.UI.Helpers;
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
        Guard.Against.NullOrWhiteSpace(opts.AppCastUrlSingle);
        Guard.Against.NullOrWhiteSpace(opts.AppCastUrlInstaller);
        Guard.Against.NullOrWhiteSpace(opts.SecurityMode.ToString());

        var url = Helper.IsInstalledVersion() ? opts.AppCastUrlInstaller : opts.AppCastUrlSingle;
        var verifier = new DSAChecker(opts.SecurityMode.Value);
        _logger.LogInformation("Update url is {Url}.", url);
        _sparkle = new SparkleUpdater(url, verifier)
        {
            UIFactory = uIFactory,
            RelaunchAfterUpdate = true,
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
