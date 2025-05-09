using System.Windows.Controls;

namespace XTweetCleaner.UI.Contracts.Services;

public interface IPageService
{
    Type GetPageType(string key);

    Page GetPage(string key);
}
