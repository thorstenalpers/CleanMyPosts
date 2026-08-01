using System.IO;
using CleanMyPosts.Hosting;
using Microsoft.Web.WebView2.Core;

namespace CleanMyPosts.Infrastructure;

/// <summary>
/// One shared <see cref="CoreWebView2Environment"/> for both the chrome and
/// site WebView2 controls — they then share a single browser process instead
/// of each spinning up their own.
/// </summary>
public sealed class WebView2EnvironmentProvider : IDisposable
{
    private readonly SemaphoreSlim _lock = new(1, 1);
    private CoreWebView2Environment? _environment;

    public async Task<CoreWebView2Environment> GetEnvironmentAsync()
    {
        if (_environment is not null)
        {
            return _environment;
        }

        await _lock.WaitAsync();
        try
        {
            if (_environment is not null)
            {
                return _environment;
            }

            Directory.CreateDirectory(AppPaths.WebView2UserData);

            var options = new CoreWebView2EnvironmentOptions { Language = "en-US" };
            _environment = await CoreWebView2Environment.CreateWithOptionsAsync(
                string.Empty, AppPaths.WebView2UserData, options);
            return _environment;
        }
        finally
        {
            _lock.Release();
        }
    }

    public void Dispose() => _lock.Dispose();
}
