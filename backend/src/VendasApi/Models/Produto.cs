namespace VendasApi.Models;

public class Produto
{
    public int CodProduto { get; set; }
    public string Nome { get; set; } = string.Empty;
    public decimal Preco { get; set; }
    public int Estoque { get; set; }
}

