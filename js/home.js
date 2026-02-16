function Menu() {

	this.init = function () {
		$("#email").html(keycloak.tokenParsed.email);
	};
	$("#titleHeader").html("");
};

$(document).ready(function () {
	var menu = new Menu();
	menu.init();
});