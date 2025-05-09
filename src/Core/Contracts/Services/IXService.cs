using XTweetCleaner.Core.Models;

namespace XTweetCleaner.Core.Contracts.Services;

public interface IXService
{
    Task<DeleteResult> DeleteAllTweetsAsync(string authToken, string ct0);
}
