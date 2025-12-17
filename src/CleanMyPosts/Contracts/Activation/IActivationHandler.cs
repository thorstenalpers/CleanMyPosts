namespace CleanMyPosts.Contracts.Activation;

public interface IActivationHandler
{
    bool CanHandle();

    Task HandleAsync();
}