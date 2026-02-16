const fullpage = new CustomEvent("fullpage", {
	detail: {},
	bubbles: true,
	cancelable: true,
	composed: false,
});

function Annotations() {
	let currentPage = 1;
	//let idDocument;
	let highlights = [];
	let Bhighlights = [];
	let advanceMode = true;
	let fragments = {};
	let innerFragments = {};
	let pageloaded = {};
	let infoJson;
	let operations;
	let hltr = null;
	let highlightEnable = null;
	let selected = {};
	let qaScrolled = false;
	//let redrawBlockTimeout = null;


	this.init = function () {
		$("#controls-right").hide();

		$("html").css("overflow", "hidden");

		this.bindMessage();
		this.eventPDF();
		this.copyAndPasteText();
		this.loadInfoJson();
		this.bindBtn();
	};


	this.copyAndPasteText = function () {
		const copyListener = (e) => {
			const range = window.getSelection().getRangeAt(0),
				rangeContents = range.cloneContents();
			let tmp = $(rangeContents);
			let txt = "";
			tmp.find("span").each(function () {
				txt += $(this).text();
			});

			event.clipboardData.setData("text/plain", txt);
			event.preventDefault();
		};
		document.addEventListener("copy", copyListener);
	}

	this.loadScript = function (url, callback, error) {
		jQuery.ajax({
			url: url,
			dataType: 'script',
			success: callback,
			error: error,
			async: true
		});
	}

	this.triggerFullPageEvent = function () {
		var length = setInterval(function () {
			let info = $(" .t").length;
			if (info > 0) {
				document.dispatchEvent(fullpage);
				clearInterval(length);
			}
		}, 200)
	}

	this.initIDRViewer = function (id) {
		let that = this;
		idDocument = id;
		$.ajax({
			url: "config.js",
			type: 'GET',
			async: false,
			cache: false,
			dataType: "text",
			success: function (json) {
				IDRViewer.config = JSON.parse(json);

				let loadIDRviewer = function () {
					console.log(IDRViewer.config);
					IDRViewer.setup();
					IDRViewer.setZoom(IDRViewer.ZOOM_FITPAGE);
					IDRViewer.setLayout(IDRViewer.LAYOUT_CONTINUOUS);

					$("#btnZoom").val("fitheight");
										$("#btnView").val("continuous");

					that.triggerFullPageEvent();
				}


				that.loadScript("../../../../../plugins/annotations/idrviewer.js", loadIDRviewer);

			},
			error: function (request) {
				if (request.responseText) {
					toastr.error(request.responseText);
				}
				console.error(request);
			}
		});
	}

	this.loadInfoJson = function () {
		let that = this;
		$.ajax({
			url: "info.json",
			type: 'GET',
			async: false,
			cache: false,
			dataType: "json",
			success: function (json) {
				console.log(json);
				infoJson = json;
			},
			error: function (request) {
				if (request.responseText) {
					toastr.error(request.responseText);
				}
				console.error(request);
			}
		});
	}

	this.eventPDF = function () {
		let that = this;
		IDRViewer.on('pagechange', function (data) {
			currentPage = data.page;
			//console.log('pagechange-> ' + currentPage);
			that.writePagesLoaded();
			parent.postMessage({ page: data.page, frame: $("#idrviewer").attr("frame-id")}, "*");
			if (operations) {
				that.clearHidden();
			}
		});

		$(document).on('fullpage', function () {
			if (!currentPage) {
				currentPage = 1;
			}
			parent.postMessage({ page: currentPage }, "*");
		});

		$(document).on('click', function (e) {
			parent.postMessage({ click: true }, "*");
		});

		IDRViewer.on('ready', function (data) {
			console.log("ready-> ", data);
			parent.postMessage({ ready: true }, "*");
		});

		IDRViewer.on('pageload', function (data) {
			//console.log("pageload-> ", data);
			pageloaded[data.page] = true;
		});

		IDRViewer.on('pageunload', function (data) {
			//console.log("pageunload-> ", data);
			delete pageloaded[data.page];
		});

		IDRViewer.on('zoomchange', function (data) {

			$(".barBlock").each(function () {
				that.createBox(parseInt($(this).attr("id")), $(this).attr("type"));
			});

			$(".innerBarBlock").each(function () {
				that.createInnerBox(parseInt($(this).attr("id")), $(this).attr("type"));
			});

			$(".courtesyView").trigger("updated");
		});

		$('#idrviewer').on('scroll', function (e) {

			$(".barBlock").each(function () {
				that.createBox(parseInt($(this).attr("id")), $(this).attr("type"));
			});

			$(".innerBarBlock").each(function () {
				that.createInnerBox(parseInt($(this).attr("id")), $(this).attr("type"));
			});

			$(".courtesyView").trigger("updated");
		});
	}

	this.writePagesLoaded = function () {

		let that = this;
		let interval = setInterval(function () {
			for (let key in pageloaded) {
				if (key == currentPage) {
					console.log("highlights/operations page->" + currentPage);
					that.highlightsTerms(currentPage);
					that.getOperationsInPage(currentPage);
					clearInterval(interval);
				}
			}
		}, 500);
	}

	this.bindMessage = function () {
		let that = this;
		window.addEventListener('message', function (event) {

			if (event.data) {
				console.log("Recived Iframe -> ", event.data);
				if (event.data.advanceMode) {
					advanceMode = event.data.advanceMode;
				}

				if (event.data.title) {
					$("#controls-left").append("<i class='fa fa-info infoTitle' aria-hidden='true' style='color: white; position: relative; top: 10px;'></i>");
					let htmlInfoCat = '<div style="height:60px">';
					htmlInfoCat += '<p>' + event.data.title + '</p>';
					htmlInfoCat += '</div>';

					let catInf = $('.infoTitle').popover({
						html: true,
						sanitize: false,
						content: function () {
							return htmlInfoCat;
						},
						placement: 'top',
						title: function () {
							return "Filename";
						},
						container: 'body',
						trigger: 'hover'
					});
				}

				if (event.data.Bhighlights) {
					Bhighlights = event.data.Bhighlights;
					$('.tooltip').remove();
					that.writePagesLoaded();
				}

				if (event.data.fragments) {
					fragments = event.data.fragments;
					highlights = [];
					operations = [];
					$('.tooltip').remove();
					that.clearHidden();

					if (currentPage != fragments[0].pages[0]) {
						IDRViewer.goToPage(fragments[0].pages[0]);
					} else {
						that.writePagesLoaded();
					}
				}

				if (event.data.clear) {
					if (event.data.clear === "all") {
						that.clear();
						highlights = [];
						Bhighlights = [];
						fragments = {};
						innerFragments = {}
					} else if (event.data.clear === "highlight") {
						that.clear();
						that.drawBorderHighlight(currentPage);

					}
				}

				if (event.data.highlights) {
					highlights = event.data.highlights;
					fragments = [];
					innerFragments = [];
					operations = [];
					$('.tooltip').remove();
					if (highlights.length > 0) {
						if (currentPage != highlights[0].page) {
							IDRViewer.goToPage(highlights[0].page);
						} else {
							that.writePagesLoaded();
						}
					}
					/*for (let i = 0; i < highlights.length; i++) {
						if (highlights[i].pages && highlights[i].pages.length > 0) {
							let pages = highlights[i].pages[0];
							highlights[i].start = highlights[i].start - pages.start;
						}
					}*/
				}


				if (event.data.operations) {
					fragments = [];
					innerFragments = [];
					highlights = [];
					operations = event.data.operations;
					$('.tooltip').remove();
					if (operations.length > 0) {

						if (currentPage != operations[0].page) {
							IDRViewer.goToPage(operations[0].page);
						} else {
							that.writePagesLoaded();
						}



					}
				}

				if (event.data.page) {
					let page = event.data.page;
					if (currentPage != page) {
						IDRViewer.goToPage(page);
					} else {
						that.writePagesLoaded();
					}
				}

				if (event.data.editAnnotaions) {
					if (event.data.editAnnotaions == "show") {
						$(".bi.bi-pen").parent().show()
					} else if (event.data.editAnnotaions == "hide") {
						$(".bi.bi-pen").parent().hide()
					}
				}

				if (event.data.suggest) {
					that.loadSuggest(event.data.suggest);
				}

				if (event.data.qa) {
					that.qaScrolled = false;
					that.loadQa(event.data.qa);
					parent.postMessage({ ready: true }, "*");
				}

				if (event.data.annotations) {
					if (event.data.annotations == false) {
						$(".button-parent").hide();
					} else {
						$(".button-parent").show();
					}
				}

				if (event.data.changeLayout) {

					if (event.data.changeLayout == "continuous") {
						IDRViewer.setLayout(IDRViewer.LAYOUT_CONTINUOUS);
						$("#btnView").val("continuous");
					} else if (event.data.changeLayout == "magazine") {
						IDRViewer.setLayout(IDRViewer.LAYOUT_MAGAZINE);
						$("#btnView").val("magazine");
					}else{
						IDRViewer.setLayout(IDRViewer.LAYOUT_PRESENTATION);
						$("#btnView").val("presentation");
					}
				}

				if (event.data.changeZoom) {
					let zoom = event.data.changeZoom;
					if (zoom == "actual") {
						IDRViewer.setZoom(IDRViewer.ZOOM_ACTUALSIZE);
					} else if (zoom == "fitWidth") {
						IDRViewer.setZoom(IDRViewer.ZOOM_FITWIDTH);
					} else if (zoom == "fitHeight") {
						IDRViewer.setZoom(IDRViewer.ZOOM_FITHEIGHT);
					} else {
						let value = parseFloat(zoom);
						if (value > 0) {
							IDRViewer.setZoom(value);
						}
					}

				}

				if (event.data.showBars != undefined) {
					if (event.data.showBars === true){
						$("head").append("<style>.barBlock{opacity: 1;}<style>")
						$("head").append("<style>.innerBarBlock{opacity: 1;}<style>")
					} else {
						$("head").append("<style>.barBlock{opacity: 0;}<style>")
						$("head").append("<style>.innerBarBlock{opacity: 0;}<style>")
					}
				}
			}
		}, false);
	}


	this.loadQa = function (qa) {

		fragments = [{
			start: [],
			end: [],
			pages: [],
			highlights: [],
			type: "QA"
		}]

		innerFragments = [{
			start: [],
			end: [],
			pages: [],
			highlights: [],
			type: "QA"
		}]

		highlights = [];
		operations = [];
		$('.tooltip').remove();
		this.clearHidden();

		let positions = [];
		for (let position in infoJson.positions) {
			positions.push(infoJson.positions[position]);
		}
		let k = 0;
		let start = qa.start;
		let end = qa.end;
		
		fragments[0].splitStart = qa.splitStart;
		
		makeLocalPos = function(positions, start, end, fragments) {
			let k = 0;
			while (k < positions.length) {
				let startPage = positions[k][0];
				let endPage = positions[k][1];
	
				// full positions
				if (start >= startPage && end <= endPage) {
					fragments[0].start.push(start - startPage);
					fragments[0].end.push(end - startPage);
					fragments[0].pages.push((k + 1));
					break;
				} else if (start < endPage && end > endPage) {
					fragments[0].start.push(start - startPage > 0 ? start - startPage : 0);
					fragments[0].end.push(endPage - startPage);
					fragments[0].pages.push((k + 1));
					start = endPage;
				} else if (start < endPage && end <= endPage && start >= startPage) {
					fragments[0].start.push(start - startPage > 0 ? start - startPage : 0);
					fragments[0].end.push(endPage - startPage);
					fragments[0].pages.push((k + 1));
					break;
				}
				k++;
			}
		}

		makeLocalPos(positions, start, end, fragments);
		if ((qa.splitStart || qa.splitStart === 0) && qa.splitEnd){
			makeLocalPos(positions, qa.splitStart, qa.splitEnd, innerFragments);
		}

		for (let i = 0; i < qa.highlights.length; i++) {
			let start = qa.highlights[i].start;
			let end = qa.highlights[i].end;
			k = 0;
			while (k < positions.length) {
				
				let tmp = {};
				
				let startPage = positions[k][0];
				let endPage = positions[k][1];

				if (start >= startPage && end <= endPage) {
					tmp.start = (start - startPage);
					tmp.length = (end - start);
					tmp.page = (k + 1);
					tmp.terms = qa.highlights[i].terms;
					fragments[0].highlights.push(tmp);
					break;
				} else if (start < endPage && end > endPage) {
					tmp.start = (start - startPage > 0 ? start - startPage : 0);
					tmp.length = (start - startPage > 0 ? endPage - start : endPage - startPage);
					tmp.page = (k + 1);
					tmp.terms = qa.highlights[i].terms;
					fragments[0].highlights.push(tmp);
					start = endPage;
				} else if (start < endPage && end <= endPage && start >= startPage) {
					tmp.start = (start - startPage > 0 ? start - startPage : 0);
					tmp.length = (endPage - startPage);
					tmp.page = (k + 1);
					tmp.terms = qa.highlights[i].terms;
					fragments[0].highlights.push(tmp);
					break;
				}
				k++;
			}

			/*for (let k = 0; k < qa.highlights[i].terms.length; k++) {
				let term = qa.highlights[i].terms[k];
				if (term.type == "REFERENCE") {
					let start = term.start;
					let end = term.end;
					term.positions=[];
					let tmp = {};
					k = 0;
					while (k < positions.length) {
						let startPage = positions[k][0];
						let endPage = positions[k][1];

						if (start >= startPage && end <= endPage) {
							tmp.start = (start - startPage);
							tmp.length = (end - start);
							tmp.page = (k + 1);
							term.positions.push(tmp);
							break;
						} else if (start < endPage && end > endPage) {
							tmp.start = (start - startPage > 0 ? start - startPage : 0);
							tmp.length = (endPage - startPage);
							tmp.page = (k + 1);
							term.positions.push(tmp);
						} else if (start < endPage && end <= endPage && start >= startPage) {
							tmp.start = (start - startPage > 0 ? start - startPage : 0);
							tmp.length = (endPage - startPage);
							tmp.page = (k + 1);
							term.positions.push(tmp);
							break;
						}
						k++;
					}
				}
			}*/
		}

		if (currentPage != fragments[0].pages[0]) {
			if (fragments[0].splitStart){
				let splitPage = fragments[0].pages[0]
				for (let i = 0; i < positions.length; i++) {
					if (fragments[0].splitStart >= positions[i][0] && fragments[0].splitStart < positions[i][1]) {
						splitPage = i + 1
					}
				}
				IDRViewer.goToPage(splitPage);

			} else {
				IDRViewer.goToPage(fragments[0].pages[0]);
			}
		} else {
			this.writePagesLoaded();
		}

		setTimeout(function () {
			if (qa.courtesyView) {
				$(".courtesyView").html(qa.courtesyView.content);
				$("body").css("overflow", "hidden");

				/*
				let rate = 1;
				let scaledPageHeight = $("#page1").height();
				// adjust bar size
				rate = $("#page1").height() / scaledPageHeight;*/

				let scale = 1;

				IDRViewer.on('zoomchange', function (data) {
					// adjust pagesize
					scale = data.zoomValue;
					let pageHeight = $("#p1").outerHeight();
					$("#contentContainer").height(pageHeight*data.zoomValue);
					$("#page1").height(pageHeight*data.zoomValue);
				});

				$(".courtesyView").off("updated");
				$(".courtesyView").on("updated", function() {
					$(".barBlock, .innerBarBlock").each(function(){
						let height = parseInt($(this).css("height"));
						$(this).css("height", height * scale + "px");
					});
				});

				IDRViewer.setZoom(IDRViewer.ZOOM_ACTUALSIZE);

			} else {
				$("body").css("overflow", "visible");
			}
		}, 200)

	}


	this.getOperationsInPage = function (page) {
		if (operations && operations.length > 0) {
			let that = this;
			let out = [];

			for (let i = 0; i < operations.length; i++) {
				if (operations[i].type) {
					for (let j = 0; j < operations[i].page.length; j++) {
						if (operations[i].page[j] === page) {
							operations[i].j = j;
							operations[i].enter = false;

							let temp = {};
							temp.page = operations[i].page[j];
							temp.start = operations[i].char_page_begin[j];
							temp.length = operations[i].char_end - operations[i].char_begin;
							temp.cost = operations[i].cost;
							temp.type = operations[i].type;
							temp.value = operations[i].value;

							if (operations[i].joinId) {
								temp.joinId = operations[i].joinId;
							}

							if (operations[i].idOperation) {
								temp.idOperation = operations[i].idOperation;
							}

							temp.terms = [{
								color: "transparent",
								type: operations[i].type,
								value: operations[i].value
							}];

							out.push(temp);
						}
					}
				}
			}

			let html = $("#page" + page + " .t");
			html.unmark();
			html.addClass("permanent");
			html.css("z-index", 10);


			if (out.length > 0) {
				html.markRanges(out, {
					debug: false,
					each: function (e, a) {
						if (!a.joinId) {
							let color = a.terms[0].color.substring(a.terms[0].color.indexOf("("), a.terms[0].color.indexOf(")"));
							a.color = color;
							createHighlight(e, a);
						} else if (a.terms.length > 0) {
							generateTooltip(e, a, advanceMode, that);
						}
						$(e).attr("idOperation", a.idOperation)
					},
					noMatch: function (e) {
						console.error(e);
						console.log("Page Content length -> " + html.length);
					},
					done: function (e) {
						that.mergeHighlights();
					}
				});
			}

		}
	}


	this.clear = function () {
		$(".barBlock, .innerBarBlock, .innerblockStart, .innerblockEnd, .blockStart, .blockEnd").remove();
		$("#page" + currentPage + " .t").unmark();
		//highlights = [];
	}

	this.clearHidden = function () {
		$(".dot").remove();
		$(document).removeClass("idOperation");
		for (page in pageloaded) {
			if (pageloaded[page] && page != currentPage) {
				$("#page" + page + " .t").unmark();
			}
		}
	}

	this.drawFragment = function (page, fragments, prefix=null) {

		if (prefix == null) {
			prefix = "";
		}

		if (fragments && fragments.length > 0) {
			for (let i = 0; i < fragments.length; i++) {
				let start = 0;
				let end = 0;
				let type = "";

				let fragmentInPage = false;

				for (let k = 0; k < fragments[i].pages.length; k++) {
					if (fragments[i].pages[k] == page) {
						fragmentInPage = true;
						start = fragments[i].start[k];
						end = fragments[i].end[k];
						if (fragments[i].type) {
							type = fragments[i].type;
						}
						break;
					}
				}
				
				$("#" + i + "-sentence." + prefix + "blockStart, #" + i + "-sentence." + prefix + "blockEnd").remove();


				let text = "";
				let setStart = false;
				let setEnd = false;

				$("#page" + page + " .t").each(function (index) {
					let tmp = $(this);

					if (fragmentInPage && !setStart && ((text.length + tmp.text().length) > start || start == 0)) {
						let extra = ""
						if (prefix == "inner") {
							extra = tmp.find(".blockStart")[0]
							if (extra){
								extra = extra.outerHTML
							} else {
								extra = "";
							};
						}

						let internStart = start - tmp.text().length;
						let tagInit = "<span class='" + prefix + "blockStart' id='" + i + "-sentence'></span>";

						let txt = tmp.text();
						tmp.html(txt.substring(0, internStart) + tagInit + extra + txt.substring(internStart));
						setStart = true;
					}
					if (fragmentInPage && !setEnd && text.length + tmp.text().length >= end) {
						let extra = ""
						if (prefix == "inner") {
							extra =  tmp.find(".blockEnd")[0]
							if (extra){
								extra = extra.outerHTML
							} else {
								extra = "";
							};
						}

						if (tmp.find(".blockStart")[0] === undefined){
							let internStart = end - tmp.text().length;
							let tagInit = "<span class='" + prefix + "blockEnd' id='" + i + "-sentence'></span>";
							let txt = tmp.text();
							tmp.html(txt.substring(0, internStart) + tagInit + extra + txt.substring(internStart));
							setEnd = true;
						}

					}
					if (setStart && setEnd) {
						return false;
					}
					text += tmp.text();
				});

				if ($("#page" + page + " ." + prefix + "blockEnd").length == 0) {
					let last = $("#page" + page + " .t").last();
					let tagInit = "<span class='" + prefix + "blockEnd' id='" + i + "-sentence'></span>";
					last.html(last.html() + tagInit);
				}

				if (prefix.length == 0) {
					this.createBox(i, type);
				} else if (prefix == "inner") {
					this.createInnerBox(i, type);
				}
				
			}
		}
	}

	this.createInnerBox = function (index, type) {
		$("#" + index + ".innerBarBlock").remove();
		let start = $("#" + index + "-sentence.innerblockStart");
		let end = $("#" + index + "-sentence.innerblockEnd");

		if (!type) {
			type = "";
		}

		if (start.offset() && end.offset()) {
			let pointA = start.closest(".t");
			let pointB = end.closest(".t");
			let currentBox = $("#page" + currentPage);
			$('<span class="innerBarBlock" id="' + index + '" type="' + type + '"></span>').css({
				position: "absolute",
				marginLeft: "7px", marginTop: 0,
				top: pointA.offset().top, left: (currentBox.offset().left + 2), height: (pointB.offset().top - pointA.offset().top + pointB.height()),
				width: (currentBox.width() - 4),
				color: "black"
			}).appendTo("#main");
		}
	}


	this.createBox = function (index, type) {
		let that = this;
		$("#" + index + ".barBlock").remove();
		let start = $("#" + index + "-sentence.blockStart");
		let end = $("#" + index + "-sentence.blockEnd");

		if (!type) {
			type = "";
		}

		if (start.offset() && end.offset()) {
			let pointA = start.closest(".t");
			let pointB = end.closest(".t");
			let currentBox = $("#page" + currentPage);
			$('<span class="barBlock" id="' + index + '" type="' + type + '"></span>').css({
				position: "absolute",
				marginLeft: 0, marginTop: 0,
				top: pointA.offset().top, left: (currentBox.offset().left + 2), height: (pointB.offset().top - pointA.offset().top + pointB.height()),
				width: (currentBox.width() - 4),
				color: "black"
			}).appendTo("#main");
		}

		if (type !== 'QA') {
			$(".barBlock[id='" + index + "']").append("<i class='fa fa-pencil editAnnotation' aria-hidden='true' title='Annotation' style='cursor: pointer; z-index: 1000; pointer-events: all; position: relative; top: -20px;'></i>");
			$(".popover.fade.show").remove();
			let htmlAdd = '<div class="infoAnn" style="text-align: center;" index="' + index + '">';
			if (type == "") {
				htmlAdd += '       <b>This annotation is? </b><br/><br/>';
				htmlAdd += '       <i title="Good" class="ok fa fa-2x fa-thumbs-o-up" style="margin-right: 25px; cursor: pointer;"></i>';
				htmlAdd += '       <i title="Bad" class="bad fa fa-2x fa-thumbs-o-down" style="cursor: pointer;"></i>';
			} else {
				htmlAdd += '       <b>Deleted? </b><br/><br/>';
				htmlAdd += '       <i title="Delete" class="delete fa fa-2x fa-trash" style="cursor: pointer;"></i>';
			}
			htmlAdd += '   </div>';

			//annotations
			let valModal = $('.editAnnotation').popover({
				html: true,
				sanitize: false,
				content: function () {
					return htmlAdd;
				},
				placement: 'top',

				container: 'body',
				trigger: 'click'
			});

			valModal.off('shown.bs.popover');
			valModal.on('shown.bs.popover', function () {
				$(".ok").unbind();
				$(".ok").click(function () {
					let index = parseInt($(this).closest(".infoAnn").attr("index"));
					let tmp = fragments[index];
					let out = that.getMark();

					tmp.validation = tmp.item_id + " - good";
					tmp.bboxes = out.bboxes;
					tmp.text = out.text;

					that.calculateGeneralOffset(currentPage, $("#" + tmp.bboxes[0].name).attr("id"), function (offset) {
						tmp.start = offset;
						tmp.end = offset + tmp.text.length;
						tmp.page = currentPage;
						parent.postMessage({ validation: tmp }, "*");
					});


					valModal.popover("hide");
				});

				$(".bad").unbind();
				$(".bad").click(function () {
					let index = parseInt($(this).closest(".infoAnn").attr("index"));
					let tmp = fragments[index];
					let out = that.getMark();

					tmp.validation = tmp.item_id + " - bad";
					tmp.bboxes = out.bboxes;
					tmp.text = out.text;


					that.calculateGeneralOffset(currentPage, $("#" + tmp.bboxes[0].name).attr("id"), function (offset) {
						tmp.start = offset;
						tmp.end = offset + tmp.text.length;
						tmp.page = currentPage;
						parent.postMessage({ validation: tmp }, "*");
					});

				});

				$(".delete").unbind();
				$(".delete").click(function () {
					let index = parseInt($(this).closest(".infoAnn").attr("index"));
					let tmp = fragments[index];
					let toSend = {
						validation: tmp.validation,
						start: tmp.start[0],
						end: tmp.end[0],
						page: tmp.pages[0],
						id: tmp.id
					}

					parent.postMessage({ validationDelete: toSend }, "*");
					valModal.popover("hide");
					that.clear();
					highlights = [];
					Bhighlights = [];
					fragments = {};
					innerFragments = {};
				});

				//$(".blockStart, .blockEnd").remove();
			});
		}

	}

	this.getMark = function () {
		let out = [];
		let text = "";
		$("#page" + currentPage + " mark").each(function () {
			let tmp = infoJson.bboxes[currentPage][$(this).closest("span.t").index()];
			let bbox = {
				x1: tmp.x1,
				y1: tmp.y1,
				x2: tmp.x2,
				y2: tmp.y2,
				text: tmp.text,
				index: tmp.idParent,
				word_index: 0,
				label: "",
				page: currentPage,
				name: tmp.name
			}

			out.push(bbox);
			text += tmp.text;
		});
		return { bboxes: out, text: text };
	}

	this.getHighlighted = function () {
		let out = [];
		let text = "";
		$("#page" + currentPage + " span.highlighted").each(function () {
			//console.log($(this).closest("span").text());
			let tmp = infoJson.bboxes[currentPage][$(this).closest("span.t").index()];
			let bbox = {
				x1: tmp.x1,
				y1: tmp.y1,
				x2: tmp.x2,
				y2: tmp.y2,
				text: tmp.text,
				index: tmp.idParent,
				word_index: 0,
				label: "",
				page: currentPage
			}

			out.push(bbox);
			text += tmp.text;
		});
		return { bboxes: out, text: text };
	}

	this.drawBorderHighlight = function (page) {
		let that = this;
		let boxes = [];
		let html = $("#page" + page + " .t");
		if (Bhighlights && Bhighlights.length > 0) {
			for (let i = 0; i < Bhighlights.length; i++) {
				if (Bhighlights[i].page == page) {
					boxes.push(Bhighlights[i]);
				}
			}
			html.markRanges(boxes, {
				debug: false,
				each: function (e, a) {
					//console.log(a);
					//console.log(a);
					if (a.terms.length > 0) {
						generateTooltip(e, a, advanceMode, that);
					}
				},
				noMatch: function (e) {
					console.error(e);
					//noInsert.push(e);
				},
				done: function (e) {
					that.mergeHighlights();
				}
			});
		}
		return boxes;
	}

	this.foundH = function (highlight, noH) {
		let found = null;
		for (let i = 0; i < noH.length; i++) {
			if (highlight.page == noH[i].page && highlight.start == noH[i].start && highlight.length == noH[i].length) {
				found = noH[i];
				break;
			}
		}
		return found;
	}

	this.highlightsTerms = function (page) {
		let that = this;
		let html = $("#page" + page + " .t:not(.permanent)");
		html.unmark();

		$('.tooltip').remove();
		let selectPage = [];
		let noH = this.drawBorderHighlight(page);


		if (fragments.length > 0) {
			for (let i = 0; i < fragments.length; i++) {

				for (let j = 0; j < fragments[i].highlights.length; j++) {
					if (fragments[i].highlights[j].page == page) {
						let found = this.foundH(fragments[i].highlights[j], noH);
						if (found == null) {
							selectPage.push(fragments[i].highlights[j]);
						} else {
							selectPage.push(found);
						}
					}
				}

				selectPage.sort(function (a, b) { return a.page - b.page });
				selectPage.sort(function (a, b) { return a.start - b.start });
				let index = -1;
				for (let j = 0; j < fragments[i].pages.length; j++) {
					if (fragments[i].pages[j] == page) {
						index = j;
						break;
					}
				}

				let toInsert = [];

				if (selectPage.length > 0) {
					for (let k = 0; k < selectPage.length; k++) {
						if (k == 0) {
							if (fragments[i].start[index] < selectPage[k].start) {
								toInsert.push({
									start: fragments[i].start[index],
									length: selectPage[k].start - 1 - fragments[i].start[index],
									page: page,
									terms: []
								});
							}
						}

						if (k + 1 < selectPage.length) {
							if (selectPage[k + 1].start - (selectPage[k].start + selectPage[k].length) - 2 > 0) {
								toInsert.push({
									start: selectPage[k].start + selectPage[k].length + 1,
									length: selectPage[k + 1].start - (selectPage[k].start + selectPage[k].length) - 2,
									page: page,
									terms: []
								});
							}
						} else if (k + 1 == selectPage.length) {
							if (fragments[i].end[index] - (selectPage[k].start + selectPage[k].length) - 2 > 0) {
								toInsert.push({
									start: selectPage[k].start + selectPage[k].length + 1,
									length: fragments[i].end[index] - (selectPage[k].start + selectPage[k].length) - 2,
									page: page,
									terms: []
								});
							}
						}


					}
				} else {
					if (index != -1) {
						selectPage.push({
							start: fragments[i].start[index],
							length: fragments[i].end[index] - fragments[i].start[index],
							page: page,
							terms: []
						});
					}
				}

				selectPage = selectPage.concat(toInsert);
				
			}
			this.drawFragment(page, fragments)
			if (innerFragments[0].start.length > 0) {
				this.drawFragment(page, innerFragments, "inner");
			} else {
				$(".innerBarBlock, .innerblockStart, .innerblockEnd").remove();
			}
		} else {
			for (let i = 0; i < highlights.length; i++) {
				if (highlights[i].page == page) {
					let found = this.foundH(highlights[i], noH);

					if (found == null) {
						selectPage.push(highlights[i]);
					} else {
						selectPage.push(found);
					}
				}
			}
		}

		function findOverlappingRanges(ranges) {
			
			let overlapping = [];

			let merge = [];

			ranges = ranges.sort(function (a, b) { return (a.start + a.length) - (b.start + b.length)});

			visited = {}
			toRemove = []
			
			for (let k = 1; k < ranges.length - 1; k++) {
				baseStart = ranges[k].start
				baseEnd = ranges[k].start + ranges[k].length

				for (let h = 1; h < ranges.length - 1; h++) {

					if (visited[h] && visited[h].includes(k)){
						continue;
					}


					testStart = ranges[h].start
					testEnd = ranges[h].start + ranges[h].length

					if (testStart > baseEnd){
						break;
					}
	
					if (testStart > baseStart && testEnd < baseEnd) {

						if (!toRemove.includes(ranges[h])){
							toRemove.push(ranges[h])
						}
						
						for (term of ranges[h].terms){
							ranges[k].terms.push(term)
						}

						if (visited[k]){
							visited[k].push(h)
						} else {
							visited[k] = [h]
						}

					}

					if (testStart < baseEnd && testEnd > baseEnd) {
						let shift = baseEnd - testStart

						ranges[h].start += shift
						ranges[h].length -= shift

						for (term of ranges[h].terms){
							ranges[k].terms.push(term)
						}

						if (visited[k]){
							visited[k].push(h)
						} else {
							visited[k] = [h]
						}
					}

					if (testStart < baseStart && testEnd > baseStart) {
						let shift = testEnd - baseStart
						ranges[h].length -= shift

						for (term of ranges[h].terms){
							ranges[k].terms.push(term)
						}

						if (visited[k]){
							visited[k].push(h)
						} else {
							visited[k] = [h]
						}
					}
					
				}
			}
			
			return {
				overlapping: overlapping,
				merge: merge
			}
		}


		if (selectPage.length > 0) {

			selectPage = selectPage.sort(function (a, b) { return (a.start + a.length) - (b.start + b.length)});

			let prev;
			let finalSelectPage = []
			for (let i in selectPage) {
				let current = selectPage[i];
				if (prev && prev.terms && prev.terms.length > 0 && current.terms && current.terms.length == 0) {
					if (prev.start + prev.length >= current.start && prev.start + prev.length <= current.start + current.length){

						let newStart = prev.start + prev.length + 1;
						if (current.length - newStart + current.start > 0) {
							current.length -= newStart - current.start;
							current.start = newStart;
							finalSelectPage.push(current);
						} else {
							let newEntry = JSON.parse(JSON.stringify(current));
							current.start = prev.start;
							current.length = prev.length;				
							finalSelectPage.push(newEntry);
						}
						
					} else {
						finalSelectPage.push(current);
					}					

				} else if (prev && prev.terms && prev.terms.length > 0 && current.terms && current.terms.length > 0) {
					if (prev.start >= current.start && prev.start + prev.length <= current.start + current.length){
						let newEntry = JSON.parse(JSON.stringify(current));
						newEntry.start = prev.start + prev.length + 1;
						newEntry.length -= newEntry.start - current.start;

						let baseEntry = JSON.parse(JSON.stringify(current));
						baseEntry.length = prev.start - current.start - 1
						finalSelectPage.push(baseEntry);
						finalSelectPage.push(newEntry);

					} else {
						finalSelectPage.push(current);
					}
				} else {
					finalSelectPage.push(current);
				}

				prev = current;
			}

			selectPage = finalSelectPage;

			console.log(findOverlappingRanges(selectPage))

			let repairData = []
			let offset = 0;
			let noMatchHighlights = []

			html.markRanges(selectPage, {
				debug: false,
				each: function (e, a) {
					
					let len = $(e).html().length;

					position = {
						start: offset,
						end: offset + len
					}

					repairData.push({
						element: e,
						position: position
					});

					offset += len
					
					if (a.terms && a.terms.length > 0) {
						generateTooltip(e, a, advanceMode, that);
					}

				},
				noMatch: function (a) {	
					console.error(a)
					noMatchHighlights.push(a);
				},
				done: function (e) {
					that.mergeHighlights();
					
					let scrollable = $("#idrviewer");

					let element = $(".innerblockStart").eq(0);
					if (element.length == 0) {
						element = $("mark").eq(0);
					}

					if (!that.qaScrolled) {
						let position = scrollable.scrollTop() + element.offset().top - 300;
						
						scrollable.animate({
							scrollTop: (position > 0) ? position : 0
						}, 300);	
					}
					
					that.qaScrolled = true;
					
				}
			});

			//console.log(noMatchHighlights);
			//that.splitHighlight(noMatchHighlights, repairData);
		}
	}

	this.splitHighlight = function (noMatchHighlights, repairData) {
	
		for (let i in noMatchHighlights){

			let elements=[];

			let highlight = noMatchHighlights[i]

			if (highlight.terms.length > 0) {

				console.log(highlight);

				for (let idx in repairData){
					
					let mark = repairData[idx];
					if (mark.position.start > highlight.start + highlight.length){
						break
					}
	
					if (mark.position.start >= highlight.start){
						elements.push(mark);
					} else if  (highlight.start <= mark.position.end) {
						elements.push(mark);
					} else if  (highlight.start >= mark.position.start && mark.position.end >= highlight.start + highlight.length){
						elements.push(mark);
					} 
				}

				for (let idx in elements){

					let position = elements[idx].position;
					let elementObj = $(elements[idx].element);

					if (position.start < highlight.start) {
						let content = elementObj.html();
						let remainder = content.substring(highlight.start - position.start, content.length);
						elementObj.html(content.substring(0, highlight.start - position.start));
						console.log(remainder);
						console.log(content.substring(0, highlight.start - position.start));
						console.log([position.start, highlight.start, content])
					}					
				}

				console.log(elements);
			}
		}
	}


	this.mergeHighlights = function () {
		let temp = new Array();

		$("mark").each(function () {
			temp.push($(this));
		});

		let applyPush = new Array();

		for (let i = 0; i < temp.length - 1; i++) {
			let rectA = temp[i][0].getBoundingClientRect();
			if (i + 1 < temp.length) {
				let rectB = temp[i + 1][0].getBoundingClientRect();
				if (rectA.top == rectB.top && rectB.left > rectA.right) {

					const span = rectB.left - rectA.right;

					applyPush.push({
						tag: temp[i],
						cssProp: "padding-right",
						cssValue: span + "px"
					});
				}
			}
		}

		for (var i = 0; i < applyPush.length; i++) {
			let tmp = applyPush[i];
			tmp.tag.css(tmp.cssProp, tmp.cssValue);
		}
	};

	this.loadContextMenu = function () {
		let that = this;
		let container = "#main";

		$(container + ' .jumbotron').on('contextmenu', function (e) {
			if (selected && selected.text) {
				$(container + " #saveHighlight").removeClass("disabled");
				$(container + " #cancelHighlight").removeClass("disabled");
			} else {
				$(container + " #saveHighlight").addClass("disabled");
				$(container + " #cancelHighlight").addClass("disabled");
			}


			let top = e.pageY - 10;
			let left = e.pageX - 90;
			$(container + " #context-menu").css({
				display: "block",
				top: top,
				left: left
			}).addClass("show");


			$(container + " #saveHighlight").on("click", function () {
				$(container + " #context-menu").removeClass("show").hide();
				$(container + " #addModal").modal("show");
				$(container + " #selectedText").val(selected.text);
				$(container + " #name").val("");

				$(container + " #saveAnnotation").off("click");
				$(container + " #saveAnnotation").on("click", function () {
					let tmp = {};
					tmp.validation = $(container + " #name").val();
					tmp.bboxes = selected.bboxes;
					tmp.start = selected.start;
					tmp.end = selected.end;
					tmp.text = selected.text;
					tmp.page = currentPage;
					tmp.label = $("#label").val();
					parent.postMessage({ validation: tmp }, "*");
					$(container + " #addModal").modal("hide");

					if (that.hltr != null) {
						that.hltr.removeHighlights();
					}

					$(container + " #context-menu").removeClass("show").hide();
					selected = {};
				});
			});


			$(container + " #cancelHighlight").on("click", function () {
				if (that.hltr != null) {
					that.hltr.removeHighlights();
				}
				$(container + " #context-menu").removeClass("show").hide();
				selected = {};
			});

			return false; //blocks default Webbrowser right click menu
		}).on("click", function () {
			$(container + " #context-menu").removeClass("show").hide();
		});

		$(container + " #context-menu a").on("click", function () {
			$(this).parent().removeClass("show").hide();
		});
	};

	this.textHighlighter = function (enable) {
		this.highlightEnable = enable;
		if (!enable) {
			if (this.hltr != null) {
				this.hltr.removeHighlights();
			}
		} else {
			let that = this;
			let idrviewer = document.getElementById('idrviewer');
			this.hltr = new TextHighlighter(idrviewer, {
				onBeforeHighlight: function (range) {
					that.hltr.removeHighlights();

					selected = {};
					return that.highlightEnable;
				},
				onAfterHighlight: function (range, highlights) {

					let text = $("span.highlighted ").text();
					let startId = $(range.startContainer).attr('id');
					let endId = $(range.endContainer).attr('id');

					let start = startId;
					if (!start) {
						start = endId;
					}

					if (!start) {
						hltr.removeHighlights();
					} else {
						that.calculateGeneralOffset(currentPage, start, function (offset) {
							selected.start = offset;
							selected.end = offset + text.length;
							selected.text = text;
							selected.bboxes = that.getHighlighted().bboxes;
						});
					}
				}/*,
                onRemoveHighlight: function (hl) {
                    return window.confirm('Do you really want to remove: "' + hl.innerText + '"');
                }*/
			});
			this.hltr.setColor("rgba(158, 172, 186, 0.4)");
		}
	}

	this.calculateGeneralOffset = function (page, startId, callback) {
		let offset = 0;
		$('#page' + page + " .t").each(function () {
			let element = $(this);
			let currentId = element.attr("id");
			if (currentId == startId) {
				callback(offset);
			}
			offset += element.text().length;
		});
	}

	this.bindBtn = function () {
		//hilight mode
		let that = this;
		$("#link-one").on('click', function () {
			let el = $(this);

			if (el.hasClass("editMode")) {
				el.removeClass("editMode");
				that.textHighlighter(false);
				that.loadContextMenu(false);
			} else {
				el.addClass("editMode");
				that.textHighlighter(true);
				that.loadContextMenu(true);
				$(".t").unmark();
				$("#link-two").removeClass("editMode");
				that.currentViewAnnotations = false;
			}
		});

	}

	this.loadSuggest = function (json) {
		$("#label").html('');

		for (let key in json) {
			if (key != "empty") {
				let tmp = json[key];
				for (let i = 0; i < tmp.length; i++) {
					let ms = key + " - " + tmp[i].message;
					$("#label").append('<option value="' + ms + '">' + ms + '</option>');
				}
			}
		}

		$("#label").select2({
			dropdownParent: $("#addModal"),
			tags: true,
			width: '100%'
		});
	}
}
