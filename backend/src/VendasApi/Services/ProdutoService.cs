using VendasApi.DTOs;
using VendasApi.Infrastructure;
using VendasApi.Models;
using VendasApi.Repositories;

namespace VendasApi.Services;

public interface IProdutoService
{
    Task<IEnumerable<ProdutoDto>> GetAllAsync();
    Task<ProdutoDto> GetByIdAsync(int codProduto);
    Task<ProdutoDto> CreateAsync(CreateProdutoDto dto);
}

public class ProdutoService : IProdutoService
{
    private readonly IProdutoRepository _produtoRepository;

    public ProdutoService(IProdutoRepository produtoRepository)
    {
        _produtoRepository = produtoRepository;
    }

    public async Task<IEnumerable<ProdutoDto>> GetAllAsync()
    {
        var produtos = await _produtoRepository.GetAllAsync();
        return produtos.Select(p => new ProdutoDto
        {
            CodProduto = p.CodProduto,
            Nome = p.Nome,
            Preco = p.Preco,
            Estoque = p.Estoque
        });
    }

    public async Task<ProdutoDto> GetByIdAsync(int codProduto)
    {
        var produto = await _produtoRepository.GetByIdAsync(codProduto);
        if (produto == null)
        {
            throw new NotFoundException($"Produto com ID {codProduto} não foi encontrado.");
        }

        return new ProdutoDto
        {
            CodProduto = produto.CodProduto,
            Nome = produto.Nome,
            Preco = produto.Preco,
            Estoque = produto.Estoque
        };
    }

    public async Task<ProdutoDto> CreateAsync(CreateProdutoDto dto)
    {
        if (dto.Preco <= 0)
        {
            throw new BusinessRuleException("O preço do produto deve ser maior que zero.");
        }

        if (dto.Estoque < 0)
        {
            throw new BusinessRuleException("A quantidade em estoque não pode ser negativa.");
        }

        var produto = new Produto
        {
            Nome = dto.Nome.Trim(),
            Preco = dto.Preco,
            Estoque = dto.Estoque
        };

        var codProduto = await _produtoRepository.CreateAsync(produto);
        produto.CodProduto = codProduto;

        return new ProdutoDto
        {
            CodProduto = produto.CodProduto,
            Nome = produto.Nome,
            Preco = produto.Preco,
            Estoque = produto.Estoque
        };
    }
}

