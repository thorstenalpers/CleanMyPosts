using CleanMyPosts.UI.ViewModels;
using Microsoft.Extensions.Configuration;
using Serilog;

namespace CleanMyPosts.UI.Contracts.Services;

public interface IAppSetupService
{
    IConfiguration BuildConfiguration();
    ILogger CreateLogger(IConfiguration config, LogViewModel logViewModel);
}
