// Settings
let minConfidence = 0.5
const debug = false;
const uploadConfirmationDuration = 2000;
const uploadConfirmationFadeDuration = 750;



$(document).foundation();


if (window.location.pathname === "/") {
	

	// Filter
	$('.filter-element').click(function(e) {
		e.preventDefault();
		$('#filter-element-selected').removeAttr('id');
		$('#current-filter').removeAttr('id');
		$(this).attr('id', 'filter-element-selected');
		$(this).next('.filter-img').attr('id', 'current-filter')
	});


	// Webcam
	async function run() {
		await changeFaceDetector();

		const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
		const videoEl = $('#inputvideo').get(0);
		videoEl.srcObject = stream;
	}

	async function changeFaceDetector() {
		await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
		if (!isFaceDetectionModelLoaded()) {
			await getCurrentFaceDetectionNet().load('/');
		}
	}

	function getFaceDetectorOptions() {
		return new faceapi.SsdMobilenetv1Options({ minConfidence });
	}

	function getCurrentFaceDetectionNet() {
		return faceapi.nets.ssdMobilenetv1;
	}

	function isFaceDetectionModelLoaded() {
		return !!getCurrentFaceDetectionNet().params
	}


	// OFF
	let uploadBlocked = false;

	function captureImage() {
		let videoEl = document.getElementById("inputvideo");

		videoEl.pause();
	}

	function clearImage() {
		let videoEl = document.getElementById("inputvideo");
		videoEl.play();
	}

	function uploadImage() {
		let uploadCanvas = document.createElement('canvas');
		uploadCanvas.width = $('#inputvideo').width();
		uploadCanvas.height = $('#inputvideo').height();
		let uploadCtx = uploadCanvas.getContext('2d');
		let videoEl = document.getElementById("inputvideo");
		let overlayEl = document.getElementById("overlay");
		uploadCtx.translate(uploadCanvas.width, 0);
		uploadCtx.scale(-1, 1);
		uploadCtx.drawImage(videoEl, 0, 0, uploadCanvas.width, uploadCanvas.height);
		uploadCtx.drawImage(overlayEl, 0, 0, uploadCanvas.width, uploadCanvas.height);
		let dataURL = uploadCanvas.toDataURL('image/jpeg');
		
		
		$.ajax({
			type: "POST",
			url: "upload.php",
			data: { 
				img: dataURL
			}
		}).done(function(o) {
			clearImage();
			$buttonCapture.show();
			$buttonCancel.hide();
			$buttonUpload.hide();
			uploadConfirmation();
		});
	}

	function uploadConfirmation() {
		uploadBlocked = true;
		$uploadConfirmation.fadeTo(
			uploadConfirmationFadeDuration,
			1, function() {
				setTimeout(function() {
					$uploadConfirmation.fadeTo(
						uploadConfirmationFadeDuration,
						0, function() {
							uploadBlocked = false;
						})
				}, uploadConfirmationDuration);
			});
	}

	let $buttonCapture = $('#capture');
	let $buttonCancel = $('#capture-cancel');
	let $buttonUpload = $('#upload');
	let $uploadConfirmation = $('#upload-confirmation');

	$(function() {		
		run();

		$buttonCapture.click(function(e) {
			e.preventDefault();
			if (!uploadBlocked) {
				if (debug) {
					console.log('capture!');
				}
				$buttonCapture.hide();
				$buttonCancel.show();
				$buttonUpload.show();
				captureImage();
			}
		});

		$buttonCancel.click(function(e) {
			e.preventDefault();
			if (debug) {
				console.log('cancel capture');
			}
			$buttonCapture.show();
			$buttonCancel.hide();
			$buttonUpload.hide();
			clearImage();
		});

		$buttonUpload.click(function(e) {
			e.preventDefault();
			if (debug) {
				console.log('upload picture');
			}
			uploadImage();
		});
		

	});
}

async function onPlay() {
	const videoEl = $('#inputvideo').get(0);

	if(videoEl.paused || videoEl.ended || !isFaceDetectionModelLoaded())
		return setTimeout(() => onPlay())

	const options = getFaceDetectorOptions();

	const result = await faceapi.detectSingleFace(videoEl, options);

	if (result) {
		const canvas = $('#overlay').get(0);

		// let dims = faceapi.matchDimensions(canvas, displaySize);

		const dims = faceapi.matchDimensions(canvas, videoEl, true);
		// faceapi.draw.drawDetections(canvas, faceapi.resizeResults(result, dims));

		let box = [
		result["_box"]["_x"],
		result["_box"]["_y"],
		result["_box"]["_width"],
		result["_box"]["_height"]
		];

		let c = document.getElementById("overlay");
		let ctx = c.getContext("2d");
		let currentFilter = document.getElementById('current-filter');
		ctx.drawImage(currentFilter, ...box);
		if (debug) {
			ctx.rect(...box);
			ctx.stroke();
		}

		$('#overlay').height($('#inputvideo').height());
		$('#overlay').width($('#inputvideo').width());

	} else {
		const canvas = $('#overlay').get(0);
		const dims = faceapi.matchDimensions(canvas, videoEl, true);
	}

	setTimeout(() => onPlay());
}