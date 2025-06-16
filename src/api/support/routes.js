// src/api/support/routes.js

const express = require('express');
const CommandController = require('./controllers/command_controller');
const DatabaseController = require('./controllers/database_controller');
const NamespaceController = require('./controllers/namespace_controller');
const TagController = require('./controllers/tag_controller');
const TimelineController = require('./controllers/timeline_controller');
const ConfigController = require('./controllers/config_controller');
const { ErrorHandler } = require('../../cross/entity/errors');

const router = express.Router();

// Initialize controllers
const commandController = new CommandController();
const databaseController = new DatabaseController();
const namespaceController = new NamespaceController();
const tagController = new TagController();
const timelineController = new TimelineController();
const configController = new ConfigController();

// Command routes
router.post('/:aiName/commands', ErrorHandler.asyncWrapper(commandController.createCommand.bind(commandController)));
router.get('/:aiName/commands', ErrorHandler.asyncWrapper(commandController.listCommands.bind(commandController)));
router.get('/:aiName/commands/:commandId', ErrorHandler.asyncWrapper(commandController.getCommand.bind(commandController)));
router.put('/:aiName/commands/:commandId', ErrorHandler.asyncWrapper(commandController.updateCommand.bind(commandController)));
router.delete('/:aiName/commands/:commandId', ErrorHandler.asyncWrapper(commandController.deleteCommand.bind(commandController)));
router.post('/:aiName/commands/search', ErrorHandler.asyncWrapper(commandController.searchCommands.bind(commandController)));

// Database routes (admin only)
router.post('/:aiName/database', ErrorHandler.asyncWrapper(databaseController.createDatabase.bind(databaseController)));
router.delete('/:aiName/database/:databaseName', ErrorHandler.asyncWrapper(databaseController.deleteDatabase.bind(databaseController)));
router.get('/:aiName/database', ErrorHandler.asyncWrapper(databaseController.listDatabases.bind(databaseController)));

// Namespace routes
router.post('/:aiName/namespace', ErrorHandler.asyncWrapper(namespaceController.createNamespace.bind(namespaceController)));
router.delete('/:aiName/namespace/:database/:namespace', ErrorHandler.asyncWrapper(namespaceController.deleteNamespace.bind(namespaceController)));
router.get('/:aiName/namespace/:database', ErrorHandler.asyncWrapper(namespaceController.listNamespaces.bind(namespaceController)));

// Tag routes
router.post('/:aiName/tags', ErrorHandler.asyncWrapper(tagController.addTag.bind(tagController)));
router.delete('/:aiName/tags', ErrorHandler.asyncWrapper(tagController.removeTag.bind(tagController)));
router.get('/:aiName/tags', ErrorHandler.asyncWrapper(tagController.listTags.bind(tagController)));

// Timeline routes
router.get('/:aiName/timeline', ErrorHandler.asyncWrapper(timelineController.getTimeline.bind(timelineController)));
router.post('/:aiName/timeline/search', ErrorHandler.asyncWrapper(timelineController.searchTimeline.bind(timelineController)));

// Config routes
router.get('/:aiName/config', ErrorHandler.asyncWrapper(configController.getConfig.bind(configController)));
router.put('/:aiName/config', ErrorHandler.asyncWrapper(configController.updateConfig.bind(configController)));
router.put('/:aiName/config/colors', ErrorHandler.asyncWrapper(configController.updateColors.bind(configController)));
router.put('/:aiName/config/logo', ErrorHandler.asyncWrapper(configController.updateLogo.bind(configController)));
router.put('/:aiName/config/behavior', ErrorHandler.asyncWrapper(configController.updateBehavior.bind(configController)));

// SNL execution route
router.post('/:aiName/snl', ErrorHandler.asyncWrapper(configController.executeSNL.bind(configController)));

module.exports = router;