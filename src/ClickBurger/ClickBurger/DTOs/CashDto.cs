namespace ClickBurger.DTOs;

/// <summary>Payload para abrir o caixa.</summary>
public class OpenCashDto
{
    public decimal InitialValue { get; set; }
}

/// <summary>Resposta com dados da sessão atual.</summary>
public class CashSessionDto
{
    public string Id { get; set; } = string.Empty;
    public decimal InitialValue { get; set; }
    public DateTime OpenedAt { get; set; }
    public DateTime? ClosedAt { get; set; }
    public string OpenedBy { get; set; } = string.Empty;
    public bool IsOpen { get; set; }
}
