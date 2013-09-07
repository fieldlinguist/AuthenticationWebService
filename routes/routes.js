var deploy_target = process.env.NODE_DEPLOY_TARGET || "local";
var config = require('../lib/nodeconfig_' + deploy_target);
var couchkeys = require('../lib/couchkeys_' + deploy_target);


var UserHandler = require('../lib/Users');
var FieldDBHandler = require('../lib/FieldDB');
var AppHandler = require('../lib/About');

var authenticationfunctions = require('../lib/userauthentication');
var corpus = require('../lib/corpus');

var users = new UserHandler({
	'authentication': authenticationfunctions,
	'corpus': corpus
});
var fielddb = new FieldDBHandler({
	'authentication': authenticationfunctions,
	'corpus': corpus
});
var handlers = {
	'users': users,
	'fielddb': fielddb,
	'app': new AppHandler({
		'config': config,
		'couchkeys': couchkeys,
		'usersAPIDocs': users.docs,
		'fielddbAPIDocs': fielddb.docs
	})
};

var setup = function(api) {
	api.post('/users/:username', handlers.users.createUsers);
	api.put('/users/:username', handlers.users.updateUsers);
	api.get('/users/:username', handlers.users.getUsers);
	api.del('/users/:username', handlers.users.deleteUsers);

	api.post('/users/:username/:roles', handlers.users.addUserRoles);
	api.put('/users/:username/:roles', handlers.users.updateUserRoles);
	api.get('/users/:username/:roles', handlers.users.getUserRoles);
	api.del('/users/:username/:roles', handlers.users.deleteUserRoles);


	api.post('/fielddbs/:dbidentifier', handlers.fielddb.createFieldDBs);
	api.put('/fielddbs/:dbidentifier', handlers.fielddb.updateFieldDBs);
	api.get('/fielddbs/:dbidentifier', handlers.fielddb.getFieldDBs);
	api.del('/fielddbs/:dbidentifier', handlers.fielddb.deleteFieldDBs);

	api.post('/fielddbs/:dbidentifier/:roles/:username', handlers.fielddb.addFieldDBTeamMembers);
	api.put('/fielddbs/:dbidentifier/:roles/:username', handlers.fielddb.updateFieldDBTeamMembers);
	api.get('/fielddbs/:dbidentifier/:roles/:username', handlers.fielddb.getFieldDBTeamMembers);
	api.del('/fielddbs/:dbidentifier/:roles/:username', handlers.fielddb.deleteFieldDBTeamMembers);


	api.post('/corpora/:dbidentifier', handlers.fielddb.createFieldDBs);
	api.put('/corpora/:dbidentifier', handlers.fielddb.updateFieldDBs);
	api.get('/corpora/:dbidentifier', handlers.fielddb.getFieldDBs);
	api.del('/corpora/:dbidentifier', handlers.fielddb.deleteFieldDBs);

	api.post('/corpora/:dbidentifier/:roles/:username', handlers.fielddb.addFieldDBTeamMembers);
	api.put('/corpora/:dbidentifier/:roles/:username', handlers.fielddb.updateFieldDBTeamMembers);
	api.get('/corpora/:dbidentifier/:roles/:username', handlers.fielddb.getFieldDBTeamMembers);
	api.del('/corpora/:dbidentifier/:roles/:username', handlers.fielddb.deleteFieldDBTeamMembers);

	api.get('/api', handlers.app.getApiDocs);
	api.get('/api/version', handlers.app.getVersion);
	api.get('/api/install', handlers.app.installFieldDB);

	/* backward compatability */
	api.post('/register', handlers.users.createUsers);
	api.post('/login', handlers.users.updateUsers);
	api.post('/corpusteam', handlers.fielddb.getFieldDBTeamMembers);
	api.post('/addroletouser', handlers.fielddb.addFieldDBTeamMembers);
	api.post('/newcorpus', handlers.fielddb.createFieldDBs);
	api.post('/updateroles', handlers.fielddb.createFieldDBs);

};
exports.setup = setup;