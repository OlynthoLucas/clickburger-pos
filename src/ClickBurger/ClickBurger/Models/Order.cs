using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ClickBurger.Models;

public class Order
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonRepresentation(BsonType.ObjectId)]
    public string TableId { get; set; } = string.Empty;

    public int TableNumber { get; set; }

    public List<OrderItem> Items { get; set; } = new();

    public decimal Total { get; set; }

    public string Status { get; set; } = OrderStatus.ABERTO;

    public string PaymentMethod { get; set; } = PaymentMethods.DINHEIRO;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? ClosedAt { get; set; }

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}