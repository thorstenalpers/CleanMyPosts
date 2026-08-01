namespace CleanMyPosts.Settings;

public sealed record TimeoutSettingsDto(int WaitAfterDelete, int WaitBetweenRetryDeleteAttempts, int WaitAfterDocumentLoad)
{
    public static TimeoutSettingsDto From(TimeoutSettings settings) =>
        new(settings.WaitAfterDelete, settings.WaitBetweenRetryDeleteAttempts, settings.WaitAfterDocumentLoad);

    public TimeoutSettings ToModel() => new()
    {
        WaitAfterDelete = WaitAfterDelete,
        WaitBetweenRetryDeleteAttempts = WaitBetweenRetryDeleteAttempts,
        WaitAfterDocumentLoad = WaitAfterDocumentLoad
    };
}

public sealed record AppSettingsDto(
    AppTheme Theme,
    bool ShowLogs,
    bool ConfirmDeletion,
    string AccentColor,
    bool UseSystemAccent,
    TimeoutSettingsDto Timeouts);
