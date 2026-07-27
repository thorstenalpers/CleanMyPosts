#nullable enable
namespace CleanMyPosts.Sites;

internal static class ScriptResult
{
    /// <summary>Unwraps a WebView2 <c>ExecuteScriptAsync</c> JSON string result to its raw text. Returns an empty string when the script yielded no value.</summary>
    internal static string Unwrap(string? json)
    {
        if (string.IsNullOrEmpty(json) || json == "null")
        {
            return string.Empty;
        }

        return json.Replace("\\\"", "\"").Trim('\"');
    }
}
