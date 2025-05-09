using System.ComponentModel.DataAnnotations;
using System.Reflection;

namespace XTweetCleaner.UI.Helpers;

public static class EnumExtensions
{
    public static string GetDisplayName<TEnum>(this TEnum value) where TEnum : Enum
    {
        var field = value.GetType().GetField(value.ToString());
        var attribute = field?.GetCustomAttribute<DisplayAttribute>();
        return attribute?.Name ?? value.ToString();
    }
}
