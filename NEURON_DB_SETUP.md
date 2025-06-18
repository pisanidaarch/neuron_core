# Configuração do NeuronDB para Neuron-Core

Este guia mostra como configurar corretamente o NeuronDB para trabalhar com o Neuron-Core.

## 📋 Estruturas Necessárias

### 1. **IAs e suas Keys** 
**Entidade:** `config.general.ai`

```
POST https://ndb.archoffice.tech/snl
Authorization: Bearer {seu_config_jwt}
Content-Type: text/plain

set(structure)
values("ami", {"key": "jwt_da_ami"}, "jaai", {"key": "jwt_da_jaai"}, "spai", {"key": "jwt_da_spai"})
on(config.general.ai)
```

**Resultado esperado:**
```json
{
  "ami": { "key": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..." },
  "jaai": { "key": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..." },
  "spai": { "key": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..." }
}
```

### 2. **Behavior da IA AMI**
**Entidade:** `config.ami.behavior`

```
POST https://ndb.archoffice.tech/snl
Authorization: Bearer {seu_config_jwt}
Content-Type: text/plain

set(structure)
values("default", {"behavior": "nome desta ia: ami (arch mentory inteligency), tom amigavel, ser objetiva"})
on(config.ami.behavior)
```

### 3. **Behavior da IA JAAI**
**Entidade:** `config.jaai.behavior`

```
POST https://ndb.archoffice.tech/snl
Authorization: Bearer {seu_config_jwt}
Content-Type: text/plain

set(structure)
values("default", {"behavior": "nome desta ia: jaai (just another artificial intelligence), tom profissional, ser precisa e técnica"})
on(config.jaai.behavior)
```

### 4. **Behavior da IA SPAI**
**Entidade:** `config.spai.behavior`

```
POST https://ndb.archoffice.tech/snl
Authorization: Bearer {seu_config_jwt}
Content-Type: text/plain

set(structure)
values("default", {"behavior": "nome desta ia: spai (smart personal ai), tom casual, ser prática e didática"})
on(config.spai.behavior)
```

### 5. **Configurações dos Agentes**
**Entidade:** `config.general.agent`

```
POST https://ndb.archoffice.tech/snl
Authorization: Bearer {seu_config_jwt}
Content-Type: text/plain

set(structure)
values(
  "claude", {
    "apiKey": "sk-ant-api03-...",
    "models": [
      {
        "max_tokens": 64000,
        "model": "claude-sonnet-4-20250514",
        "name": "Sonnet 4"
      },
      {
        "max_tokens": 32000,
        "model": "claude-opus-4-20250514", 
        "name": "Opus 4"
      }
    ],
    "role": "system",
    "url": "https://api.anthropic.com/v1/messages"
  },
  "gpt", {
    "apiKey": "sk-proj-...",
    "max_tokens": 4096,
    "model": "gpt-4o",
    "role": "system",
    "url": "https://api.openai.com/v1/chat/completions"
  },
  "gemini", {
    "apiKey": "AIzaSy...",
    "maxOutputTokens": 250000,
    "model": "gemini-1.5-pro",
    "temperature": 0.2,
    "topK": 20,
    "topP": 0.95
  }
)
on(config.general.agent)
```

## 🔍 Verificação

Para verificar se as configurações estão corretas:

### Verificar IAs
```
view(structure)
on(config.general.ai)
```

### Verificar Behavior de uma IA
```
view(structure)
on(config.ami.behavior)
```

### Verificar Agentes
```
view(structure)
on(config.general.agent)
```

## ⚠️ Importante

1. **Todas as operações de configuração** usam o `config_jwt` fixo
2. **Operações do sistema** usam as `keys` das IAs específicas
3. **Operações do usuário** usam o token do usuário após login
4. **Refresh automático** a cada 5 minutos no Neuron-Core
5. **Isolamento por IA** via URL pattern `/api/{aiName}/...`

## 🚀 Após Configurar

1. Configure o `config.json` do Neuron-Core
2. Execute: `npm run dev`
3. Acesse: `http://localhost:3000/api/docs`
4. Teste: `http://localhost:3000/api/ami/security/health`