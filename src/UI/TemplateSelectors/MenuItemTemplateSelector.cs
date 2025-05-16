using System.Windows;
using System.Windows.Controls;
using MahApps.Metro.Controls;

namespace XTweetCleaner.UI.TemplateSelectors;

public class MenuItemTemplateSelector : DataTemplateSelector
{
    public DataTemplate GlyphDataTemplate { get; set; }
    public DataTemplate ImageDataTemplate { get; set; }
    public DataTemplate IconDataTemplate { get; set; }

    public override DataTemplate SelectTemplate(object item, DependencyObject container)
    {
        return item switch
        {
            HamburgerMenuGlyphItem _ => GlyphDataTemplate,
            HamburgerMenuImageItem _ => ImageDataTemplate,
            HamburgerMenuIconItem _ => IconDataTemplate,
            _ => base.SelectTemplate(item, container),
        };
    }
}