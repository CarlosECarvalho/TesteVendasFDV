using System.ComponentModel.DataAnnotations;

namespace VendasApi.DTOs;

public class CreatePedidoItemDto
{
    [Required(ErrorMessage = "O código do produto é obrigatório.")]
    [Range(1, int.MaxValue, ErrorMessage = "Código do produto inválido.")]
    public int CodProduto { get; set; }

    [Required(ErrorMessage = "A quantidade é obrigatória.")]
    [Range(1, int.MaxValue, ErrorMessage = "A quantidade deve ser de pelo menos 1 item.")]
    public int Quantidade { get; set; }

    [Range(0.01, 9999999.99, ErrorMessage = "O preço unitário deve ser maior que zero.")]
    public decimal? PrecoUnitario { get; set; }
}

public class CreatePedidoDto
{
    [Required(ErrorMessage = "O código do cliente é obrigatório.")]
    [Range(1, int.MaxValue, ErrorMessage = "Código do cliente inválido.")]
    public int CodCliente { get; set; }

    [Required(ErrorMessage = "O pedido deve conter pelo menos um item.")]
    [MinLength(1, ErrorMessage = "O pedido deve conter pelo menos um item.")]
    public List<CreatePedidoItemDto> Itens { get; set; } = new();
}

public class ItemPedidoDetalheDto
{
    public int CodPedido { get; set; }
    public int CodProduto { get; set; }
    public string NomeProduto { get; set; } = string.Empty;
    public int Quantidade { get; set; }
    public decimal PrecoUnitario { get; set; }
    public decimal Subtotal => Quantidade * PrecoUnitario;
}

public class PedidoDetalheDto
{
    public int CodPedido { get; set; }
    public DateTime DataPedido { get; set; }
    public decimal ValorTotal { get; set; }
    public ClienteDto Cliente { get; set; } = null!;
    public List<ItemPedidoDetalheDto> Itens { get; set; } = new();
}

public class PedidoResumoDto
{
    public int CodPedido { get; set; }
    public DateTime DataPedido { get; set; }
    public decimal ValorTotal { get; set; }
    public int CodCliente { get; set; }
    public string NomeCliente { get; set; } = string.Empty;
    public string CNPJCliente { get; set; } = string.Empty;
    public int TotalItens { get; set; }
}

