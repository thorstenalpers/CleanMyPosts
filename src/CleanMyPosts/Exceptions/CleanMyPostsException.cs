namespace CleanMyPosts.Exceptions;

/// <summary>
/// Represents errors that occur within the CleanMyPosts system.
/// </summary>
public class CleanMyPostsException : System.Exception
{
    /// <summary>
    /// Initializes a new instance of the <see cref="CleanMyPostsException"/> class.
    /// </summary>
    public CleanMyPostsException()
    {
    }

    /// <summary>
    /// Initializes a new instance of the <see cref="CleanMyPostsException"/> class with a specified error message.
    /// </summary>
    /// <param name="message">The message that describes the error.</param>
    public CleanMyPostsException(string message)
        : base(message)
    {
    }

    /// <summary>
    /// Initializes a new instance of the <see cref="CleanMyPostsException"/> class with a specified error message and a reference to the inner exception that is the cause of this exception.
    /// </summary>
    /// <param name="message">The message that describes the error.</param>
    /// <param name="inner">The exception that is the cause of the current exception.</param>
    public CleanMyPostsException(string message, System.Exception inner)
        : base(message, inner)
    {
    }
}
