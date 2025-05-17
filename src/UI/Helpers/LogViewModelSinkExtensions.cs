using Serilog;
using Serilog.Configuration;
using CleanMyPosts.UI.ViewModels;

namespace CleanMyPosts.UI.Helpers;

public static class LogViewModelSinkExtensions
{
    public static LoggerConfiguration LogViewModelSink(
        this LoggerSinkConfiguration loggerConfiguration,
        LogViewModel logViewModel)
    {
        return loggerConfiguration.Sink(new LogViewModelSink(logViewModel));
    }
}