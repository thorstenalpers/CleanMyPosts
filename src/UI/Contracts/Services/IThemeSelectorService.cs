using XTweetCleaner.UI.Models;

namespace XTweetCleaner.UI.Contracts.Services;

public interface IThemeSelectorService
{
    void InitializeTheme();
    void SetTheme(AppTheme theme);
    AppTheme GetCurrentTheme();
}
