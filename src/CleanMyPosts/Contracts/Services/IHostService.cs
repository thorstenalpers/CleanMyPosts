using CleanMyPosts.ViewModels;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace CleanMyPosts.Contracts.Services;

public interface IHostService
{
    IHost BuildHost(string[] args, IConfiguration config, LogViewModel logViewModel);
}
