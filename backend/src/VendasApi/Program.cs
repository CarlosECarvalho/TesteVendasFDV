using VendasApi.Infrastructure;
using VendasApi.Repositories;
using VendasApi.Services;

var builder = WebApplication.CreateBuilder(args);

// 1. Configurar Serviços e Injeção de Dependências
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configuração de CORS para comunicação com o Next.js
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                  "http://localhost:3000", 
                  "http://127.0.0.1:3000",
                  "http://sistemavendasfgv.local",
                  "https://sistemavendasfgv.local",
                  "http://localhost",
                  "https://localhost"
              )
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Infraestrutura e Banco de Dados
builder.Services.AddSingleton<IDbConnectionFactory, DbConnectionFactory>();
builder.Services.AddTransient<DatabaseInitializer>();

// Repositórios (Dapper)
builder.Services.AddScoped<IClienteRepository, ClienteRepository>();
builder.Services.AddScoped<IProdutoRepository, ProdutoRepository>();
builder.Services.AddScoped<IPedidoRepository, PedidoRepository>();

// Serviços (Regras de Negócio)
builder.Services.AddScoped<IClienteService, ClienteService>();
builder.Services.AddScoped<IProdutoService, ProdutoService>();
builder.Services.AddScoped<IPedidoService, PedidoService>();

var app = builder.Build();

// 2. Inicialização do Banco de Dados e Carga de Seed
using (var scope = app.Services.CreateScope())
{
    var dbInitializer = scope.ServiceProvider.GetRequiredService<DatabaseInitializer>();
    try
    {
        dbInitializer.Initialize();
    }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Ocorreu um erro durante a inicialização do banco de dados.");
    }
}

// 3. Pipeline HTTP
app.UseMiddleware<ExceptionMiddleware>();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Vendas API v1");
    c.RoutePrefix = "swagger";
});

app.UseCors("AllowFrontend");

app.UseAuthorization();

app.MapControllers();

app.Run();
