using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ClickBurger.Models;

public class Table
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    public int Number { get; set; }

    public string Status { get; set; } = TableStatus.LIVRE;

    public int Capacity { get; set; }

    [BsonRepresentation(BsonType.ObjectId)]
    public string? CurrentOrderId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}