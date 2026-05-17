using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ClickBurger.Models;

public class OrderItem
{
    [BsonRepresentation(BsonType.ObjectId)]
    public string MenuItemId { get; set; } = string.Empty;

    public string MenuItemName { get; set; } = string.Empty;

    public int Quantity { get; set; }

    public decimal UnitPrice { get; set; }

    public string Notes { get; set; } = string.Empty;

    public string Status { get; set; } = OrderItemStatus.PENDENTE;

    public DateTime AddedAt { get; set; } = DateTime.UtcNow;
}