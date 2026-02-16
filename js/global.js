//*********************************
//* 2026 Villanova.ai      	  	  *
//* Powered by Francesco Casciola *
//*********************************

var global = {
	api_url: "api/",
};

var keycloak = {
	tokenParsed: {
		email: "admin",
		preferred_username: null
	},
	token: "admin",
	idToken: "admin",
	login: function(args){return new Promise((resolve, reject) => {
		resolve(true);
	})},
	logout: function(args){return new Promise((resolve, reject) => {
		resolve(true);
	})},
	init: function(args){return new Promise((resolve, reject) => {
		resolve(true);
	})},
	onTokenExpired: function(args){return true},
	updateToken: function(args){return new Promise((resolve, reject) => {
		resolve(true);
	})},
	hasRealmRole: function(role){
		return true
	}
}

/*
var keycloak = new Keycloak({
	realm: "",
	clientId: "",
	url: ""
});
*/

var current = {
	timeoutCheckLock: null,
	ajaxCall: new Array()
};
