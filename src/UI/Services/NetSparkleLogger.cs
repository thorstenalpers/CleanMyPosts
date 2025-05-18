using Microsoft.Extensions.Logging;

namespace CleanMyPosts.UI.Services;

public class NetSparkleLogger(ILogger<NetSparkleLogger> logger) : NetSparkleUpdater.Interfaces.ILogger
{
    private readonly ILogger<NetSparkleLogger> _logger = logger;

    public void PrintMessage(string message, params object[] arguments)
    {
#pragma warning disable CA2254 // Template should be a static expression
        _logger.LogInformation(message: message);
#pragma warning restore CA2254 // Template should be a static expression
    }
}