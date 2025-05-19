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
        if (sender is TextBox tb)
        {
            if (e.ClickCount == 2)
            {
                tb.Focus();

                var pt = e.GetPosition(tb);
                var charIndex = tb.GetCharacterIndexFromPoint(pt, true);
                if (charIndex >= 0)
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
                else
                {
                    tb.SelectAll();
                }

                e.Handled = true;
            }
            else if (e.ClickCount == 3)
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
