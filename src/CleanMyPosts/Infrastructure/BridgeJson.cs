using System.Text.Json;
using System.Text.Json.Serialization;

namespace CleanMyPosts.Infrastructure;

public static class BridgeJson
{
    public static readonly JsonSerializerOptions Options = CreateOptions();

    private static JsonSerializerOptions CreateOptions()
    {
        var options = new JsonSerializerOptions(JsonSerializerDefaults.Web);
        // Enum member names (e.g. AppTheme.Default) must match the PascalCase
        // string literals in the TS contract ('Default' | 'Light' | 'Dark'),
        // so no naming policy is applied here.
        options.Converters.Add(new JsonStringEnumConverter());
        return options;
    }
}
