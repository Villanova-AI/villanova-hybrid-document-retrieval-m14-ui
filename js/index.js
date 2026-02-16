function Main() {

	this.init = function () {
		this.login();
		this.setUTF8();
		this.logout();
		this.changePassword();
	};


	this.menu = function () {
		$("#menu").click(function () {
			loadPage("home.html");
		});
	}

	this.changePassword = function () {
		let that = this;

		$("#change").click(function () {
			keycloak.login({
				action: "UPDATE_PASSWORD",
			});
		});
	}

	this.logout = function () {
		let that = this;

		$("#logout").click(function () {
			that.logoutFn();
		});
	}

	this.logoutFn = function () {
		let cnsRedirectUrl = window.location.origin + window.location.pathname;
		let logoutOptions = { redirectUri: cnsRedirectUrl };

		keycloak.logout(logoutOptions).then((success) => {
			console.log("--> log: logout success ", success);
		}).catch((error) => {
			console.log("--> log: logout error ", error);
		});
	}

	this.setUser = function () {
		$("#user").html(keycloak.tokenParsed.email[0].toUpperCase() + keycloak.tokenParsed.email[1].toUpperCase());
		$("#emailUser").html(keycloak.tokenParsed.email);
	}

	this.login = function () {
		let that = this;

		let loadData = function () {
			if (keycloak.idToken && keycloak.idToken != null && keycloak.idToken != "") {
				that.bindMenu();
				that.setUser();
				console.log(keycloak);
			} else {
				keycloak.loadUserProfile(function () {
					that.bindMenu();
					that.setUser();
					console.log(keycloak);
				}, function (e) {
					console.log(e);
				});
			}
		}

		let reloadData = function () {
			keycloak.updateToken(180)
				.then(loadData)
				.catch(function (e) {
					console.log(e);
				});
		}

		keycloak.onTokenExpired = () => {
			console.log(">>> Re-Authenticated");
			keycloak.updateToken(50);
		};

		keycloak.init({ onLoad: 'login-required', checkLoginIframe: true }).then(reloadData).catch(function () {
			that.logoutFn();
		});
	}

	this.first = function () {
		if (global.redirect != "" && global.redirect !== "index.html") {
			$("li a[href='" + global.redirect + "']").click();
		} else {
			loadPage("similiarity.html");
		}
	};

	this.setUTF8 = function () {
		$.ajaxSetup({
			contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
			'beforeSend': function (XHR) {
				XHR.overrideMimeType('application/x-www-form-urlencoded; charset=UTF-8');
				XHR.setRequestHeader('Authorization', 'Bearer ' + keycloak.token);
			},
			cache: false
		});
	};

	this.bindMenu = function () {
		$.pjax.defaults.maxCacheLength = 0;

		let menu = $(".sidebar-wrapper li.nav-item");
		menu.click(function () {
			if ($(this).find(".inner-list").length == 0) {
				$(this).siblings(".active").find(".inner-list").slideUp();
				menu.removeClass("active");

				$(this).parent(".inner-list").parent().addClass("active");
				$(this).addClass("active");
			}
		});

		let that = this;
		let container = $(".sidebar");

		$.pjax.defaults.timeout = global.timeoutPush;

		container.pjax('a', {
			container: '#main-container'
		});

		$(document).on('pjax:beforeSend', function (event, xhr, settings) {
			settings.data = [{
				ajax: true
			}]

			current.changePage = true;


			if (current.socket) {
				current.socket.close();
			}
			if (current.socket_db) {
				current.socket_db.close();
			}

			$('.popover').remove();
		});

		$(document).on('pjax:send', function (a, b) {
			$(".compare").hide();
			if (current.timeoutCheckLock != null) {
				clearInterval(current.timeoutCheckLock);
			}
			if (current.pdf && current.pdf != null) {
				clearInterval(current.pdf);
			}
			emptyCall();
			try {
				window = $(window).clone()[0];
			} catch { };

		});

		$(document).on('pjax:click', function (a, b) {
			$(".menu-toggle").click();
		});

		$(document).on('pjax:complete', function (a, b) {
			current.changePage = false;
			let nameFile = "";
			let extFile = "";
			if (a.relatedTarget != undefined) {
				if (a.relatedTarget.attributes == undefined) {
					a.relatedTarget = a.relatedTarget.split("\#")[0];
					nameFile = a.relatedTarget.substring(a.relatedTarget.lastIndexOf('/') + 1).split(".")[0];
					extFile = a.relatedTarget.substring(a.relatedTarget.lastIndexOf('.') + 1).split(".")[0];
				} else {
					for (let i = 0; i < a.relatedTarget.attributes.length; i++) {
						let item = a.relatedTarget.attributes[i];
						switch (item.name) {
							case "href":
								item.value = item.value.split('#')[0];

								nameFile = item.value.substring(item.value.lastIndexOf('/') + 1).split(".")[0];
								extFile = item.value.substring(item.value.lastIndexOf('.') + 1).split(".")[0];

								break;
							default:
						}
					}
				}
			} else {
				if (a.currentTarget.URL != undefined) {
					nameFile = getNamePage(a.currentTarget.URL);
					extFile = getExtPage(a.currentTarget.URL);
				}
			}
			let realPath = "";
			if (nameFile != "") {
				let mTime = (new Date()).getTime();
				let call = $.ajax({
					url: realPath + "js/" + nameFile + ".js?timestamp=" + mTime,
					dataType: "script",
					cache: false,
					success: function () {
					}
				});
				current.ajaxCall.push(call);
			}
			$('html, body').scrollTop(0);
		});

		$(document).on('pjax:popstate', function (a, b) {
			emptyCall();
			var url = a.state.url;
			loadPage(url);
		});

		$(document).on('pjax:error', function (xhr, textStatus, error, options) {
			return false;
		});

		$(document).on('pjax:timeout', function (event) {
			event.preventDefault();
		});

		container.bind('contentchanged', function () {
			that.existCookiePolicy();
		});

		let pathParts = getUrlPath().replace("\\", "/").split("/");
		let page = pathParts[pathParts.length - 1];

		if (page == "") {
			page = "home.html";
		}

		$(".inner-list").parent().find(".nav-link").click(function () {

			let parent = $(this).parent();

			if (parent.hasClass('active') && $(this).siblings('.inner-list').length > 0) {
				parent.find(".inner-list").slideUp();
				parent.removeClass("active");
				$(".nav>.nav-item.active").find(".inner-list").slideDown();
			}
			else {
				let activeList = $(".nav>.nav-item.active").find(".inner-list");
				for (let i = 0; i < activeList.length; i++) {
					if ($(activeList[i]).parent()[0] != parent.parent().parent()[0]) {
						$(activeList[i]).slideUp()
					}
				}
				if ($(this).siblings('.inner-list').length == 0) {
					parent.parent().parent().siblings().find('.inner-list').find('.active').removeClass("active");
				}

				if (parent.children('.inner-list').length == 0) {
					parent.siblings().removeClass("active");
					parent.parent().parent().siblings().removeClass("active");
				}

				if ($(this).siblings('.inner-list').length > 0) {
					let otherActive = parent.siblings().find(".inner-list").parent();
					otherActive.each(function () {
						if ($(this).children(".inner-list").children(".active").length == 0) {
							$(this).removeClass("active");
						}
					});
				}

				parent.addClass("active");
				parent.find(".inner-list").slideDown();
			};
		});


		const queryString = window.location.search;
		const urlParams = new URLSearchParams(queryString);
		const id = urlParams.get('id');
		const idRoot = urlParams.get('idRoot');
		const idDoc = urlParams.get('idDoc');

		let str = "";
		if (id && id != null) {
			str = "?id=" + id + "&idRoot=" + idRoot;

			if (idDoc && idDoc != null) {
				str += "&idDoc=" + idDoc;
			}

		}

		loadPage(page + str);

		let activeSubmenu = $(".nav-item").find('a[href="' + page.split("#")[0] + '"]').parent();
		activeSubmenu.addClass("active");
		activeMenu = activeSubmenu.parent().parent();
		activeMenu.addClass("active");
		activeMenu.children().slideDown();

	};
};

$(document).ready(function () {
	var main = new Main();
	main.init();
});
