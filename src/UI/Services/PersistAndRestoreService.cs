using System.Collections;
using System.IO;
using CleanMyPosts.Core.Contracts.Services;
using CleanMyPosts.UI.Contracts.Services;
using CleanMyPosts.UI.Models;
using Microsoft.Extensions.Options;

namespace CleanMyPosts.UI.Services;

public class PersistAndRestoreService(IFileService fileService, IOptions<AppConfig> appConfig) : IPersistAndRestoreService
{
    private readonly IFileService _fileService = fileService;
    private readonly AppConfig _appConfig = appConfig.Value;
    private readonly string _localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);

    public void PersistData()
    {
        var props = System.Windows.Application.Current?.Properties;
        if (props != null && props.Count > 0)
        {
            var folderPath = Path.Combine(_localAppData, _appConfig.ConfigurationsFolder);
            var fileName = _appConfig.AppPropertiesFileName;
            _fileService.Save(folderPath, fileName, props);
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
