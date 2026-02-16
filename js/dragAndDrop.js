
async function readFileAsync(file, type) {
	let promise = new Promise((resolve, reject) => {
	  let reader = new FileReader();
  
	  // Set up event listeners
	  reader.onload = function(event) {
		// Resolve the promise with the result when reading is complete
		resolve(event.target.result);
	  };
  
	  reader.onerror = function(error) {
		// Reject the promise with an error if something goes wrong
		reject(error);
	  };
  
	  // Start reading the file
	  if (type == "arrayBuffer") {
		reader.readAsArrayBuffer(file);
	  } else if (type == "base64") {
		reader.readAsDataURL(file);
	  }
	  
	});

	return promise
}

async function readExcelColumns(file, readFile) {
	let binary;
	if (readFile){
		binary = await readFileAsync(file, "arrayBuffer");
	} else {
		binary = file;
	}

	const workbook = XLSX.read(binary);

	const ws = workbook.Sheets[workbook.SheetNames[0]]

	const header = []
	const columnCount = XLSX.utils.decode_range(ws['!ref']).e.c + 1
	for (let i = 0; i < columnCount; ++i) {
		try{
			header[i] = ws[ XLSX.utils.encode_col(i) + '1'].v
		} catch (error) {}		
	}

	return header;
}


async function buildDraggableFromTable(file, draggableItemsContainer, draggableClass, droppableClass, 
										readFile=false, fontSize = 12, factor = 0.8){
											
	let columns = await readExcelColumns(file, readFile)

	let container = $(draggableItemsContainer);
	
	let avg_width = 0;
	let cnt = 0

	for (let i = 0; i < columns.length; i++){
		if (columns[i].length > 0) {
			avg_width += fontSize * columns[i].length;
			cnt += 1;
		}
	}

	avg_width /= cnt;
	avg_width *= factor;

	for (let i = 0; i < columns.length; i++){
		if (columns[i].length > 0) {
			//container.html(container.html() + '<div class="'+ draggableClass + '" style="font-size: ' + fontSize + 'px; width: ' + avg_width + 'px;">' + columns[i] + '</div>'
			container.html(container.html() + '<div class="'+ draggableClass + '" style="font-size: ' + fontSize + 'px;">' + columns[i] + '</div>'

		)}
	}

	//resizeText(avg_width, draggableClass, factor)

	$("." + draggableClass).draggable({
		start: function(event, ui) {
			$(this).css("z-index", 1000);
		  },
		stop: function(event, ui) {
			$(this).css("z-index", "auto");
		},
		revert: "invalid", // revert if not dropped into droppable
		cursor: "move", // change cursor while dragging
		grid: [10, 10] 
	});

	$("." + droppableClass).each(function(){
		let draggables = $(this).find("." + draggableClass);
		$(this).attr("elem-count", draggables.length);
	});
	

	$("." + droppableClass).off("consistencyCheck");
	$("." + droppableClass).on("consistencyCheck", function(){
		let prev = parseInt($(this).attr("elem-count"));
		let draggables = $(this).find("." + draggableClass);

		if (draggables.length != prev) {
			$(this).attr("elem-count", draggables.length);
			$(this).trigger("change");
		}

	});

	
    $("." + droppableClass).droppable({
		drop: function(event, ui) {

			let x = event.clientX;
			let y = event.clientY;
			let closest;
			
			let dist = Infinity;
			let before = false;

			let draggables = $(this).find("." + draggableClass);

			draggables.each(function() {
				let position = $(this).offset();
				let width = $(this).outerWidth();

				let tmpDist = Math.pow(x-position.left, 2) + Math.pow(y-position.top, 2);
				if (tmpDist < dist) {
					dist = tmpDist;
					before = (x - position.left - width/2) < 0

					closest = $(this);
				}
				
			});

			let element = ui.draggable.detach()

			if (closest) {
				if (before){
					element.insertBefore(closest).css({top: 0, left: 0}); // append the draggable element to the droppable area and reset its position
				} else {
					element.insertAfter(closest).css({top: 0, left: 0}); // append the draggable element to the droppable area and reset its position
				}				
			} else {
				element.appendTo($(this)).css({top: 0, left: 0}); // append the draggable element to the droppable area and reset its position
			}

			
			if (draggables.length > $(this).find("." + draggableClass).length) {
				element.appendTo($(this)).css({top: 0, left: 0});
			}

			$("." + droppableClass).trigger("consistencyCheck")			
		}
	});
}

function resizeText(avg, draggableClass, factor) {

	let draggables = $("." + draggableClass)
	if (draggables.length > 0) {

		draggables.each(function() {

			let e = $(this);
			let fontSize = parseInt($(this).css("font-size"));
			let estimate = fontSize * e.html().length * (factor);
	
			while (estimate > avg) {
				fontSize -= 0.5;
				estimate = fontSize * e.html().length * (factor);
			}
	
			e.css("font-size", fontSize + "px");
	
		});
	}
}

function getDragDropItems(selector, draggableClass) {
	let e = $(selector);
	let items = [];
	e.find("." + draggableClass).each(function(){
		items.push($(this).text());
	});

	return items
}
