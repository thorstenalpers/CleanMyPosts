using System.Drawing;
using System.Windows;
using AutoUpdaterDotNET;
using Microsoft.Extensions.Logging;
using CleanMyPosts.Infrastructure;

namespace CleanMyPosts.Updater;

public static class UpdaterBridgeHandlers
{
    public static void Register(HostBridge bridge, UpdaterConfig updaterConfig, ILogger logger)
    {
        bridge.Register<object, UpdateCheckResultDto>("updater.checkForUpdates", _ => CheckForUpdatesAsync(updaterConfig, logger));
    }

    private static Task<UpdateCheckResultDto> CheckForUpdatesAsync(UpdaterConfig updaterConfig, ILogger logger)
    {
        var tcs = new TaskCompletionSource<UpdateCheckResultDto>(TaskCreationOptions.RunContinuationsAsynchronously);

        void Handler(UpdateInfoEventArgs args)
        {
            AutoUpdater.CheckForUpdateEvent -= Handler;

            if (args == null)
            {
                tcs.TrySetResult(new UpdateCheckResultDto(false, "Unable to check for updates at this time."));
                return;
            }

            if (args.IsUpdateAvailable)
            {
                AutoUpdater.ShowUpdateForm(args);
                tcs.TrySetResult(new UpdateCheckResultDto(true, null));
            }
            else
            {
                tcs.TrySetResult(new UpdateCheckResultDto(false, "No updates available."));
            }
        }

        try
        {
            var iconUri = new Uri(updaterConfig.IconUri, UriKind.Absolute);
            var iconStream = Application.GetResourceStream(iconUri)?.Stream;
            if (iconStream != null)
            {
                using (iconStream)
                using (var icon = new Icon(iconStream))
                {
                    AutoUpdater.Icon = icon.ToBitmap();
                }
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to load updater icon.");
        }

        AutoUpdater.CheckForUpdateEvent += Handler;
        AutoUpdater.Start(updaterConfig.UpdateUrl);

        return tcs.Task;
    }
}
