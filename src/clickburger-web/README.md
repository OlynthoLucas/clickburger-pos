# ClickBurger Web - Frontend

Sistema web de gerenciamento de pedidos e caixa para hamburguerias. Interface React + TypeScript construída com Vite.

## 🚀 Quick Start (Desenvolvimento)

### Pré-requisitos
- Node.js 20+
- npm 10+
- Backend rodando em `http://localhost:5004`

### Setup Inicial

```bash
# 1. Instalar dependências
npm install

# 2. Criar arquivo de ambiente local
cp .env.example .env.local

# 3. Iniciar servidor de desenvolvimento
npm run dev
```

Acesse `http://localhost:5173`

## 📦 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev           # Inicia servidor Vite com hot reload

# Produção
npm run build         # Compila TypeScript e gera build Vite
npm run preview       # Visualiza build de produção localmente

# Qualidade
npm run lint          # Executa ESLint
```

## 🌍 Deploy no Vercel

### Pré-requisitos
- Conta no Vercel
- GitHub com este repositório
- Azure App Service com API backend

### Step-by-Step

#### 1️⃣ Conectar GitHub ao Vercel

```bash
# No https://vercel.com/new
1. Selecione "Import Git Repository"
2. Conecte sua conta GitHub
3. Selecione o repositório: pmv-ads-2026-1-e4-infra-t1-garcom
4. Escolha as settings padrão
```

#### 2️⃣ Configurar Environment Variables

No Vercel Dashboard → Settings → Environment Variables:

```
VITE_API_BASE_URL=https://seu-app.azurewebsites.net
```

> **Nota:** Substitua `seu-app.azurewebsites.net` pela URL do seu App Service no Azure

#### 3️⃣ Configurar Build Root Directory

No Vercel Dashboard → Settings → Build & Development Settings:

```
Root Directory: src/clickburger-web
```

#### 4️⃣ Deploy

Vercel fará deploy automaticamente quando você:
- Fizer push para `main`
- Criar uma Pull Request

Ou manualmente:
```bash
# Via CLI
npm i -g vercel
vercel --prod
```

### Arquivos de Configuração

O projeto vem pré-configurado:
- `vercel.json` - Configuração Vercel (buildCommand, outputDirectory, rewrites)
- `.vercelignore` - Arquivos ignorados no deploy
- `.env.example` - Documentação de variáveis necessárias

### Verificação Pós-Deploy

Após deploy, teste:

```bash
# 1. Acessar a aplicação
# https://seu-projeto.vercel.app

# 2. Verificar console do navegador (F12)
# Network tab → verificar requisições à API

# 3. Testar login
# - Página deve carregar sem erros CORS
# - Requisições à API devem usar a URL configurada
```

### Troubleshooting

#### ❌ Erro: "Cannot GET /"
**Causa:** Rewrite do SPA não está funcionando
**Solução:** Verifique `vercel.json` tem `"rewrites"` configurado

#### ❌ Erro: API 404
**Causa:** `VITE_API_BASE_URL` não está configurado ou incorreto
**Solução:** 
```bash
# Verifique variável no Vercel Dashboard
vercel env list

# Re-deploy após mudar variáveis
vercel --prod
```

#### ❌ Erro: CORS
**Causa:** Backend não permite requisições do frontend Vercel
**Solução:** Configure CORS no backend (.NET):
```csharp
app.UseCors(builder => builder
    .WithOrigins("https://seu-projeto.vercel.app")
    .AllowAnyHeader()
    .AllowAnyMethod()
);
```

## 🏗️ Arquitetura

```
src/
├── components/      # Componentes React reutilizáveis
├── pages/          # Páginas/rotas principais
├── services/       # APIs e comunicação backend
├── store/          # Estado global (Zustand)
├── contexts/       # Context API (tema)
├── hooks/          # Custom React hooks
├── layouts/        # Layouts de página
├── routes/         # Configuração de rotas
├── types/          # TypeScript types
└── styles/         # Estilos globais
```

## 🔐 Autenticação

- **Armazenamento:** localStorage (persist com Zustand)
- **Token:** JWT Bearer
- **Refresh:** Automático em requisições com 401

## 📊 Stack Tecnológico

- **Framework:** React 19
- **Build Tool:** Vite 8
- **Linguagem:** TypeScript 6
- **State:** Zustand 5
- **HTTP:** Axios 1.15
- **Rotas:** React Router 7
- **UI:** Radix UI 3
- **Validação:** Zod 4
- **Formulários:** React Hook Form 7
- **Animações:** Framer Motion 12
- **Notificações:** Sonner 2
- **Ícones:** Lucide React 1

## 📝 Environment Variables

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `VITE_API_BASE_URL` | URL base da API backend | `http://localhost:5004` ou `https://api.example.com` |

## 🧪 Testes

```bash
# Rodar testes (se configurado)
npm run test

# Coverage
npm run test:coverage
```

## 📚 Documentação

- [Especificação do Projeto](../../docs/02-Especificação%20do%20Projeto.md)
- [Arquitetura da Solução](../../docs/05-Arquitetura%20da%20Solução.md)
- [Programação de Funcionalidades](../../docs/07-Programação%20de%20Funcionalidades.md)

## 🤝 Contribuindo

1. Crie uma branch: `git checkout -b feature/MinhaFeature`
2. Commit mudanças: `git commit -m "Add MinhaFeature"`
3. Push para branch: `git push origin feature/MinhaFeature`
4. Abra Pull Request

## 📄 Licença

MIT License - veja [LICENSE](../../LICENSE)
