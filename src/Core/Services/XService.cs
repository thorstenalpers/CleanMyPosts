using System.Text;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using XTweetCleaner.Core.Contracts.Services;

namespace XTweetCleaner.Core.Services;

public class XService : IXService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<XService> _logger;

    public XService(IHttpClientFactory httpClientFactory, ILogger<XService> logger)
    {
        _httpClientFactory = httpClientFactory ?? throw new ArgumentNullException(nameof(httpClientFactory));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task DeleteAllTweetsAsync(string authToken, string ct0, string screen_name, string operationId, CancellationToken cancellationToken = default)
    {
        var client = _httpClientFactory.CreateClient();

        const string bearerToken = "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA";
        client.DefaultRequestHeaders.Add("authorization", bearerToken);
        client.DefaultRequestHeaders.Add("x-csrf-token", ct0);
        client.DefaultRequestHeaders.Add("cookie", $"auth_token={authToken}; ct0={ct0}");
        client.DefaultRequestHeaders.Add("x-twitter-auth-type", "OAuth2Session");
        client.DefaultRequestHeaders.Add("x-twitter-active-user", "yes");

        var tweetIds = await FetchOwnTweetIdsAsync(client, operationId, screen_name, cancellationToken);

        _logger.LogInformation("Starting tweet deletion. Total tweets: {Count}", tweetIds.Count);

        int success = 0, fail = 0;
        foreach (var tweetId in tweetIds)
        {
            var url = $"https://x.com/i/api/graphql/{operationId}/DeleteTweet";
            var payload = new
            {
                variables = new { tweet_id = tweetId },
                queryId = operationId
            };

            var json = JsonConvert.SerializeObject(payload);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            HttpResponseMessage response = null;
            string result = null;
            var retries = 0;

            while (retries < 3)
            {
                response = await client.PostAsync(url, content, cancellationToken);
                result = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("Deleted tweet {TweetId}", tweetId);
                    success++;
                    break;
                }

                if ((int)response.StatusCode == 429)
                {
                    retries++;
                    var delay = TimeSpan.FromSeconds(Math.Pow(2, retries)); // 2s, 4s, 8s
                    _logger.LogWarning("Rate limited. Retrying in {Delay}s...", delay.TotalSeconds);
                    await Task.Delay(delay, cancellationToken);
                }
                else
                {
                    _logger.LogWarning("Failed to delete tweet {TweetId}. Status: {Status}. Body: {ResponseBody}", tweetId, response.StatusCode, result);
                    fail++;
                    break;
                }
            }
            await Task.Delay(TimeSpan.FromMilliseconds(400), cancellationToken);
        }
        _logger.LogInformation("Finished deleting tweets. Success: {Success}, Failed: {Failed}", success, fail);
    }

    private async Task<List<string>> FetchOwnTweetIdsAsync(HttpClient client, string operationId, string screen_name, CancellationToken cancellationToken)
    {
        var tweetIds = new List<string>();

        var userId = await GetUserIdAsync(client, operationId, screen_name, cancellationToken) ?? throw new Exception("Could not determine userId");
        var cursor = string.Empty;

        while (true)
        {
            var variables = new
            {
                userId,
                count = 40,
                cursor,
                includePromotedContent = false,
                withQuickPromoteEligibilityTweetFields = true,
                withVoice = true,
                withV2Timeline = true
            };

            var variablesJson = JsonConvert.SerializeObject(variables);
            var url = $"https://x.com/i/api/graphql/QUERY_ID/UserTweets?variables={Uri.EscapeDataString(variablesJson)}";

            var response = await client.GetAsync(url, cancellationToken);
            var content = await response.Content.ReadAsStringAsync();

            dynamic json = JsonConvert.DeserializeObject(content);

            var instructions = json?.data?.user?.result?.timeline_v2?.timeline?.instructions;
            if (instructions == null)
            {
                break;
            }

            foreach (var entry in instructions[0]?.entries ?? new JArray())
            {
                string entryId = entry.entryId;
                if (entryId.StartsWith("tweet-"))
                {
                    string tweetId = entry.content.itemContent.tweet_results.result.rest_id;
                    if (!string.IsNullOrEmpty(tweetId))
                    {
                        tweetIds.Add(tweetId);
                    }
                }
                else if (entryId.StartsWith("cursor-bottom"))
                {
                    cursor = entry.content.value;
                }
            }

            if (string.IsNullOrEmpty(cursor))
            {
                break;
            }
        }

        return tweetIds;
    }

    private async Task<string> GetUserIdAsync(HttpClient client, string operationId, string screenName, CancellationToken cancellationToken)
    {
        // Prepare GraphQL query payload
        var query = @"
    query UserByScreenName($screen_name: String!) {
      user(screen_name: $screen_name) {
        screen_name
      }
    }";

        var variables = new
        {
            screen_name = screenName
        };

        var body = new
        {
            query = query,
            variables = variables
        };

        // Serialize the payload to JSON
        var jsonPayload = JsonConvert.SerializeObject(body);

        // Make the POST request to the GraphQL endpoint
        var url = $"https://x.com/i/api/graphql/{operationId}/UserByScreenName";
        var response = await client.PostAsync(url, new StringContent(jsonPayload, Encoding.UTF8, "application/json"), cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Error fetching screen name from GraphQL. Status: {StatusCode}", response.StatusCode);
            return null;
        }

        var result = await response.Content.ReadAsStringAsync();
        var data = JsonConvert.DeserializeObject<dynamic>(result);

        // Extract the screen name from the response
        string screenNameResult = data?.data?.user?.screen_name;

        return screenNameResult;

        //var resp = await client.GetAsync($"https://x.com/i/api/graphql/{screen_name}/UserByScreenName", cancellationToken);


        //if (!resp.IsSuccessStatusCode)
        //{
        //    return null;
        //}

        //var body = await resp.Content.ReadAsStringAsync();
        //dynamic json = JsonConvert.DeserializeObject(body);

        //return json?.user_id;
    }
}