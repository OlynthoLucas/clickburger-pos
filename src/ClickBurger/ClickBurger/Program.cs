using System.Text;
using ClickBurger.Authorization;
using ClickBurger.Endpoints;
using ClickBurger.Hubs;
using ClickBurger.Services;
using ClickBurger.Validation;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddProblemDetails();

builder.Services.AddSingleton<MongoDbService>();
builder.Services.AddSingleton<StorageService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<OrderService>();
builder.Services.AddScoped<ReportService>();
builder.Services.AddScoped<CashService>();

if (builder.Environment.IsDevelopment())
{
    builder.Services.AddScoped<DevSeedService>();
}
builder.Services.AddHostedService<MongoIndexInitializer>();

builder.Services.AddValidatorsFromAssemblyContaining<LoginRequestValidator>();
builder.Services.AddClickBurgerAuthorization();

// ← SignalR
builder.Services.AddSignalR();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "ClickBurger API",
        Version = "v1",
        Description = "Web API REST — cardápio, mesas e pedidos (MongoDB + JWT). OAuth2: use Bearer access token; refresh em POST /api/auth/refresh."
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "JWT emitido por POST /api/auth/login ou /api/auth/refresh. Formato: Bearer {token}"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

var allowOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AppCors", policy =>
    {
        if (allowOrigins.Length > 0)
            // SignalR requer AllowCredentials — não pode usar AllowAnyOrigin com credentials
            policy.WithOrigins(allowOrigins)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        else
            // Dev: aceita qualquer origem mas fixa localhost para AllowCredentials
            policy.WithOrigins("http://localhost:5173", "http://localhost:3000")
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
    });
});

var jwtSettings = builder.Configuration.GetSection("Jwt");
var jwtKey = jwtSettings["SecretKey"];
if (string.IsNullOrWhiteSpace(jwtKey))
    jwtKey = Environment.GetEnvironmentVariable("JWT_SECRET") ?? "DefaultSecretKeyForClickBurgerApplication";
if (jwtKey.Length < 32)
    jwtKey = jwtKey.PadRight(32, '0');

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings["Issuer"] ?? "ClickBurger",
            ValidAudience = jwtSettings["Audience"] ?? "ClickBurgerUsers",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };

        // ← SignalR envia o token via query string — precisa extrair aqui
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                    context.Token = accessToken;
                return Task.CompletedTask;
            }
        };
    });

var app = builder.Build();

app.UseExceptionHandler();
app.UseStatusCodePages();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "ClickBurger v1");
    });
}

app.UseCors("AppCors");
app.UseAuthentication();
app.UseAuthorization();

app.MapAuthEndpoints();
app.MapUserEndpoints();
app.MapMenuEndpoints();
app.MapTableEndpoints();
app.MapOrderEndpoints();
app.MapCustomerEndpoints(); // ← Mobile app: anonymous customer orders
app.MapReportEndpoints();
app.MapCashEndpoints();
app.MapDevSeedEndpoints();

// ← Mapeia o hub SignalR
app.MapHub<OrderHub>("/hubs/orders");

app.Run();
