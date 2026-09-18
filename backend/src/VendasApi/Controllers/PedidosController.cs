using Microsoft.AspNetCore.Mvc;
using VendasApi.DTOs;
using VendasApi.Services;

namespace VendasApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class PedidosController : ControllerBase
{
    private readonly IPedidoService _pedidoService;

    public PedidosController(IPedidoService pedidoService)
    {
        _pedidoService = pedidoService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<PedidoResumoDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] PedidoFiltroDto filtro)
    {
        var pedidos = await _pedidoService.GetAllAsync(filtro);
        return Ok(pedidos);
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(PedidoDetalheDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var pedido = await _pedidoService.GetByIdAsync(id);
        return Ok(pedido);
    }

    [HttpPost]
    [ProducesResponseType(typeof(PedidoDetalheDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Create([FromBody] CreatePedidoDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var pedidoCriado = await _pedidoService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = pedidoCriado.CodPedido }, pedidoCriado);
    }
}

