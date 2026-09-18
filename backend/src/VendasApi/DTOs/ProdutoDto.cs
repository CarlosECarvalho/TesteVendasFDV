using System.ComponentModel.DataAnnotations;

namespace VendasApi.DTOs;

public class ProdutoDto
{
    public int CodProduto { get; set; }
    public string Nome { get; set; } = string.Empty;
    public decimal Preco { get; set; }
    public int Estoque { get; set; }
}

public class CreateProdutoDto
{
    [Required(ErrorMessage = "O Nome do produto é obrigatório.")]
    [StringLength(150, MinimumLength = 2, ErrorMessage = "O Nome deve ter entre 2 e 150 caracteres.")]
    public string Nome { get; set; } = string.Empty;

    [Required(ErrorMessage = "O Preço é obrigatório.")]
    [Range(0.01, 9999999.99, ErrorMessage = "O Preço deve ser maior que zero.")]
    public decimal Preco { get; set; }

    [Required(ErrorMessage = "A Quantidade em Estoque é obrigatória.")]
    [Range(0, 1000000, ErrorMessage = "O Estoque não pode ser negativo.")]
    public int Estoque { get; set; }
}

