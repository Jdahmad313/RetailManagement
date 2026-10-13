# Multi-stage Dockerfile for .NET 8 Web API
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution projects and restore layers
COPY ["RetailManagement.Domain/RetailManagement.Domain.csproj", "RetailManagement.Domain/"]
COPY ["RetailManagement.Application/RetailManagement.Application.csproj", "RetailManagement.Application/"]
COPY ["RetailManagement.Infrastructure/RetailManagement.Infrastructure.csproj", "RetailManagement.Infrastructure/"]
COPY ["RetailManagement.API/RetailManagement.API.csproj", "RetailManagement.API/"]

RUN dotnet restore "RetailManagement.API/RetailManagement.API.csproj"

# Copy remaining source code
COPY . .

# Build and publish API
WORKDIR "/src/RetailManagement.API"
RUN dotnet publish "RetailManagement.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime Image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "RetailManagement.API.dll"]
