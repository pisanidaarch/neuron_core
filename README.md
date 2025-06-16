# NeuronCore - Sistema de IA Multi-Instância

O NeuronCore é um backend robusto para sistemas de inteligência artificial que oferece gerenciamento multi-instância, autenticação avançada, timeline de interações e suporte completo a workflows.

## 🚀 Principais Características

- **Multi-IA**: Suporte a múltiplas instâncias de IA simultaneamente
- **Segurança Avançada**: Autenticação JWT, grupos de usuários e permissões granulares
- **Timeline**: Histórico completo de interações com sistema de tags
- **Workflows**: Sistema de comandos personalizáveis e agendamento
- **Configuração Flexível**: Temas personalizáveis e comportamentos configuráveis
- **SNL Integration**: Integração nativa com NeuronDB usando linguagem SNL

## 📋 Pré-requisitos

- Node.js 18+ 
- NeuronDB Server rodando e acessível
- NPM ou Yarn

## 🛠️ Instalação

### 1. Clone o repositório
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

# Edite config.json com suas configurações
nano config.json
```

### 4. Configuração do config.json

```json
{
  "database": {
    "config_url": "http://localhost:8080",
    "config_token": "seu_token_de_config_aqui"
  },
  "ai_instances": {
    "minha_ia": {
      "name": "minha_ia",
      "url": "http://localhost:8080", 
      "token": "token_da_minha_ia_aqui"
    }
  },
  "security": {
    "jwt_secret": "seu_jwt_secret_super_seguro_aqui",
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

O servidor será iniciado na porta 3000 (ou a porta configurada) e automaticamente:
- Criará os bancos de dados necessários
- Inicializará as estruturas de dados
- Criará o usuário administrativo de subscription
- Configurará grupos e permissões padrão

## 🔧 Estrutura do Projeto

```
neuron-core/
├── src/
│   ├── api/                    # Camada de API
│   │   ├── security/           # Endpoints de segurança
│   │   └── support/            # Endpoints de suporte
│   ├── core/                   # Lógica de negócio principal (futuro)
│   ├── cross/                  # Entidades compartilhadas
│   │   └── entity/             # Entidades de domínio
│   ├── data/                   # Camada de dados
│   │   ├── manager/            # Gerenciadores de entidades
│   │   ├── snl/               # Comandos SNL
│   │   ├── neuron_db/         # Senders para NeuronDB
│   │   └── initializer/       # Inicializadores de banco
│   └── support/               # Módulo de suporte (futuro)
├── config.json               # Configuração do sistema
├── package.json              # Dependências NPM
└── README.md                 # Este arquivo
```

## 🔐 Módulo de Segurança

### Grupos Padrão

- **subscription_admin**: Grupo para integração com gateways de pagamento
- **admin**: Administradores que podem gerenciar usuários e configurações
- **default**: Usuários padrão da IA

### Usuário Padrão

- **Email**: `subscription_admin@system.local`
- **Senha**: `sudo_subscription_admin`
- **Grupo**: `subscription_admin`

### Endpoints de Autenticação

```bash
# Login
POST /{ai_name}/security/login
{
  "username": "user@example.com",
  "password": "password123"
}

# Validar token
GET /{ai_name}/security/validate
Authorization: Bearer {token}

# Trocar senha
POST /{ai_name}/security/change-password
Authorization: Bearer {token}
{
  "newPassword": "newpassword123"
}
```

### Gerenciamento de Usuários

```bash
# Criar usuário (Admin)
POST /{ai_name}/security/create-user
Authorization: Bearer {admin_token}
{
  "email": "newuser@example.com",
  "password": "password123",
  "nick": "New User"
}

# Obter permissões
GET /{ai_name}/security/permissions
Authorization: Bearer {token}

# Definir permissão (Admin)
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

## 📚 Módulo de Support

### Timeline

O sistema de timeline registra todas as interações e permite busca avançada:

```bash
# Registrar entrada na timeline
POST /{ai_name}/support/timeline/record
Authorization: Bearer {token}
{
  "entity_name": "chat",
  "input": "Hello, world!",
  "output": "Hi there!",
  "tags": ["test", "greeting"]
}

# Buscar por período
GET /{ai_name}/support/timeline?year=2025&month=6&entity=chat
Authorization: Bearer {token}

# Buscar por termo
GET /{ai_name}/support/timeline/search?query=hello
Authorization: Bearer {token}
```

### Configuração de IA

```bash
# Obter configuração
GET /{ai_name}/support/config
Authorization: Bearer {token}

# Atualizar tema (Admin apenas)
PUT /{ai_name}/support/config/theme
Authorization: Bearer {admin_token}
{
  "primary_colors": {
    "black": "#000000",
    "white": "#FFFFFF",
    "dark_blue": "#0363AE",
    "dark_purple": "#50038F"
  }
}
```

### Sistema de Tags

```bash
# Adicionar tag
POST /{ai_name}/support/tag
Authorization: Bearer {token}
{
  "database": "timeline",
  "namespace": "user_namespace",
  "entity": "chat_entry",
  "tag": "important"
}

# Listar tags
GET /{ai_name}/support/tags?database=timeline&namespace=user_namespace
Authorization: Bearer {token}
```

### Operações SNL Diretas

```bash
# Executar comando SNL
POST /{ai_name}/support/snl
Authorization: Bearer {token}
{
  "command": "list(database)\non()"
}
```

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
# Status dos bancos de dados
GET /admin/database/status

# Forçar inicialização
POST /admin/database/initialize

# Status de saúde
GET /health
```

## 🧪 Testes com Postman

Importe a coleção Postman incluída no projeto para testar todos os endpoints. A coleção inclui:

- Todas as operações de segurança
- Operações de timeline
- Gerenciamento de configuração
- Operações de banco de dados
- Sistema de tags
- Execução de SNL

### Variáveis da Coleção
- `base_url`: http://localhost:3000
- `ai_name`: nome da sua instância de IA
- `auth_token`: token do usuário (preenchido automaticamente)
- `admin_token`: token do admin (preenchido automaticamente)

## 🔧 Desenvolvimento

### Estrutura de Código

- **Entidades**: Modelos de domínio em `src/cross/entity/`
- **Managers**: Lógica de negócio em `src/data/manager/`
- **SNL**: Comandos de banco em `src/data/snl/`
- **Controllers**: Endpoints em `src/api/`

### Padrões Utilizados

- **Repository Pattern**: Para acesso a dados
- **Singleton Pattern**: Para gerenciamento de chaves (KeysVO)
- **DTO Pattern**: Para transferência de dados entre camadas
- **Command Pattern**: Para operações SNL

## 🐛 Troubleshooting

### Erro: "Cannot find module '../snl/subscription_snl'"
- Certifique-se de que todos os arquivos SNL foram criados
- Verifique se os caminhos estão corretos

### Erro: "Config token not available"
- Verifique se o arquivo `config.json` está configurado corretamente
- Confirme se os tokens do NeuronDB estão válidos

### Erro de conexão com NeuronDB
- Verifique se o NeuronDB está rodando
- Confirme as URLs e tokens no config.json
- Teste a conectividade manualmente

### Problemas de inicialização
- Use o endpoint `/admin/database/initialize` para forçar reinicialização
- Verifique logs detalhados no console
- Confirme permissões dos tokens

## 📈 Monitoramento

O sistema fornece endpoints de monitoramento:

- `/health`: Status geral do sistema
- `/admin/database/status`: Status detalhado dos bancos

## 🔒 Segurança

- Tokens JWT com expiração configurável
- Permissões granulares por banco de dados
- Isolamento completo entre instâncias de IA
- Grupos de usuários com controle de acesso
- Validação de entrada em todos os endpoints

## 🚀 Produção

Para deploy em produção:

1. Configure `NODE_ENV=production`
2. Use tokens seguros e únicos
3. Configure CORS adequadamente
4. Use HTTPS
5. Configure logs apropriados
6. Monitore performance e uso

## 📝 License

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para detalhes.

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

---

**NeuronCore** - Elevando a inteligência artificial a um novo patamar 🧠✨