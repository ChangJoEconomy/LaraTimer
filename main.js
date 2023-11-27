const monitoringButton = document.getElementById("screenmonitoringButton")
const pipButton = document.getElementById("pipActiveButton")
const pipVideo = document.getElementById("pipVideo");
const screenVideo = document.getElementById('screen');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const statusCanvas = document.getElementById("statusCanvas");
const statusCtx = statusCanvas.getContext('2d', { willReadFrequently: true });
let cnt = 0;

// 남은 시간, 모든 분출지속시간은 18초라 가정
let riverRmnTime = new Date(2023);
let sunRmnTime = new Date(2023);
let windRmnTime = new Date(2023);

setInterval(drawStatusCanvas, 200);

function drawStatusCanvas() {
    let nowTime = new Date();
    nowTime.setMilliseconds(0);
    const riverTime = Math.max(0, (16 - parseInt((nowTime.getTime() - riverRmnTime.getTime())/1000)));
    const sunTime = Math.max(0, (16 - parseInt((nowTime.getTime() - sunRmnTime.getTime())/1000)));
    const windTime = Math.max(0, (16 - parseInt((nowTime.getTime() - windRmnTime.getTime())/1000)));

    statusCtx.clearRect(0, 0, statusCanvas.width, statusCanvas.height);
    statusCtx.fillStyle = "#132043";
    statusCtx.fillRect(0, 0, 600, 230)
    // 정령 이미지
    statusCtx.drawImage(document.getElementById("riverImg"), 30, 20)  // x:35(mid:100, width:131)
    statusCtx.drawImage(document.getElementById("sunImg"), 220, 10)   // x:228(mid:300, width:143)
    statusCtx.drawImage(document.getElementById("windImg"), 421, 20)  // x:421(mid:500, width:158)
    // 남은 시간 업데이트
    // 강
    statusCtx.font = "70pt Nanum Gothic";
	statusCtx.fillStyle = "white";
	statusCtx.fillText(riverTime,riverTime>=10?40:60, 210); // 2:40, 1:60
    // 해
    statusCtx.font = "70pt Nanum Gothic";
	statusCtx.fillStyle = "white";
	statusCtx.fillText(sunTime, sunTime>=10?250:270, 210);  //2:250, 1:270
    // 바람
    statusCtx.font = "70pt Nanum Gothic";
	statusCtx.fillStyle = "white";
	statusCtx.fillText(windTime, windTime>=10?440:460, 210);  // 2:440, 1:460
}

function chkScreen(target) {
    let src = cv.imread(canvas, cv.COLOR_BGR2GRAY);
    let riverElement = document.getElementById(target);
    let templ = cv.imread(riverElement, cv.COLOR_BGR2GRAY);
    let dst = new cv.Mat();
    let mask = new cv.Mat();
    cv.matchTemplate(src, templ, dst, cv.TM_CCOEFF_NORMED, mask);
    let result = cv.minMaxLoc(dst, mask);
    src.delete(); dst.delete(); mask.delete();
    return result.maxVal;
}

function update() {
    // screen 한번에 하나의 분출만 chk하여 성능 향상
    cnt++;
    if(cnt==3) cnt = 0;

    if(cnt==0 && chkScreen("riverSrc") > 0.9) {
        riverRmnTime = new Date();
        riverRmnTime.setMilliseconds(0);
    }
    if(cnt==1 && chkScreen("sunSrc") > 0.9) {
        sunRmnTime = new Date();
        sunRmnTime.setMilliseconds(0);
    }
    if(cnt==2 && chkScreen("windSrc") > 0.9) {
        windRmnTime = new Date();
        windRmnTime.setMilliseconds(0);
    }
}

function captureImage() {
    const video = screenVideo;
    // 높이는 절반만 들고와서 속도향상
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight/2;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
    if (ctx.canvas.width == 0) {return;}
    update()
    screenVideo.requestVideoFrameCallback(captureImage);
}

monitoringButton.addEventListener("click", function() {
    if(canvas.style.display == "none")
        canvas.style.display = "block";
	else canvas.style.display = "none";
});

document.getElementById("screenSharingButton").addEventListener("click", function() {
    navigator.mediaDevices.getDisplayMedia({ video: true })
        .then(stream => {
            screenVideo.srcObject = stream;
            document.getElementById("statusPrint").innerText = "on";
            document.getElementById("statusPrint").style.color = "green";
            if(monitoringButton.style.display == "none")
                monitoringButton.style.display = "block";
            if(pipButton.style.display == "none")
                pipButton.style.display = "block";
            if(statusCanvas.style.display == "none")
                statusCanvas.style.display = "block";

            pipVideo.srcObject = statusCanvas.captureStream();
        })
        .catch(error => {
            document.getElementById("statusPrint").innerText = "실패!(" + error + ")";
            document.getElementById("statusPrint").style.color = "red";
            if(monitoringButton.style.display == "block")
                monitoringButton.style.display = "none";
            if(pipButton.style.display == "block")
                pipButton.style.display = "none";
            if(statusCanvas.style.display == "block")
                statusCanvas.style.display = "none";
        });

    screenVideo.requestVideoFrameCallback(captureImage);		
});

pipButton.addEventListener("click", function() {
    if (document.pictureInPictureElement) document.exitPictureInPicture();
    else pipVideo.requestPictureInPicture();
});
