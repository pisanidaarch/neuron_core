// setup.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise(resolve => {
    rl.question(prompt, resolve);
  });
}

function generateJWTSecret() {
  return crypto.randomBytes(32).toString('hex');
}

async function setup() {
  console.log('🚀 Bem-vindo ao setup do Neuron-Core!\n');

  const configPath = path.join(__dirname, 'config.json');
  const examplePath = path.join(__dirname, 'config.json.example');

  // Verificar se config.json já existe
  if (fs.existsSync(configPath)) {
    const overwrite = await question('⚠️  config.json já existe. Deseja sobrescrever? (s/N): ');
    if (overwrite.toLowerCase() !== 's' && overwrite.toLowerCase() !== 'sim') {
      console.log('✅ Setup cancelado. Arquivo existente mantido.');
      rl.close();
      return;
    }
  }

  console.log('📝 Configurando o Neuron-Core...\n');

  // Configurações básicas
  const neurondbUrl = await question('🔗 URL do NeuronDB (https://ndb.archoffice.tech): ') || 'https://ndb.archoffice.tech';
  const configJWT = await question('🔑 JWT de configuração do NeuronDB: ');

  if (!configJWT) {
    console.log('❌ JWT de configuração é obrigatório!');
    rl.close();
    return;
  }

  const port = await question('🌐 Porta do servidor (3000): ') || '3000';

  // Criar configuração simplificada
  const config = {
    neurondb: {
      url: neurondbUrl,
      config_jwt: configJWT
    },
    server: {
      port: parseInt(port)
    }
  };

  try {
    // Salvar config.json
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log('✅ config.json criado com sucesso!');

    // Verificar estrutura de diretórios
    const requiredDirs = [
      'src/api/controllers',
      'src/api/middlewares',
      'src/api/routes',
      'src/core/security',
      'src/cross/entities',
      'src/cross/constants',
      'src/data/managers',
      'src/data/snl/security',
      'src/data/sender'
    ];

    console.log('\n📁 Verificando estrutura de diretórios...');
    for (const dir of requiredDirs) {
      const dirPath = path.join(__dirname, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`✅ Criado: ${dir}`);
      }
    }

    console.log('\n🎉 Setup concluído com sucesso!');
    console.log('\n📋 Próximos passos:');
    console.log('1. Configure suas IAs no NeuronDB: config.general.ai');
    console.log('2. Configure behaviors das IAs: config.{nomeIA}.behavior');
    console.log('3. Configure agentes no NeuronDB: config.general.agent');
    console.log('4. Execute: npm run dev');
    console.log('5. Acesse: http://localhost:' + port + '/api/docs');
    console.log('\n📖 Consulte o README.md para mais informações.');
    console.log('\n🔄 Configurações são carregadas automaticamente do NeuronDB a cada 5 minutos.');

  } catch (error) {
    console.error('❌ Erro ao criar configuração:', error.message);
  }

  rl.close();
}

setup().catch(console.error);