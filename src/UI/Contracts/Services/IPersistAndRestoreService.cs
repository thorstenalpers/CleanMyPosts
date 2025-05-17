namespace CleanMyPosts.UI.Contracts.Services;

public interface IPersistAndRestoreService
{
    void RestoreData();
    void PersistData();
}
