using CleanMyPosts.Sites;
#nullable enable
using System.Text.Json.Serialization;

namespace CleanMyPosts.Infrastructure;

public sealed record UpdateCheckResultDto(bool UpdateAvailable, string? Message);

public sealed record SystemOpenUrlParams(string Url);

public sealed record AppInfoDto(string Version, string HomepageUrl, string ReportBugUrl);

/// <summary>Wire values must stay lower-case to match the TS contract's <c>LogLevelSchema</c>.</summary>
public enum LogLevel
{
    [JsonStringEnumMemberName("info")] Info,
    [JsonStringEnumMemberName("warning")] Warning,
    [JsonStringEnumMemberName("error")] Error
}

public sealed record LogEntryDto(DateTimeOffset Timestamp, LogLevel Level, string Message);

/// <summary>Push-event payloads (host -> chrome WebView2), sent outside the request/response envelope.</summary>
public sealed record ProgressPayloadDto(string RequestId, int DeletedCount, string? Message);

public sealed record SiteLoginPayloadDto(Platform Platform, bool LoggedIn);
