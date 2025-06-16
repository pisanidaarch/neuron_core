# NeuronCore Security Module

## 🔐 Overview

O módulo de segurança do NeuronCore fornece autenticação, autorização, gerenciamento de usuários, grupos e assinaturas para múltiplas instâncias de IA. Este módulo garante isolamento completo entre diferentes AIs e controle granular de acesso.

## 🏗️ Arquitetura

```
src/
├── cross/entity/          # Entidades compartilhadas
│   ├── user.js
│   ├── user_group.js
│   ├── subscription.js
│   ├── plan.js
│   └── permission.js
├── data/
│   ├── snl/              # Comandos SNL
│   │   ├── user_snl.js
│   │   ├── user_group_snl.js
│   │   ├── subscription_snl.js
│   │   └── plan_snl.js
│   ├── manager/          # Gerenciadores de entidades
│   │   ├── user_manager.js
│   │   ├── user_group_manager.js
│   │   ├── subscription_manager.js
│   │   └── plan_manager.js
│   └── initializer/      # Inicialização de bancos
│       └── database_initializer.js
└── api/security/         # Controllers e rotas
    ├── auth_controller.js
    ├── permission_controller.js
    ├── subscription_controller.js
    └── routes.js
```

## 🚀 Quick Start

### 1. Instalação e Configuração

```bash
# Instalar dependências
npm install

# Configurar tokens
cp config.json.example config.json
# Editar config.json com seus tokens reais
```

### 2. Inicializar Sistema

```bash
# Iniciar servidor
npm start

# O sistema automaticamente:
# - Cria bancos de dados necessários
# - Inicializa estruturas
# - Cria usuário subscription_admin
# - Cria grupos padrão (admin, default, subscription_admin)
```

### 3. Verificar Inicialização

```bash
# Verificar status dos bancos
curl http://localhost:3000/admin/database/status

# Forçar reinicialização se necessário
curl -X POST http://localhost:3000/admin/database/initialize
```

## 🔑 Autenticação

### Login
```bash
POST /{ai_name}/security/login
{
  "username": "user@example.com",
  "password": "password123"
}
```

### Validar Token
```bash
GET /{ai_name}/security/validate
Authorization: Bearer {token}
```

### Trocar Senha
```bash
POST /{ai_name}/security/change-password
Authorization: Bearer {token}
{
  "newPassword": "newpassword123"
}
```

## 👥 Gerenciamento de Usuários

### Criar Usuário (Admin)
```bash
POST /{ai_name}/security/create-user
Authorization: Bearer {admin_token}
{
  "email": "newuser@example.com",
  "password": "password123",
  "nick": "New User"
}
```

### Obter Permissões
```bash
GET /{ai_name}/security/permissions
Authorization: Bearer {token}
```

### Definir Permissão (Admin)
```bash
POST /{ai_name}/security/permissions/set
Authorization: Bearer {admin_token}
{
  "email": "user@example.com",
  "database": "timeline",
  "level": 2
}
```

**Níveis de Permissão:**
- `1` - Read (leitura)
- `2` - Write (escrita)
- `3` - Admin (administrador)

## 👪 Gerenciamento de Grupos

### Listar Grupos
```bash
GET /{ai_name}/security/groups
Authorization: Bearer {token}
```

### Criar Grupo (Admin)
```bash
POST /{ai_name}/security/groups/create
Authorization: Bearer {admin_token}
{
  "groupName": "developers",
  "description": "Development team"
}
```

### Adicionar Usuário ao Grupo (Admin)
```bash
POST /{ai_name}/security/groups/add-user
Authorization: Bearer {admin_token}
{
  "email": "user@example.com",
  "groupName": "admin"
}
```

### Remover Usuário do Grupo (Admin)
```bash
POST /{ai_name}/security/groups/remove-user
Authorization: Bearer {admin_token}
{
  "email": "user@example.com",
  "groupName": "default"
}
```

### Definir Papel do Usuário (Admin)
```bash
POST /{ai_name}/security/roles/set
Authorization: Bearer {admin_token}
{
  "email": "user@example.com",
  "role": "admin"  // "admin" ou "default"
}
```

## 💳 Gerenciamento de Assinaturas

### Listar Planos
```bash
GET /{ai_name}/security/plans
Authorization: Bearer {token}
```

### Obter Plano Específico
```bash
GET /{ai_name}/security/plans/{planId}
Authorization: Bearer {token}
```

### Criar Assinatura (Gateway de Pagamento)
```bash
POST /{ai_name}/security/subscription/create
Authorization: Bearer {subscription_admin_token}
{
  "email": "subscriber@example.com",
  "planId": "basic",
  "password": "optional_password"
}
```

### Alterar Plano (Admin)
```bash
POST /{ai_name}/security/subscription/change-plan
Authorization: Bearer {admin_token}
{
  "email": "subscriber@example.com",
  "oldPlanId": "basic",
  "newPlanId": "professional"
}
```

### Cancelar Assinatura (Admin)
```bash
POST /{ai_name}/security/subscription/cancel
Authorization: Bearer {admin_token}
{
  "email": "subscriber@example.com"
}
```

### Adicionar Usuário à Assinatura (Admin)
```bash
POST /{ai_name}/security/subscription/add-user
Authorization: Bearer {admin_token}
{
  "subscriptionOwner": "subscriber@example.com",
  "newUserEmail": "teammember@example.com",
  "password": "optional_password"
}
```

## 🎭 Grupos Padrão

### subscription_admin
- **Propósito**: Integração com gateway de pagamento
- **Usuário**: `subscription_admin@system.local`
- **Senha**: `sudo_subscription_admin`
- **Permissões**: Criar/cancelar/alterar assinaturas
- **Visibilidade**: Oculto (não aparece em listagens)

### admin
- **Propósito**: Administradores da IA
- **Permissões**: 
  - Criar/gerenciar usuários
  - Alterar configurações da IA
  - Gerenciar grupos
  - Alterar/cancelar planos

### default
- **Propósito**: Usuários padrão
- **Permissões**: Usar a IA

## 🗄️ Bancos de Dados

O sistema cria automaticamente os seguintes bancos:

- **main**: Dados principais (usuários, grupos, assinaturas, planos)
- **timeline**: Histórico de interações dos usuários
- **user-data**: Dados pessoais dos usuários
- **workflow**: Workflows ativos
- **workflow-hist**: Histórico de workflows
- **schedule**: Tarefas agendadas

## 🧪 Testes

### Postman Collection
Importe a coleção `NeuronCore-Security.postman_collection.json` no Postman para testes completos.

### Cenários de Teste

1. **Fluxo Completo de Usuário**
   - Criar conta
   - Login
   - Promover para admin
   - Verificar permissões

2. **Gerenciamento de Assinatura**
   - Criar assinatura básica
   - Upgrade para profissional
   - Adicionar membro da equipe

3. **Testes de Erro**
   - Credenciais inválidas
   - Acesso sem token
   - Operações sem permissão

### Executar Testes
```bash
# Executar todos os testes
npm test

# Executar testes específicos
npm run test:security
```

## 🔐 Segurança

### Tokens JWT
- Gerados pelo NeuronDB
- Contêm permissões do usuário
- Validados a cada requisição

### Isolamento Multi-Tenant
- Cada IA tem dados completamente isolados
- Validação rigorosa do nome da IA
- Tokens específicos por IA

### Controle de Acesso
- Permissões granulares por banco de dados
- Grupos de usuários com papéis definidos
- Verificação de permissões em todas as operações

## 🐛 Troubleshooting

### Erro: "AI token not found"
```bash
# Verificar configuração das AIs
curl http://localhost:3000/config/ai/{ai_name}

# Reinicializar KeysVO
curl -X POST http://localhost:3000/admin/database/initialize
```

### Erro: "Subscription admin not found"
```bash
# Verificar se usuário existe
curl -X POST http://localhost:3000/admin/database/initialize

# Login manual
curl -X POST http://localhost:3000/{ai_name}/security/login \
  -H "Content-Type: application/json" \
  -d '{"username":"subscription_admin@system.local","password":"sudo_subscription_admin"}'
```

### Erro: "Database not initialized"
```bash
# Forçar inicialização
curl -X POST http://localhost:3000/admin/database/initialize

# Verificar status
curl http://localhost:3000/admin/database/status
```

## 📖 Exemplos Práticos

### Cenário: E-commerce com IA
```bash
# 1. Gateway de pagamento cria assinatura
POST /ecommerce-ai/security/subscription/create
Authorization: Bearer {subscription_admin_token}
{
  "email": "loja@exemplo.com",
  "planId": "professional"
}

# 2. Dono da loja adiciona funcionário
POST /ecommerce-ai/security/subscription/add-user
Authorization: Bearer {admin_token}
{
  "subscriptionOwner": "loja@exemplo.com",
  "newUserEmail": "funcionario@exemplo.com"
}

# 3. Funcionário faz login
POST /ecommerce-ai/security/login
{
  "username": "funcionario@exemplo.com",
  "password": "generated_password"
}
```

### Cenário: Empresa com Múltiplos Departamentos
```bash
# 1. Criar grupos departamentais
POST /empresa-ai/security/groups/create
{
  "groupName": "vendas",
  "description": "Equipe de vendas"
}

# 2. Adicionar usuários aos grupos
POST /empresa-ai/security/groups/add-user
{
  "email": "vendedor@empresa.com",
  "groupName": "vendas"
}

# 3. Configurar permissões específicas
POST /empresa-ai/security/permissions/set
{
  "email": "vendedor@empresa.com",
  "database": "user-data",
  "level": 2
}
```

## 🔄 Integrações

### Gateway de Pagamento
Use o token `subscription_admin` para:
- Criar assinaturas após pagamento
- Cancelar assinaturas por falta de pagamento
- Alterar planos por upgrade/downgrade

### Sistema de CRM
Integre com os endpoints de usuários para:
- Sincronizar dados de clientes
- Gerenciar permissões automaticamente
- Criar relatórios de uso

## 📝 Logs e Monitoramento

O sistema registra automaticamente:
- Todas as operações de autenticação
- Mudanças de permissões
- Criação/alteração de assinaturas
- Erros de acesso

Logs são enviados para `console` e podem ser integrados com sistemas como ELK Stack ou Datadog.

## 🚨 Alertas

Configure alertas para:
- Tentativas de login falhadas
- Criação de usuários admin
- Alterações em assinaturas
- Erros de sistema

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs de erro
2. Consulte a seção Troubleshooting
3. Execute os testes da coleção Postman
4. Verifique o status dos bancos de dados