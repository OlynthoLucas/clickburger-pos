using MongoDB.Driver;
using ClickBurger.DTOs;
using ClickBurger.Models;

namespace ClickBurger.Services;

public class CashService
{
    private readonly IMongoCollection<CashSession> _sessions;

    public CashService(MongoDbService mongo)
    {
        _sessions = mongo.GetCollection<CashSession>("CashSessions");
    }

    /// <summary>Retorna a sessão aberta no momento, ou null.</summary>
    public async Task<CashSession?> GetCurrentAsync()
    {
        return await _sessions
            .Find(s => s.ClosedAt == null)
            .SortByDescending(s => s.OpenedAt)
            .FirstOrDefaultAsync();
    }

    /// <summary>
    /// Abre o caixa. Retorna erro se já houver uma sessão aberta.
    /// </summary>
    public async Task<(CashSession? session, string? error)> OpenAsync(decimal initialValue, string openedBy)
    {
        var existing = await GetCurrentAsync();
        if (existing is not null)
            return (null, "Já existe um caixa aberto.");

        var session = new CashSession
        {
            InitialValue = initialValue,
            OpenedAt = DateTime.UtcNow,
            OpenedBy = openedBy,
        };

        await _sessions.InsertOneAsync(session);
        return (session, null);
    }

    /// <summary>
    /// Fecha o caixa atual. Retorna erro se não houver sessão aberta.
    /// </summary>
    public async Task<(CashSession? session, string? error)> CloseAsync()
    {
        var existing = await GetCurrentAsync();
        if (existing is null)
            return (null, "Não há caixa aberto para fechar.");

        var update = Builders<CashSession>.Update
            .Set(s => s.ClosedAt, DateTime.UtcNow);

        await _sessions.UpdateOneAsync(s => s.Id == existing.Id, update);
        existing.ClosedAt = DateTime.UtcNow;
        return (existing, null);
    }

    /// <summary>Histórico de sessões (mais recentes primeiro).</summary>
    public async Task<List<CashSession>> GetHistoryAsync(int limit = 30)
    {
        return await _sessions
            .Find(_ => true)
            .SortByDescending(s => s.OpenedAt)
            .Limit(limit)
            .ToListAsync();
    }

    private static CashSessionDto ToDto(CashSession s) => new()
    {
        Id = s.Id ?? string.Empty,
        InitialValue = s.InitialValue,
        OpenedAt = s.OpenedAt,
        ClosedAt = s.ClosedAt,
        OpenedBy = s.OpenedBy,
        IsOpen = s.IsOpen,
    };

    public static CashSessionDto MapToDto(CashSession s) => ToDto(s);
}
