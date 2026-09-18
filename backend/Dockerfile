FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copiar arquivos de projeto e restaurar dependências
COPY src/VendasApi/VendasApi.csproj src/VendasApi/
RUN dotnet restore src/VendasApi/VendasApi.csproj

# Copiar todo o código e publicar
COPY . .
RUN dotnet publish src/VendasApi/VendasApi.csproj -c Release -o /app/publish

# Imagem de runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:5000
EXPOSE 5000

ENTRYPOINT ["dotnet", "VendasApi.dll"]

