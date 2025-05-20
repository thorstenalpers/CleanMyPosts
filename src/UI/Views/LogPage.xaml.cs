using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using CleanMyPosts.UI.ViewModels;

namespace CleanMyPosts.UI.Views;

public partial class LogPage : Page
{

    public LogPage(LogViewModel viewModel)
    {
        InitializeComponent();
        DataContext = viewModel;
    }

    private void TextBox_PreviewMouseLeftButtonDown(object sender, MouseButtonEventArgs e)
    {
        if (sender is not TextBox tb)
            return;

        if (e.ClickCount == 2)
        {
            HandleDoubleClick(tb, e);
        }
        else if (e.ClickCount == 3)
        {
            HandleTripleClick(tb, e);
        }
    }

    private static void HandleDoubleClick(TextBox tb, MouseButtonEventArgs e)
    {
        tb.Focus();

        var pt = e.GetPosition(tb);
        var charIndex = tb.GetCharacterIndexFromPoint(pt, true);
        if (charIndex < 0)
        {
            tb.SelectAll();
        }
        else
        {
            SelectWordAt(tb, charIndex);
        }
        e.Handled = true;
    }

    private static void SelectWordAt(TextBox tb, int charIndex)
    {
        var text = tb.Text;
        var start = charIndex;
        var end = charIndex;

        while (start > 0 && !char.IsWhiteSpace(text[start - 1]))
        {
            start--;
        }

        while (end < text.Length && !char.IsWhiteSpace(text[end]))
        {
            end++;
        }

        tb.Select(start, end - start);
    }

    private static void HandleTripleClick(TextBox tb, MouseButtonEventArgs e)
    {
        tb.Focus();
        tb.SelectAll();
        e.Handled = true;

        var listView = FindAncestor<ListView>(tb);
        if (listView != null)
        {
            listView.SelectedItem = tb.DataContext;
        }
    }

    private static T FindAncestor<T>(DependencyObject current) where T : DependencyObject
    {
        while (current != null)
        {
            if (current is T t)
            {
                return t;
            }

            current = VisualTreeHelper.GetParent(current);
        }
        return null;
    }
}
