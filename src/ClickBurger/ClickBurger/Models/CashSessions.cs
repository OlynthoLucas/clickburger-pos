using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ClickBurger.Models;

public class CashSession
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    /// <summary>Valor inicial informado ao abrir o caixa.</summary>
    public decimal InitialValue { get; set; }

    /// <summary>Data/hora de abertura (UTC).</summary>
    public DateTime OpenedAt { get; set; }

    /// <summary>Data/hora de fechamento (UTC). Null enquanto aberto.</summary>
    public DateTime? ClosedAt { get; set; }

    /// <summary>Quem abriu o caixa.</summary>
    public string OpenedBy { get; set; } = string.Empty;

    public bool IsOpen => ClosedAt is null;
}
