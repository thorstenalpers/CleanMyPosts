using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.Wpf;
using CleanMyPosts.Sites;

namespace CleanMyPosts.Infrastructure;

public class ChromeWebViewService(WebView2EnvironmentProvider environmentProvider) : IChromeWebViewService
{
    private const string VirtualHostName = "cleanmyposts.local";
    private WebView2 _webView;

    public event EventHandler<WebMessageReceivedEventArgs> MessageReceived;

    public async Task InitializeAsync(WebView2 webView, string wwwRootPath)
    {
        _webView = webView ?? throw new ArgumentNullException(nameof(webView));

        var env = await environmentProvider.GetEnvironmentAsync();
        await _webView.EnsureCoreWebView2Async(env);

        _webView.CoreWebView2.SetVirtualHostNameToFolderMapping(
            VirtualHostName, wwwRootPath, CoreWebView2HostResourceAccessKind.Allow);

        // The TS bridge client posts plain objects (`postMessage({...})`), not pre-stringified
        // JSON, so this must read them via TryGetWebMessageAsJson — TryGetWebMessageAsString
        // throws (silently, inside this WebView2-native event pump) for anything but a string.
        _webView.CoreWebView2.WebMessageReceived += (_, e) =>
            MessageReceived?.Invoke(this, new WebMessageReceivedEventArgs { Message = e.WebMessageAsJson });

        _webView.Source = new Uri($"https://{VirtualHostName}/index.html");
    }

    public void PostMessage(string json)
    {
        _webView?.CoreWebView2?.PostWebMessageAsJson(json);
    }
}
