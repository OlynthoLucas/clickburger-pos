# 🍔 ClickBurger — Sistema de Gestão para Hamburguerias

> **Disciplina:** Desenvolvimento de uma Aplicação Distribuída — 4º Eixo | ADS · PUC Minas  
> **Orientador:** Leonardo Vilela Cardoso

Sistema inteligente de caixa, gestão de mesas e pedidos para hamburguerias. Integra um **painel web** para gerentes/atendentes/cozinha com um **cardápio digital** nas mesas, tudo conectado em tempo real via **SignalR**. Os pedidos fluem automaticamente do cliente → cozinha → caixa, eliminando erros de anotação e reduzindo o tempo de espera.

---

## Índice

1. [Funcionalidades Principais](#funcionalidades-principais)
2. [Tech Stack](#tech-stack)
3. [Arquitetura do Sistema](#arquitetura-do-sistema)
4. [Estrutura do Repositório](#estrutura-do-repositório)
5. [Pré-requisitos](#pré-requisitos)
6. [Getting Started](#getting-started)
7. [Variáveis de Ambiente](#variáveis-de-ambiente)
8. [Scripts Disponíveis](#scripts-disponíveis)
9. [Endpoints da API](#endpoints-da-api)
10. [Schema do Banco de Dados](#schema-do-banco-de-dados)
11. [Perfis de Usuário e Permissões](#perfis-de-usuário-e-permissões)
12. [Deploy](#deploy)
13. [Testes](#testes)
14. [Solução de Problemas](#solução-de-problemas)
15. [Equipe](#equipe)
16. [Documentação Completa](#documentação-completa)

---

## Funcionalidades Principais

| Perfil | Funcionalidade |
|--------|---------------|
| **Cliente (tablet)** | Visualizar cardápio digital com imagens, montar pedido com personalizações, acompanhar status em tempo real, simular pagamento |
| **Garçom / Atendente** | Receber notificações de novos pedidos em tempo real, gerenciar mesas, fechar comandas |
| **Cozinha** | Visualizar fila de pedidos pendentes, atualizar status (Preparando → Pronto) |
| **Admin / Gerente** | CRUD completo de produtos, usuários e mesas, relatórios de vendas diários/mensais, controle de caixa |

---

## Tech Stack

### Backend — API REST
| Camada | Tecnologia |
|--------|-----------|
| Runtime | .NET 8 (ASP.NET Core Minimal API) |
| Banco de Dados | MongoDB Atlas (MongoDB.Driver 3.7) |
| Autenticação | JWT Bearer + Refresh Token (BCrypt.Net, System.IdentityModel.Tokens.Jwt 8) |
| Validação | FluentValidation 11 |
| Tempo Real | SignalR (`/hubs/orders`) |
| Documentação | Swagger / OpenAPI (Swashbuckle 6.5) |
| Testes | xUnit v3 (.NET 8) |

### Frontend Web
| Camada | Tecnologia |
|--------|-----------|
| Framework | React 19 + TypeScript 6 |
| Build | Vite 8 |
| Estado Global | Zustand 5 |
| Roteamento | React Router 7 |
| HTTP | Axios 1.15 |
| UI / Acessibilidade | Radix UI 3 (Dialog, Dropdown, Tooltip, Themes) |
| Formulários | React Hook Form 7 + Zod 4 |
| Animações | Framer Motion 12 |
| Notificações | Sonner 2 |
| Ícones | Lucide React |
| Estilização | SCSS Modules |
| Tempo Real | @microsoft/signalr 10 |
| Deploy | Vercel |

---

## Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENTES / USUÁRIOS                   │
│  Tablet (mesa)   │  Garçom/Cozinha   │  Admin/Gerente   │
└────────┬─────────┴────────┬──────────┴────────┬─────────┘
         │                  │                   │
         └──────────────────▼───────────────────┘
                    ┌───────────────┐
                    │  React SPA    │  ← Vercel (HTTPS)
                    │  (Vite + TS)  │
                    └───────┬───────┘
                            │ REST HTTP + SignalR WebSocket
                    ┌───────▼───────┐
                    │  ASP.NET Core │  ← Azure App Service
                    │  Minimal API  │    (porta 8082 local)
                    │  + JWT + CORS │
                    └───────┬───────┘
                            │ MongoDB.Driver
                    ┌───────▼───────┐
                    │  MongoDB Atlas│  ← Cloud (NoSQL)
                    └───────────────┘
```

### Fluxo de Pedido em Tempo Real

```
Cliente faz pedido no tablet
        │
        ▼
POST /api/orders  ──▶  OrderService salva no MongoDB
        │
        ▼
SignalR Hub (/hubs/orders) ──broadcast──▶ Cozinha recebe notificação
        │
        ▼
Cozinha atualiza status  ──▶  PATCH /api/orders/{id}/status
        │
        ▼
SignalR broadcast ──▶  Cliente vê status atualizado em tempo real
```

---

## Estrutura do Repositório

```
pmv-ads-2026-1-e4-infra-t1-garcom/
├── docs/                          # Documentação acadêmica completa
│   ├── 01-Documentação de Contexto.md
│   ├── 02-Especificação do Projeto.md
│   ├── 03-Metodologia.md
│   ├── 05-Arquitetura da Solução.md
│   └── ...
├── scripts/
│   └── start-clickburger.ps1      # Script PowerShell para subir tudo localmente
├── src/
│   ├── ClickBurger/               # Solução .NET
│   │   ├── ClickBurger/           # Projeto principal da API
│   │   │   ├── Authorization/     # Políticas e handlers JWT
│   │   │   ├── DTOs/              # Data Transfer Objects
│   │   │   ├── Endpoints/         # Minimal API endpoints
│   │   │   │   ├── AuthEndpoints.cs
│   │   │   │   ├── MenuEndpoints.cs
│   │   │   │   ├── OrderEndpoints.cs
│   │   │   │   ├── TableEndpoints.cs
│   │   │   │   ├── ReportEndpoints.cs
│   │   │   │   ├── CashEndpoints.cs
│   │   │   │   └── UserEndpoints.cs
│   │   │   ├── Filters/           # Filtros de pipeline HTTP
│   │   │   ├── Hubs/              # SignalR OrderHub
│   │   │   ├── Models/            # Entidades MongoDB
│   │   │   │   ├── User.cs
│   │   │   │   ├── Product.cs
│   │   │   │   ├── Order.cs
│   │   │   │   ├── OrderItem.cs
│   │   │   │   ├── Table.cs
│   │   │   │   ├── MenuItem.cs
│   │   │   │   └── CashSessions.cs
│   │   │   ├── Services/
│   │   │   │   ├── MongoDbService.cs
│   │   │   │   ├── AuthService.cs
│   │   │   │   ├── OrderService.cs
│   │   │   │   ├── ReportService.cs
│   │   │   │   ├── CashService.cs
│   │   │   │   └── DevSeedService.cs
│   │   │   ├── Validation/        # FluentValidation validators
│   │   │   ├── Program.cs         # Entry point / DI / middleware
│   │   │   ├── appsettings.json
│   │   │   └── appsettings.Development.json
│   │   └── ClickBurger.Tests/     # Projeto de testes xUnit
│   └── clickburger-web/           # Frontend React
│       ├── src/
│       │   ├── components/        # Componentes reutilizáveis
│       │   ├── pages/
│       │   │   ├── Home.tsx       # Dashboard principal
│       │   │   ├── Kitchen.tsx    # Tela da cozinha
│       │   │   ├── Profile.tsx    # Perfil do usuário
│       │   │   ├── admin/         # AdminDashboard, Products, Users, Tables, Reports
│       │   │   ├── auth/          # Login / Register
│       │   │   └── waiter/        # Interface do garçom
│       │   ├── routes/
│       │   │   ├── AppRoutes.tsx  # Definição de rotas
│       │   │   ├── ProtectedRoute.tsx
│       │   │   └── RoleRoute.tsx  # Controle por perfil
│       │   ├── services/          # Clientes Axios para a API
│       │   ├── store/             # Zustand stores
│       │   ├── contexts/          # ThemeContext
│       │   ├── hooks/             # Custom hooks
│       │   ├── types/             # TypeScript interfaces
│       │   └── styles/            # Estilos globais SCSS
│       ├── .env.example
│       ├── vercel.json
│       └── vite.config.ts
├── start-clickburger.bat          # Atalho Windows para iniciar tudo
└── README.md
```

---

## Pré-requisitos

Certifique-se de ter instalado antes de começar:

| Ferramenta | Versão mínima | Como verificar |
|-----------|--------------|----------------|
| [.NET SDK](https://dotnet.microsoft.com/download) | 8.0 | `dotnet --version` |
| [Node.js](https://nodejs.org/) | 20.x LTS | `node --version` |
| npm | 10.x | `npm --version` |
| [Git](https://git-scm.com/) | qualquer | `git --version` |
| Conta [MongoDB Atlas](https://www.mongodb.com/atlas) | — | Connection string |

> **Opcional (para deploy):** Conta [Vercel](https://vercel.com) + [Azure](https://azure.microsoft.com) App Service.

---

## Getting Started

### 1. Clone o repositório

```bash
git clone https://github.com/XXXXXXXX/pmv-ads-2026-1-e4-infra-t1-garcom.git
cd pmv-ads-2026-1-e4-infra-t1-garcom
```

### 2. Configure a API (.NET)

#### 2a. Variáveis sensíveis via User Secrets (recomendado)

```bash
cd src/ClickBurger/ClickBurger

# Inicializar user secrets (já configurado no .csproj)
dotnet user-secrets set "ConnectionStrings:MongoDb" "mongodb+srv://<user>:<password>@<cluster>.mongodb.net/ClickBurger?retryWrites=true&w=majority"
dotnet user-secrets set "Jwt:SecretKey" "SuaChaveSecretaComPeloMenos32Caracteres!"
```

#### 2b. Alternativa: editar `appsettings.Development.json`

Edite `src/ClickBurger/ClickBurger/appsettings.Development.json`:

```json
{
  "ConnectionStrings": {
    "MongoDb": "mongodb+srv://<user>:<password>@<cluster>.mongodb.net/ClickBurger?retryWrites=true&w=majority"
  },
  "Jwt": {
    "SecretKey": "SuaChaveSecretaComPeloMenos32Caracteres!",
    "ExpirationInMinutes": "120",
    "RefreshTokenDays": "14"
  }
}
```

> ⚠️ **Nunca faça commit** de connection strings ou chaves reais. Use User Secrets ou variáveis de ambiente.

### 3. Configure o Frontend (React)

```bash
cd src/clickburger-web

# Copiar arquivo de exemplo
cp .env.example .env.local
```

Edite `.env.local`:

```env
VITE_API_BASE_URL=http://localhost:8082
```

### 4. Instale as dependências do frontend

```bash
cd src/clickburger-web
npm install
```

### 5. Inicie tudo de uma vez (Windows)

O repositório inclui um script que sobe a API e o Vite em janelas separadas:

```bat
# Na raiz do repositório — clique duplo ou execute no terminal:
start-clickburger.bat

# Com rebuild do .NET antes de iniciar:
start-clickburger.bat -Build
```

O script verifica MongoDB, libera porta 8082 e abre duas janelas PowerShell.

### 5. Alternativa: iniciar manualmente

**Terminal 1 — API:**
```bash
cd src/ClickBurger/ClickBurger
$env:ASPNETCORE_ENVIRONMENT="Development"
$env:ASPNETCORE_URLS="http://localhost:8082"
dotnet run
```

**Terminal 2 — Frontend:**
```bash
cd src/clickburger-web
npm run dev
```

### 6. Acesse a aplicação

| Serviço | URL |
|---------|-----|
| **Frontend** | http://localhost:5173 |
| **API** | http://localhost:8082 |
| **Swagger UI** | http://localhost:8082/swagger |
| **SignalR Hub** | ws://localhost:8082/hubs/orders |

### 7. Dados iniciais (seed)

Em ambiente de desenvolvimento, a API registra automaticamente o `DevSeedService`. Para popular dados iniciais:

```bash
# Com a API rodando em Development:
POST http://localhost:8082/api/dev/seed
```

---

## Variáveis de Ambiente

### Backend (`appsettings.json` / User Secrets / env vars)

| Chave | Descrição | Obrigatório | Exemplo |
|-------|-----------|-------------|---------|
| `ConnectionStrings:MongoDb` | Connection string do MongoDB Atlas | ✅ | `mongodb+srv://user:pass@cluster.mongodb.net/ClickBurger` |
| `Jwt:SecretKey` | Chave HMAC-SHA256 para assinar tokens (mín. 32 chars) | ✅ | `MinhaChaveSecretaComMaisDe32Chars!` |
| `Jwt:Issuer` | Issuer do JWT | ❌ | `ClickBurger` (padrão) |
| `Jwt:Audience` | Audience do JWT | ❌ | `ClickBurgerUsers` (padrão) |
| `Jwt:ExpirationMinutes` | Validade do access token em minutos | ❌ | `60` (padrão) |
| `Jwt:RefreshTokenDays` | Validade do refresh token em dias | ❌ | `7` (padrão) |
| `Cors:AllowedOrigins` | Lista de origens CORS permitidas | ❌ | `["https://meu-app.vercel.app"]` |
| `JWT_SECRET` | Alternativa via env var (sobrescreve `Jwt:SecretKey`) | ❌ | — |

### Frontend (`.env.local`)

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `VITE_API_BASE_URL` | URL base da API backend | `http://localhost:8082` (dev) / `https://api.azurewebsites.net` (prod) |

> Todas as variáveis `VITE_*` são expostas no bundle. **Nunca** coloque chaves secretas aqui.

---

## Scripts Disponíveis

### Backend (.NET)

```bash
# Na pasta src/ClickBurger/

# Compilar solução
dotnet build ClickBurger.sln

# Rodar API em desenvolvimento
dotnet run --project ClickBurger/ClickBurger.csproj

# Rodar testes xUnit
dotnet test

# Publicar para produção
dotnet publish -c Release -o ./publish
```

### Frontend (React)

```bash
# Na pasta src/clickburger-web/

npm run dev        # Inicia Vite com hot-reload
npm run build      # Compila TypeScript + bundle Vite (saída em /dist)
npm run preview    # Serve o bundle de produção localmente
npm run lint       # Executa ESLint
```

---

## Endpoints da API

A documentação interativa completa está disponível no **Swagger UI** (`/swagger` em Development). Resumo dos grupos:

### Autenticação — `/api/auth`

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| `POST` | `/api/auth/login` | Login com email + senha → retorna access + refresh token | ❌ |
| `POST` | `/api/auth/refresh` | Renova o access token usando refresh token | ❌ |
| `POST` | `/api/auth/logout` | Invalida o refresh token | ✅ |

### Usuários — `/api/users`

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| `GET` | `/api/users` | Listar usuários | ✅ Admin |
| `POST` | `/api/users` | Criar usuário | ✅ Admin |
| `PUT` | `/api/users/{id}` | Editar usuário | ✅ Admin |
| `DELETE` | `/api/users/{id}` | Remover usuário | ✅ Admin |

### Cardápio — `/api/menu`

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| `GET` | `/api/menu` | Listar produtos do cardápio | ❌ |
| `POST` | `/api/menu` | Adicionar produto | ✅ Admin |
| `PUT` | `/api/menu/{id}` | Editar produto | ✅ Admin |
| `DELETE` | `/api/menu/{id}` | Remover produto | ✅ Admin |

### Mesas — `/api/tables`

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| `GET` | `/api/tables` | Listar todas as mesas | ✅ |
| `POST` | `/api/tables` | Criar mesa | ✅ Admin |
| `PATCH` | `/api/tables/{id}/status` | Atualizar status da mesa | ✅ |

### Pedidos — `/api/orders`

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| `GET` | `/api/orders` | Listar pedidos | ✅ |
| `POST` | `/api/orders` | Criar pedido | ✅ |
| `PATCH` | `/api/orders/{id}/status` | Atualizar status | ✅ |

### Relatórios — `/api/reports`

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| `GET` | `/api/reports/daily` | Relatório diário de vendas | ✅ Admin |
| `GET` | `/api/reports/monthly` | Relatório mensal de vendas | ✅ Admin |

### Caixa — `/api/cash`

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| `POST` | `/api/cash/open` | Abrir sessão de caixa | ✅ |
| `POST` | `/api/cash/close` | Fechar sessão de caixa | ✅ |

### SignalR Hub

```
ws://{host}/hubs/orders
```

O token JWT deve ser passado via query string: `?access_token=<token>`

Eventos emitidos:
- `NewOrder` — novo pedido recebido
- `OrderStatusUpdated` — status de pedido alterado

---

## Schema do Banco de Dados

O banco utilizado é **MongoDB Atlas** (NoSQL). Coleções principais:

### `users`
```json
{
  "_id": "ObjectId",
  "name": "string",
  "email": "string",
  "passwordHash": "string (BCrypt)",
  "roles": ["admin" | "waiter" | "kitchen" | "customer"],
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### `products` (cardápio)
```json
{
  "_id": "ObjectId",
  "name": "string",
  "description": "string",
  "price": "decimal",
  "category": "string",
  "imageUrl": "string",
  "available": "bool",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### `orders` (pedidos)
```json
{
  "_id": "ObjectId",
  "tableId": "ObjectId",
  "userId": "ObjectId",
  "items": [
    {
      "productId": "ObjectId",
      "quantity": "int",
      "price": "decimal",
      "notes": "string",
      "status": "pending | preparing | ready"
    }
  ],
  "totalPrice": "decimal",
  "status": "received | preparing | ready | delivered",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### `tables` (mesas)
```json
{
  "_id": "ObjectId",
  "number": "int",
  "status": "free | occupied | payment | closed",
  "capacity": "int"
}
```

### `cashSessions` (sessões de caixa)
```json
{
  "_id": "ObjectId",
  "openedAt": "datetime",
  "closedAt": "datetime | null",
  "totalRevenue": "decimal"
}
```

---

## Perfis de Usuário e Permissões

| Role | Acesso |
|------|--------|
| `admin` | Tudo — CRUD de produtos, usuários, mesas; relatórios; caixa |
| `waiter` | Gerenciar mesas, visualizar e atualizar pedidos, fechar comandas |
| `kitchen` | Visualizar fila de pedidos, atualizar status (preparando/pronto) |
| `customer` | Visualizar cardápio, criar pedido, acompanhar status |

O controle de acesso é feito via **JWT claims** no backend e via `RoleRoute.tsx` no frontend.

---

## Deploy

### Frontend → Vercel

1. Acesse [vercel.com/new](https://vercel.com/new) e importe o repositório GitHub.
2. Configure:
   - **Root Directory:** `src/clickburger-web`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Adicione a variável de ambiente:
   ```
   VITE_API_BASE_URL=https://sua-api.azurewebsites.net
   ```
4. O deploy acontece automaticamente a cada push em `main`.

Deploy manual via CLI:
```bash
npm i -g vercel
cd src/clickburger-web
vercel --prod
```

### Backend → Azure App Service

1. Publique o projeto:
   ```bash
   cd src/ClickBurger/ClickBurger
   dotnet publish -c Release -o ./publish
   ```
2. Faça deploy via Azure CLI:
   ```bash
   az webapp deploy --resource-group <rg> --name <app-name> --src-path ./publish
   ```
3. Configure as variáveis de ambiente no portal Azure (Configuration → Application Settings):
   ```
   ConnectionStrings__MongoDb   = mongodb+srv://...
   Jwt__SecretKey               = <chave-producao>
   Cors__AllowedOrigins__0      = https://seu-projeto.vercel.app
   ASPNETCORE_ENVIRONMENT       = Production
   ```

### Configurar CORS no Azure

Adicione a URL do Vercel em `appsettings.Production.json`:
```json
{
  "Cors": {
    "AllowedOrigins": ["https://seu-projeto.vercel.app"]
  }
}
```

---

## Testes

### Testes de unidade (.NET — xUnit v3)

```bash
cd src/ClickBurger

# Rodar todos os testes
dotnet test

# Com output detalhado
dotnet test --verbosity normal

# Rodar testes de um arquivo específico
dotnet test --filter "NomeDoTeste"
```

Os testes estão em `src/ClickBurger/ClickBurger.Tests/`.

### Testes do frontend

```bash
cd src/clickburger-web

# Se configurado (verificar package.json)
npm run test
```

---

## Solução de Problemas

### API não conecta ao MongoDB

**Sintoma:** `TimeoutException` ou erro de autenticação ao iniciar.

**Solução:**
1. Verifique se a connection string está correta em User Secrets ou `appsettings.Development.json`.
2. Confirme que seu IP está na **allowlist** do MongoDB Atlas (Network Access).
3. Teste a conexão manualmente:
   ```bash
   # Com MongoDB Shell instalado:
   mongosh "mongodb+srv://<cluster>.mongodb.net/ClickBurger" --username <user>
   ```

### Porta 8082 já em uso

**Sintoma:** `Address already in use` ao iniciar a API.

**Solução:**
```powershell
# Identificar processo usando a porta
netstat -ano | findstr :8082

# Encerrar processo (substitua PID pelo número encontrado)
taskkill /PID <PID> /F
```

### Erro de CORS no frontend

**Sintoma:** Requisições bloqueadas pelo browser com `CORS policy` no console.

**Solução:** Adicione a origem do frontend em `Cors:AllowedOrigins` no backend. Em desenvolvimento, `http://localhost:5173` e `http://localhost:3000` são permitidos automaticamente.

### Frontend não conecta à API

**Sintoma:** Erros 404 ou `Network Error` nas chamadas Axios.

**Solução:**
1. Confirme que `VITE_API_BASE_URL` no `.env.local` aponta para a porta correta (`http://localhost:8082`).
2. Verifique que a API está rodando: acesse `http://localhost:8082/swagger`.
3. Rebuilde o frontend após alterar `.env.local`:
   ```bash
   npm run dev   # Vite recarrega automaticamente variáveis de ambiente
   ```

### Erros de JWT `InvalidSignatureException`

**Sintoma:** Todas as rotas protegidas retornam 401.

**Solução:** A `Jwt:SecretKey` deve ter pelo menos 32 caracteres. Verifique se a chave em desenvolvimento e em produção é consistente.

### SignalR não conecta

**Sintoma:** Eventos em tempo real não chegam ao frontend.

**Solução:**
1. O token JWT deve ser passado via query string: `?access_token=<token>`.
2. Confirme que o CORS permite `AllowCredentials()` — não é compatível com `AllowAnyOrigin()`.
3. Verifique se o hub está mapeado: `app.MapHub<OrderHub>("/hubs/orders")`.

---

## Equipe

| Nome | Papel |
|------|-------|
| **Daniel Salinas de Souzza** | Scrum Master · Dev |
| **Emanuel Antonio Mendonça Raimundo** | Product Owner · Dev |
| **Lucas Olyntho Silva** | Dev |
| **Caio Augusto de Carvalho Rosa** | Dev |
| **Matheus Henrique Castiglieri Okamoto** | Dev |
| **Marco Aurélio Velozo Costa Sodré** | Dev |

---

## Documentação Completa

| # | Documento |
|---|-----------|
| 1 | [Documentação de Contexto](docs/01-Documentação%20de%20Contexto.md) |
| 2 | [Especificação do Projeto](docs/02-Especificação%20do%20Projeto.md) |
| 3 | [Metodologia](docs/03-Metodologia.md) |
| 4 | [Projeto de Interface](docs/04-Projeto%20de%20Interface.md) |
| 5 | [Arquitetura da Solução](docs/05-Arquitetura%20da%20Solução.md) |
| 6 | [Template Padrão da Aplicação](docs/06-Template%20Padrão%20da%20Aplicação.md) |
| 7 | [Programação de Funcionalidades](docs/07-Programação%20de%20Funcionalidades.md) |
| 8 | [Registro de Testes Unitários](docs/08-Registro%20de%20Testes%20Unitários.md) |
| 9 | [Registro de Testes de Integração](docs/09-Registro%20de%20Testes%20de%20Integração.md) |
| 10 | [Registro de Testes de Sistema](docs/10-Registro%20de%20Testes%20de%20Sistema.md) |
| 11 | [Registro de Contribuição](docs/11-Registro%20de%20Contribuição.md) |
| 12 | [Apresentação do Projeto](docs/12-Apresentação%20do%20Projeto.md) |
| 13 | [Referências](docs/13-Referências.md) |

---

## Licença

Distribuído sob a [MIT License](LICENSE).
