# Neuron-Core

API para execução de comandos inteligentes que combina múltiplas inteligências artificiais, comandos JavaScript e o banco de dados NeuronDB em workflows unificados.

## 🚀 Instalação

```bash
# Clone o repositório
git clone https://github.com/your-org/neuron-core.git
cd neuron-core

# Instale as dependências
npm install

# Configure o arquivo de configuração
cp config.json.example config.json
# Edite o arquivo config.json com suas configurações
```

## ⚙️ Configuração

### Arquivo config.json

```json
{
  "neurondb": {
    "url": "https://ndb.archoffice.tech",
    "config_jwt": "seu_jwt_de_configuracao_aqui"
  },
  "server": {
    "port": 3000
  }
}
```

**Importante:** Apenas essas 3 configurações são fixas. Todo o resto (IAs, behaviors, agentes) são carregados automaticamente do NeuronDB.

### Configurações Dinâmicas no NeuronDB

O Neuron-Core carrega automaticamente as seguintes configurações do NeuronDB a cada 5 minutos:

#### 1. **IAs e suas Keys** (`config.general.ai`)
```
POST https://ndb.archoffice.tech/snl
Authorization: Bearer {config_jwt}
Content-Type: text/plain

view(structure)
on(config.general.ai)
```

**Estrutura esperada:**
```json
{
  "ami": { "key": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..." },
  "ba-express": { "key": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..." },
  "jaai": { "key": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..." },
  "spai": { "key": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..." }
}
```

#### 2. **Behaviors das IAs** (`config.{aiName}.behavior`)
```
POST https://ndb.archoffice.tech/snl
Authorization: Bearer {config_jwt}
Content-Type: text/plain

view(structure)
on(config.ami.behavior)
```

**Estrutura esperada:**
```json
{
  "default": {
    "behavior": "nome desta ia: ami (arch mentory inteligency), tom amigavel, ser objetiva"
  }
}
```

#### 3. **Configurações dos Agentes** (`config.general.agent`)
```
POST https://ndb.archoffice.tech/snl
Authorization: Bearer {config_jwt}
Content-Type: text/plain

view(structure)
on(config.general.agent)
```

**Estrutura esperada:**
```json
{
  "claude": {
    "apiKey": "sk-ant-api03-...",
    "models": [
      {
        "max_tokens": 64000,
        "model": "claude-sonnet-4-20250514",
        "name": "Sonnet 4"
      }
    ],
    "role": "system",
    "url": "https://api.anthropic.com/v1/messages"
  },
  "gpt": {
    "apiKey": "sk-proj-...",
    "max_tokens": 4096,
    "model": "gpt-4o",
    "role": "system",
    "url": "https://api.openai.com/v1/chat/completions"
  }
}
```

## 🏃 Executando

```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

## 📚 API Reference

### Estrutura de URLs

**IMPORTANTE:** Todas as URLs seguem o padrão:
```
https://seu-dominio/api/{nome-da-ia}/{módulo}/{endpoint}
```

Exemplos:
```
https://localhost:3000/api/ami/security/login
https://localhost:3000/api/jaai/security/permissions
https://localhost:3000/api/spai/security/subscriptions
```

### Padrão de Resposta

Todas as respostas seguem o padrão:

**Sucesso:**
```json
{
  "message": "Descrição do sucesso",
  "data": { /* dados retornados */ }
}
```

**Erro:**
```json
{
  "error": "Descrição do erro",
  "data": { /* dados adicionais ou null */ }
}
```

## 🔐 Módulo Security

### Autenticação

#### Login
```http
POST /api/{nome-da-ia}/security/login
Content-Type: application/json

{
  "email": "usuario@exemplo.com",
  "password": "senha123"
}
```

**Resposta:**
```json
{
  "message": "Login successful",
  "data": {
    "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "email": "usuario@exemplo.com",
    "permissions": [
      {
        "database": "main",
        "level": 2,
        "levelName": "read-write"
      }
    ]
  }
}
```

#### Trocar Senha
```http
POST /api/{nome-da-ia}/security/change-password
Authorization: Bearer {token}
Content-Type: application/json

{
  "newPassword": "novaSenha123!"
}
```

#### Obter Permissões
```http
GET /api/{nome-da-ia}/security/permissions
Authorization: Bearer {token}
```

### Gestão de Usuários

#### Criar Usuário (Requer Admin)
```http
POST /api/{nome-da-ia}/security/users
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "email": "novo@exemplo.com",
  "password": "senha123!",
  "nick": "Novo Usuário",
  "role": "default"
}
```

#### Definir Permissão (Requer Admin)
```http
POST /api/{nome-da-ia}/security/permissions/set
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "email": "usuario@exemplo.com",
  "database": "main",
  "level": 2
}
```

**Níveis de Permissão:**
- `1` = read-only
- `2` = read-write  
- `3` = admin

### Gestão de Assinaturas

#### Criar Assinatura (Sistema de Pagamento)
```http
POST /api/{nome-da-ia}/security/subscriptions
Content-Type: application/json

{
  "userEmail": "cliente@exemplo.com",
  "plan": "premium",
  "nick": "Cliente Premium",
  "authorizedBy": "pisani@archoffice.tech"
}
```

**Resposta:**
```json
{
  "message": "Subscription created successfully",
  "data": {
    "subscription": {
      "userEmail": "cliente@exemplo.com",
      "plan": "premium",
      "subscribedAt": "2025-06-17T10:00:00.000Z",
      "userCount": 1,
      "status": "active"
    },
    "credentials": {
      "email": "cliente@exemplo.com",
      "password": "xK9#mP2$vL5n"
    }
  }
}
```

#### Obter Assinatura
```http
GET /api/{nome-da-ia}/security/subscriptions/{email}
Authorization: Bearer {token}
```

#### Cancelar Assinatura (Requer Admin)
```http
POST /api/{nome-da-ia}/security/subscriptions/{email}/cancel
Authorization: Bearer {admin_token}
```

### Gestão de Planos

#### Listar Planos
```http
GET /api/{nome-da-ia}/security/plans
```

**Planos Padrão:**
- **basic**: R$ 29,90 - 500 ChatGPT, 300 Gemini, 400 Claude, 1 usuário
- **premium**: R$ 99,90 - 2000 ChatGPT, 1000 Gemini, 1500 Claude, 5 usuários
- **enterprise**: R$ 299,90 - 10000 ChatGPT, 5000 Gemini, 7500 Claude, 50 usuários

#### Criar/Atualizar Plano (Requer Admin)
```http
POST /api/{nome-da-ia}/security/plans
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "planId": "custom",
  "name": "Plano Customizado",
  "price": 149.90,
  "limits": {
    "chatgpt": 3000,
    "gemini": 1500,
    "claude": 2000,
    "users": 10
  }
}
```

### Gestão de Grupos

#### Listar Grupos
```http
GET /api/{nome-da-ia}/security/groups
Authorization: Bearer {token}
```

#### Criar Grupo (Requer Admin)
```http
POST /api/{nome-da-ia}/security/groups
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "groupName": "desenvolvedores",
  "users": ["dev1@exemplo.com", "dev2@exemplo.com"]
}
```

### Gestão de Papéis

#### Definir Papel do Usuário (Requer Admin)
```http
POST /api/{nome-da-ia}/security/roles/set
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "email": "usuario@exemplo.com",
  "role": "admin"
}
```

**Papéis Disponíveis:**
- `default` = Usuário padrão
- `admin` = Administrador

## 🏗️ Arquitetura

### Estrutura em Camadas

1. **API Layer** - Express.js com middlewares de validação
2. **Core Layer** - Lógica de negócios (Security, Intelligence, Support)
3. **Cross Layer** - DTOs, entidades e constantes compartilhadas
4. **Data Layer** - Managers, SNL commands, e NeuronDB sender

### Fluxo de Dados

```
HTTP Request → AI Validator → API Layer → Core Layer → Data Layer → NeuronDB
                    ↓             ↓            ↓            ↓
               Valida IA      Validation   Business    Database
               na URL           &          Logic      Operations
                               Routing
```

### ConfigVO Singleton

A entidade `ConfigVO` é um singleton que armazena:

**Configurações Fixas (config.json):**
- **URL do NeuronDB** 
- **JWT de configuração**
- **Porta do servidor**

**Configurações Dinâmicas (NeuronDB via SNL):**
- **Chaves das IAs** (atualizado a cada 5 minutos)
- **Behaviors das IAs** (atualizado a cada 5 minutos) 
- **Configurações dos agentes** (atualizado a cada 5 minutos)

### Fluxo de Tokens

1. **Para configurações**: Usa `config_jwt` (fixo)
2. **Para operações do sistema**: Usa a `key` da IA específica (obtida via SNL)
3. **Para operações do usuário**: Usa o token do usuário (após login)

## 🔒 Segurança

- **Multi-tenant**: Isolamento completo entre IAs através da URL
- **JWT Authentication**: Tokens seguros para autenticação
- **Role-based Access**: Controle de acesso baseado em papéis (default/admin)
- **Permission Levels**: 3 níveis de permissão (1=read, 2=read-write, 3=admin)
- **Rate Limiting**: Proteção contra abuso (100 req/15min por IP)
- **Helmet.js**: Headers de segurança HTTP

## 📊 Entidades do Banco

Todas as entidades são criadas automaticamente no namespace `main.core`:

- **usergroups** - Grupos de usuários
- **plans** - Planos disponíveis
- **usersplans** - Associação usuário-plano
- **userroles** - Papéis dos usuários (default/admin)
- **subscription** - Assinaturas ativas
- **planlimits** - Limites por plano
- **billing** - Histórico de pagamentos

## 🛠️ Endpoints de Sistema

### Health Check
```http
GET /health
```

### Documentação da API
```http
GET /api/docs
```

### Health Check por IA
```http
GET /api/{nome-da-ia}/security/health
```

## 🧪 Testes

```bash
# Executar testes
npm test

# Testes com coverage
npm run test:coverage

# Testes específicos
npm run test:verbose
```

## 📝 Logs

Os logs incluem:
- Validação de IA por request
- Carregamento de configurações
- Operações de banco de dados
- Erros e exceções

## 🚨 Troubleshooting

### Erro: "AI configurations not loaded yet"
- Verifique se o `config_jwt` no config.json está correto
- Confirme que a entidade `config.general.ai` existe no NeuronDB

### Erro: "Invalid AI name: {nome}"
- O nome da IA na URL deve corresponder exatamente ao configurado
- Verifique IAs disponíveis em `/api/docs`

### Erro: "Admin privileges required"
- Verifique se o usuário tem papel `admin`
- Confirme se o token possui nível de permissão 3

### Erro: "Service unavailable"
- Verifique conectividade com o NeuronDB
- Confirme se as configurações no config.json estão corretas

## 📖 Exemplos de Uso

### Fluxo Completo de Onboarding

1. **Criar assinatura** (sistema de pagamento):
```bash
curl -X POST http://localhost:3000/api/ami/security/subscriptions \
  -H "Content-Type: application/json" \
  -d '{
    "userEmail": "cliente@empresa.com",
    "plan": "premium",
    "nick": "Cliente Empresa"
  }'
```

2. **Login do usuário criado**:
```bash
curl -X POST http://localhost:3000/api/ami/security/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "cliente@empresa.com",
    "password": "senha_gerada_automaticamente"
  }'
```

3. **Verificar permissões**:
```bash
curl -X GET http://localhost:3000/api/ami/security/permissions \
  -H "Authorization: Bearer {token_do_login}"
```

### Gestão Administrativa

1. **Criar usuário adicional** (como admin):
```bash
curl -X POST http://localhost:3000/api/ami/security/users \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "funcionario@empresa.com",
    "password": "senhaSegura123!",
    "nick": "Funcionário",
    "role": "default"
  }'
```

2. **Criar plano customizado**:
```bash
curl -X POST http://localhost:3000/api/ami/security/plans \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "enterprise_plus",
    "name": "Enterprise Plus",
    "price": 499.90,
    "limits": {
      "chatgpt": 20000,
      "gemini": 10000,
      "claude": 15000,
      "users": 100
    }
  }'
```

## 🤝 Contribuindo

1. Fork o projeto
2. Crie sua feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença ISC.

---

**Neuron-Core v1.0.0** - API para comandos inteligentes com múltiplas IAs