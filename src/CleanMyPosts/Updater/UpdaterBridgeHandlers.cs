using AutoUpdaterDotNET;
using CleanMyPosts.Infrastructure;
using Microsoft.Extensions.Logging;

namespace CleanMyPosts.Updater;

public static class UpdaterBridgeHandlers
{
    public static void Register(
        HostBridge bridge,
        UpdaterConfig updaterConfig,
        IShellLayoutService shellLayoutService,
        ILogger logger)
    {
        bridge.Register<object, UpdateCheckResultDto>("updater.checkForUpdates",
            _ => CheckForUpdatesAsync(updaterConfig, shellLayoutService, logger));
    }

    private static Task<UpdateCheckResultDto> CheckForUpdatesAsync(
        UpdaterConfig updaterConfig,
        IShellLayoutService shellLayoutService,
        ILogger logger)
    {
        var tcs = new TaskCompletionSource<UpdateCheckResultDto>(TaskCreationOptions.RunContinuationsAsynchronously);

        async void Handler(UpdateInfoEventArgs args)
        {
            AutoUpdater.CheckForUpdateEvent -= Handler;

            if (args is null)
            {
                tcs.TrySetResult(new UpdateCheckResultDto(false, "Unable to check for updates at this time."));
                return;
            }

            if (!args.IsUpdateAvailable)
            {
                tcs.TrySetResult(new UpdateCheckResultDto(false, "No updates available."));
                return;
            }

            try
            {
                var confirmed = await shellLayoutService.ConfirmUpdateAsync(
                    args.CurrentVersion, args.InstalledVersion.ToString(), args.ChangelogURL);

                if (confirmed && AutoUpdater.DownloadUpdate(args))
                {
                    Environment.Exit(0);
                }

                tcs.TrySetResult(new UpdateCheckResultDto(true, null));
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Update prompt failed.");
                tcs.TrySetResult(new UpdateCheckResultDto(true, "Update could not be installed."));
            }
        }

        AutoUpdater.CheckForUpdateEvent += Handler;
        AutoUpdater.Start(updaterConfig.UpdateUrl);

        return tcs.Task;
    }
}
