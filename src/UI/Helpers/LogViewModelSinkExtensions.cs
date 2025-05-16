using Serilog;
using Serilog.Configuration;
using XTweetCleaner.UI.ViewModels;

namespace XTweetCleaner.UI.Helpers;

public static class LogViewModelSinkExtensions
{
    public static LoggerConfiguration LogViewModelSink(
        this LoggerSinkConfiguration loggerConfiguration,
        LogViewModel logViewModel)
    {
        return loggerConfiguration.Sink(new LogViewModelSink(logViewModel));
    }
}