using System.IO;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace CleanMyPosts.Hosting;

public class FileService : IFileService
{
    // Enums are written as their member names so existing settings files
    // (e.g. "Theme": "Dark") stay readable, and stay readable by humans.
    private static readonly JsonSerializerOptions Options = new()
    {
        WriteIndented = true,
        Converters = { new JsonStringEnumConverter() }
    };

    public T? Read<T>(string folderPath, string fileName)
    {
        var path = Path.Combine(folderPath, fileName);
        if (!File.Exists(path))
        {
            return default;
        }

        try
        {
            return JsonSerializer.Deserialize<T>(File.ReadAllText(path), Options);
        }
        catch (JsonException)
        {
            // Settings are user state, not a contract: a file left behind by an older
            // version (or hand-edited) must fall back to defaults, not stop start-up.
            return default;
        }
    }

    public string ReadFile(string filePath) => File.ReadAllText(filePath);

    public void Save<T>(string folderPath, string fileName, T content)
    {
        Directory.CreateDirectory(folderPath);
        File.WriteAllText(Path.Combine(folderPath, fileName), JsonSerializer.Serialize(content, Options));
    }
}
