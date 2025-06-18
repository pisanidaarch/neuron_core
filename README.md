# Neuron-Core

API para execução de comandos inteligentes que combina múltiplas inteligências artificiais, comandos JavaScript e o banco de dados NeuronDB em workflows unificados.

## 🚀 Instalação

```bash
# Clone o repositório
git clone https://github.com/your-org/neuron-core.git
cd neuron-core

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

## ⚙️ Configuração

### Variáveis de Ambiente

```env
# NeuronDB Configuration
NEURONDB_URL=https://ndb.archoffice.tech
NEURONDB_CONFIG_JWT=seu_jwt_de_configuracao_aqui

# Server Configuration
PORT=3000
NODE_ENV=development

# Security
JWT_SECRET=seu_secret_jwt_aqui

# Cache Configuration
CACHE_TTL=300 # 5 minutos em segundos

# Admin User (para subscriptions)
ADMIN_USER_EMAIL=pisani@archoffice.tech
```

### Configuração Inicial no NeuronDB

Antes de iniciar o Neuron-Core, você precisa ter no NeuronDB:

1. **Base de configuração** com as chaves JWT de cada IA:
   ```
   config.general.ai
   ```

2. **Estrutura esperada**:
   ```json
   {
     "ami": { "ami": "jwt_token_da_ami" },
     "ba-express": { "ba-express": "jwt_token_ba_express" },
     "jaai": { "jaai": "jwt_token_jaai" },
     "spai": { "spai": "jwt_token_spai" }
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

Todas as URLs seguem o padrão:
```
https://seu-dominio/api/{nome-da-ia}/{recurso}
```

Exemplo:
```
https://localhost:3000/api/ami/security/login
```

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
  "message": "Success",
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

#### Criar Usuário (Admin)
```http
POST /api/{nome-da-ia}/security/create-user
Authorization: Bearer {admin-token}
Content-Type: application/json

{
  "email": "novo@exemplo.com",
  "password": "senha123",
  "nick": "NovoUsuario",
  "role": "default"
}
```

### Permissões

#### Obter Permissões
```http
GET /api/{nome-da-ia}/security/permissions
Authorization: Bearer {token}
```

#### Definir Permissão (Admin)
```http
POST /api/{nome-da-ia}/security/permissions
Authorization: Bearer {admin-token}
Content-Type: application/json

{
  "email": "usuario@exemplo.com",
  "database": "main",
  "level": 2
}
```

**Níveis de Permissão:**
- `1` - Read Only
- `2` - Read/Write
- `3` - Admin

### Grupos

#### Listar Grupos (Admin)
```http
GET /api/{nome-da-ia}/security/groups
Authorization: Bearer {admin-token}
```

#### Criar Grupo (Admin)
```http
POST /api/{nome-da-ia}/security/groups
Authorization: Bearer {admin-token}
Content-Type: application/json

{
  "name": "developers"
}
```

#### Adicionar Usuário ao Grupo (Admin)
```http
POST /api/{nome-da-ia}/security/groups/{nome-grupo}/users
Authorization: Bearer {admin-token}
Content-Type: application/json

{
  "email": "usuario@exemplo.com"
}
```

#### Remover Usuário do Grupo (Admin)
```http
DELETE /api/{nome-da-ia}/security/groups/{nome-grupo}/users/{email}
Authorization: Bearer {admin-token}
```

### Planos

#### Listar Planos
```http
GET /api/{nome-da-ia}/security/plans
```

#### Obter Plano Específico
```http
GET /api/{nome-da-ia}/security/plans/{plan-id}
```

#### Criar Plano (Admin)
```http
POST /api/{nome-da-ia}/security/plans
Authorization: Bearer {admin-token}
Content-Type: application/json

{
  "id": "premium",
  "name": "Plano Premium",
  "price": 99.90,
  "features": ["Feature 1", "Feature 2"],
  "limits": {
    "chatgpt": 1000,
    "gemini": 500,
    "claude": 800
  }
}
```

#### Atualizar Plano (Admin)
```http
PUT /api/{nome-da-ia}/security/plans/{plan-id}
Authorization: Bearer {admin-token}
Content-Type: application/json

{
  "name": "Plano Premium Plus",
  "price": 149.90,
  "limits": {
    "chatgpt": 2000,
    "gemini": 1000,
    "claude": 1500
  }
}
```

### Assinaturas

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

#### Cancelar Assinatura
```http
POST /api/{nome-da-ia}/security/subscriptions/{email}/cancel
Authorization: Bearer {token}
```

## 🏗️ Arquitetura

### Estrutura em Camadas

1. **API Layer** - Express.js com middlewares
2. **Core Layer** - Lógica de negócios (Security, Intelligence, Support)
3. **Cross Layer** - DTOs e entidades compartilhadas
4. **Data Layer** - Managers, SNL commands, e NeuronDB sender

### Fluxo de Dados

```
HTTP Request → API Layer → Core Layer → Data Layer → NeuronDB
                   ↓            ↓            ↓
                Validation   Business    Database
                   &          Logic      Operations
                Routing
```

## 🔒 Segurança

- **Multi-tenant**: Isolamento completo entre IAs
- **JWT Authentication**: Tokens seguros para autenticação
- **Role-based Access**: Controle de acesso baseado em papéis
- **Rate Limiting**: Proteção contra abuso
- **Helmet.js**: Headers de segurança HTTP

## 🧪 Testes

```bash
# Executar testes
npm test

# Testes com coverage
npm run test:coverage
```

## 📝 Logs

Os logs são salvos em:
- `error.log` - Apenas erros
- `combined.log` - Todos os logs
- Console - Desenvolvimento

## 🚨 Troubleshooting

### Erro: "AI configurations not loaded yet"
- Verifique se o `NEURONDB_CONFIG_JWT` está correto
- Confirme que a entidade `config.general.ai` existe no NeuronDB

### Erro: "Invalid AI name"
- O nome da IA na URL deve corresponder exatamente ao configurado
- Exemplo: `/api/ami/...` requer que "ami" esteja configurado

### Erro: "Insufficient permissions"
- Verifique se o usuário tem nível de permissão adequado
- Admin = nível 3, Read/Write = nível 2, Read Only = nível 1

## 🤝 Contribuindo

1. Fork o projeto
2. Crie sua feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença ISC.