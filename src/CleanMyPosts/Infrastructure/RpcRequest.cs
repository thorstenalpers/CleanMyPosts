using System.Text.Json;
using System.Text.Json.Serialization;

namespace CleanMyPosts.Infrastructure;

public sealed class RpcRequest
{
    [JsonPropertyName("id")] public string Id { get; init; } = string.Empty;
    [JsonPropertyName("method")] public string Method { get; init; } = string.Empty;
    [JsonPropertyName("params")] public JsonElement Params { get; init; }
}
