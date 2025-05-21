using Microsoft.Extensions.Logging;

namespace CleanMyPosts.UI.Services;

public class NetSparkleLogger(ILogger<NetSparkleLogger> logger) : NetSparkleUpdater.Interfaces.ILogger
{
    private readonly ILogger<NetSparkleLogger> _logger = logger ?? throw new ArgumentNullException(nameof(logger));

    public void PrintMessage(string message, params object[] arguments)
    {
        var formattedMessage = string.Format(message, arguments);
        _logger.LogInformation("{NetSparkleMessage}", formattedMessage);
    }
}
