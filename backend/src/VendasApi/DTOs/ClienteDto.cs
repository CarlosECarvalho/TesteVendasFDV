using System.ComponentModel.DataAnnotations;

namespace VendasApi.DTOs;

public class ClienteDto
{
    public int CodCliente { get; set; }
    public string CNPJ { get; set; } = string.Empty;
    public string Nome { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public DateTime DataCadastro { get; set; }
}

public class CreateClienteDto
{
    [Required(ErrorMessage = "O CNPJ é obrigatório.")]
    [StringLength(20, MinimumLength = 14, ErrorMessage = "O CNPJ deve ter entre 14 e 20 caracteres.")]
    public string CNPJ { get; set; } = string.Empty;

    [Required(ErrorMessage = "O Nome é obrigatório.")]
    [StringLength(150, MinimumLength = 2, ErrorMessage = "O Nome deve ter entre 2 e 150 caracteres.")]
    public string Nome { get; set; } = string.Empty;

    [Required(ErrorMessage = "O E-mail é obrigatório.")]
    [EmailAddress(ErrorMessage = "Formato de e-mail inválido.")]
    [StringLength(150, ErrorMessage = "O E-mail não pode exceder 150 caracteres.")]
    public string Email { get; set; } = string.Empty;
}

