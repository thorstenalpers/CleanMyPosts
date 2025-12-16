using System.Text;
using CleanMyPosts.Services;
using FluentAssertions;
using Xunit;

namespace CleanMyPosts.Tests.Services;

[Trait("Category", "Unit")]
public class FileServiceTests : IDisposable
{
    private readonly string _testDirectory;
    private readonly FileService _fileService;

    public FileServiceTests()
    {
        _testDirectory = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString());
        _fileService = new FileService();
    }

    [Fact]
    public void Save_ShouldCreateFileWithCorrectContent()
    {
        // Arrange
        var fileName = "test.json";
        var expectedObject = new TestObject { Id = 1, Name = "Test" };

        // Act
        _fileService.Save(_testDirectory, fileName, expectedObject);

        // Assert
        var filePath = Path.Combine(_testDirectory, fileName);
        File.Exists(filePath).Should().BeTrue();

        var json = File.ReadAllText(filePath);
        var result = Newtonsoft.Json.JsonConvert.DeserializeObject<TestObject>(json);

        result.Should().BeEquivalentTo(expectedObject);
    }

    [Fact]
    public void Read_ShouldReturnDeserializedObject()
    {
        // Arrange
        var fileName = "readtest.json";
        var expectedObject = new TestObject { Id = 2, Name = "ReadTest" };
        var json = Newtonsoft.Json.JsonConvert.SerializeObject(expectedObject);
        Directory.CreateDirectory(_testDirectory);
        File.WriteAllText(Path.Combine(_testDirectory, fileName), json, Encoding.UTF8);

        // Act
        var result = _fileService.Read<TestObject>(_testDirectory, fileName);

        // Assert
        result.Should().BeEquivalentTo(expectedObject);
    }

    [Fact]
    public void Delete_ShouldRemoveFileIfExists()
    {
        // Arrange
        var fileName = "todelete.json";
        var filePath = Path.Combine(_testDirectory, fileName);
        Directory.CreateDirectory(_testDirectory);
        File.WriteAllText(filePath, "dummy");

        // Act
        _fileService.Delete(_testDirectory, fileName);

        // Assert
        File.Exists(filePath).Should().BeFalse();
    }

    [Fact]
    public void Read_ShouldReturnDefault_WhenFileDoesNotExist()
    {
        // Act
        var result = _fileService.Read<TestObject>(_testDirectory, "nonexistent.json");

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public void ReadFile_ShouldReturnFileContent()
    {
        // Arrange
        var fileName = "testfile.txt";
        var expectedContent = "This is test content\nwith multiple lines";
        var filePath = Path.Combine(_testDirectory, fileName);
        Directory.CreateDirectory(_testDirectory);
        File.WriteAllText(filePath, expectedContent, Encoding.UTF8);

        // Act
        var result = _fileService.ReadFile(filePath);

        // Assert
        result.Should().Be(expectedContent);
    }

    [Fact]
    public void Delete_ShouldNotThrow_WhenFileNameIsNull()
    {
        // Act & Assert
        var action = () => _fileService.Delete(_testDirectory, null);
        action.Should().NotThrow();
    }

    [Fact]
    public void Delete_ShouldNotThrow_WhenFileDoesNotExist()
    {
        // Act & Assert
        var action = () => _fileService.Delete(_testDirectory, "nonexistent.json");
        action.Should().NotThrow();
    }

    [Fact]
    public void Save_ShouldCreateDirectory_WhenItDoesNotExist()
    {
        // Arrange
        var nonExistentDirectory = Path.Combine(_testDirectory, "subfolder", "nested");
        var fileName = "test.json";
        var testObject = new TestObject { Id = 3, Name = "DirectoryTest" };

        // Act
        _fileService.Save(nonExistentDirectory, fileName, testObject);

        // Assert
        Directory.Exists(nonExistentDirectory).Should().BeTrue();
        var filePath = Path.Combine(nonExistentDirectory, fileName);
        File.Exists(filePath).Should().BeTrue();
    }

    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }

    protected virtual void Dispose(bool disposing)
    {
        if (Directory.Exists(_testDirectory))
        {
            Directory.Delete(_testDirectory, true);
        }
    }

    private class TestObject
    {
        public int Id { get; set; }
        public string Name { get; set; }
    }
}