using CleanMyPosts.UI.Helpers;
using CleanMyPosts.UI.ViewModels;
using Serilog;
using Serilog.Configuration;

namespace CleanMyPosts.UI.Extensions;

public static class LogViewModelSinkExtensions
{
    public static LoggerConfiguration LogViewModelSink(
        this LoggerSinkConfiguration loggerConfiguration,
        LogViewModel logViewModel)
    {
        return loggerConfiguration.Sink(new LogViewModelSink(logViewModel));
    }
}