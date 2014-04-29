var Canvas = {
	canvas: null,
	tempContext: null,
	canvasData: null,
	height: null,
	width: null,
	blockSize: null,
	finished: null,
	finalImage: null,
	workersCount: null,
	iterations: null,
	startTime: null,
};

$(document).ready(function () {
	Canvas.canvas = document.getElementById("canvasElement");
	if (!Canvas.canvas.getContext) {
		alert("Canvas not supported. Please install a HTML5 compatible browser.");
		return;
	}

	$("body").fadeIn(500);
	initializeCanvas();
	
	//set the size of the Canvas element based on the current screen
	Canvas.width = $("#container").width();
	Canvas.height = Canvas.width/1.2;
	$("#canvasElement").attr("width", Canvas.width);
	$("#canvasElement").attr("height",  Canvas.height);
	//update canvas size
	$( window ).resize(function() {
		Canvas.width = $("#container").width();
		Canvas.height = Canvas.width/1.2;
		$("#canvasElement").attr("width", Canvas.width);
		$("#canvasElement").attr("height",  Canvas.height);
	});


	$("#slider-range-iterations").slider({
		range: "min",
		min: 5000,
		max: 10000,
		value: 7500,
		step: 200,
	});

	$("#slider-range-webWorkers").slider({
		range: "min",
		min: 1,
		max: 8,
		value: 1,
		step: 1,
	});

	$("a.ui-slider-handle").mousemove(function(evt){
		var id = evt.target.parentNode.id;
		showSliderBubble(id);
		updateCellSliderValues(id);
	});

	$("a.ui-slider-handle").mouseout(function(evt){
		var id = evt.target.parentNode.id;
		hideSliderBubble(id);
		updateCellSliderValues(id);
	});

	$("#start").click(function(){
		Canvas.tempContext.clearRect(0, 0, Canvas.width, Canvas.height);
		
		var radioChecked = $("input:checked").val();
		Canvas.iterations = $("#slider-range-iterations").slider("values",0);
		Canvas.workersCount = $("#slider-range-webWorkers").slider("values",0);

		Canvas.finalImage = [Canvas.workersCount];
		Canvas.blockSize = Math.floor(Canvas.height / Canvas.workersCount);
		Canvas.finished = 0;

		if (radioChecked === "mandelbrot")
		{
			showLoadingGif();
			doMandelbrot();
		}
		else
		{
			//Do Julia Set
		}
	});
});

function doMandelbrot()
{
	Canvas.startTime = new Date().getTime();
	for (var i = 0; i < Canvas.workersCount; i++) {
		var worker = new Worker("js/tools.js");
		worker.onmessage = messageHandler;

		var startY = Math.floor(Canvas.blockSize * i);

		var canvasData = Canvas.tempContext.getImageData(0, startY, Canvas.width, Canvas.blockSize);
		worker.postMessage({ workerData: canvasData, workerIndex: i, start: startY, maxIterations: Canvas.iterations, fullHeight: Canvas.height});
	}
}

function messageHandler(e) 
{	
	var canvasData = e.data.result;
	var index = e.data.index;
	Canvas.finalImage[index] = canvasData;
	Canvas.finished++;
	if (Canvas.finished === Canvas.workersCount) {
		DrawSet(Canvas.finalImage);
		console.log((new Date().getTime() - Canvas.startTime)/1000 + " seconds");
		hideLoadingGif();
	}
}

function DrawSet(finalImage)
{
	for (var c = 0; c < Canvas.workersCount; c++)
		Canvas.tempContext.putImageData(finalImage[c], 0, Canvas.blockSize * c);
}

function initializeCanvas()
{
	Canvas.height = Canvas.canvas.height;
	Canvas.width = Canvas.canvas.width;
	Canvas.tempContext = Canvas.canvas.getContext("2d");
	Canvas.canvasData = Canvas.tempContext.getImageData(0, 0, Canvas.width, Canvas.height);
}

function showLoadingGif()
{
	$("#start").hide();
	$("#loading").show();
}

function hideLoadingGif()
{
	$("#loading").hide();
	$("#start").show();	
}

function hideSliderBubble(id)
{
	$("#" + id + "-bubbleValue").hide();
}

function showSliderBubble(id)
{
	$("#" + id + "-bubbleValue").show();
}

function updateCellSliderValues(id)
{
	var value = $("#"+ id).slider("values",0);
	var denominator = $("#slider-range-iterations").slider("option", "max") - $("#slider-range-iterations").slider("option", "min"),
	offSet = ((value-$("#slider-range-iterations").slider("option", "min"))*100)/denominator;
	$("#"+ id + "-bubbleValue").text(value).css({"left": + offSet + "%"});
}
