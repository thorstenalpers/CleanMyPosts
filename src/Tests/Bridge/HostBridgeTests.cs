using CleanMyPosts.Infrastructure;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace CleanMyPosts.Tests.Bridge;

[Trait("Category", "Unit")]
public class HostBridgeTests
{
    private readonly HostBridge _bridge = new(NullLogger<HostBridge>.Instance);

    private sealed record Params(int Value);
    private sealed record Result(int Doubled);

    [Fact]
    public async Task HandleAsync_DispatchesToRegisteredHandlerAndReturnsSuccessEnvelope()
    {
        _bridge.Register<Params, Result>("double", p => Task.FromResult(new Result(p.Value * 2)));

        var response = await _bridge.HandleAsync("""{"id":"1","method":"double","params":{"value":21}}""");

        response.Should().Contain("\"id\":\"1\"");
        response.Should().Contain("\"ok\":true");
        response.Should().Contain("\"doubled\":42");
    }

    [Fact]
    public async Task HandleAsync_ReturnsErrorEnvelope_ForUnknownMethod()
    {
        var response = await _bridge.HandleAsync("""{"id":"2","method":"nope","params":{}}""");

        response.Should().Contain("\"id\":\"2\"");
        response.Should().Contain("\"ok\":false");
        response.Should().Contain("Unknown bridge method");
    }

    [Fact]
    public async Task HandleAsync_ReturnsErrorEnvelope_WhenHandlerThrows()
    {
        _bridge.Register<Params, Result>("boom", _ => throw new InvalidOperationException("kaboom"));

        var response = await _bridge.HandleAsync("""{"id":"3","method":"boom","params":{"value":1}}""");

        response.Should().Contain("\"id\":\"3\"");
        response.Should().Contain("\"ok\":false");
        response.Should().Contain("kaboom");
    }

    [Fact]
    public async Task HandleAsync_ReturnsErrorEnvelope_ForMalformedJson()
    {
        var response = await _bridge.HandleAsync("not json");

        response.Should().Contain("\"ok\":false");
    }

    [Fact]
    public async Task HandleAsync_TreatsMissingParamsAsDefaultForVoidLikeMethods()
    {
        _bridge.Register<object, string>("ping", _ => Task.FromResult("pong"));

        var response = await _bridge.HandleAsync("""{"id":"4","method":"ping"}""");

        response.Should().Contain("\"ok\":true");
        response.Should().Contain("pong");
    }
}
