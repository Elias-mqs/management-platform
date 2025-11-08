# 🚀 Quick Start Guide

## Pré-requisitos

- Node.js 20+
- pnpm 8+
- Docker & Docker Compose

## Setup Rápido

### 1. Instalar Dependências

```bash
pnpm install
```

### 2. Configurar Variáveis de Ambiente

```bash
# Backend
cp apps/api/.env.example apps/api/.env

# Frontend
cp apps/web/.env.example apps/web/.env.local
```

**Importante:** As variáveis já estão configuradas para desenvolvimento local. Não é necessário editar os arquivos `.env`.

### 3. Escolha o Modo de Execução

---

## 🐳 Opção A: Docker Compose (Recomendado)

Execute tudo (PostgreSQL + Backend + Frontend) com um único comando:

```bash
docker compose up -d
```

**Pronto!** 🎉 Aguarde ~30 segundos para os serviços iniciarem.

O sistema irá automaticamente:
- ✅ Iniciar o PostgreSQL
- ✅ Executar as migrações do banco de dados
- ✅ Popular o banco com dados de teste (seed)
- ✅ Iniciar o backend (API)
- ✅ Iniciar o frontend (Web)

Verifique se tudo está rodando:
```bash
docker compose ps
```

Acesse:
- **Frontend**: http://localhost:3000 🌐
- **API**: http://localhost:3333
- **Docs**: http://localhost:3333/docs 📚

### Ver Logs

```bash
# Todos os serviços
docker compose logs -f

# Serviço específico
docker compose logs -f api
docker compose logs -f web
```

### Parar os Serviços

```bash
docker compose down
```

---

## 💻 Opção B: Execução Local (Sem Docker)

### 3. Iniciar PostgreSQL

```bash
docker compose up -d postgres
```

Aguarde o container ficar saudável (~10 segundos).

### 4. Configurar Banco de Dados

```bash
cd apps/api
pnpm prisma db push
pnpm prisma:seed
```

### 5. Iniciar Backend

```bash
# No diretório apps/api
pnpm dev
```

✅ **Backend rodando em: http://localhost:3333**
📚 **Documentação API: http://localhost:3333/docs**

### 6. Iniciar Frontend

```bash
# Em outro terminal, no diretório apps/web
pnpm dev
```

✅ **Frontend rodando em: http://localhost:3000**

---

## 🧪 Testar API

#### Criar Intenção de Participação
```bash
curl -X POST http://localhost:3333/api/intents \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test@example.com",
    "phone": "+1234567890",
    "notes": "Interested in networking"
  }'
```

#### Listar Intenções (Admin)
```bash
curl http://localhost:3333/api/admin/intents?status=PENDING \
  -H "x-admin-key: dev-admin-key-123"
```

#### Aprovar Intenção (Admin)
```bash
curl -X POST http://localhost:3333/api/admin/intents/{intentId}/approve \
  -H "x-admin-key: dev-admin-key-123"
```

## Credenciais

### Admin
- **Email**: admin@networkinggroups.com
- **Password**: Admin@123
- **Admin Key**: dev-admin-key-123

### Membros de Teste (criados automaticamente pelo seed)
Os dados de teste incluem:
- 1 Admin (admin@networkinggroups.com)
- 2 Intents PENDING (john@example.com, jane@example.com)
- Você pode testar aprovação de intents e geração de tokens de convite

## Estrutura do Projeto

```
desafio-negocio/
├── apps/
│   ├── api/              ✅ Backend completo (Fastify + Prisma)
│   └── web/              ✅ Frontend completo (Next.js 14)
├── docs/                 📄 Documentação do desafio
└── docker-compose.yml    🐳 PostgreSQL + API + Web configurados
```

## Endpoints Principais

### Públicos
- `POST /api/intents` - Submeter intenção
- `GET /api/invites/:token` - Validar convite
- `POST /api/invites/:token/register` - Registrar membro

### Admin (Header: `x-admin-key`)
- `GET /api/admin/intents` - Listar intenções
- `POST /api/admin/intents/:id/approve` - Aprovar
- `POST /api/admin/intents/:id/reject` - Rejeitar

### Health Checks
- `GET /healthz` - Liveness probe
- `GET /readyz` - Readiness probe (verifica DB)

## Troubleshooting

### Serviços não iniciam com Docker Compose
```bash
# Verificar status dos containers
docker compose ps

# Ver logs de erro
docker compose logs

# Rebuild completo
docker compose down
docker compose up -d --build
```

### Backend não inicia (modo local)
```bash
# Verificar se PostgreSQL está rodando
docker compose ps postgres

# Verificar logs
docker compose logs postgres

# Recriar banco
cd apps/api
pnpm prisma db push --force-reset
pnpm prisma:seed
```

### Erro de variáveis de ambiente
```bash
# Verificar se .env existe
ls apps/api/.env
ls apps/web/.env.local

# Se não existirem, criar baseados nos exemplos
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

### Port 3333 ou 3000 em uso
```bash
# Windows
netstat -ano | findstr :3333
taskkill /PID <pid> /F

# Linux/Mac
lsof -ti:3333 | xargs kill -9
lsof -ti:3000 | xargs kill -9
```

### Docker Compose não encontrado
```bash
# Verificar se Docker está instalado
docker --version
docker compose version

# Se estiver usando docker-compose antigo
docker-compose up -d
```

## Próximos Passos

### Acessar a Aplicação
- 🌐 **Frontend**: http://localhost:3000
- 📚 **API Docs**: http://localhost:3333/docs
- ❤️ **Health Check**: http://localhost:3333/healthz

### Executar Testes
```bash
cd apps/api
pnpm test
pnpm test:coverage
```

### Comandos Úteis Docker

```bash
# Parar serviços
docker compose down

# Reiniciar serviço específico
docker compose restart api
docker compose restart web

# Rebuild após mudanças
docker compose up -d --build

# Remover tudo (incluindo volumes)
docker compose down -v
```

## Documentação Completa

- [README Principal](./README.md)
- [Backend API](./apps/api/README.md)
- [Arquitetura](./docs/arquitetura.md)
- [Guidelines Backend](./docs/guidelines-backend.md)

## Suporte

- 🌐 Frontend: http://localhost:3000
- 📚 Swagger UI: http://localhost:3333/docs (interface interativa)
- ❤️ Health: http://localhost:3333/healthz
- 📖 Issues: Consulte a documentação completa

---

**Status**: Backend ✅ | Frontend ✅ | Docker Compose ✅
