using System.Windows.Input;

using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using XTweetCleaner.UI.Contracts.Services;
using XTweetCleaner.UI.Contracts.ViewModels;
using XTweetCleaner.UI.Models;

namespace XTweetCleaner.UI.ViewModels;

public class SettingsViewModel : ObservableObject, INavigationAware
{
    private readonly IThemeSelectorService _themeSelectorService;
    private readonly IApplicationInfoService _applicationInfoService;
    private AppTheme _theme;
    private string _versionDescription;
    private ICommand _setThemeCommand;

    public AppTheme Theme
    {
        get { return _theme; }
        set { SetProperty(ref _theme, value); }
    }

    public string VersionDescription
    {
        get { return _versionDescription; }
        set { SetProperty(ref _versionDescription, value); }
    }

    public ICommand SetThemeCommand => _setThemeCommand ?? (_setThemeCommand = new RelayCommand<string>(OnSetTheme));

    public SettingsViewModel(IThemeSelectorService themeSelectorService, IApplicationInfoService applicationInfoService)
    {
        _themeSelectorService = themeSelectorService;
        _applicationInfoService = applicationInfoService;
    }

    public void OnNavigatedTo(object parameter)
    {
        VersionDescription = $"{Properties.Resources.AppDisplayName} - {_applicationInfoService.GetVersion()}";
        Theme = _themeSelectorService.GetCurrentTheme();
    }

    public void OnNavigatedFrom()
    {
    }

    private void OnSetTheme(string themeName)
    {
        var theme = (AppTheme)Enum.Parse(typeof(AppTheme), themeName);
        _themeSelectorService.SetTheme(theme);
    }
}
