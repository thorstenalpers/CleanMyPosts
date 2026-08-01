using System.IO;
using System.Reflection;

namespace CleanMyPosts.Infrastructure;

/// <summary>
/// Serves the built Svelte assets straight out of the assembly, so the publish
/// folder never carries a loose wwwroot/Scripts tree.
/// </summary>
public sealed class WebAssetProvider
{
    private const string Prefix = "WebAssets/";

    private static readonly Assembly Assembly = typeof(WebAssetProvider).Assembly;

    // MSBuild builds LogicalName from %(RecursiveDir), which uses backslashes on Windows.
    private readonly Dictionary<string, string> _resourceNames =
        Assembly.GetManifestResourceNames()
            .Where(name => name.StartsWith(Prefix, StringComparison.Ordinal))
            .ToDictionary(name => Normalize(name[Prefix.Length..]), name => name, StringComparer.OrdinalIgnoreCase);

    public Stream? Open(string path) =>
        _resourceNames.TryGetValue(Normalize(path), out var resourceName)
            ? Assembly.GetManifestResourceStream(resourceName)
            : null;

    public async Task<string> ReadTextAsync(string path)
    {
        await using var stream = Open(path) ?? throw new FileNotFoundException($"Embedded web asset not found: {path}");
        using var reader = new StreamReader(stream);
        return await reader.ReadToEndAsync();
    }

    public static string GetContentType(string path) => Path.GetExtension(path).ToLowerInvariant() switch
    {
        ".html" or ".htm" => "text/html; charset=utf-8",
        ".js" or ".mjs" => "text/javascript; charset=utf-8",
        ".css" => "text/css; charset=utf-8",
        ".json" or ".map" => "application/json; charset=utf-8",
        ".svg" => "image/svg+xml",
        ".png" => "image/png",
        ".jpg" or ".jpeg" => "image/jpeg",
        ".webp" => "image/webp",
        ".ico" => "image/x-icon",
        ".woff2" => "font/woff2",
        ".woff" => "font/woff",
        ".ttf" => "font/ttf",
        _ => "application/octet-stream"
    };

    private static string Normalize(string path) => path.Replace('\\', '/').TrimStart('/');
}
