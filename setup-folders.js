// setup-folders.js - Create folder structure for NeuronCore

const fs = require('fs');
const path = require('path');

// Define folder structure
const folders = [
    // API Layer
    'src/api',
    'src/api/http_facade',
    'src/api/security',
    'src/api/core',
    'src/api/support',

    // Security Layer
    'src/security',
    'src/security/authentication',
    'src/security/permission',
    'src/security/subscription',

    // Core Layer
    'src/core',
    'src/core/chat',
    'src/core/command',
    'src/core/v8',
    'src/core/ai',

    // Support Layer
    'src/support',
    'src/support/ui',
    'src/support/command',
    'src/support/config',
    'src/support/timeline',

    // Cross Layer
    'src/cross',
    'src/cross/entity',
    'src/cross/dto',
    'src/cross/errors',

    // Data Layer
    'src/data',
    'src/data/manager',
    'src/data/snl',
    'src/data/neuron_db',

    // Tests
    'tests',
    'tests/unit',
    'tests/integration',
    'tests/fixtures'
];

// Create folders
console.log('📁 Creating folder structure for NeuronCore...\n');

folders.forEach(folder => {
    const fullPath = path.join(process.cwd(), folder);

    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`✅ Created: ${folder}`);
    } else {
        console.log(`⏭️  Exists: ${folder}`);
    }
});

// Create .gitkeep files in empty folders
console.log('\n📄 Adding .gitkeep files to empty folders...\n');

folders.forEach(folder => {
    const fullPath = path.join(process.cwd(), folder);
    const gitkeepPath = path.join(fullPath, '.gitkeep');

    // Check if folder is empty
    const files = fs.readdirSync(fullPath);
    if (files.length === 0 || (files.length === 1 && files[0] === '.gitkeep')) {
        fs.writeFileSync(gitkeepPath, '');
        console.log(`✅ Added .gitkeep to: ${folder}`);
    }
});

console.log('\n✨ Folder structure created successfully!');