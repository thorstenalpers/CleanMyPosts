#nullable enable
using System.Text.Json.Serialization;

namespace CleanMyPosts.Sites;

/// <summary>
/// Wire shape of messages the content-script (running inside the *site*
/// WebView2) posts back via `chrome.webview.postMessage` — mirrors
/// `CleanMyPosts.UI/src/lib/engine/protocol.ts`'s `ContentMessage` union.
/// </summary>
public sealed record ContentMessageDto
{
    [JsonPropertyName("type")] public string Type { get; init; } = string.Empty;
    [JsonPropertyName("level")] public string? Level { get; init; }
    [JsonPropertyName("message")] public string? Message { get; init; }
    [JsonPropertyName("requestId")] public string? RequestId { get; init; }
    [JsonPropertyName("deletedCount")] public int? DeletedCount { get; init; }
}
