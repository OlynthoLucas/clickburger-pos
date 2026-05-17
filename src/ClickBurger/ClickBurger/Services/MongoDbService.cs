using MongoDB.Driver;

namespace ClickBurger.Services;

public class MongoDbService
{
    private readonly IMongoDatabase _database;

    public MongoDbService(IConfiguration configuration)
    {
        var conn = configuration["MongoDbSettings:ConnectionString"] 
                   ?? configuration.GetConnectionString("MongoDb") 
                   ?? Environment.GetEnvironmentVariable("MONGODB_URI");

        if (string.IsNullOrWhiteSpace(conn))
            throw new InvalidOperationException(
                "Defina MongoDbSettings:ConnectionString, ConnectionStrings:MongoDb ou variável de ambiente MONGODB_URI.");

        var databaseName = configuration["MongoDbSettings:DatabaseName"] ?? "ClickBurgerDb";

        var client = new MongoClient(conn);
        _database = client.GetDatabase(databaseName);
    }

    public IMongoCollection<T> GetCollection<T>(string name) => _database.GetCollection<T>(name);

    public IMongoClient Client => _database.Client;
}