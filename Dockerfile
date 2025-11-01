FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# copy csproj and restore as distinct layers
COPY ["stretch-scheduler.csproj", "./"]
RUN dotnet restore "stretch-scheduler.csproj"

# copy all remaining source files (respects .dockerignore)
COPY . .

# publish the application
RUN dotnet publish "stretch-scheduler.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# Render routes traffic to port 10000 internally; container should listen on 8080
ENV ASPNETCORE_URLS=http://+:${PORT:-8080}

EXPOSE 8080

COPY --from=build /app/publish .

EXPOSE 8080
ENTRYPOINT ["dotnet", "stretch-scheduler.dll"]


