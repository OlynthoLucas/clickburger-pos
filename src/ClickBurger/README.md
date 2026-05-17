# ClickBurger

API REST em ASP.NET Core 8 (Minimal APIs), MongoDB e autenticação JWT com refresh token. Documentação interativa usando **Swagger** (somente em ambiente de desenvolvimento).

## Requisitos

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- MongoDB (local ou [MongoDB Atlas](https://www.mongodb.com/atlas))

## Configuração rápida

### 1. Connection string e segredos

**Não commite** connection strings ou `Jwt:SecretKey` reais. Use uma das opções:

- **Variáveis de ambiente** (recomendado em produção):

  ```bash
  export ConnectionStrings__MongoDb="mongodb+srv://..."
  export Jwt__SecretKey="sua-chave-com-pelo-menos-32-caracteres!!"
  ```

- **User Secrets** (desenvolvimento):

  ```bash
  cd ClickBurger
  dotnet user-secrets set "ConnectionStrings:MongoDb" "mongodb://..."
  dotnet user-secrets set "Jwt:SecretKey" "sua-chave-com-pelo-menos-32-caracteres!!"
  ```

O arquivo [`appsettings.json`](ClickBurger/appsettings.json) mantém apenas *placeholders*. Em desenvolvimento, [`appsettings.Development.json`](ClickBurger/appsettings.Development.json) pode apontar para `mongodb://localhost:27017` e uma chave de desenvolvimento.

### 2. Executar

```bash
cd ClickBurger
dotnet run
```

Swagger UI: `https://localhost:{porta}/swagger` (apenas `Development`).

### 3. Primeiro usuário

O **primeiro** cadastro em `POST /api/auth/register` recebe papel **admin** automaticamente (banco vazio). Os demais recebem **user**. Garçons e admins adicionais: `POST /api/users/staff` (somente **admin**).

## Estrutura do código

| Área | Descrição |
|------|-----------|
| [`Endpoints/`](ClickBurger/Endpoints/) | Grupos de rotas (`MapGroup`) por recurso |
| [`Services/`](ClickBurger/Services/) | `AuthService`, `OrderService`, `MongoDbService`, índices |
| [`Validation/`](ClickBurger/Validation/) | FluentValidation |
| [`Authorization/`](ClickBurger/Authorization/) | Políticas por papel (`admin`, `garcom`, `user`) |

## Testes e CI

```bash
dotnet test ClickBurger.sln
```

O workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) executa `restore`, `build` e `test` em push/PR.