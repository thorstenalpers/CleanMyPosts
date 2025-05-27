using System.Collections.Specialized;
using System.Text;
using System.Windows;
using System.Windows.Controls;
using CleanMyPosts.UI.ViewModels;
using ControlzEx.Theming;

namespace CleanMyPosts.UI.Views;

public partial class LogPage : Page
{
    private readonly LogViewModel _viewModel;
    private string _currentBackgroundColor = "#FFFAFA";
    private string _currentTextColor = "black";
    private string _currentBorderColor = "#EEE";

    public LogPage(LogViewModel viewModel)
    {
        InitializeComponent();
        _viewModel = viewModel;
        DataContext = _viewModel;

        Loaded += LogPage_Loaded;
        _viewModel.LogEntries.CollectionChanged += LogEntries_CollectionChanged;
        ThemeManager.Current.ThemeChanged += OnThemeChanged;
    }

    private void OnThemeChanged(object sender, ThemeChangedEventArgs e)
    {
        if (LogWebView?.CoreWebView2 == null)
        {
            return;
        }

        var theme = ThemeManager.Current.DetectTheme();
        string backgroundColor, textColor, borderColor;

        if (theme?.BaseColorScheme == "Dark")
        {
            backgroundColor = "#1E1E1E";
            textColor = "#E0E0E0";
            borderColor = "#333";
        }
        else
        {
            backgroundColor = "#FFFAFA";
            textColor = "black";
            borderColor = "#EEE";
        }

        var js = $"setTheme('{backgroundColor}', '{textColor}', '{borderColor}');";
        LogWebView.CoreWebView2.ExecuteScriptAsync(js);
    }


    private async void LogPage_Loaded(object sender, RoutedEventArgs e)
    {
        await LogWebView.EnsureCoreWebView2Async();
        LogWebView.CoreWebView2.Settings.IsScriptEnabled = true;

        // Define JS function for runtime use
        var jsFunc = @"
        function setTheme(backgroundColor, textColor, borderColor) {
            document.body.style.backgroundColor = backgroundColor;
            document.body.style.color = textColor;
            const entries = document.querySelectorAll('.log-entry');
            entries.forEach(entry => {
                entry.style.borderBottom = `1px solid ${borderColor}`;
            });
        }";
        await LogWebView.CoreWebView2.AddScriptToExecuteOnDocumentCreatedAsync(jsFunc);

        // Detect theme
        var theme = ThemeManager.Current.DetectTheme();
        string backgroundColor, textColor, borderColor;

        if (theme?.BaseColorScheme == "Dark")
        {
            backgroundColor = "#1E1E1E";
            textColor = "#E0E0E0";
            borderColor = "#333";
        }
        else
        {
            backgroundColor = "#FFFAFA";
            textColor = "black";
            borderColor = "#EEE";
        }

        _currentBackgroundColor = backgroundColor;
        _currentTextColor = textColor;
        _currentBorderColor = borderColor;

        UpdateLogHtml();

        var js = $"setTheme('{backgroundColor}', '{textColor}', '{borderColor}');";
        _ = LogWebView.CoreWebView2.ExecuteScriptAsync(js);
    }


    private void LogEntries_CollectionChanged(object sender, NotifyCollectionChangedEventArgs e)
    {
        UpdateLogHtml();
    }

    private void UpdateLogHtml()
    {
        if (LogWebView?.CoreWebView2 == null)
        {
            return;
        }

        string html = GenerateLogHtml();
        LogWebView.NavigateToString(html);
    }

    private string GenerateLogHtml()
    {
        var html = $@"
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset=""utf-8"" />
            <style>
                body {{
                    font-family: Consolas, monospace;
                    background-color: {_currentBackgroundColor};
                    color: {_currentTextColor};
                    padding: 10px;
                }}
                .log-entry {{
                    margin-bottom: 2px;
                    white-space: pre-wrap;
                    border-bottom: 1px solid {_currentBorderColor};
                    padding-bottom: 2px;
                }}
            </style>
        </head>
        <body>
    ";

        var sb = new StringBuilder();
        sb.Append(html);

        foreach (var entry in _viewModel.LogEntries)
        {
            var safeEntry = System.Net.WebUtility.HtmlEncode(entry);
            sb.AppendLine($"<div class=\"log-entry\">{safeEntry}</div>");
        }

        sb.AppendLine("</body></html>");
        return sb.ToString();
    }

}
