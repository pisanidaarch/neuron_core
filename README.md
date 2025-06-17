# NeuronCore

Backend system for AI management with NeuronDB integration. Built with Node.js and designed for scalability, security, and multi-AI instance support.

## 🚀 Features

- **Multi-AI Instance Support**: Manage multiple AI instances with isolated data and configurations
- **NeuronDB Integration**: Native integration with NeuronDB using SNL (Structured Neuron Language)
- **Security First**: JWT authentication, granular permissions, and secure data isolation
- **Timeline Tracking**: Complete audit trail of all user interactions
- **Flexible Configuration**: Per-AI configuration with theme, behavior, and model settings
- **Command Workflows**: Support for complex command chains and workflows
- **Real-time Operations**: Asynchronous processing with streaming support

## 📋 Prerequisites

- Node.js 16.0.0 or higher
- NeuronDB instance with valid tokens
- Basic understanding of SNL commands

## 🛠️ Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/neuron-core.git
cd neuron-core
```

2. Install dependencies:
```bash
npm install
```

3. Configure the system:
```bash
cp config.example.json config.json
```

4. Edit `config.json` with your NeuronDB credentials:
```json
{
  "database": {
    "config_url": "https://ndb.archoffice.tech",
    "config_token": "YOUR_CONFIG_TOKEN_HERE"
  },
  "ai_instances": {
    "demo_ai": {
      "name": "demo_ai",
      "url": "https://ndb.archoffice.tech",
      "token": "YOUR_AI_TOKEN_HERE"
    }
  }
}
```

5. Start the server:
```bash
npm start
```

## 🏗️ Architecture

### Layer Structure

```
┌─────────────────┐
│   API Layer     │  Controllers, Routes, Middleware
├─────────────────┤
│  Core Layer     │  Business Logic, Services
├─────────────────┤
│  Data Layer     │  Managers, SNL Commands, Senders
├─────────────────┤
│  Cross Layer    │  Entities, DTOs, Errors
└─────────────────┘
```

### Data Flow

```
Entity (input) → Manager → SNL → Sender → NeuronDB
                    ↓                         ↓
                Response ← Manager ← Result ←─┘
```

## 📡 API Endpoints

### Authentication
- `POST /api/security/{aiName}/auth/login` - User login
- `GET /api/security/{aiName}/auth/validate` - Validate token
- `POST /api/security/{aiName}/auth/change-password` - Change password

### Users
- `POST /api/security/{aiName}/users/create` - Create user (Admin)
- `GET /api/security/{aiName}/users/me` - Get current user
- `GET /api/security/{aiName}/users/list` - List users (Admin)

### Support
- `POST /api/support/{aiName}/snl` - Execute SNL command
- `GET /api/support/{aiName}/timeline` - Get user timeline
- `GET /api/support/{aiName}/config` - Get AI configuration

## 🔐 Security

### Default System User
- **Email**: `subscription_admin@system.local`
- **Password**: `sudo_subscription_admin`
- **Role**: Subscription Administrator

### Permission Levels
- `1` - Read access
- `2` - Write access
- `3` - Admin access

### Groups
- `subscription_admin` - Full system access
- `admin` - User and configuration management
- `default` - Basic user access

## 📚 SNL Commands

### Supported Commands
- `set` - Create or update entities
- `view` - View entity content
- `list` - List entities
- `search` - Search for content
- `match` - Semantic/tag matching
- `remove` - Remove items
- `drop` - Delete entities
- `tag/untag` - Manage tags
- `audit` - View audit logs

### Example SNL Commands

```text
# Create user
set(structure)
values("user@example.com", {"nick": "John", "password": "secure123", "group": "default"})
on(main.core.users)

# View user
view(structure)
on(main.core.users.user@example.com)

# List users
list(structure)
values("*")
on(main.core)
```

## 🧪 Testing

Run tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## 🚧 Development

### Project Structure
See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for detailed folder organization.

### Adding New Features

1. **Entity**: Create in `src/cross/entity/`
2. **SNL**: Create in `src/data/snl/` extending `BaseSNL`
3. **Manager**: Create in `src/data/manager/` extending `BaseManager`
4. **Service**: Create in `src/core/`
5. **Controller**: Create in `src/api/`

### Code Standards
- ES6+ JavaScript
- JSDoc comments
- 70% minimum test coverage
- Max 200 lines per file
- English for code and comments

## 🐛 Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Check your token in config.json
   - Ensure NeuronDB is accessible
   - Verify user credentials

2. **SNL Command Errors**
   - Validate command syntax
   - Check permissions for the operation
   - Ensure entity types are correct

3. **Connection Issues**
   - Verify NeuronDB URLs
   - Check network connectivity
   - Ensure tokens are valid

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Contact the development team
- Check the [documentation](docs/)

## 🚦 Status

- [x] Core architecture
- [x] Authentication system
- [x] User management
- [x] Permission system
- [x] SNL integration
- [ ] API controllers
- [ ] Chat functionality
- [ ] Command workflows
- [ ] V8 integration
- [ ] Full test coverage

---

Built with ❤️ for the Neuron ecosystem