using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace RetailManagement.API.Services;

public class RenderKeepAliveService : BackgroundService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<RenderKeepAliveService> _logger;

    public RenderKeepAliveService(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<RenderKeepAliveService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Wait 2 minutes after container startup before beginning keep-alive pings
        await Task.Delay(TimeSpan.FromMinutes(2), stoppingToken);

        var targetUrl = _configuration["Render:ExternalUrl"]
            ?? Environment.GetEnvironmentVariable("RENDER_EXTERNAL_URL")
            ?? "https://retailmanagement-jgpr.onrender.com/api/v1/health";

        _logger.LogInformation("RenderKeepAliveService activated. Scheduled to ping every 10 minutes: {Url}", targetUrl);

        using var periodicTimer = new PeriodicTimer(TimeSpan.FromMinutes(10));
        while (!stoppingToken.IsCancellationRequested && await periodicTimer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                var client = _httpClientFactory.CreateClient();
                client.Timeout = TimeSpan.FromSeconds(25);
                var response = await client.GetAsync(targetUrl, stoppingToken);
                _logger.LogInformation("Keep-alive heartbeat sent to {Url}: status {StatusCode} at {Time:u}",
                    targetUrl, (int)response.StatusCode, DateTime.UtcNow);
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Keep-alive heartbeat ping to {Url} had notice: {Message}", targetUrl, ex.Message);
            }
        }
    }
}
