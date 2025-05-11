namespace XTweetCleaner.Core.Contracts.Services;

public interface IXService
{
    Task DeleteAllTweetsAsync(string authToken, string ct0, string screen_name, string operationId, CancellationToken cancellationToken = default);
}
