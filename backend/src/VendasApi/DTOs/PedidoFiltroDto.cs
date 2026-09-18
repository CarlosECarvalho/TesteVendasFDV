namespace VendasApi.DTOs;

public class PedidoFiltroDto
{
    public DateTime? DataInicio { get; set; }
    public DateTime? DataFim { get; set; }
    public string? Cliente { get; set; }
}

