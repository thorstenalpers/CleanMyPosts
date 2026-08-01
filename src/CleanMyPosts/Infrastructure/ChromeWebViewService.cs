using System.IO;
using CleanMyPosts.Sites;
using Microsoft.UI.Xaml.Controls;
using Microsoft.Web.WebView2.Core;
using Microsoft.UI;

namespace CleanMyPosts.Infrastructure;

public class ChromeWebViewService(
    WebView2EnvironmentProvider environmentProvider,
    WebAssetProvider assetProvider) : IChromeWebViewService
{
    private const string VirtualHostName = "cleanmyposts.local";

    private WebView2? _webView;

    public event EventHandler<WebMessageReceivedEventArgs>? MessageReceived;

    public async Task InitializeAsync(WebView2 webView)
    {
        ArgumentNullException.ThrowIfNull(webView);
        _webView = webView;

        // Transparent both before and after initialisation: the control's own brush is what
        // paints until CoreWebView2 exists, and the core's colour is what paints afterwards.
        // Without both, the Mica backdrop is hidden behind an opaque white page.
        _webView.DefaultBackgroundColor = Colors.Transparent;

        var env = await environmentProvider.GetEnvironmentAsync();
        await _webView.EnsureCoreWebView2Async(env);

        var core = _webView.CoreWebView2;
        _webView.DefaultBackgroundColor = Colors.Transparent;

        // The UI ships as embedded resources, so there is no folder to map a virtual
        // host to — every request under the virtual host is answered from the assembly.
        core.AddWebResourceRequestedFilter($"https://{VirtualHostName}/*", CoreWebView2WebResourceContext.All);
        core.WebResourceRequested += (_, e) => e.Response = CreateResponse(env, e.Request.Uri);

        // The TS bridge client posts plain objects (`postMessage({...})`), not pre-stringified
        // JSON, so this must read them via TryGetWebMessageAsJson — TryGetWebMessageAsString
        // throws (silently, inside this WebView2-native event pump) for anything but a string.
        core.WebMessageReceived += (_, e) =>
            MessageReceived?.Invoke(this, new WebMessageReceivedEventArgs { Message = e.WebMessageAsJson });

        _webView.Source = new Uri($"https://{VirtualHostName}/index.html");
    }

    public void PostMessage(string json) => _webView?.CoreWebView2?.PostWebMessageAsJson(json);

    private CoreWebView2WebResourceResponse CreateResponse(CoreWebView2Environment env, string requestUri)
    {
        var path = new Uri(requestUri).AbsolutePath;
        var stream = assetProvider.Open(path);

        return stream is null
            ? env.CreateWebResourceResponse(null, 404, "Not Found", string.Empty)
            : env.CreateWebResourceResponse(stream.AsRandomAccessStream(), 200, "OK",
                $"Content-Type: {WebAssetProvider.GetContentType(path)}\r\nCache-Control: no-cache");
    }
}
