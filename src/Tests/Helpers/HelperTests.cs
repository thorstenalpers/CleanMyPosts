using CleanMyPosts.UI.Helpers;
using FluentAssertions;
using Xunit;

namespace CleanMyPosts.Tests.Helpers;

[Trait("Category", "Unit")]
public class HelperTests
{
    [Theory]
    [InlineData("\\\"test\\\"", "test")]
    [InlineData("\"hello\"", "hello")]
    [InlineData("\\\"quoted\\\"", "quoted")]
    [InlineData("\"with spaces \"", "with spaces ")]
    public void CleanJsonResult_ShouldCleanJsonCorrectly(string input, string expected)
    {
        // Act
        var result = Helper.CleanJsonResult(input);

        // Assert
        result.Should().Be(expected);
    }
}