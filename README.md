# MS Gerencial

Sistema de contabilidade gerencial com partidas dobradas, plano de contas hierárquico e relatórios financeiros.

## Stack

- **Next.js 14** (App Router, Server Actions, Server Components)
- **PostgreSQL** via Docker local, Supabase em produção
- **Prisma 7** com `@prisma/adapter-pg`
- **Supabase Auth** (Google OAuth) — bypass automático em dev local
- **shadcn/ui** + Tailwind CSS + `next-themes` (dark/light)

## Funcionalidades

- **Plano de Contas** — visualização em TreeView hierárquico, inclusão de conta filha a partir da conta mãe, ativação/desativação
- **Lançamentos** — partidas dobradas (débito/crédito), validação contábil, vinculação a centros de custo
- **Relatórios**
  - DRE (Demonstração do Resultado do Exercício)
  - Balanço Patrimonial
  - Razão Contábil por conta analítica
- **Filtros por período** — ano e mês em todos os relatórios

## Pré-requisitos

- Node.js 18+
- Docker Desktop

## Instalação

```bash
npm install
cp .env.example .env  # edite as variáveis se necessário
```

## Banco de dados local

```bash
# Subir o PostgreSQL via Docker (porta 5433 para não conflitar com instalações locais)
docker compose up -d

# Criar as tabelas
npx prisma db push

# Popular com plano de contas e lançamentos de exemplo
npx prisma db seed
```

## Desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000). Sem Supabase configurado, a autenticação é ignorada e um usuário dev local é usado automaticamente.

## Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | URL do PostgreSQL (ex: `postgresql://user:pass@localhost:5433/db`) |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase (deixe em branco para dev local) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anônima do Supabase |
| `NEXT_PUBLIC_APP_URL` | URL base da aplicação |

## Schema do banco

| Tabela | Descrição |
|---|---|
| `Profile` | Usuários (sincronizado com Supabase Auth) |
| `PlanoContas` | Contas sintéticas e analíticas com hierarquia |
| `CentroCusto` | Centros de custo para rastreio de despesas |
| `Lancamento` | Lançamentos contábeis (débito + crédito) |

## Deploy (produção)

Configure as variáveis de ambiente apontando para um PostgreSQL externo (ex: Supabase) e um projeto Supabase para autenticação. O deploy pode ser feito na Vercel ou via `fly deploy`.
