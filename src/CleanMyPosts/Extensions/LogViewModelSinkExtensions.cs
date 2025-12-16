using CleanMyPosts.Helpers;
using CleanMyPosts.ViewModels;
using Serilog;
using Serilog.Configuration;

namespace CleanMyPosts.Extensions;

public static class LogViewModelSinkExtensions
{
    public static LoggerConfiguration LogViewModelSink(
        this LoggerSinkConfiguration loggerConfiguration,
        LogViewModel logViewModel)
    {
        return loggerConfiguration.Sink(new LogViewModelSink(logViewModel));
    }
}