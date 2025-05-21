using System.Windows;
using CleanMyPosts.UI.TemplateSelectors;
using FluentAssertions;
using MahApps.Metro.Controls;
using Xunit;

namespace CleanMyPosts.Tests.TemplateSelectors;

[Trait("Category", "Unit")]
public class MenuItemTemplateSelectorTests
{
    private readonly MenuItemTemplateSelector _selector;
    private readonly DataTemplate _glyphTemplate;
    private readonly DataTemplate _imageTemplate;
    private readonly DataTemplate _iconTemplate;

    public MenuItemTemplateSelectorTests()
    {
        _glyphTemplate = new DataTemplate();
        _imageTemplate = new DataTemplate();
        _iconTemplate = new DataTemplate();

        _selector = new MenuItemTemplateSelector
        {
            GlyphDataTemplate = _glyphTemplate,
            ImageDataTemplate = _imageTemplate,
            IconDataTemplate = _iconTemplate
        };
    }

    [Fact]
    public void SelectTemplate_WithGlyphItem_ReturnsGlyphDataTemplate()
    {
        // Arrange
        var item = new HamburgerMenuGlyphItem();

        // Act
        var result = _selector.SelectTemplate(item, null);

        // Assert
        result.Should().Be(_glyphTemplate);
    }

    [Fact]
    public void SelectTemplate_WithImageItem_ReturnsImageDataTemplate()
    {
        // Arrange
        var item = new HamburgerMenuImageItem();

        // Act
        var result = _selector.SelectTemplate(item, null);

        // Assert
        result.Should().Be(_imageTemplate);
    }

    [Fact]
    public void SelectTemplate_WithIconItem_ReturnsIconDataTemplate()
    {
        // Arrange
        var item = new HamburgerMenuIconItem();

        // Act
        var result = _selector.SelectTemplate(item, null);

        // Assert
        result.Should().Be(_iconTemplate);
    }

    [Fact]
    public void SelectTemplate_WithUnknownItem_ReturnsBaseSelectTemplateResult()
    {
        // Arrange
        var unknownItem = new object();

        // Act
        var result = _selector.SelectTemplate(unknownItem, null);

        // Assert
        // Since base.SelectTemplate returns null by default, expect null here
        result.Should().BeNull();
    }

    [Fact]
    public void SelectTemplate_WithNullItem_ReturnsBaseSelectTemplateResult()
    {
        // Arrange
        object nullItem = null;

        // Act
        var result = _selector.SelectTemplate(nullItem, null);

        // Assert
        result.Should().BeNull();
    }
}