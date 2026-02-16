
function emptyCall() {
	for (var i = 0; i < current.ajaxCall.length; i++) {
		current.ajaxCall[i].abort();
	}
	current.ajaxCall.length = 0;
	if (current.timeoutView != null) {
		clearInterval(current.timeoutView);
	}
}

function waitForElement(selector) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                observer.disconnect();
                resolve(document.querySelector(selector));
            }
        });

        // If you get "parameter 1 is not of type 'Node'" error, see https://stackoverflow.com/a/77855838/492336
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}

function getUrlPath() {
	var path = window.location.origin + window.location.pathname;
	return path;
}

function loadPage(url, noReplace) {

	var replace = false;
	if (noReplace != undefined)
		replace = true;

	setTimeout(function () {
		$.pjax({
			url: url,
			container: "#main-container",
			push: true,
			type: "GET",
			replace: replace
		});
	}, 100);
}

function getNamePage(url) {
	var temp = "";
	if (url == undefined)
		temp = window.location.href.toString();
	else
		temp = url.toString();

	temp = temp.split('#')[0];
	temp = temp.split('?id')[0];
	temp = temp.substring(temp.lastIndexOf('/') + 1).split(".")[0];

	return temp;
}

function getExtPage(url) {
	var temp = "";
	if (url == undefined)
		temp = window.location.href.toString();
	else
		temp = url.toString();

	temp = temp.split('#')[0];
	temp = temp.substring(temp.lastIndexOf('.') + 1).split(".")[0];

	return temp;
}

function generateTooltip(e, a, advanceMode, annotation) {

	let html = '';
	html += '	  <table class="table table-hover">\n';
	html += '		<thead class="text-warning">\n';
	if (advanceMode) {
		html += '		  <tr><th>Type</th>\n';
		html += '		  <th>Information</th>\n';
		if (a.terms[0].score) {
			html += '		  <th>Score</th>\n';
		}
	} else {
		if (a.terms[0].score) {
			html += '		  <th>Score</th>\n';
		}
	}
	if (a.terms[0].risk) {
		html += '		  <th>Alert</th>\n';
	}

	html += '		</tr></thead>\n';
	html += '		<tbody>\n';

	let totSCore = 0;
	let ref = false;
	for (let i = 0; i < a.terms.length; i++) {
		html += '		  <tr>\n';
		if (advanceMode) {
			html += "        <td>" + a.terms[i].type + "</td>\n";
			html += "        <td>" + a.terms[i].value + "</td>\n";
		}
		if (a.terms[i].hasOwnProperty("score")) {
			if (advanceMode && a.terms[i].score) {
				html += "          <td>" + (a.terms[i].score).toFixed(3) + "</td>\n";
			}
			if (a.terms[i].score) {
				totSCore += a.terms[i].score;
			}
		}
		if (a.terms[i].risk) {
			html += '		  <td>' + a.terms[i].risk + '</td>\n';
		}
		html += '		   </tr>\n';


		if (a.terms[i].type == "REFERENCE") {
			ref = true;
			html += '		  <tr><td colspan="2"><a style="cursor: pointer;" class="goRef" index="'+i+'">Go to Reference</a></td></tr>\n';
		}
	}

	if (!advanceMode) {
		html += "          <td>" + Math.abs(totSCore.toFixed(3)) + "</td>\n";
	}

	html += '		</tbody>\n';
	html += '	  </table>\n';

	totSCore = Math.abs(totSCore);

	let alfa = totSCore;

	if (alfa >= 0.6) {
		alfa = 0.6;
	} else if (alfa <= 0.09) {
		alfa = 0.1
	}

	let tmpEl = $(e);

	tmpEl.tooltip({ title: html, sanitize: false, html: true, delay: 50, placement: "top", container: 'body', fallbackPlacement: 'clockwise', trigger: "click" });
	tmpEl.addClass("annotation");

	if (a.joinId) {
		tmpEl.attr("join", a.joinId)
	}

	if (a.color) {
		tmpEl.css("background-color", a.color);
	} else if (a.terms[0].color) {
		//tmpEl.css("background-color", "rgba(255, 128, 0," + alfa + ")");
		tmpEl.css("background-color", a.terms[0].color);
	} else {
		tmpEl.css("background-color", "rgba(33, 129, 196," + alfa + ")");
	}
	if (a.opacity) {
		tmpEl.css("opacity", a.opacity);
	}

	tmpEl.on('show.bs.tooltip', function () {
		$('.tooltip').remove();
		//tmpEl.css("background-color", "rgba(255, 128, 0, 1)");
		//$(".showTooltip").removeClass("showTooltip");
		//tmpEl.addClass("showTooltip");
	});
	tmpEl.on('shown.bs.tooltip', function () {
		if (ref) {
			$(".goRef").unbind();
			$(".goRef").click(function (e) {
				e.stopPropagation();
				let index = parseInt($(this).attr("index"));
				let ref = a.terms[index];
				console.log(ref);

				let qa = {
					start: ref.start,
					end: ref.end,
					highlights: []
				};

				annotation.loadQa(qa);
			});
		}
		//tmpEl.css("background-color", "rgba(255, 128, 0, 1)");
		//$(".showTooltip").removeClass("showTooltip");
		//tmpEl.addClass("showTooltip");
	});
	tmpEl.on('hide.bs.tooltip', function () {
		//tmpEl.css("background-color", "rgba(255, 128, 0," + alfa + ")");
		//tmpEl.css("background-color", color);
		//$(".showTooltip").removeClass("showTooltip");
	});
}



function createHighlight(e, a) {

	if (a.cost === 0) {
		a.cost = "";
	}
	let tmpEl = $(e);
	let html = "";
	tmpEl.addClass("annotation");

	let alfa = (a.cost === "") ? "0" : (a.cost).toFixed(2);
	alfa = (parseFloat(alfa) > 0.6) ? "0.6" : alfa;

	if (a.type === "REP") {
		html += "<div>REPLACE</div><div>" + a.value + "</div><div>" + a.cost + "</div>";
		tmpEl.css("background-color", "rgba(0, 132, 202," + alfa + ")");
		tmpEl.addClass("replace rep");
		tmpEl.attr("join", a.joinId);
		tmpEl.attr("start", a.start);
	} else if (a.type === "NONE") {
		html += "<div>NONE</div><div>" + a.value + "</div><div>" + a.cost + "</div>";
		tmpEl.css("background-color", "inherit");
		tmpEl.addClass("replace none");
		tmpEl.attr("join", a.joinId);
		tmpEl.attr("start", a.start);
	} else if (a.type === "SEM_EQUAL") {
		html += "<div>SEM EQUAL</div><div>" + a.value + "</div><div>" + a.cost + "</div>";
		tmpEl.css("background-color", "rgba(255, 255, 224, 1)");
		tmpEl.addClass("replace none");
		tmpEl.attr("join", a.joinId);
		tmpEl.attr("start", a.start);
	} else {
		tmpEl.attr("char_ref", a.char_ref);
		if (a.value === "_INSERTED_SENTENCE_" || a.value === "_REMOVED_SENTENCE_" || a.value === "_INSERTED_SEQUENCE_" || a.value === "_REMOVED_SEQUENCE_") {
			tmpEl.addClass("barrato");
			html += "<div>" + a.value.replace(/_/g, " ") + "</div><div>" + a.cost + "</div>";
			tmpEl.css("background-color", "rgba(0, 132, 202, 0.1)");
		} else {
			if (a.type == "INS") {
				html += "<div>INSERT</div><div>" + a.value + "</div><div>" + a.cost + "</div>";
				tmpEl.css("background-color", "rgba(0, 132, 202," + alfa + ")");
			} else if (a.type == "REM") {
				html += "<div>REMOVE</div><div>" + a.value + "</div><div>" + a.cost + "</div>";
				tmpEl.css("background-color", "rgba(0, 132, 202," + alfa + ")");
			}
		}
	}

	tmpEl.tooltip({ title: html, html: true, delay: 500, placement: "top", container: 'body', fallbackPlacement: 'clockwise' });
}

function capitalize(text) {
	let arr = text.trim().split(" ");

	arr = arr.map(element => {
		element = element.trim();
		return element.charAt(0).toUpperCase() + element.slice(1).toLowerCase();
	});

	return arr.join(" ");
}


function saveBase64ToExcel(data, fileName) {
	let a = document.createElement("a");
	document.body.appendChild(a);
	a.style = "display: none";

	let binaryData = atob(data);

	// Create an array buffer from the binary data
	let arrayBuffer = new ArrayBuffer(binaryData.length);
	let uint8Array = new Uint8Array(arrayBuffer);
	for (let i = 0; i < binaryData.length; i++) {
		uint8Array[i] = binaryData.charCodeAt(i);
	}

	// Create a Blob from the binary data
	let blob = new Blob(
		[   // byte order mark (BOM)
			uint8Array
		], { type: "data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;"});
	let url = window.URL.createObjectURL(blob);
	a.href = url;
	a.download = fileName;
	a.click();
	window.URL.revokeObjectURL(url);
}


function saveBase64ToFile(data, fileName) {
	let a = document.createElement("a");
	document.body.appendChild(a);
	a.style = "display: none";

	let binaryData = atob(data);

	// Create an array buffer from the binary data
	let arrayBuffer = new ArrayBuffer(binaryData.length);
	let uint8Array = new Uint8Array(arrayBuffer);
	for (let i = 0; i < binaryData.length; i++) {
		uint8Array[i] = binaryData.charCodeAt(i);
	}

	// Create a Blob from the binary data
	let blob = new Blob(
		[   // byte order mark (BOM)
			uint8Array
		], { type: ".json"});
	let url = window.URL.createObjectURL(blob);
	a.href = url;
	a.download = fileName;
	a.click();
	window.URL.revokeObjectURL(url);
}