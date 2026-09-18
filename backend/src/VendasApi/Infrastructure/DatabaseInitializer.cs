using Dapper;
using Microsoft.Data.SqlClient;

namespace VendasApi.Infrastructure;

public class DatabaseInitializer
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<DatabaseInitializer> _logger;

    public DatabaseInitializer(IConfiguration configuration, ILogger<DatabaseInitializer> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public void Initialize()
    {
        var connectionString = _configuration.GetConnectionString("DefaultConnection") 
            ?? throw new InvalidOperationException("ConnectionString não encontrada.");

        var builder = new SqlConnectionStringBuilder(connectionString);
        var targetDb = builder.InitialCatalog;

        // 1. Garante que o banco de dados exista conectando ao master
        builder.InitialCatalog = "master";
        var masterConnString = builder.ConnectionString;

        try
        {
            using (var masterConn = new SqlConnection(masterConnString))
            {
                masterConn.Open();
                var checkDbSql = "IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = @DbName) CREATE DATABASE [" + targetDb + "];";
                masterConn.Execute(checkDbSql, new { DbName = targetDb });
                _logger.LogInformation("Banco de dados {DbName} verificado/criado com sucesso.", targetDb);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Não foi possível verificar a criação do banco via master. Tentando conectar diretamente ao banco alvo.");
        }

        // 2. Conecta ao banco de dados alvo e executa os DDLs e Seed
        using var connection = new SqlConnection(connectionString);
        connection.Open();

        // Tabela Cliente
        var createClienteSql = @"
            IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Cliente]') AND type in (N'U'))
            BEGIN
                CREATE TABLE [dbo].[Cliente] (
                    [CodCliente] INT IDENTITY(1,1) NOT NULL,
                    [CNPJ] VARCHAR(20) NOT NULL,
                    [Nome] VARCHAR(150) NOT NULL,
                    [Email] VARCHAR(150) NOT NULL,
                    [DataCadastro] DATETIME2 NOT NULL CONSTRAINT [DF_Cliente_DataCadastro] DEFAULT GETDATE(),
                    CONSTRAINT [PK_Cliente] PRIMARY KEY CLUSTERED ([CodCliente] ASC),
                    CONSTRAINT [UQ_Cliente_CNPJ] UNIQUE NONCLUSTERED ([CNPJ] ASC)
                );
            END";
        connection.Execute(createClienteSql);

        // Tabela Produto
        var createProdutoSql = @"
            IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Produto]') AND type in (N'U'))
            BEGIN
                CREATE TABLE [dbo].[Produto] (
                    [CodProduto] INT IDENTITY(1,1) NOT NULL,
                    [Nome] VARCHAR(150) NOT NULL,
                    [Preco] DECIMAL(18,2) NOT NULL,
                    [Estoque] INT NOT NULL CONSTRAINT [DF_Produto_Estoque] DEFAULT 0,
                    CONSTRAINT [PK_Produto] PRIMARY KEY CLUSTERED ([CodProduto] ASC)
                );
            END";
        connection.Execute(createProdutoSql);

        // Tabela Pedido
        var createPedidoSql = @"
            IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Pedido]') AND type in (N'U'))
            BEGIN
                CREATE TABLE [dbo].[Pedido] (
                    [CodPedido] INT IDENTITY(1,1) NOT NULL,
                    [CodCliente] INT NOT NULL,
                    [DataPedido] DATETIME2 NOT NULL CONSTRAINT [DF_Pedido_DataPedido] DEFAULT GETDATE(),
                    [ValorTotal] DECIMAL(18,2) NOT NULL CONSTRAINT [DF_Pedido_ValorTotal] DEFAULT 0.00,
                    CONSTRAINT [PK_Pedido] PRIMARY KEY CLUSTERED ([CodPedido] ASC),
                    CONSTRAINT [FK_Pedido_Cliente] FOREIGN KEY ([CodCliente]) 
                        REFERENCES [dbo].[Cliente] ([CodCliente]) ON DELETE NO ACTION
                );
            END";
        connection.Execute(createPedidoSql);

        // Tabela ItensPedido
        var createItensPedidoSql = @"
            IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ItensPedido]') AND type in (N'U'))
            BEGIN
                CREATE TABLE [dbo].[ItensPedido] (
                    [CodPedido] INT NOT NULL,
                    [CodProduto] INT NOT NULL,
                    [Quantidade] INT NOT NULL,
                    [PrecoUnitario] DECIMAL(18,2) NOT NULL,
                    CONSTRAINT [PK_ItensPedido] PRIMARY KEY CLUSTERED ([CodPedido] ASC, [CodProduto] ASC),
                    CONSTRAINT [FK_ItensPedido_Pedido] FOREIGN KEY ([CodPedido]) 
                        REFERENCES [dbo].[Pedido] ([CodPedido]) ON DELETE CASCADE,
                    CONSTRAINT [FK_ItensPedido_Produto] FOREIGN KEY ([CodProduto]) 
                        REFERENCES [dbo].[Produto] ([CodProduto]) ON DELETE NO ACTION
                );
            END";
        connection.Execute(createItensPedidoSql);

        // Seed Data
        var seedSql = @"
            -- Clientes
            IF NOT EXISTS (SELECT 1 FROM [dbo].[Cliente] WHERE [CNPJ] = '12.345.678/0001-90')
            BEGIN
                INSERT INTO [dbo].[Cliente] ([CNPJ], [Nome], [Email], [DataCadastro])
                VALUES ('12.345.678/0001-90', 'João da Silva', 'joao.silva@email.com', GETDATE());
            END

            IF NOT EXISTS (SELECT 1 FROM [dbo].[Cliente] WHERE [CNPJ] = '98.765.432/0001-10')
            BEGIN
                INSERT INTO [dbo].[Cliente] ([CNPJ], [Nome], [Email], [DataCadastro])
                VALUES ('98.765.432/0001-10', 'Tech Solutions Ltda', 'contato@techsolutions.com.br', GETDATE());
            END

            -- Produtos especificados no teste:
            -- 5 monitores e 0 teclados USB
            IF NOT EXISTS (SELECT 1 FROM [dbo].[Produto] WHERE [Nome] = 'Monitor LED 27"" Full HD')
            BEGIN
                INSERT INTO [dbo].[Produto] ([Nome], [Preco], [Estoque])
                VALUES ('Monitor LED 27"" Full HD', 1200.00, 5);
            END

            IF NOT EXISTS (SELECT 1 FROM [dbo].[Produto] WHERE [Nome] = 'Teclado USB Mecânico')
            BEGIN
                INSERT INTO [dbo].[Produto] ([Nome], [Preco], [Estoque])
                VALUES ('Teclado USB Mecânico', 150.00, 0);
            END

            IF NOT EXISTS (SELECT 1 FROM [dbo].[Produto] WHERE [Nome] = 'Mouse Óptico Sem Fio USB')
            BEGIN
                INSERT INTO [dbo].[Produto] ([Nome], [Preco], [Estoque])
                VALUES ('Mouse Óptico Sem Fio USB', 85.50, 15);
            END

            IF NOT EXISTS (SELECT 1 FROM [dbo].[Produto] WHERE [Nome] = 'Cabo HDMI 2.0 Blindado 2m')
            BEGIN
                INSERT INTO [dbo].[Produto] ([Nome], [Preco], [Estoque])
                VALUES ('Cabo HDMI 2.0 Blindado 2m', 35.00, 30);
            END

            IF NOT EXISTS (SELECT 1 FROM [dbo].[Produto] WHERE [Nome] = 'Headset Gamer USB com Microfone')
            BEGIN
                INSERT INTO [dbo].[Produto] ([Nome], [Preco], [Estoque])
                VALUES ('Headset Gamer USB com Microfone', 220.00, 8);
            END
        ";
        connection.Execute(seedSql);
        _logger.LogInformation("Banco de dados, tabelas e seeds inicializados com sucesso.");
    }
}

