using CleanMyPosts.UI.Models;

namespace CleanMyPosts.UI.Contracts.Services;

public interface IThemeSelectorService
{
    void InitializeTheme();
    void SetTheme(AppTheme theme);
    AppTheme GetCurrentTheme();
}
