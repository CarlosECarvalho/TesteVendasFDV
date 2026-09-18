using System.Data;
using Dapper;
using VendasApi.DTOs;
using VendasApi.Infrastructure;
using VendasApi.Models;

namespace VendasApi.Repositories;

public interface IPedidoRepository
{
    Task<IEnumerable<PedidoResumoDto>> GetAllAsync(PedidoFiltroDto? filtro);
    Task<PedidoDetalheDto?> GetByIdAsync(int codPedido);
    Task<int> CreatePedidoComItensAsync(Pedido pedido, List<ItemPedido> itens);
}

public class PedidoRepository : IPedidoRepository
{
    private readonly IDbConnectionFactory _connectionFactory;

    public PedidoRepository(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<IEnumerable<PedidoResumoDto>> GetAllAsync(PedidoFiltroDto? filtro)
    {
        using var connection = _connectionFactory.CreateConnection();

        var sql = @"
            SELECT 
                p.CodPedido,
                p.DataPedido,
                p.ValorTotal,
                c.CodCliente,
                c.Nome AS NomeCliente,
                c.CNPJ AS CNPJCliente,
                ISNULL(SUM(ip.Quantidade), 0) AS TotalItens
            FROM Pedido p
            INNER JOIN Cliente c ON p.CodCliente = c.CodCliente
            LEFT JOIN ItensPedido ip ON p.CodPedido = ip.CodPedido
            WHERE 1=1
        ";

        var parameters = new DynamicParameters();

        if (filtro != null)
        {
            if (filtro.DataInicio.HasValue)
            {
                sql += " AND p.DataPedido >= @DataInicio";
                parameters.Add("DataInicio", filtro.DataInicio.Value.Date);
            }

            if (filtro.DataFim.HasValue)
            {
                sql += " AND p.DataPedido <= @DataFim";
                parameters.Add("DataFim", filtro.DataFim.Value.Date.AddDays(1).AddTicks(-1));
            }

            if (!string.IsNullOrWhiteSpace(filtro.Cliente))
            {
                var termo = "%" + filtro.Cliente.Trim() + "%";
                var digitos = new string(filtro.Cliente.Where(char.IsDigit).ToArray());

                if (!string.IsNullOrEmpty(digitos))
                {
                    var termoLimpo = "%" + digitos + "%";
                    sql += @" AND (
                        c.Nome LIKE @Termo 
                        OR c.CNPJ LIKE @Termo 
                        OR REPLACE(REPLACE(REPLACE(c.CNPJ, '.', ''), '-', ''), '/', '') LIKE @TermoLimpo
                    )";
                    parameters.Add("TermoLimpo", termoLimpo);
                }
                else
                {
                    sql += @" AND (
                        c.Nome LIKE @Termo 
                        OR c.CNPJ LIKE @Termo
                    )";
                }

                parameters.Add("Termo", termo);
            }
        }

        sql += @"
            GROUP BY p.CodPedido, p.DataPedido, p.ValorTotal, c.CodCliente, c.Nome, c.CNPJ
            ORDER BY p.DataPedido DESC, p.CodPedido DESC
        ";

        return await connection.QueryAsync<PedidoResumoDto>(sql, parameters);
    }

    public async Task<PedidoDetalheDto?> GetByIdAsync(int codPedido)
    {
        using var connection = _connectionFactory.CreateConnection();

        const string sqlPedido = @"
            SELECT 
                p.CodPedido,
                p.DataPedido,
                p.ValorTotal,
                c.CodCliente,
                c.CNPJ,
                c.Nome,
                c.Email,
                c.DataCadastro
            FROM Pedido p
            INNER JOIN Cliente c ON p.CodCliente = c.CodCliente
            WHERE p.CodPedido = @CodPedido";

        var pedidoData = await connection.QueryAsync<PedidoDetalheDto, ClienteDto, PedidoDetalheDto>(
            sqlPedido,
            (pedido, cliente) =>
            {
                pedido.Cliente = cliente;
                return pedido;
            },
            new { CodPedido = codPedido },
            splitOn: "CodCliente"
        );

        var pedidoDto = pedidoData.FirstOrDefault();
        if (pedidoDto == null) return null;

        const string sqlItens = @"
            SELECT 
                ip.CodPedido,
                ip.CodProduto,
                prod.Nome AS NomeProduto,
                ip.Quantidade,
                ip.PrecoUnitario
            FROM ItensPedido ip
            INNER JOIN Produto prod ON ip.CodProduto = prod.CodProduto
            WHERE ip.CodPedido = @CodPedido";

        var itens = await connection.QueryAsync<ItemPedidoDetalheDto>(sqlItens, new { CodPedido = codPedido });
        pedidoDto.Itens = itens.ToList();

        return pedidoDto;
    }

    public async Task<int> CreatePedidoComItensAsync(Pedido pedido, List<ItemPedido> itens)
    {
        using var connection = _connectionFactory.CreateConnection();
        connection.Open();
        using var transaction = connection.BeginTransaction();

        try
        {
            // 1. Inserir Pedido
            const string sqlPedido = @"
                INSERT INTO Pedido (CodCliente, DataPedido, ValorTotal)
                VALUES (@CodCliente, @DataPedido, @ValorTotal);
                SELECT CAST(SCOPE_IDENTITY() as int);";

            var codPedido = await connection.ExecuteScalarAsync<int>(sqlPedido, pedido, transaction);
            pedido.CodPedido = codPedido;

            // 2. Inserir Itens do Pedido e Atualizar Estoque
            const string sqlItem = @"
                INSERT INTO ItensPedido (CodPedido, CodProduto, Quantidade, PrecoUnitario)
                VALUES (@CodPedido, @CodProduto, @Quantidade, @PrecoUnitario);";

            const string sqlUpdateEstoque = @"
                UPDATE Produto 
                SET Estoque = Estoque - @Quantidade 
                WHERE CodProduto = @CodProduto AND Estoque >= @Quantidade;";

            foreach (var item in itens)
            {
                item.CodPedido = codPedido;
                await connection.ExecuteAsync(sqlItem, item, transaction);

                var rowsAffected = await connection.ExecuteAsync(sqlUpdateEstoque, new 
                { 
                    Quantidade = item.Quantidade, 
                    CodProduto = item.CodProduto 
                }, transaction);

                if (rowsAffected == 0)
                {
                    throw new BusinessRuleException($"Estoque insuficiente ou concorrente para o produto com ID {item.CodProduto}.");
                }
            }

            transaction.Commit();
            return codPedido;
        }
        catch
        {
            transaction.Rollback();
            throw;
        }
    }
}

