# NeuronCore

🧠 **Multi-AI orchestration platform with workflow capabilities and comprehensive security module**

NeuronCore é o backend central para sistemas de inteligência artificial que funciona como camada de gerenciamento entre clientes e modelos de IA. O sistema utiliza o NeuronDB para armazenamento de dados e oferece funcionalidades avançadas de segurança, autenticação e workflows.

## 🚀 Quick Start

### 1. Clone o projeto
```bash
git clone <repository-url>
cd neuron-core
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure o sistema
```bash
# Copie o arquivo de exemplo
cp config.json.example config.json

# Edite o config.json com suas configurações
nano config.json
```

### 4. Configure o config.json

**⚠️ IMPORTANTE: Substitua os tokens de exemplo pelos reais do seu NeuronDB**

```json
{
  "database": {
    "config_url": "http://localhost:8080",
    "config_token": "YOUR_REAL_CONFIG_TOKEN_HERE"
  },
  "ai_instances": {
    "demo_ai": {
      "name": "demo_ai",
      "url": "http://localhost:8080",
      "token": "YOUR_REAL_AI_TOKEN_HERE"
    }
  },
  "security": {
    "jwt_secret": "your_super_secret_jwt_key_change_in_production",
    "token_expiry": "24h"
  },
  "server": {
    "port": 3000,
    "cors_origin": "*"
  }
}
```

### 5. Inicie o servidor
```bash
npm start
```

O servidor será iniciado na porta 3000 e automaticamente:
- ✅ Criará os bancos de dados necessários
- ✅ Inicializará as estruturas de dados
- ✅ Criará o usuário administrativo de subscription
- ✅ Configurará grupos e permissões padrão

## 🔧 Estrutura do Projeto

```
neuron-core/
├── src/
│   ├── api/                    # Camada de API
│   │   ├── security/           # Endpoints de segurança
│   │   └── support/            # Endpoints de suporte (TODO)
│   ├── core/                   # Lógica de negócio principal (TODO)
│   ├── cross/                  # Entidades compartilhadas
│   │   └── entity/             # Entidades de domínio
│   ├── data/                   # Camada de dados
│   │   ├── manager/            # Gerenciadores de entidades
│   │   ├── snl/               # Comandos SNL
│   │   ├── neuron_db/         # Senders para NeuronDB
│   │   └── initializer/       # Inicializadores de banco
├── postman/                   # Coleções Postman para testes
├── config.json               # Configuração do sistema
├── config.json.example       # Exemplo de configuração
├── package.json              # Dependências NPM
└── README.md                 # Este arquivo
```

## 🔐 Módulo de Segurança

### Grupos Padrão

- **subscription_admin**: Grupo para integração com gateways de pagamento
- **admin**: Administradores que podem gerenciar usuários e configurações
- **default**: Usuários padrão da IA

### Usuário Padrão do Sistema

- **Email**: `subscription_admin@system.local`
- **Senha**: `sudo_subscription_admin`
- **Grupo**: `subscription_admin`

### Endpoints de Autenticação

```bash
# Login
POST /api/security/{ai_name}/auth/login
{
  "username": "user@example.com",
  "password": "password123"
}

# Validar token
GET /api/security/{ai_name}/auth/validate
Authorization: Bearer {token}

# Trocar senha
POST /api/security/{ai_name}/auth/change-password
Authorization: Bearer {token}
{
  "newPassword": "newpassword123"
}
```

### Gerenciamento de Usuários

```bash
# Criar usuário (Admin)
POST /api/security/{ai_name}/users/create
Authorization: Bearer {admin_token}
{
  "email": "newuser@example.com",
  "password": "password123",
  "nick": "New User"
}

# Obter informações do usuário atual
GET /api/security/{ai_name}/auth/me
Authorization: Bearer {token}
```

**Níveis de Permissão:**
- `1` - Read (leitura)
- `2` - Write (escrita)
- `3` - Admin (administrador)

## 📚 Módulo de Support (TODO)

O módulo de support está em desenvolvimento. Funcionalidades planejadas:

- **Timeline**: Registro e busca de interações
- **Command System**: Sistema de criação e execução de comandos
- **Configuration**: Gerenciamento de cores e configurações da IA
- **Tag System**: Sistema de tags para entidades
- **Database Operations**: Operações de banco e namespace
- **SNL Execution**: Execução direta de comandos SNL

## 🎨 Esquema de Cores Padrão

### Cores Principais
- **Preto**: `#000000` (fundo principal)
- **Branco**: `#FFFFFF` (tipografia)
- **Azul Escuro**: `#0363AE` (gradiente principal)
- **Roxo Escuro**: `#50038F` (gradiente principal)

### Cores Secundárias
- **Roxo**: `#6332F5` (destaque)
- **Turquesa**: `#54D3EC` (gradiente secundário)
- **Azul**: `#2F62CD` (destaque de texto)
- **Verde-azulado**: `#3AA3A9` (marcadores)

### Gradientes
- **Principal**: `#50038F` → `#0363AE`
- **Secundário**: `#6332F5` → `#54D3EC`

## 📊 Endpoints de Administração

```bash
# Status geral do sistema
GET /health

# Status administrativo
GET /admin/status

# Forçar inicialização de bancos
POST /admin/database/initialize
```

## 🧪 Testando com Postman

1. Importe a coleção: `postman/NeuronCore-Security.postman_collection.json`
2. Configure as variáveis:
   - `base_url`: `http://localhost:3000`
   - `ai_name`: `demo_ai` (ou o nome da sua IA)
3. Execute os testes na seguinte ordem:
   - **Health & Info** → **Authentication** → **User Management**

### Sequência de Teste Recomendada:

1. 🔍 **Health Check** - Verificar se o sistema está rodando
2. 🔐 **Login Subscription Admin** - Fazer login como admin do sistema
3. 👤 **Create User** - Criar um usuário de teste
4. 🔑 **Login Custom User** - Fazer login com o usuário criado
5. ✅ **Validate Token** - Validar o token obtido

## 🐛 Troubleshooting

### Erro: "Configuration validation failed"
- ✅ Verifique se o arquivo `config.json` existe e está configurado corretamente
- ✅ Confirme se os tokens do NeuronDB estão corretos e válidos

### Erro: "Cannot find module 'cors'"
- ✅ Execute `npm install` para instalar todas as dependências

### Erro de conexão com NeuronDB
- ✅ Verifique se o NeuronDB está rodando na URL configurada
- ✅ Confirme se as URLs e tokens estão corretos no config.json
- ✅ Teste a conectividade manualmente

### Problemas de inicialização
- ✅ Use o endpoint `/admin/database/initialize` para forçar reinicialização
- ✅ Verifique logs detalhados no console
- ✅ Confirme permissões dos tokens

## 📈 Monitoramento

O sistema fornece endpoints de monitoramento:

- `/health`: Status geral do sistema
- `/admin/status`: Status detalhado da aplicação
- `/api/security/health`: Status do módulo de segurança
- `/api/support/health`: Status do módulo de suporte

## 🔒 Segurança

- ✅ Tokens JWT com expiração configurável
- ✅ Permissões granulares por banco de dados
- ✅ Isolamento completo entre instâncias de IA
- ✅ Grupos de usuários com controle de acesso
- ✅ Validação de entrada em todos os endpoints
- ✅ Sistema de grupos hierárquico

## 🚀 Produção

Para deploy em produção:

1. Configure `NODE_ENV=production`
2. Use tokens seguros e únicos
3. Configure CORS adequadamente
4. Use HTTPS
5. Configure logs apropriados
6. Monitore performance e uso
7. **Troque TODOS os tokens de exemplo por tokens reais!**

## 🤝 Desenvolvimento

### Arquitetura

- **Repository Pattern**: Para acesso a dados
- **Singleton Pattern**: Para gerenciamento de chaves (KeysVO)
- **DTO Pattern**: Para transferência de dados entre camadas
- **Command Pattern**: Para operações SNL

### Adicionando Novas Funcionalidades

1. **Entidades**: Modelos de domínio em `src/cross/entity/`
2. **Managers**: Lógica de negócio em `src/data/manager/`
3. **SNL**: Comandos de banco em `src/data/snl/`
4. **Controllers**: Endpoints em `src/api/`

## 📝 Roadmap

- ✅ Módulo Security completo
- ✅ Sistema de autenticação JWT
- ✅ Gerenciamento de usuários e grupos
- ✅ Inicialização automática de bancos
- 🔄 Módulo Support (em desenvolvimento)
- 🔄 Módulo Core com workflows
- 🔄 Sistema de comandos avançado
- 🔄 Timeline e histórico
- 🔄 Sistema de tags
- 🔄 Configurações dinâmicas

## 📄 License

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para detalhes.

---

**NeuronCore** - Elevando a inteligência artificial a um novo patamar 🧠✨

*Desenvolvido com ❤️ para simplificar e potencializar o uso de múltiplas IAs*