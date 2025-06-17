// src/utils/startup_banner.js

const packageJson = require('../../package.json');

/**
 * Startup Banner and System Info
 */
class StartupBanner {
    /**
     * Display startup banner
     */
    static display() {
        console.log('\n🧠 ===============================================');
        console.log('   ███╗   ██╗███████╗██╗   ██╗██████╗  ██████╗ ███╗   ██║');
        console.log('   ████╗  ██║██╔════╝██║   ██║██╔══██╗██╔═══██╗████╗  ██║');
        console.log('   ██╔██╗ ██║█████╗  ██║   ██║██████╔╝██║   ██║██╔██╗ ██║');
        console.log('   ██║╚██╗██║██╔══╝  ██║   ██║██╔══██╗██║   ██║██║╚██╗██║');
        console.log('   ██║ ╚████║███████╗╚██████╔╝██║  ██║╚██████╔╝██║ ╚████║');
        console.log('   ╚═╝  ╚═══╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝');
        console.log('                    ______ _____ ____  ______               ');
        console.log('                   / ____// ___// __ \\/ ____/              ');
        console.log('                  / /     \\__ \\/ /_/ / __/                 ');
        console.log('                 / /___  ___/ / _, _/ /___                  ');
        console.log('                 \\____/ /____/_/ |_/_____/                 ');
        console.log('   ===============================================');
        console.log('   🚀 Multi-AI Orchestration Platform');
        console.log('   🔒 Enterprise Security & Authentication');
        console.log('   🔄 Advanced Workflow Management');
        console.log('   📊 Timeline & Analytics');
        console.log(`   📦 Version: ${packageJson.version}`);
        console.log('   ===============================================\n');
    }

    /**
     * Display system information
     */
    static displaySystemInfo() {
        const info = this.getSystemInfo();

        console.log('📋 System Information:');
        console.log(`   Node.js: ${info.nodeVersion}`);
        console.log(`   Platform: ${info.platform}`);
        console.log(`   Architecture: ${info.architecture}`);
        console.log(`   Memory: ${info.memory}`);
        console.log(`   Uptime: ${info.uptime}s`);
        console.log('');
    }

    /**
     * Get system information
     */
    static getSystemInfo() {
        const memoryUsage = process.memoryUsage();
        const totalMemory = Math.round(memoryUsage.rss / 1024 / 1024);

        return {
            nodeVersion: process.version,
            platform: process.platform,
            architecture: process.arch,
            memory: `${totalMemory}MB`,
            uptime: Math.round(process.uptime()),
            pid: process.pid,
            cwd: process.cwd()
        };
    }

    /**
     * Display configuration status
     */
    static displayConfigStatus(keysVO) {
        console.log('⚙️  Configuration Status:');

        if (keysVO) {
            const validation = keysVO.validate();

            if (validation.length === 0) {
                console.log('   ✅ Configuration is valid');
                console.log(`   🔗 Config URL: ${keysVO.getConfigUrl()}`);
                console.log(`   🤖 AI Instances: ${keysVO.getAINames().join(', ')}`);
                console.log(`   🔐 JWT Secret: ${keysVO.getJWTSecret() ? 'Set' : 'Not set'}`);
            } else {
                console.log('   ❌ Configuration has errors:');
                validation.forEach(error => {
                    console.log(`     - ${error}`);
                });
            }
        } else {
            console.log('   ❌ Configuration not loaded');
        }
        console.log('');
    }

    /**
     * Display startup warnings
     */
    static displayWarnings() {
        const warnings = [];

        // Check environment
        if (process.env.NODE_ENV !== 'production') {
            warnings.push('Running in development mode');
        }

        // Check if using default secrets
        try {
            const config = require('../../config.json');
            if (config.security?.jwt_secret?.includes('production')) {
                warnings.push('Using default JWT secret - change in production!');
            }
            if (config.database?.config_token?.includes('YOUR_')) {
                warnings.push('Using demo config token - change to real token!');
            }
            if (config.ai_instances) {
                Object.values(config.ai_instances).forEach(ai => {
                    if (ai.token?.includes('YOUR_')) {
                        warnings.push(`AI ${ai.name} using demo token - change to real token!`);
                    }
                });
            }
        } catch (error) {
            warnings.push('Config file not found or invalid');
        }

        if (warnings.length > 0) {
            console.log('⚠️  Warnings:');
            warnings.forEach(warning => {
                console.log(`   ⚠️  ${warning}`);
            });
            console.log('');
        }
    }

    /**
     * Display success message
     */
    static displaySuccess(port) {
        console.log('🎉 ===============================================');
        console.log('   🚀 NeuronCore is running successfully!');
        console.log('   ===============================================');
        console.log(`   🌐 Server: http://localhost:${port}`);
        console.log(`   📋 Health: http://localhost:${port}/health`);
        console.log(`   ⚙️  Admin: http://localhost:${port}/admin/status`);
        console.log('   ===============================================');
        console.log('   📚 Security API:');
        console.log(`   🔐 Login: POST /api/security/{ai_name}/auth/login`);
        console.log(`   ✅ Validate: GET /api/security/{ai_name}/auth/validate`);
        console.log(`   🔑 Change PWD: POST /api/security/{ai_name}/auth/change-password`);
        console.log(`   👤 Create User: POST /api/security/{ai_name}/users/create`);
        console.log('   ===============================================');
        console.log('   💡 Default System Admin:');
        console.log('   📧 Email: subscription_admin@system.local');
        console.log('   🔐 Password: sudo_subscription_admin');
        console.log('   ===============================================');
        console.log('   🔧 Quick Commands:');
        console.log('   npm run setup        - Run configuration wizard');
        console.log('   npm run health        - Check system health');
        console.log('   npm run admin         - Check admin status');
        console.log('   npm run security:test - Run Postman tests');
        console.log('   ===============================================\n');
    }

    /**
     * Display error message
     */
    static displayError(error) {
        console.log('\n❌ ===============================================');
        console.log('   💥 NeuronCore failed to start!');
        console.log('   ===============================================');
        console.log(`   Error: ${error.message}`);

        if (error.code) {
            console.log(`   Code: ${error.code}`);
        }

        console.log('   ===============================================');
        console.log('   🔧 Troubleshooting:');
        console.log('   1. Check if config.json exists and is valid');
        console.log('   2. Run: npm run setup (configuration wizard)');
        console.log('   3. Verify NeuronDB is running');
        console.log('   4. Check tokens in config.json');
        console.log('   5. Run: npm run health (after fixing)');
        console.log('   ===============================================\n');
    }

    /**
     * Display graceful shutdown message
     */
    static displayShutdown() {
        console.log('\n👋 ===============================================');
        console.log('   🛑 NeuronCore is shutting down gracefully...');
        console.log('   ===============================================');
        console.log('   💾 Saving state...');
        console.log('   🔌 Closing connections...');
        console.log('   ✅ Shutdown complete');
        console.log('   ===============================================');
        console.log('   Thanks for using NeuronCore! 🧠✨');
        console.log('   ===============================================\n');
    }
}

module.exports = StartupBanner;