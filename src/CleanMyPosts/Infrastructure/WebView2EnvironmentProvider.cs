using System.IO;
using Microsoft.Web.WebView2.Core;

namespace CleanMyPosts.Infrastructure;

/// <summary>
/// One shared <see cref="CoreWebView2Environment"/> for both the chrome and
/// site WebView2 controls — they then share a single browser process instead
/// of each spinning up their own.
/// </summary>
public class WebView2EnvironmentProvider
{
    // Pinned, not derived from the assembly name: renaming the assembly must not
    // orphan the WebView2 profile (cookies/logins) by moving its folder.
    private const string ProfileFolderName = "CleanMyPosts";

    private readonly SemaphoreSlim _lock = new(1, 1);
    private CoreWebView2Environment _environment;

    public async Task<CoreWebView2Environment> GetEnvironmentAsync()
    {
        if (_environment != null)
        {
            return _environment;
        }

        await _lock.WaitAsync();
        try
        {
            if (_environment != null)
            {
                return _environment;
            }

            var userDataFolder = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                ProfileFolderName,
                "WebView2");

            Directory.CreateDirectory(userDataFolder);

            var options = new CoreWebView2EnvironmentOptions(null, "en-US");
            _environment = await CoreWebView2Environment.CreateAsync(null, userDataFolder, options);
            return _environment;
        }
        finally
        {
            _lock.Release();
        }
    }
}
