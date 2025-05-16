﻿using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

namespace XTweetCleaner.UI.ViewModels;

public partial class ShellDialogViewModel : ObservableObject
{
    public Action<bool?> SetResult { get; set; }

    [RelayCommand]
    private void Close()
    {
        SetResult?.Invoke(true);
    }
}
