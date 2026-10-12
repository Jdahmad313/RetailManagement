using System.Net;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using RetailManagement.Application.Common;
using RetailManagement.Application.Common.Exceptions;

namespace RetailManagement.API.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;
    private readonly IHostEnvironment _env;

    public ExceptionHandlingMiddleware(
        RequestDelegate next,
        ILogger<ExceptionHandlingMiddleware> logger,
        IHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception occurred: {Message}", ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        var response = new ApiResponse<object>
        {
            Success = false,
            TraceId = context.TraceIdentifier
        };

        switch (exception)
        {
            case NotFoundException notFound:
                context.Response.StatusCode = (int)HttpStatusCode.NotFound;
                response.Message = notFound.Message;
                break;

            case ValidationException valEx:
                context.Response.StatusCode = (int)HttpStatusCode.UnprocessableEntity;
                response.Message = valEx.Message;
                response.Errors = valEx.Errors;
                break;

            case BadRequestException badReq:
                context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                response.Message = badReq.Message;
                break;

            case UnauthorizedException unauth:
                context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
                response.Message = unauth.Message;
                break;

            case DbUpdateConcurrencyException:
                context.Response.StatusCode = (int)HttpStatusCode.Conflict;
                response.Message = "A concurrency conflict occurred. The record was modified by another operation. Please reload and try again.";
                break;

            default:
                context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                response.Message = _env.IsDevelopment()
                    ? $"An unexpected error occurred: {exception.Message}"
                    : "An unexpected error occurred on the server. Please try again later.";
                break;
        }

        var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        var json = JsonSerializer.Serialize(response, options);
        await context.Response.WriteAsync(json);
    }
}
