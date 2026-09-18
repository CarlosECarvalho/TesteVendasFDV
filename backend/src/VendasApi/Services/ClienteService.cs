using VendasApi.DTOs;
using VendasApi.Infrastructure;
using VendasApi.Models;
using VendasApi.Repositories;

namespace VendasApi.Services;

public interface IClienteService
{
    Task<IEnumerable<ClienteDto>> GetAllAsync();
    Task<ClienteDto> GetByIdAsync(int codCliente);
    Task<ClienteDto> GetByCnpjAsync(string cnpj);
    Task<ClienteDto> CreateAsync(CreateClienteDto dto);
}

public class ClienteService : IClienteService
{
    private readonly IClienteRepository _clienteRepository;

    public ClienteService(IClienteRepository clienteRepository)
    {
        _clienteRepository = clienteRepository;
    }

    public async Task<IEnumerable<ClienteDto>> GetAllAsync()
    {
        var clientes = await _clienteRepository.GetAllAsync();
        return clientes.Select(c => new ClienteDto
        {
            CodCliente = c.CodCliente,
            CNPJ = c.CNPJ,
            Nome = c.Nome,
            Email = c.Email,
            DataCadastro = c.DataCadastro
        });
    }

    public async Task<ClienteDto> GetByIdAsync(int codCliente)
    {
        var cliente = await _clienteRepository.GetByIdAsync(codCliente);
        if (cliente == null)
        {
            throw new NotFoundException($"Cliente com ID {codCliente} não foi encontrado.");
        }

        return new ClienteDto
        {
            CodCliente = cliente.CodCliente,
            CNPJ = cliente.CNPJ,
            Nome = cliente.Nome,
            Email = cliente.Email,
            DataCadastro = cliente.DataCadastro
        };
    }

    public async Task<ClienteDto> GetByCnpjAsync(string cnpj)
    {
        if (string.IsNullOrWhiteSpace(cnpj))
        {
            throw new BusinessRuleException("O CNPJ deve ser informado.");
        }

        var cliente = await _clienteRepository.GetByCnpjAsync(cnpj);
        if (cliente == null)
        {
            throw new NotFoundException($"Cliente com CNPJ {cnpj} não foi encontrado.");
        }

        return new ClienteDto
        {
            CodCliente = cliente.CodCliente,
            CNPJ = cliente.CNPJ,
            Nome = cliente.Nome,
            Email = cliente.Email,
            DataCadastro = cliente.DataCadastro
        };
    }

    public async Task<ClienteDto> CreateAsync(CreateClienteDto dto)
    {
        // Validação de duplicidade de CNPJ
        var clienteExistente = await _clienteRepository.GetByCnpjAsync(dto.CNPJ);
        if (clienteExistente != null)
        {
            throw new ConflictException($"Já existe um cliente cadastrado com o CNPJ {dto.CNPJ}.");
        }

        var cliente = new Cliente
        {
            CNPJ = dto.CNPJ.Trim(),
            Nome = dto.Nome.Trim(),
            Email = dto.Email.Trim(),
            DataCadastro = DateTime.UtcNow
        };

        var codCliente = await _clienteRepository.CreateAsync(cliente);
        cliente.CodCliente = codCliente;

        return new ClienteDto
        {
            CodCliente = cliente.CodCliente,
            CNPJ = cliente.CNPJ,
            Nome = cliente.Nome,
            Email = cliente.Email,
            DataCadastro = cliente.DataCadastro
        };
    }
}

