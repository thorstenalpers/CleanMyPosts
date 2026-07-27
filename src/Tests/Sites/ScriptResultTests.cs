using CleanMyPosts.Sites;
using FluentAssertions;
using Xunit;

namespace CleanMyPosts.Tests.Sites;

[Trait("Category", "Unit")]
public class ScriptResultTests
{
    [Theory]
    [InlineData("\\\"test\\\"", "test")]
    [InlineData("\"hello\"", "hello")]
    [InlineData("\\\"quoted\\\"", "quoted")]
    [InlineData("\"with spaces \"", "with spaces ")]
    public void Unwrap_ShouldCleanJsonCorrectly(string input, string expected)
    {
        // Act
        var result = ScriptResult.Unwrap(input);

        // Assert
        result.Should().Be(expected);
    }
}
