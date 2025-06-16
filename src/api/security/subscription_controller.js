// src/api/security/subscription_controller.js

const { getInstance } = require('../../data/manager/keys_vo_manager');
const SubscriptionManager = require('../../data/manager/subscription_manager');
const PlanManager = require('../../data/manager/plan_manager');
const UserGroupManager = require('../../data/manager/user_group_manager');
const UserManager = require('../../data/manager/user_manager');
const NeuronDBSender = require('../../data/neuron_db/sender');
const { AuthenticationError, ValidationError, NotFoundError } = require('../../cross/entity/errors');

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
        const isSubscriptionAdmin = validation.sub === 'subscription_admin@system.local';
        const isAdmin = validation.permissions?.some(p =>
            p.database === 'main' && p.level >= 3
        );

        if (!isSubscriptionAdmin && !isAdmin) {
            throw new AuthenticationError('Subscription admin permissions required');
        }

        return { validation, isSubscriptionAdmin };
    }

    /**
     * Get plans endpoint (public)
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

            // Get active plans
            const planManager = new PlanManager(aiToken);
            const plans = await planManager.getActivePlans();

            res.json({
                error: false,
                data: plans.map(plan => ({
                    id: plan.id,
                    name: plan.name,
                    description: plan.description,
                    price: plan.price,
                    currency: plan.currency,
                    billing_cycle: plan.billing_cycle,
                    limits: plan.limits,
                    features: plan.features
                }))
            });

        } catch (error) {
            console.error('Get plans error:', error);

            if (error instanceof AuthenticationError) {
                res.status(401).json({
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
     * Get specific plan endpoint
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async getPlan(req, res) {
        try {
            const { aiName, planId } = req.params;
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                throw new AuthenticationError('Token is required');
            }

            // Validate token
            await this.sender.validateToken(token);

            // Get AI token
            const aiToken = await this.getAIToken(aiName);

            // Get plan
            const planManager = new PlanManager(aiToken);
            const plan = await planManager.getPlan(planId);

            if (!plan) {
                throw new NotFoundError('Plan', planId);
            }

            res.json({
                error: false,
                data: {
                    id: plan.id,
                    name: plan.name,
                    description: plan.description,
                    price: plan.price,
                    currency: plan.currency,
                    billing_cycle: plan.billing_cycle,
                    limits: plan.limits,
                    features: plan.features
                }
            });

        } catch (error) {
            console.error('Get plan error:', error);

            if (error instanceof AuthenticationError) {
                res.status(401).json({
                    error: true,
                    message: error.message
                });
            } else if (error instanceof NotFoundError) {
                res.status(404).json({
                    error: true,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    error: true,
                    message: 'Failed to get plan'
                });
            }
        }
    }

    /**
     * Create subscription endpoint (for payment gateway)
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async createSubscription(req, res) {
        try {
            const { aiName } = req.params;
            const token = req.headers.authorization?.replace('Bearer ', '');
            const { email, planId, password } = req.body;

            if (!token) {
                throw new AuthenticationError('Token is required');
            }

            if (!email || !planId) {
                throw new ValidationError('Email and plan ID are required');
            }

            // Validate subscription admin permissions (payment gateway only)
            const { isSubscriptionAdmin } = await this.validateSubscriptionAdminPermissions(token);

            if (!isSubscriptionAdmin) {
                throw new AuthenticationError('Only subscription admin can create subscriptions');
            }

            // Get AI token
            const aiToken = await this.getAIToken(aiName);

            // Check if plan exists
            const planManager = new PlanManager(aiToken);
            const plan = await planManager.getPlan(planId);
            if (!plan) {
                throw new NotFoundError('Plan', planId);
            }

            // Generate password if not provided
            const userPassword = password || this.generateRandomPassword();

            // Create user with NeuronDB
            const userData = {
                email: email,
                password: userPassword,
                nick: email.split('@')[0],
                roles: {
                    permissions: {
                        main: 1 // Read permission
                    }
                }
            };

            await this.sender.setUser(aiToken, userData);

            // Create subscription
            const subscriptionManager = new SubscriptionManager(aiToken);
            const subscription = await subscriptionManager.createSubscription(email, planId);

            // Add user to default group
            const userGroupManager = new UserGroupManager(aiToken);
            await userGroupManager.addMemberToGroup('default', email);

            res.json({
                error: false,
                message: 'Subscription created successfully',
                data: {
                    email: email,
                    password: userPassword,
                    plan: planId
                }
            });

        } catch (error) {
            console.error('Create subscription error:', error);

            if (error instanceof AuthenticationError) {
                res.status(401).json({
                    error: true,
                    message: error.message
                });
            } else if (error instanceof ValidationError) {
                res.status(400).json({
                    error: true,
                    message: error.message
                });
            } else if (error instanceof NotFoundError) {
                res.status(404).json({
                    error: true,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    error: true,
                    message: 'Failed to create subscription'
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
            const token = req.headers.authorization?.replace('Bearer ', '');
            const { email, oldPlanId, newPlanId } = req.body;

            if (!token) {
                throw new AuthenticationError('Token is required');
            }

            if (!email || !newPlanId) {
                throw new ValidationError('Email and new plan ID are required');
            }

            // Validate admin permissions
            await this.validateSubscriptionAdminPermissions(token);

            // Get AI token
            const aiToken = await this.getAIToken(aiName);

            // Check if new plan exists
            const planManager = new PlanManager(aiToken);
            const newPlan = await planManager.getPlan(newPlanId);
            if (!newPlan) {
                throw new NotFoundError('Plan', newPlanId);
            }

            // Change subscription plan
            const subscriptionManager = new SubscriptionManager(aiToken);
            const success = await subscriptionManager.changeSubscriptionPlan(email, newPlanId);

            if (!success) {
                throw new Error('Failed to change subscription plan');
            }

            res.json({
                error: false,
                message: 'Plan changed successfully'
            });

        } catch (error) {
            console.error('Change plan error:', error);

            if (error instanceof AuthenticationError) {
                res.status(401).json({
                    error: true,
                    message: error.message
                });
            } else if (error instanceof ValidationError) {
                res.status(400).json({
                    error: true,
                    message: error.message
                });
            } else if (error instanceof NotFoundError) {
                res.status(404).json({
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
            const token = req.headers.authorization?.replace('Bearer ', '');
            const { email } = req.body;

            if (!token) {
                throw new AuthenticationError('Token is required');
            }

            if (!email) {
                throw new ValidationError('Email is required');
            }

            // Validate admin permissions
            await this.validateSubscriptionAdminPermissions(token);

            // Get AI token
            const aiToken = await this.getAIToken(aiName);

            // Cancel subscription
            const subscriptionManager = new SubscriptionManager(aiToken);
            const success = await subscriptionManager.cancelSubscription(email);

            if (!success) {
                throw new Error('Failed to cancel subscription');
            }

            res.json({
                error: false,
                message: 'Subscription cancelled successfully'
            });

        } catch (error) {
            console.error('Cancel plan error:', error);

            if (error instanceof AuthenticationError) {
                res.status(401).json({
                    error: true,
                    message: error.message
                });
            } else if (error instanceof ValidationError) {
                res.status(400).json({
                    error: true,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    error: true,
                    message: 'Failed to cancel subscription'
                });
            }
        }
    }

    /**
     * Add user to subscription endpoint
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async addUserToSubscription(req, res) {
        try {
            const { aiName } = req.params;
            const token = req.headers.authorization?.replace('Bearer ', '');
            const { subscriptionOwner, newUserEmail, password } = req.body;

            if (!token) {
                throw new AuthenticationError('Token is required');
            }

            if (!subscriptionOwner || !newUserEmail) {
                throw new ValidationError('Subscription owner and new user email are required');
            }

            // Validate admin permissions
            const { validation } = await this.validateSubscriptionAdminPermissions(token);

            // Get AI token
            const aiToken = await this.getAIToken(aiName);

            // Get subscription and plan
            const subscriptionManager = new SubscriptionManager(aiToken);
            const subscription = await subscriptionManager.getSubscription(subscriptionOwner);

            if (!subscription) {
                throw new NotFoundError('Subscription', subscriptionOwner);
            }

            const planManager = new PlanManager(aiToken);
            const plan = await planManager.getPlan(subscription.plan_id);

            if (!plan) {
                throw new NotFoundError('Plan', subscription.plan_id);
            }

            // Check if subscription allows more users
            if (!subscription.canAddUser(plan.limits.max_users)) {
                throw new ValidationError('Subscription has reached maximum user limit');
            }

            // Generate password if not provided
            const userPassword = password || this.generateRandomPassword();

            // Create new user
            const userData = {
                email: newUserEmail,
                password: userPassword,
                nick: newUserEmail.split('@')[0],
                roles: {
                    permissions: {
                        main: 1 // Read permission
                    }
                }
            };

            await this.sender.setUser(aiToken, userData);

            // Add user to subscription
            await subscriptionManager.addUserToSubscription(subscriptionOwner, plan.limits.max_users);

            // Add user to default group
            const userGroupManager = new UserGroupManager(aiToken);
            await userGroupManager.addMemberToGroup('default', newUserEmail);

            res.json({
                error: false,
                message: 'User added to subscription successfully',
                data: {
                    email: newUserEmail,
                    password: userPassword
                }
            });

        } catch (error) {
            console.error('Add user to subscription error:', error);

            if (error instanceof AuthenticationError) {
                res.status(401).json({
                    error: true,
                    message: error.message
                });
            } else if (error instanceof ValidationError) {
                res.status(400).json({
                    error: true,
                    message: error.message
                });
            } else if (error instanceof NotFoundError) {
                res.status(404).json({
                    error: true,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    error: true,
                    message: 'Failed to add user to subscription'
                });
            }
        }
    }

    /**
     * Generate random password
     * @returns {string}
     */
    generateRandomPassword() {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let password = '';
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }
}

module.exports = SubscriptionController;