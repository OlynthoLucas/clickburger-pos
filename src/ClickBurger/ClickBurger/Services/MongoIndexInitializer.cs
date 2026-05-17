using MongoDB.Driver;
using ClickBurger.Models;

namespace ClickBurger.Services;

public class MongoIndexInitializer : IHostedService
{
    private readonly MongoDbService _mongo;
    private readonly ILogger<MongoIndexInitializer> _logger;

    public MongoIndexInitializer(MongoDbService mongo, ILogger<MongoIndexInitializer> logger)
    {
        _mongo = mongo;
        _logger = logger;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        try
        {
            var users = _mongo.GetCollection<User>("Users");
            await users.Indexes.CreateOneAsync(
                new CreateIndexModel<User>(
                    Builders<User>.IndexKeys.Ascending(u => u.Username),
                    new CreateIndexOptions { Unique = true, Name = "ux_users_username" }),
                cancellationToken: cancellationToken);

            await users.Indexes.CreateOneAsync(
                new CreateIndexModel<User>(
                    Builders<User>.IndexKeys.Ascending(u => u.Email),
                    new CreateIndexOptions { Unique = true, Name = "ux_users_email" }),
                cancellationToken: cancellationToken);

            var tables = _mongo.GetCollection<Table>("Tables");
            await tables.Indexes.CreateOneAsync(
                new CreateIndexModel<Table>(
                    Builders<Table>.IndexKeys.Ascending(t => t.Number),
                    new CreateIndexOptions { Unique = true, Name = "ux_tables_number" }),
                cancellationToken: cancellationToken);

            var orders = _mongo.GetCollection<Order>("Orders");
            await orders.Indexes.CreateOneAsync(
                new CreateIndexModel<Order>(
                    Builders<Order>.IndexKeys.Ascending(o => o.TableId).Descending(o => o.CreatedAt),
                    new CreateIndexOptions { Name = "ix_orders_table_created" }),
                cancellationToken: cancellationToken);

            await orders.Indexes.CreateOneAsync(
                new CreateIndexModel<Order>(
                    Builders<Order>.IndexKeys.Ascending(o => o.Status).Descending(o => o.ClosedAt),
                    new CreateIndexOptions { Name = "ix_orders_status_closedat" }),
                cancellationToken: cancellationToken);

            var refresh = _mongo.GetCollection<RefreshToken>("RefreshTokens");
            await refresh.Indexes.CreateOneAsync(
                new CreateIndexModel<RefreshToken>(
                    Builders<RefreshToken>.IndexKeys.Ascending(r => r.Token),
                    new CreateIndexOptions { Unique = true, Name = "ux_refreshtokens_token" }),
                cancellationToken: cancellationToken);

            await refresh.Indexes.CreateOneAsync(
                new CreateIndexModel<RefreshToken>(
                    Builders<RefreshToken>.IndexKeys.Ascending(r => r.ExpiresAt),
                    new CreateIndexOptions
                    {
                        Name = "ix_refreshtokens_expires",
                        ExpireAfter = TimeSpan.Zero
                    }),
                cancellationToken: cancellationToken);
        }
        catch (MongoCommandException ex) when (ex.CodeName == "IndexOptionsConflict" || ex.Message.Contains("already exists", StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogWarning(ex, "Índice MongoDB já existe ou conflito de opções; ignorando.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Falha ao criar índices MongoDB.");
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
