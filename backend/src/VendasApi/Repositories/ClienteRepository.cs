using Dapper;
using VendasApi.Infrastructure;
using VendasApi.Models;

namespace VendasApi.Repositories;

public interface IClienteRepository
{
    Task<IEnumerable<Cliente>> GetAllAsync();
    Task<Cliente?> GetByIdAsync(int codCliente);
    Task<Cliente?> GetByCnpjAsync(string cnpj);
    Task<int> CreateAsync(Cliente cliente);
}

public class ClienteRepository : IClienteRepository
{
    private readonly IDbConnectionFactory _connectionFactory;

    public ClienteRepository(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<IEnumerable<Cliente>> GetAllAsync()
    {
        using var connection = _connectionFactory.CreateConnection();
        const string sql = "SELECT CodCliente, CNPJ, Nome, Email, DataCadastro FROM Cliente ORDER BY Nome ASC";
        return await connection.QueryAsync<Cliente>(sql);
    }

    public async Task<Cliente?> GetByIdAsync(int codCliente)
    {
        using var connection = _connectionFactory.CreateConnection();
        const string sql = "SELECT CodCliente, CNPJ, Nome, Email, DataCadastro FROM Cliente WHERE CodCliente = @CodCliente";
        return await connection.QueryFirstOrDefaultAsync<Cliente>(sql, new { CodCliente = codCliente });
    }

    public async Task<Cliente?> GetByCnpjAsync(string cnpj)
    {
        using var connection = _connectionFactory.CreateConnection();
        // Remove pontuações para flexibilidade de consulta
        var cnpjLimpo = new string(cnpj.Where(char.IsDigit).ToArray());
        const string sql = @"
            SELECT CodCliente, CNPJ, Nome, Email, DataCadastro 
            FROM Cliente 
            WHERE REPLACE(REPLACE(REPLACE(CNPJ, '.', ''), '-', ''), '/', '') = @CnpjLimpo
               OR CNPJ = @CnpjOriginal";
        return await connection.QueryFirstOrDefaultAsync<Cliente>(sql, new { CnpjLimpo = cnpjLimpo, CnpjOriginal = cnpj });
    }

    public async Task<int> CreateAsync(Cliente cliente)
    {
        using var connection = _connectionFactory.CreateConnection();
        const string sql = @"
            INSERT INTO Cliente (CNPJ, Nome, Email, DataCadastro)
            VALUES (@CNPJ, @Nome, @Email, @DataCadastro);
            SELECT CAST(SCOPE_IDENTITY() as int);";
        return await connection.ExecuteScalarAsync<int>(sql, cliente);
    }
}

