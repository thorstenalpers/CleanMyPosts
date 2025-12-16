namespace CleanMyPosts.Tests.Converters;

using System.Globalization;
using CleanMyPosts.Converters;
using FluentAssertions;
using Xunit;

public enum SampleEnum
{
    First,
    Second,
    Third
}

[Trait("Category", "Unit")]
public class EnumToBooleanConverterTests
{
    private readonly EnumToBooleanConverter _converter;

    public EnumToBooleanConverterTests()
    {
        _converter = new EnumToBooleanConverter
        {
            EnumType = typeof(SampleEnum)
        };
    }

    [Theory]
    [InlineData(SampleEnum.First, "First", true)]
    [InlineData(SampleEnum.Second, "First", false)]
    [InlineData(SampleEnum.Third, "Third", true)]
    [InlineData(SampleEnum.First, "Second", false)]
    public void Convert_ShouldReturnExpectedBoolean(object value, string parameter, bool expected)
    {
        // Act
        var result = _converter.Convert(value, typeof(bool), parameter, CultureInfo.InvariantCulture);

        // Assert
        result.Should().Be(expected);
    }

    [Theory]
    [InlineData(true, "First", SampleEnum.First)]
    [InlineData(false, "Second", SampleEnum.Second)]
    [InlineData(true, "Third", SampleEnum.Third)]
    public void ConvertBack_ShouldReturnExpectedEnum(object value, string parameter, SampleEnum expected)
    {
        // Act
        var result = _converter.ConvertBack(value, typeof(SampleEnum), parameter, CultureInfo.InvariantCulture);

        // Assert
        result.Should().Be(expected);
    }

    [Fact]
    public void Convert_WithUndefinedEnumValue_ShouldReturnFalse()
    {
        // Arrange
        var invalidValue = 999; // Not defined in SampleEnum
        var parameter = "First";

        // Act
        var result = _converter.Convert(invalidValue, typeof(bool), parameter, CultureInfo.InvariantCulture);

        // Assert
        result.Should().Be(false);
    }

    [Fact]
    public void Convert_WithNullParameter_ShouldReturnFalse()
    {
        // Act
        var result = _converter.Convert(SampleEnum.First, typeof(bool), null, CultureInfo.InvariantCulture);

        // Assert
        result.Should().Be(false);
    }

    [Fact]
    public void ConvertBack_WithNullParameter_ShouldReturnNull()
    {
        // Act
        var result = _converter.ConvertBack(true, typeof(SampleEnum), null, CultureInfo.InvariantCulture);

        // Assert
        result.Should().BeNull();
    }
}
