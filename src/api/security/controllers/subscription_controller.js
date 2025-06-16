// src/api/security/controllers/subscription_controller.js

const { getInstance } = require('../../../data/manager/keys_vo_manager');
const SubscriptionManager = require('../../../data/manager/subscription_manager');
const PlanManager = require('../../../data/manager/plan_manager');
const UserGroupManager = require('../../../data/manager/user_group_manager');
const UserManager = require('../../../data/manager/user_manager');
const TimelineManager = require('../../../data/manager/timeline_manager');
const NeuronDBSender = require('../../../data/neuron_db/sender');
const { AuthenticationError, ValidationError, NotFoundError } = require('../../../cross/entity/errors');

/**
 * Subscription Controller for NeuronCore Security API
 */
class SubscriptionController {
    constructor() {
        this.sender = new NeuronDBSender();
    }

    /**
     * Get AI token for operations
     * @param {string} aiName - AI name
     * @returns {Promise<string>}
     */
    async getAIToken(aiName) {
        const keysManager = getInstance();
        const keysVO = await keysManager.getKeysVO();
        return keysVO.getAIToken(aiName);
    }

    /**
     * Validate subscription admin permissions
     * @param {string} token - JWT token
     * @returns {Promise<Object>}
     */
    async validateSubscriptionAdminPermissions(token) {
        const validation = await this.sender.validateToken(token);

        // Check if user is subscription_admin (for payment gateway integration)
        // or regular admin for user operations
        const isSubscriptionAdmin = validation.sub === 'subscription_admin@system.local' ||
                                   validation.username === 'subscription_admin';
        const isAdmin = validation.permissions?.some(p =>
            p.database === 'main' && p.level >= 3
        ) || validation.groups?.includes('admin');

        if (!isSubscriptionAdmin && !isAdmin) {
            throw new AuthenticationError('Subscription admin permissions required');
        }

        return { validation, isSubscriptionAdmin };
    }

    /**
     * Get plans endpoint (public for authenticated users)
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async getPlans(req, res) {
        try {
            const { aiName } = req.params;
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                throw new AuthenticationError('Token is required');
            }

            // Validate token
            await this.sender.validateToken(token);

            // Get AI token
            const aiToken = await this.getAIToken(aiName);

            // Mock plans data (in real implementation, this would come from database)
            const plans = [
                {
                    id: 'basic',
                    name: 'Plano Básico',
                    description: 'Ideal para uso pessoal e pequenos projetos',
                    price: {
                        monthly: 29.90,
                        yearly: 299.00
                    },
                    features: [
                        'Até 1000 comandos/mês',
                        '5 workflows ativos',
                        'Suporte por email',
                        '1 usuário'
                    ],
                    limits: {
                        commands: 1000,
                        workflows: 5,
                        users: 1,
                        storage: 1
                    },
                    active: true
                },
                {
                    id: 'professional',
                    name: 'Plano Profissional',
                    description: 'Para equipes e projetos de médio porte',
                    price: {
                        monthly: 99.90,
                        yearly: 999.00
                    },
                    features: [
                        'Até 10.000 comandos/mês',
                        '50 workflows ativos',
                        'Suporte prioritário',
                        'Até 10 usuários',
                        'Personalização de cores'
                    ],
                    limits: {
                        commands: 10000,
                        workflows: 50,
                        users: 10,
                        storage: 10
                    },
                    active: true
                },
                {
                    id: 'enterprise',
                    name: 'Plano Enterprise',
                    description: 'Para grandes empresas e projetos complexos',
                    price: {
                        monthly: 299.90,
                        yearly: 2999.00
                    },
                    features: [
                        'Comandos ilimitados',
                        'Workflows ilimitados',
                        'Suporte 24/7',
                        'Usuários ilimitados',
                        'Personalização completa',
                        'Integração com APIs externas'
                    ],
                    limits: {
                        commands: -1,
                        workflows: -1,
                        users: -1,
                        storage: 100
                    },
                    active: true
                }
            ];

            res.json({
                error: false,
                data: {
                    plans: plans,
                    currency: 'BRL',
                    retrievedAt: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Get plans error:', error);

            if (error instanceof AuthenticationError) {
                res.status(error.statusCode).json({
                    error: true,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    error: true,
                    message: 'Failed to get plans'
                });
            }
        }
    }

    /**
     * Get current plan endpoint
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async getCurrentPlan(req, res) {
        try {
            const { aiName } = req.params;
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                throw new AuthenticationError('Token is required');
            }

            // Validate token and get user info
            const userInfo = await this.sender.validateToken(token);

            // Get AI token
            const aiToken = await this.getAIToken(aiName);

            // Mock current plan data (in real implementation, this would come from database)
            const currentPlan = {
                id: 'basic',
                name: 'Plano Básico',
                status: 'active',
                billingCycle: 'monthly',
                currentPeriod: {
                    start: '2025-01-01',
                    end: '2025-02-01'
                },
                usage: {
                    commands: 150,
                    workflows: 2,
                    users: 1,
                    storage: 0.2
                },
                limits: {
                    commands: 1000,
                    workflows: 5,
                    users: 1,
                    storage: 1
                },
                nextBilling: '2025-02-01',
                amount: 29.90,
                currency: 'BRL',
                autoRenew: true
            };

            res.json({
                error: false,
                data: {
                    plan: currentPlan,
                    user: userInfo.username,
                    retrievedAt: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Get current plan error:', error);

            if (error instanceof AuthenticationError) {
                res.status(error.statusCode).json({
                    error: true,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    error: true,
                    message: 'Failed to get current plan'
                });
            }
        }
    }

    /**
     * Change plan endpoint
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async changePlan(req, res) {
        try {
            const { aiName } = req.params;
            const { planId, billingCycle = 'monthly' } = req.body;
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                throw new AuthenticationError('Token is required');
            }

            if (!planId) {
                throw new ValidationError('Plan ID is required');
            }

            if (!['monthly', 'yearly'].includes(billingCycle)) {
                throw new ValidationError('Billing cycle must be monthly or yearly');
            }

            // Validate subscription admin permissions
            const { validation } = await this.validateSubscriptionAdminPermissions(token);

            // Get AI token
            const aiToken = await this.getAIToken(aiName);

            // Validate plan exists (mock validation)
            const validPlans = ['basic', 'professional', 'enterprise'];
            if (!validPlans.includes(planId)) {
                throw new ValidationError('Invalid plan ID');
            }

            // Log subscription change
            try {
                const timelineManager = new TimelineManager(aiToken);
                await timelineManager.logSecurityAction(
                    validation.email || validation.username,
                    aiName,
                    'subscription_plan_changed',
                    {
                        oldPlan: 'basic',
                        newPlan: planId,
                        billingCycle: billingCycle,
                        changedBy: validation.username,
                        changeTime: new Date().toISOString()
                    }
                );
            } catch (timelineError) {
                console.warn('Failed to log plan change to timeline:', timelineError.message);
            }

            // Mock successful plan change
            res.json({
                error: false,
                message: 'Plan changed successfully',
                data: {
                    newPlan: planId,
                    billingCycle: billingCycle,
                    effectiveDate: new Date().toISOString(),
                    changedBy: validation.username,
                    confirmationId: `CHG_${Date.now()}`
                }
            });

        } catch (error) {
            console.error('Change plan error:', error);

            if (error instanceof AuthenticationError || error instanceof ValidationError) {
                res.status(error.statusCode).json({
                    error: true,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    error: true,
                    message: 'Failed to change plan'
                });
            }
        }
    }

    /**
     * Cancel plan endpoint
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async cancelPlan(req, res) {
        try {
            const { aiName } = req.params;
            const { reason, effectiveDate } = req.body;
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                throw new AuthenticationError('Token is required');
            }

            // Validate subscription admin permissions
            const { validation } = await this.validateSubscriptionAdminPermissions(token);

            // Get AI token
            const aiToken = await this.getAIToken(aiName);

            const cancellationDate = effectiveDate ? new Date(effectiveDate) : new Date();
            const cancellationId = `CANCEL_${Date.now()}`;

            // Log subscription cancellation
            try {
                const timelineManager = new TimelineManager(aiToken);
                await timelineManager.logSecurityAction(
                    validation.email || validation.username,
                    aiName,
                    'subscription_cancelled',
                    {
                        reason: reason || 'No reason provided',
                        effectiveDate: cancellationDate.toISOString(),
                        cancelledBy: validation.username,
                        cancellationId: cancellationId,
                        cancelTime: new Date().toISOString()
                    }
                );
            } catch (timelineError) {
                console.warn('Failed to log cancellation to timeline:', timelineError.message);
            }

            // Mock successful cancellation
            res.json({
                error: false,
                message: 'Plan cancelled successfully',
                data: {
                    cancellationId: cancellationId,
                    effectiveDate: cancellationDate.toISOString(),
                    reason: reason || 'No reason provided',
                    cancelledBy: validation.username,
                    refundEligible: false,
                    accessUntil: cancellationDate.toISOString()
                }
            });

        } catch (error) {
            console.error('Cancel plan error:', error);

            if (error instanceof AuthenticationError) {
                res.status(error.statusCode).json({
                    error: true,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    error: true,
                    message: 'Failed to cancel plan'
                });
            }
        }
    }

    /**
     * Get subscription usage endpoint
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async getUsage(req, res) {
        try {
            const { aiName } = req.params;
            const { period = 'current' } = req.query;
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                throw new AuthenticationError('Token is required');
            }

            // Validate token
            const userInfo = await this.sender.validateToken(token);

            // Get AI token
            const aiToken = await this.getAIToken(aiName);

            // Mock usage data (in real implementation, this would be calculated from actual usage)
            const usage = {
                period: period,
                periodStart: '2025-01-01T00:00:00Z',
                periodEnd: '2025-02-01T00:00:00Z',
                usage: {
                    commands: {
                        used: 150,
                        limit: 1000,
                        percentage: 15
                    },
                    workflows: {
                        used: 2,
                        limit: 5,
                        percentage: 40
                    },
                    users: {
                        used: 1,
                        limit: 1,
                        percentage: 100
                    },
                    storage: {
                        used: 0.2,
                        limit: 1,
                        unit: 'GB',
                        percentage: 20
                    }
                },
                dailyUsage: [
                    { date: '2025-01-15', commands: 25, workflows: 0 },
                    { date: '2025-01-16', commands: 30, workflows: 1 },
                    { date: '2025-01-17', commands: 22, workflows: 0 }
                ],
                warnings: [],
                recommendations: [
                    'Consider upgrading to Professional plan for more workflows'
                ]
            };

            // Add warnings if near limits
            if (usage.usage.commands.percentage > 80) {
                usage.warnings.push('Command usage is approaching limit');
            }
            if (usage.usage.workflows.percentage > 80) {
                usage.warnings.push('Workflow usage is approaching limit');
            }

            res.json({
                error: false,
                data: {
                    usage: usage,
                    user: userInfo.username,
                    retrievedAt: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Get usage error:', error);

            if (error instanceof AuthenticationError) {
                res.status(error.statusCode).json({
                    error: true,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    error: true,
                    message: 'Failed to get usage information'
                });
            }
        }
    }

    /**
     * Get billing history endpoint
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async getBillingHistory(req, res) {
        try {
            const { aiName } = req.params;
            const { page = 1, limit = 10 } = req.query;
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                throw new AuthenticationError('Token is required');
            }

            // Validate token (admin or subscription admin only)
            await this.validateSubscriptionAdminPermissions(token);

            // Get AI token
            const aiToken = await this.getAIToken(aiName);

            // Mock billing history (in real implementation, this would come from payment provider)
            const billingHistory = [
                {
                    id: 'inv_001',
                    date: '2025-01-01',
                    amount: 29.90,
                    currency: 'BRL',
                    status: 'paid',
                    planId: 'basic',
                    billingCycle: 'monthly',
                    period: {
                        start: '2025-01-01',
                        end: '2025-02-01'
                    },
                    paymentMethod: 'credit_card',
                    downloadUrl: null
                },
                {
                    id: 'inv_002',
                    date: '2024-12-01',
                    amount: 29.90,
                    currency: 'BRL',
                    status: 'paid',
                    planId: 'basic',
                    billingCycle: 'monthly',
                    period: {
                        start: '2024-12-01',
                        end: '2025-01-01'
                    },
                    paymentMethod: 'credit_card',
                    downloadUrl: null
                }
            ];

            res.json({
                error: false,
                data: {
                    invoices: billingHistory,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: billingHistory.length,
                        pages: Math.ceil(billingHistory.length / limit)
                    },
                    retrievedAt: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Get billing history error:', error);

            if (error instanceof AuthenticationError) {
                res.status(error.statusCode).json({
                    error: true,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    error: true,
                    message: 'Failed to get billing history'
                });
            }
        }
    }
}

module.exports = SubscriptionController;