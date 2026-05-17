using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ClickBurger.Models;
public class ProductInventory
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }
    [BsonRepresentation(BsonType.ObjectId)]
    public string ProductId { get; set; } = string.Empty;
    public int Quantity { get; set; }
}