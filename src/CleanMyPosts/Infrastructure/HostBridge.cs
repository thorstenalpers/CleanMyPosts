#nullable enable
using System.Text.Json;
using Microsoft.Extensions.Logging;

namespace CleanMyPosts.Infrastructure;

/// <summary>
/// Dispatches RPC requests coming from the chrome WebView2 (postMessage) to
/// registered handlers, and serializes their result back into the same
/// envelope shape the TS bridge client (`$lib/bridge/client.ts`) expects.
/// </summary>
public sealed class HostBridge(ILogger<HostBridge> logger)
{
    private readonly Dictionary<string, IBridgeMethod> _methods = new();

    public void Register<TParams, TResult>(string name, Func<TParams, Task<TResult>> handler)
    {
        _methods[name] = new BridgeMethod<TParams, TResult>(handler);
    }

    /// <summary>Wires every RPC request the chrome WebView2 posts to <see cref="HandleAsync"/> and replies in place.</summary>
    public void AttachTo(IChromeWebViewService chromeWebViewService)
    {
        chromeWebViewService.MessageReceived += async (_, e) =>
        {
            var response = await HandleAsync(e.Message);
            chromeWebViewService.PostMessage(response);
        };
    }

    public async Task<string> HandleAsync(string rawJson)
    {
        RpcRequest request;
        try
        {
            request = JsonSerializer.Deserialize<RpcRequest>(rawJson, BridgeJson.Options)
                      ?? throw new JsonException("Empty request.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Malformed bridge request: {Raw}", rawJson);
            return BuildError("unknown", ex.Message);
        }

        if (!_methods.TryGetValue(request.Method, out var method))
        {
            logger.LogWarning("No bridge handler registered for {Method}", request.Method);
            return BuildError(request.Id, $"Unknown bridge method \"{request.Method}\".");
        }

        try
        {
            var result = await method.InvokeAsync(request.Params);
            return BuildSuccess(request.Id, result);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Bridge method {Method} failed", request.Method);
            return BuildError(request.Id, ex.Message);
        }
    }

    private static string BuildSuccess(string id, object? result) =>
        JsonSerializer.Serialize(new { id, ok = true, result }, BridgeJson.Options);

    private static string BuildError(string id, string message) =>
        JsonSerializer.Serialize(new { id, ok = false, error = new { message } }, BridgeJson.Options);

    private interface IBridgeMethod
    {
        Task<object?> InvokeAsync(JsonElement paramsJson);
    }

    private sealed class BridgeMethod<TParams, TResult>(Func<TParams, Task<TResult>> handler) : IBridgeMethod
    {
        public async Task<object?> InvokeAsync(JsonElement paramsJson)
        {
            var typedParams = paramsJson.ValueKind is JsonValueKind.Undefined or JsonValueKind.Null
                ? default!
                : paramsJson.Deserialize<TParams>(BridgeJson.Options)!;

            return await handler(typedParams);
        }
    }
}
