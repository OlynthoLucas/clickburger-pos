using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ClickBurger.Models;
public class Product
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public double Price { get; set; }
    public List<string> images { get; set; } = new();
}