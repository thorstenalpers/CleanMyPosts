using System.Text.Json.Serialization;
using CleanMyPosts.Settings;

namespace CleanMyPosts.Sites;

/// <summary>Wire values must stay lower-case to match the TS contract's <c>PlatformSchema</c>.</summary>
public enum Platform
{
    [JsonStringEnumMemberName("x")] X,
    [JsonStringEnumMemberName("youtube")] Youtube
}

public sealed record SiteNavigateParams(Platform Platform, string Action);
public sealed record SiteNavigateResult(bool Ok);

public sealed record SiteRunActionParams(string RequestId, Platform Platform, string Action, TimeoutSettingsDto Timeouts);
public sealed record SiteCancelActionParams(string RequestId);
public sealed record ActionResultDto(int DeletedCount);

public sealed record SiteHideParams(bool Hide);

public sealed record SetSidebarExpandedParams(bool Expanded);
