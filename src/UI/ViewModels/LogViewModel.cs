using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

namespace XTweetCleaner.UI.ViewModels;

public partial class LogViewModel : ObservableObject
{
    public ObservableCollection<string> LogEntries { get; } = [];

    public void AppendLog(string message)
    {
        LogEntries.Add(message);
    }

    [RelayCommand]
    private void ClearLog()
    {
        LogEntries.Clear();
    }
}
