using Newtonsoft.Json;
using XTweetCleaner.Core.Contracts.Services;
using XTweetCleaner.Core.Models;

namespace XTweetCleaner.Core.Services;

public class XService : IXService
{
    private const string ollamaBaseUrl = "http://localhost:30347";
    private readonly IHttpClientFactory _httpClientFactory;

    public XService(IHttpClientFactory httpClientFactory)
    {
        _httpClientFactory = httpClientFactory ?? throw new ArgumentNullException(nameof(httpClientFactory));
    }

    public async Task<DeleteResult> DeleteAllTweetsAsync(string authToken, string ct0)
    {
        const string UserTweetsUrl = "https://twitter.com/i/api/graphql/SomeHash/UserTweets";
        //const string DeleteTweetUrl = "https://twitter.com/i/api/graphql/SomeOtherHash/DeleteTweet";

        var httpClient = _httpClientFactory.CreateClient();
        try
        {
            httpClient.DefaultRequestHeaders.Clear();
            httpClient.DefaultRequestHeaders.Add("Authorization", bearerToken);
            httpClient.DefaultRequestHeaders.Add("Cookie", $"auth_token={authToken}; ct0={ct0}");
            httpClient.DefaultRequestHeaders.Add("x-csrf-token", ct0);
            httpClient.DefaultRequestHeaders.Add("x-twitter-auth-type", "OAuth2Session");
            httpClient.DefaultRequestHeaders.Add("x-twitter-active-user", "yes");
            httpClient.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0");


            const string ViewerUrl = "https://twitter.com/i/api/graphql/0x3LHDLkIvWk9wUuVnFNoA/Viewer";

            var viewerResponse = await httpClient.GetAsync(ViewerUrl);
            if (!viewerResponse.IsSuccessStatusCode)
            {
                Console.WriteLine("Failed to get viewer info.");
                return null;
            }


            var queryParams = "?variables=" + Uri.EscapeDataString("{\"userId\":\"YOUR_USER_ID\",\"count\":40}");

            var tweetsResponse = await httpClient.GetAsync(UserTweetsUrl + queryParams);
            if (!tweetsResponse.IsSuccessStatusCode)
            {
                Console.WriteLine("Failed to fetch tweets");
                return null;
            }

            var json = await tweetsResponse.Content.ReadAsStringAsync();
            // Parse JSON to get tweet IDs
            dynamic tweetData = JsonConvert.DeserializeObject(json);
            var tweetIds = new List<string>();
            foreach (var instruction in tweetData.data.user.result.timeline_v2.timeline.instructions)
            {
                if (instruction.entries != null)
                {
                    foreach (var entry in instruction.entries)
                    {
                        var content = entry.content?.itemContent?.tweet_results?.result?.rest_id;
                        if (content != null)
                        {
                            tweetIds.Add((string)content);
                        }
                    }
                }
            }


            //// Get account settings (to fetch user screen_name)
            //var userResponse = await httpClient.GetAsync("https://api.x.com/2/account/settings.json"); // Adjusted URL for X.com


            //// Set default headers for all requests
            //httpClient.DefaultRequestHeaders.Clear();
            //httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {authToken}");
            //httpClient.DefaultRequestHeaders.Add("Cookie", $"auth_token={authToken}; ct0={ct0}");
            //httpClient.DefaultRequestHeaders.Add("x-csrf-token", ct0);
            //httpClient.DefaultRequestHeaders.Add("x-twitter-auth-type", "OAuth2Session");
            //httpClient.DefaultRequestHeaders.Add("x-twitter-active-user", "yes");
            //httpClient.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0");

            //// Step 1: Get account info to fetch screen_name
            //var userResponse = await httpClient.GetAsync("https://api.twitter.com/1.1/account/settings.json");
            //if (!userResponse.IsSuccessStatusCode)
            //{
            //    return DeleteResult.Failure("Failed to get account info.");
            //}

            //var content = await userResponse.Content.ReadAsStringAsync();

            //var accountData = Newtonsoft.Json.JsonConvert.DeserializeObject<AccountSettings>(content);
            //var screenName = accountData?.screen_name;

            //// Step 2: Get tweet IDs (simplified, real API is paginated)
            //var timelineResponse = await httpClient.GetAsync($"https://api.twitter.com/2/timeline/profile/{screenName}.json");
            //if (!timelineResponse.IsSuccessStatusCode)
            //{
            //    return DeleteResult.Failure("Failed to load tweets.");
            //}

            //var json = await timelineResponse.Content.ReadAsStringAsync();
            //var timeline = Newtonsoft.Json.JsonConvert.DeserializeObject<TimelineResponse>(json);

            //if ((timeline?.globalObjects?.tweets) == null)
            //{
            //    return DeleteResult.Failure("Failed to load tweets.");
            //}

            //var tweetIds = new List<string>();
            //foreach (var entry in timeline.globalObjects.tweets)
            //{
            //    tweetIds.Add(entry.Key);  // Entry is a KeyValuePair
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

            return DeleteResult.Success();
        }
        catch (Exception ex)
        {
            // Log exception (if you have a logging framework)
            return DeleteResult.Failure($"Error occurred: {ex.Message}");
        }
    }


    //public async Task<string> SendPromptViaHttpAsync(string model, string prompt)
    //{
    //    var httpClient = _httpClientFactory.CreateClient();
    //    try
    //    {
    //        var requestBody = new
    //        {
    //            model,
    //            prompt
    //        };

    //        var jsonContent = JsonConvert.SerializeObject(requestBody);
    //        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

    //        var response = await httpClient.PostAsync(ollamaEndpoint, content);

    //        if (response.IsSuccessStatusCode)
    //        {
    //            var responseBody = await response.Content.ReadAsStringAsync();
    //            return responseBody;
    //        }
    //        else
    //        {
    //            return $"Error: {response.StatusCode}";
    //        }
    //    }
    //    catch (Exception ex)
    //    {
    //        return $"Error: {ex.Message}";
    //    }
    //}   
}