using CleanMyPosts.ViewModels;
using Microsoft.Extensions.Configuration;
using Serilog;

namespace CleanMyPosts.Contracts.Services;

public interface IAppSetupService
{
    IConfiguration BuildConfiguration();
    ILogger CreateLogger(IConfiguration config, LogViewModel logViewModel);
}