using System.Windows;
using System.Windows.Input;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using XTweetCleaner.Core.Contracts.Services;
using XTweetCleaner.UI.Contracts.Services;

namespace XTweetCleaner.UI.ViewModels;

public partial class MainViewModel : ObservableObject
{
    private readonly IWebViewCookieService _cookieService;
    private readonly IXService _xService;
    private Microsoft.Web.WebView2.Wpf.WebView2 _webView;
    public ICommand DeleteAllPostsCommand { get; }

    [ObservableProperty]
    private string _source = "https://x.com";

    public MainViewModel(IWebViewCookieService webViewCookieService, IXService xService)
    {
        _cookieService = webViewCookieService;
        _xService = xService;
        DeleteAllPostsCommand = new AsyncRelayCommand(ExecuteDeleteAllPostsAsync);
    }

    private async Task ExecuteDeleteAllPostsAsync()
    {
        var (authToken, ct0) = await _cookieService.GetTwitterCookiesAsync(_webView.CoreWebView2);

        if (string.IsNullOrEmpty(authToken) || string.IsNullOrEmpty(ct0))
        {
            //await _dialogCoordinator.ShowMessageAsync(this, "Login Required", "Please log in to continue.");
            return;
        }

        var result = await _xService.DeleteAllTweetsAsync(authToken, ct0);

        MessageBox.Show(result.IsSuccess ? "Deleted." : $"Error: {result.ErrorMessage}");

        //if (_webView?.CoreWebView2 == null)
        //    return;

        //var cookies = await _webView.CoreWebView2.CookieManager.GetCookiesAsync("https://x.com");

        //string authToken = null, ct0 = null;
        //foreach (var cookie in cookies)
        //{
        //    if (cookie.Name == "auth_token") authToken = cookie.Value;
        //    if (cookie.Name == "ct0") ct0 = cookie.Value;
        //}

        //if (string.IsNullOrEmpty(authToken) || string.IsNullOrEmpty(ct0))
        //{
        //    MessageBox.Show("Authentication cookies not found. Please ensure you're logged in.");
        //    return;
        //}



        //var httpClient = new HttpClient();
        //httpClient.DefaultRequestHeaders.Add("Authorization", "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAA...");
        //httpClient.DefaultRequestHeaders.Add("Cookie", $"auth_token={authToken}; ct0={ct0}");
        //httpClient.DefaultRequestHeaders.Add("x-csrf-token", ct0);
        //httpClient.DefaultRequestHeaders.Add("x-twitter-auth-type", "OAuth2Session");
        //httpClient.DefaultRequestHeaders.Add("x-twitter-active-user", "yes");
        //httpClient.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0");

        //// Step 1: Get account info
        //var userResponse = await httpClient.GetAsync("https://api.twitter.com/1.1/account/settings.json");
        //if (!userResponse.IsSuccessStatusCode)
        //{
        //    MessageBox.Show("Failed to get account info.");
        //    return;
        //}

        //dynamic accountData = Newtonsoft.Json.JsonConvert.DeserializeObject(await userResponse.Content.ReadAsStringAsync());
        //string screenName = accountData.screen_name;

        //// Step 2: Get tweet IDs (simplified, real API is paginated)
        //var timelineResponse = await httpClient.GetAsync($"https://api.twitter.com/2/timeline/profile/{screenName}.json");
        //if (!timelineResponse.IsSuccessStatusCode)
        //{
        //    MessageBox.Show("Failed to load tweets.");
        //    return;
        //}

        //string json = await timelineResponse.Content.ReadAsStringAsync();
        //dynamic timeline = Newtonsoft.Json.JsonConvert.DeserializeObject(json);

        //var tweetIds = new List<string>();
        //foreach (var entry in timeline.globalObjects.tweets)
        //{
        //    tweetIds.Add(entry.Name); // Entry is a KeyValuePair
        //}

        //// Step 3: Delete tweets
        //foreach (var tweetId in tweetIds)
        //{
        //    var deleteResponse = await httpClient.PostAsync($"https://api.twitter.com/1.1/statuses/destroy/{tweetId}.json", null);
        //    if (!deleteResponse.IsSuccessStatusCode)
        //    {
        //        Console.WriteLine($"Failed to delete tweet {tweetId}");
        //    }
        //}

        //MessageBox.Show("Finished deleting tweets.");
    }

    public void Initialize(Microsoft.Web.WebView2.Wpf.WebView2 webView)
    {
        _webView = webView;
    }

    //public async Task OnNavigationCompletedAsync(object sender, CoreWebView2NavigationCompletedEventArgs e)
    //{
    //    IsLoading = false;
    //    if (e != null && !e.IsSuccess)
    //    {
    //        IsShowingFailedMessage = true;
    //    }

    //    BrowserBackCommand.NotifyCanExecuteChanged();
    //    BrowserForwardCommand.NotifyCanExecuteChanged();


    //    var cookieManager = _webView.CoreWebView2.CookieManager;
    //    var cookies = await cookieManager.GetCookiesAsync("https://x.com");

    //    foreach (var cookie in cookies)
    //    {
    //        Console.WriteLine($"{cookie.Name} = {cookie.Value}");
    //        Debug.WriteLine($"{cookie.Name} = {cookie.Value}");
    //    }

    //}
}
