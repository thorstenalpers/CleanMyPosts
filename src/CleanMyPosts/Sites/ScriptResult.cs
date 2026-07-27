namespace CleanMyPosts.Sites;

internal static class ScriptResult
{
    /// <summary>Unwraps a WebView2 <c>ExecuteScriptAsync</c> JSON string result to its raw text.</summary>
    internal static string Unwrap(string json)
    {
        return json.Replace("\\\"", "\"").Trim('\"');
    }
}
