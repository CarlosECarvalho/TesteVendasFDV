using System.Data;
using Dapper;
using VendasApi.Infrastructure;
using VendasApi.Models;

namespace VendasApi.Repositories;

public interface IProdutoRepository
{
    Task<IEnumerable<Produto>> GetAllAsync();
    Task<Produto?> GetByIdAsync(int codProduto);
    Task<int> CreateAsync(Produto produto);
    Task UpdateEstoqueAsync(int codProduto, int novoEstoque, IDbTransaction? transaction = null);
}

public class ProdutoRepository : IProdutoRepository
{
    private readonly IDbConnectionFactory _connectionFactory;

    public ProdutoRepository(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<IEnumerable<Produto>> GetAllAsync()
    {
        using var connection = _connectionFactory.CreateConnection();
        const string sql = "SELECT CodProduto, Nome, Preco, Estoque FROM Produto ORDER BY Nome ASC";
        return await connection.QueryAsync<Produto>(sql);
    }

    public async Task<Produto?> GetByIdAsync(int codProduto)
    {
        using var connection = _connectionFactory.CreateConnection();
        const string sql = "SELECT CodProduto, Nome, Preco, Estoque FROM Produto WHERE CodProduto = @CodProduto";
        return await connection.QueryFirstOrDefaultAsync<Produto>(sql, new { CodProduto = codProduto });
    }

    public async Task<int> CreateAsync(Produto produto)
    {
        using var connection = _connectionFactory.CreateConnection();
        const string sql = @"
            INSERT INTO Produto (Nome, Preco, Estoque)
            VALUES (@Nome, @Preco, @Estoque);
            SELECT CAST(SCOPE_IDENTITY() as int);";
        return await connection.ExecuteScalarAsync<int>(sql, produto);
    }

    public async Task UpdateEstoqueAsync(int codProduto, int novoEstoque, IDbTransaction? transaction = null)
    {
        const string sql = "UPDATE Produto SET Estoque = @Estoque WHERE CodProduto = @CodProduto";
        var param = new { Estoque = novoEstoque, CodProduto = codProduto };

        if (transaction != null)
        {
            if (transaction.Connection == null)
                throw new InvalidOperationException("A transação não possui uma conexão ativa.");
            await transaction.Connection.ExecuteAsync(sql, param, transaction);
        }
        else
        {
            using var connection = _connectionFactory.CreateConnection();
            await connection.ExecuteAsync(sql, param);
        }
    }
}
