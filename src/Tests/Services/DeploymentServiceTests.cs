using CleanMyPosts.UI.Services;
using Xunit;

namespace CleanMyPosts.Tests.Services;

public class DeploymentServiceTests
{
    public class TestDeploymentService : DeploymentService
    {
        public string ExePathToReturn { get; set; }
        public string ProgramFilesPathToReturn { get; set; }
        public string ProgramFilesX86PathToReturn { get; set; }

        protected override string GetExePath() => ExePathToReturn;
        protected override string GetProgramFilesPath() => ProgramFilesPathToReturn;
        protected override string GetProgramFilesX86Path() => ProgramFilesX86PathToReturn;
    }

    [Fact]
    public void IsRunningAsInstalled_ReturnsTrue_WhenExePathIsUnderProgramFiles()
    {
        var service = new TestDeploymentService
        {
            ExePathToReturn = @"C:\Program Files\MyApp\app.exe",
            ProgramFilesPathToReturn = @"C:\Program Files",
            ProgramFilesX86PathToReturn = @"C:\Program Files (x86)"
        };

        Assert.True(service.IsRunningAsInstalled());
    }

    [Fact]
    public void IsRunningAsInstalled_ReturnsTrue_WhenExePathIsUnderProgramFilesX86()
    {
        var service = new TestDeploymentService
        {
            ExePathToReturn = @"C:\Program Files (x86)\MyApp\app.exe",
            ProgramFilesPathToReturn = @"C:\Program Files",
            ProgramFilesX86PathToReturn = @"C:\Program Files (x86)"
        };

        Assert.True(service.IsRunningAsInstalled());
    }

    [Fact]
    public void IsRunningAsInstalled_ReturnsFalse_WhenExePathIsNotUnderProgramFiles()
    {
        var service = new TestDeploymentService
        {
            ExePathToReturn = @"D:\SomeFolder\app.exe",
            ProgramFilesPathToReturn = @"C:\Program Files",
            ProgramFilesX86PathToReturn = @"C:\Program Files (x86)"
        };

        Assert.False(service.IsRunningAsInstalled());
    }

    [Fact]
    public void IsRunningAsInstalled_IsCaseInsensitive()
    {
        var service = new TestDeploymentService
        {
            ExePathToReturn = @"c:\program files\myapp\app.exe",
            ProgramFilesPathToReturn = @"C:\Program Files",
            ProgramFilesX86PathToReturn = @"C:\Program Files (x86)"
        };

        Assert.True(service.IsRunningAsInstalled());
    }
}
