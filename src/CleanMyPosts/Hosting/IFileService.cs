namespace CleanMyPosts.Hosting;

public interface IFileService
{
    T? Read<T>(string folderPath, string fileName);

    void Save<T>(string folderPath, string fileName, T content);

    string ReadFile(string filePath);
}
