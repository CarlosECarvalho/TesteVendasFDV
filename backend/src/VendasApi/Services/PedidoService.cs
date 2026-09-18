using VendasApi.DTOs;
using VendasApi.Infrastructure;
using VendasApi.Models;
using VendasApi.Repositories;

namespace VendasApi.Services;

public interface IPedidoService
{
    Task<IEnumerable<PedidoResumoDto>> GetAllAsync(PedidoFiltroDto? filtro);
    Task<PedidoDetalheDto> GetByIdAsync(int codPedido);
    Task<PedidoDetalheDto> CreateAsync(CreatePedidoDto dto);
}

public class PedidoService : IPedidoService
{
    private readonly IPedidoRepository _pedidoRepository;
    private readonly IClienteRepository _clienteRepository;
    private readonly IProdutoRepository _produtoRepository;

    public PedidoService(
        IPedidoRepository pedidoRepository,
        IClienteRepository clienteRepository,
        IProdutoRepository produtoRepository)
    {
        _pedidoRepository = pedidoRepository;
        _clienteRepository = clienteRepository;
        _produtoRepository = produtoRepository;
    }

    public async Task<IEnumerable<PedidoResumoDto>> GetAllAsync(PedidoFiltroDto? filtro)
    {
        return await _pedidoRepository.GetAllAsync(filtro);
    }

    public async Task<PedidoDetalheDto> GetByIdAsync(int codPedido)
    {
        var pedido = await _pedidoRepository.GetByIdAsync(codPedido);
        if (pedido == null)
        {
            throw new NotFoundException($"Pedido número {codPedido} não foi encontrado.");
        }

        return pedido;
    }

    public async Task<PedidoDetalheDto> CreateAsync(CreatePedidoDto dto)
    {
        if (dto.Itens == null || !dto.Itens.Any())
        {
            throw new BusinessRuleException("O pedido deve conter pelo menos um item.");
        }

        // 1. Validar existência do cliente
        var cliente = await _clienteRepository.GetByIdAsync(dto.CodCliente);
        if (cliente == null)
        {
            throw new NotFoundException($"Cliente com ID {dto.CodCliente} não encontrado.");
        }

        // 2. Validar cada item e disponibilidade rigorosa de estoque
        decimal valorTotalCalculado = 0;
        var itensParaPersistir = new List<ItemPedido>();

        // Agrupar itens repetidos pelo mesmo produto, se houver
        var itensAgrupados = dto.Itens
            .GroupBy(i => i.CodProduto)
            .Select(g => new
            {
                CodProduto = g.Key,
                QuantidadeTotal = g.Sum(x => x.Quantidade),
                PrecoUnitario = g.First().PrecoUnitario
            });

        foreach (var item in itensAgrupados)
        {
            if (item.QuantidadeTotal <= 0)
            {
                throw new BusinessRuleException("A quantidade de cada produto deve ser maior que zero.");
            }

            var produto = await _produtoRepository.GetByIdAsync(item.CodProduto);
            if (produto == null)
            {
                throw new NotFoundException($"Produto com ID {item.CodProduto} não encontrado.");
            }

            // Regra principal do teste técnico:
            // Para que um produto seja incluído no pedido, é necessário que a quantidade solicitada esteja disponível em estoque.
            if (item.QuantidadeTotal > produto.Estoque)
            {
                throw new BusinessRuleException(
                    $"Não é possível incluir o produto '{produto.Nome}'. A quantidade solicitada ({item.QuantidadeTotal}) excede o estoque disponível ({produto.Estoque})."
                );
            }

            // Preço unitário definido ou padrão do produto
            var precoUnitario = (item.PrecoUnitario.HasValue && item.PrecoUnitario.Value > 0)
                ? item.PrecoUnitario.Value
                : produto.Preco;

            valorTotalCalculado += item.QuantidadeTotal * precoUnitario;

            itensParaPersistir.Add(new ItemPedido
            {
                CodProduto = item.CodProduto,
                Quantidade = item.QuantidadeTotal,
                PrecoUnitario = precoUnitario
            });
        }

        // 3. Montar Pedido com total recalculado
        var pedido = new Pedido
        {
            CodCliente = dto.CodCliente,
            DataPedido = DateTime.UtcNow,
            ValorTotal = valorTotalCalculado
        };

        // 4. Persistir com transação atômica
        var codPedidoCriado = await _pedidoRepository.CreatePedidoComItensAsync(pedido, itensParaPersistir);

        // 5. Retornar dados completos do pedido criado
        var pedidoCriado = await _pedidoRepository.GetByIdAsync(codPedidoCriado);
        return pedidoCriado!;
    }
}

