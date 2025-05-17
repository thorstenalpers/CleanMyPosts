namespace CleanMyPosts.UI.Helpers;
public static class Helper
{
    public static string CleanJsonResult(string json)
    {
        return json?.Replace("\\\"", "\"")?.Trim('\"') ?? "";
    }
}
