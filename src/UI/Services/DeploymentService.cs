using CleanMyPosts.UI.Contracts.Services;

namespace CleanMyPosts.UI.Services;

public class DeploymentService : IDeploymentService
{
    protected virtual string GetExePath() => AppContext.BaseDirectory;
    protected virtual string GetProgramFilesPath() => Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles);
    protected virtual string GetProgramFilesX86Path() => Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86);

    public bool IsRunningAsInstalled()
    {
        var exePath = GetExePath();
        var pf = GetProgramFilesPath();
        var pf86 = GetProgramFilesX86Path();

        return exePath.StartsWith(pf, StringComparison.OrdinalIgnoreCase) ||
               exePath.StartsWith(pf86, StringComparison.OrdinalIgnoreCase);
    }
}

