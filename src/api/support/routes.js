// src/api/support/routes.js

const express = require('express');
const CommandController = require('./command_controller');
const TimelineController = require('./timeline_controller');
const ConfigController = require('./config_controller');
const TagController = require('./tag_controller');
const DatabaseController = require('./database_controller');
const UserDataController = require('./user_data_controller');
const SNLController = require('./snl_controller');

/**
 * Support API Routes
 */
function createSupportRoutes(aiName) {
    const router = express.Router();

    // Initialize controllers
    const commandController = new CommandController(aiName);
    const timelineController = new TimelineController(aiName);
    const configController = new ConfigController(aiName);
    const tagController = new TagController(aiName);
    const databaseController = new DatabaseController();
    const userDataController = new UserDataController(aiName);
    const snlController = new SNLController(aiName);

    // Command routes
    router.post('/command', commandController.createCommand.bind(commandController));
    router.get('/command/:id', commandController.getCommand.bind(commandController));
    router.put('/command/:id', commandController.updateCommand.bind(commandController));
    router.delete('/command/:id', commandController.deleteCommand.bind(commandController));
    router.get('/commands', commandController.listCommands.bind(commandController));
    router.get('/commands/search', commandController.searchCommands.bind(commandController));

    // Timeline routes
    router.post('/timeline', timelineController.recordInteraction.bind(timelineController));
    router.get('/timeline', timelineController.getTimeline.bind(timelineController));
    router.get('/timeline/search', timelineController.searchTimeline.bind(timelineController));
    router.post('/timeline/tag', timelineController.addTagToEntry.bind(timelineController));
    router.get('/timeline/summary', timelineController.getTimelineSummary.bind(timelineController));
    router.get('/timeline/recent', timelineController.getRecentEntries.bind(timelineController));

    // Config routes
    router.get('/config', configController.getAIConfig.bind(configController));
    router.put('/config/theme', configController.updateTheme.bind(configController));
    router.put('/config/behavior', configController.updateBehavior.bind(configController));
    router.get('/config/behavior-override', configController.getBehaviorOverride.bind(configController));
    router.put('/config/behavior-override', configController.setBehaviorOverride.bind(configController));
    router.post('/config/reset', configController.resetToDefault.bind(configController));

    // Tag routes
    router.post('/tag', tagController.addTag.bind(tagController));
    router.delete('/tag', tagController.removeTag.bind(tagController));
    router.get('/tags', tagController.listTags.bind(tagController));
    router.post('/tags/match', tagController.matchTags.bind(tagController));
    router.get('/tag/:tag', tagController.viewTag.bind(tagController));

    // Database routes
    router.post('/db', databaseController.createDatabase.bind(databaseController));
    router.get('/db', databaseController.listDatabases.bind(databaseController));
    router.delete('/db/:name', databaseController.dropDatabase.bind(databaseController));
    router.post('/db/:db/namespace', databaseController.createNamespace.bind(databaseController));
    router.get('/db/:db/namespace', databaseController.listNamespaces.bind(databaseController));
    router.delete('/db/:db/namespace/:name', databaseController.dropNamespace.bind(databaseController));

    // User Data routes
    router.post('/data/pointer', userDataController.storePointer.bind(userDataController));
    router.post('/data/structure', userDataController.storeStructure.bind(userDataController));
    router.post('/data/enum', userDataController.storeEnum.bind(userDataController));
    router.get('/data/:type/:name', userDataController.getUserData.bind(userDataController));
    router.get('/data', userDataController.listUserData.bind(userDataController));
    router.delete('/data/:type/:name', userDataController.deleteUserData.bind(userDataController));

    // SNL routes
    router.post('/snl', snlController.executeSNL.bind(snlController));

    return router;
}

module.exports = createSupportRoutes;