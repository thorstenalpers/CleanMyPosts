using System.Collections;
using System.IO;
using Microsoft.Extensions.Options;
using XTweetCleaner.Core.Contracts.Services;
using XTweetCleaner.UI.Contracts.Services;
using XTweetCleaner.UI.Models;

namespace XTweetCleaner.UI.Services;

public class PersistAndRestoreService(IFileService fileService, IOptions<AppConfig> appConfig) : IPersistAndRestoreService
{
    private readonly IFileService _fileService = fileService;
    private readonly AppConfig _appConfig = appConfig.Value;
    private readonly string _localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);

    public void PersistData()
    {
        if (System.Windows.Application.Current.Properties != null)
        {
            var folderPath = Path.Combine(_localAppData, _appConfig.ConfigurationsFolder);
            var fileName = _appConfig.AppPropertiesFileName;
            _fileService.Save(folderPath, fileName, System.Windows.Application.Current.Properties);
        }
    }

    public void RestoreData()
    {
        var folderPath = Path.Combine(_localAppData, _appConfig.ConfigurationsFolder);
        var fileName = _appConfig.AppPropertiesFileName;
        var properties = _fileService.Read<IDictionary>(folderPath, fileName);
        if (properties != null)
        {
            foreach (DictionaryEntry property in properties)
            {
                System.Windows.Application.Current.Properties.Add(property.Key, property.Value);
            }
        }
    }
}
