using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Driver;
using ClickBurger.Models;
using ClickBurger.DTOs;

namespace ClickBurger.Services;

public class AuthService
{
    private readonly IMongoCollection<User> _users;
    private readonly IMongoCollection<RefreshToken> _refreshTokens;
    private readonly IConfiguration _configuration;

    public AuthService(MongoDbService mongoDb, IConfiguration configuration)
    {
        _users = mongoDb.GetCollection<User>("Users");
        _refreshTokens = mongoDb.GetCollection<RefreshToken>("RefreshTokens");
        _configuration = configuration;
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest request)
    {
        var user = await _users.Find(u =>
            (u.Username == request.Username || u.Email == request.Username) && u.Active
        ).FirstOrDefaultAsync();

        if (user == null || !VerifyPassword(request.Password, user.PasswordHash))
        {
            return new LoginResponse
            {
                Success = false,
                Message = "Usuário ou senha inválidos."
            };
        }

        return await BuildSuccessLoginResponseAsync(user);
    }

    public async Task<LoginResponse?> RefreshAccessTokenAsync(string refreshTokenValue)
    {
        var stored = await _refreshTokens.Find(r => r.Token == refreshTokenValue).FirstOrDefaultAsync();
        if (stored == null || stored.ExpiresAt <= DateTime.UtcNow)
            return null;

        var user = await _users.Find(u => u.Id == stored.UserId && u.Active).FirstOrDefaultAsync();
        if (user == null)
            return null;

        await _refreshTokens.DeleteOneAsync(r => r.Id == stored.Id);

        return await BuildSuccessLoginResponseAsync(user);
    }

    public async Task<bool> RegisterAsync(RegisterRequest request)
    {
        var existingUser = await _users.Find(u => u.Username == request.Username || u.Email == request.Email).FirstOrDefaultAsync();

        if (existingUser != null)
            return false;

        var isFirstUser = await _users.CountDocumentsAsync(_ => true) == 0;
        var role = isFirstUser ? UserRoles.SUPERADMIN : UserRoles.USER;

        var user = new User
        {
            Username = request.Username,
            Email = request.Email,
            PasswordHash = HashPassword(request.Password),
            Role = role,
            Active = true
        };

        await _users.InsertOneAsync(user);
        return true;
    }

    public async Task<(bool success, string? error, UserDto? user)> RegisterStaffAsync(StaffUserCreateDto request, string callerRole)
    {
        var role = request.Role.Trim().ToLowerInvariant();
        var isValidRole = role == UserRoles.GARCOM || role == UserRoles.ADMIN || role == UserRoles.SUPERADMIN || role == UserRoles.COZINHA;
        if (!isValidRole)
            return (false, "Role inválida. Use superadmin, admin, garcom ou cozinha.", null);

        if ((role == UserRoles.ADMIN || role == UserRoles.SUPERADMIN) && callerRole != UserRoles.SUPERADMIN)
            return (false, "Apenas superadmins podem criar admins ou superadmins.", null);

        var existingUser = await _users.Find(u => u.Username == request.Username || u.Email == request.Email).FirstOrDefaultAsync();
        if (existingUser != null)
            return (false, "Usuário já existe.", null);

        var user = new User
        {
            Username = request.Username,
            Email = request.Email,
            PasswordHash = HashPassword(request.Password),
            Role = role,
            Active = true
        };

        await _users.InsertOneAsync(user);
        var dto = new UserDto
        {
            Id = user.Id!,
            Username = user.Username,
            Email = user.Email,
            Role = user.Role
        };
        return (true, null, dto);
    }

    public async Task<List<UserDto>> ListUsersAsync()
    {
        var users = await _users.Find(_ => true).ToListAsync();
        return users.Select(u => new UserDto
        {
            Id = u.Id!,
            Username = u.Username,
            Email = u.Email,
            Role = u.Role
        }).ToList();
    }

    private async Task<LoginResponse> BuildSuccessLoginResponseAsync(User user)
    {
        var accessMinutes = 24 * 60;
        if (int.TryParse(_configuration["Jwt:ExpirationMinutes"], out var em))
            accessMinutes = em;
        else if (int.TryParse(_configuration["Jwt:ExpirationHours"], out var eh))
            accessMinutes = eh * 60;

        var token = GenerateJwtToken(user, accessMinutes);
        var accessExpires = DateTime.UtcNow.AddMinutes(accessMinutes);

        var refreshDays = int.Parse(_configuration["Jwt:RefreshTokenDays"] ?? "7");
        var refreshPlain = GenerateSecureToken();
        var refreshEntity = new RefreshToken
        {
            Token = refreshPlain,
            UserId = user.Id!,
            ExpiresAt = DateTime.UtcNow.AddDays(refreshDays),
            CreatedAt = DateTime.UtcNow
        };
        await _refreshTokens.InsertOneAsync(refreshEntity);

        return new LoginResponse
        {
            Success = true,
            Token = token,
            RefreshToken = refreshPlain,
            AccessTokenExpiresAt = accessExpires,
            RefreshTokenExpiresAt = refreshEntity.ExpiresAt,
            Message = "Login realizado com sucesso.",
            User = new UserDto
            {
                Id = user.Id!,
                Username = user.Username,
                Email = user.Email,
                Role = user.Role
            }
        };
    }

    private static string GenerateSecureToken()
    {
        var bytes = new byte[32];
        RandomNumberGenerator.Fill(bytes);
        return Convert.ToBase64String(bytes);
    }

    private string GenerateJwtToken(User user, int expirationMinutes)
    {
        var secretKey = _configuration["Jwt:SecretKey"];
        if (string.IsNullOrWhiteSpace(secretKey))
            secretKey = Environment.GetEnvironmentVariable("JWT_SECRET") ?? "DefaultSecretKeyForClickBurgerApplication";
        if (secretKey.Length < 32)
            secretKey = secretKey.PadRight(32, '0');
        
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id!),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role)
        };

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"] ?? "ClickBurger",
            audience: _configuration["Jwt:Audience"] ?? "ClickBurgerUsers",
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expirationMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private string HashPassword(string password) => BCrypt.Net.BCrypt.HashPassword(password);

    private bool VerifyPassword(string password, string hash) => BCrypt.Net.BCrypt.Verify(password, hash);
    public async Task<(bool success, string? error)> DeleteUserAsync(string id, string callerRole)
    {
        var targetUser = await _users.Find(u => u.Id == id).FirstOrDefaultAsync();
        if (targetUser == null)
            return (false, "Usuário não encontrado.");

        if (targetUser.Role == UserRoles.SUPERADMIN && callerRole != UserRoles.SUPERADMIN)
            return (false, "Apenas um superadmin pode excluir outro superadmin.");

        await _users.DeleteOneAsync(u => u.Id == id);
        return (true, null);
    }
    public async Task<(bool success, string? error)> UpdateUserAsync(string id, UserUpdateDto request, string callerRole)
    {
        var targetUser = await _users.Find(u => u.Id == id).FirstOrDefaultAsync();
        if (targetUser == null)
            return (false, "Usuário não encontrado.");

        var role = request.Role.Trim().ToLowerInvariant();
        var isValidRole = role == UserRoles.GARCOM || role == UserRoles.ADMIN || role == UserRoles.SUPERADMIN || role == UserRoles.COZINHA;
        if (!isValidRole)
            return (false, "Role inválida. Use superadmin, admin, garcom ou cozinha.");

        // Regra de segurança: Apenas superadmin pode alterar para ou de superadmin
        if ((role == UserRoles.SUPERADMIN || targetUser.Role == UserRoles.SUPERADMIN) && callerRole != UserRoles.SUPERADMIN)
            return (false, "Apenas superadmins podem editar ou promover superadmins.");

        // Regra de segurança: Apenas superadmin pode promover alguém a admin
        if (role == UserRoles.ADMIN && targetUser.Role != UserRoles.ADMIN && callerRole != UserRoles.SUPERADMIN)
            return (false, "Apenas superadmins podem promover usuários a admin.");

        // Verifica se o email já está em uso por OUTRO usuário
        if (request.Email != targetUser.Email)
        {
            var existingUser = await _users.Find(u => u.Email == request.Email && u.Id != id).FirstOrDefaultAsync();
            if (existingUser != null)
                return (false, "E-mail já está em uso.");
        }

        var updateDef = Builders<User>.Update
            .Set(u => u.Username, request.Username)
            .Set(u => u.Email, request.Email)
            .Set(u => u.Role, role);

        if (!string.IsNullOrEmpty(request.Password))
        {
            updateDef = updateDef.Set(u => u.PasswordHash, HashPassword(request.Password));
        }

        await _users.UpdateOneAsync(u => u.Id == id, updateDef);
        return (true, null);
    }
}
