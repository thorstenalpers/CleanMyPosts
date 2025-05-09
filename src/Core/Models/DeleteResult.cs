namespace XTweetCleaner.Core.Models;
public class DeleteResult
{
    public bool IsSuccess { get; }
    public string ErrorMessage { get; }

    private DeleteResult(bool success, string error = null)
    {
        IsSuccess = success;
        ErrorMessage = error;
    }

    public static DeleteResult Success() => new(true);
    public static DeleteResult Failure(string error) => new(false, error);
}
