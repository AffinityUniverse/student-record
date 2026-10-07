/* ============================================================
   이 파일이 하는 일
   ============================================================
   1. 사용자가 "이미지 업로드" 버튼으로 이미지를 선택하면
      해당 이미지를 화면(#uploaded-image)에 표시한다.
   2. "여자 도장" 버튼을 누르면 G1.png / G2.png
      중 하나를 랜덤으로 골라 정해진 위치에 표시한다.
   3. "남자 도장" 버튼을 누르면 B1.png / B2.png
      중 하나를 랜덤으로 골라 같은 위치에 표시한다.
   4. 새 이미지를 업로드하거나 도장을 다시 찍으면
      기존 것을 지우고 새 것으로 교체한다.
   5. "이미지 다운로드" 버튼을 누르면 배경 + 업로드 사진 + 도장이
      모두 합쳐진 완성 이미지를 원본 고화질(1080 x 1440px)로 다운로드한다.
      (테이프는 이번 프로젝트에는 없다)
   ============================================================ */


/* =========================
   쉽게 수정하는 디자인 설정
   (도장 이미지 목록)
   나중에 새로운 여자/남자 도장 이미지를 추가하고 싶다면:
     1. images-base64.js 파일을 열어서 BASE64_IMAGES 객체 안에
        새로운 항목(예: female_03: "data:image/png;base64,...")을 추가하고,
     2. 아래 배열에 그 key 이름을 한 줄 추가하면 된다.
   (key는 images-base64.js의 BASE64_IMAGES 객체 안에 있는 이름과 정확히 같아야 한다) */
const FEMALE_STAMPS = [
  "./G1.png",
  "./G2.png"
];

const MALE_STAMPS = [
  "./B1.png",
  "./B2.png"
];


/* ============================================================
   페이지가 열리자마자 배경 이미지를 base64 데이터로 채워 넣는다.
   (이렇게 해야 index.html을 더블클릭해서 열어도 화면이 정상적으로 보이고,
    나중에 "다운로드" 기능도 문제없이 작동한다)
   ============================================================ */
src="./Main.png"


/* =========================
   쉽게 수정하는 디자인 설정
   (다운로드 이미지를 만들 때 사용하는 "원본 픽셀 좌표")
   화면에 보이는 CSS는 %(퍼센트) 단위지만,
   실제로 다운로드될 고화질 이미지를 그릴 때는
   원본 디자인 크기(1080 x 1440px) 그대로의 픽셀 좌표가 필요하다.
   따라서 여기에는 style.css에 있는 값과 "같은 의미의 값"을
   px 단위 그대로 다시 적어둔다.
   나중에 위치를 바꾸면 style.css의 %값과 함께 이 값도 같이 바꿔줘야 한다.
   ========================= */
const DOWNLOAD_CONFIG = {
  // 전체 캔버스(원본) 크기
  canvasWidth: 1080,
  canvasHeight: 1440,

  // 업로드 이미지 프레임 (X, Y, Width, Height) - 왼쪽 위 꼭짓점 기준
  uploadFrame: { x: 132.2, y: 220.5, width: 816, height: 815.2 },

  // 도장 프레임 (X, Y, Width, Height) - 왼쪽 위 꼭짓점 기준
  stampFrame: { x: 640.2, y: 961.6, width: 369, height: 373.4 }
};


/* ============================================================
   HTML 요소 가져오기
   ============================================================ */
const fileInput = document.getElementById("file-input");           // 파일 선택 input
const uploadedImage = document.getElementById("uploaded-image");     // 업로드된 이미지를 표시할 <img>
const uploadPlaceholder = document.getElementById("upload-placeholder"); // "이미지를 업로드해주세요" 문구

const stampImage = document.getElementById("stamp-image");           // 도장 이미지를 표시할 <img>

const btnFemale = document.getElementById("btn-female");             // 여자 도장 버튼
const btnMale = document.getElementById("btn-male");                 // 남자 도장 버튼
const btnDownload = document.getElementById("btn-download");         // 다운로드 버튼

// 사용자가 실제로 이미지를 업로드했는지 / 도장을 찍었는지를 저장하는 변수.
// (img.src는 값이 비어 있어도 브라우저가 자동으로 현재 페이지 주소를 채워 넣기 때문에
//  "업로드했는지 여부"를 정확히 판단하려면 이렇게 별도의 변수로 직접 기록해야 한다.)
let hasUploadedImage = false;
let hasStamp = false;


/* ============================================================
   1) 사용자 이미지 업로드 기능
   ============================================================
   - 사용자가 파일을 선택하면 FileReader로 이미지를 읽어서
     #uploaded-image 의 src에 넣어준다.
   - 새 이미지를 선택하면 기존 이미지 src가 자동으로 교체된다.
   - CSS의 object-fit: cover(스타일 파일에서 설정) 덕분에
     어떤 비율의 이미지든 프레임을 빈틈없이 채우게 된다.
   ============================================================ */
fileInput.addEventListener("change", function (event) {
  const file = event.target.files[0]; // 사용자가 선택한 첫 번째 파일

  // 파일을 선택하지 않고 취소한 경우 아무것도 하지 않는다
  if (!file) {
    return;
  }

  // 이미지가 아닌 파일을 선택했을 경우 방지
  if (!file.type.startsWith("image/")) {
    alert("이미지 파일만 업로드할 수 있습니다.");
    return;
  }

  const reader = new FileReader();

  // 파일 읽기가 끝나면 실행되는 부분
  reader.onload = function (e) {
    // 기존 이미지가 있었다면 여기서 src만 바꿔주므로 자동으로 "교체"된다
    uploadedImage.src = e.target.result;
    uploadedImage.style.display = "block";

    // 이미지가 채워졌으니 안내 문구는 숨긴다
    uploadPlaceholder.style.display = "none";

    // 업로드가 실제로 완료되었음을 기록 (다운로드 버튼에서 이 값을 확인한다)
    hasUploadedImage = true;
  };

  // 파일을 base64 형태의 데이터 URL로 변환해서 읽는다
  reader.readAsDataURL(file);
});


/* ============================================================
   2) 도장 찍기 공통 함수
   ============================================================
   stampList : FEMALE_STAMPS 또는 MALE_STAMPS 배열을 전달받는다.
   이 함수 하나로 여자 도장/남자 도장 기능을 모두 처리한다.
   ============================================================ */
// 현재 화면에 표시된 도장이 무엇인지(어떤 key인지) 기억해두는 변수.
// 다운로드할 때 이 key로 BASE64_IMAGES에서 정확히 같은 이미지를 다시 꺼내 쓴다.
let currentStampKey = null;

function stampRandomImage(stampList) {
  // 0 ~ (배열 길이-1) 사이의 랜덤한 정수 인덱스를 뽑는다
  const randomIndex = Math.floor(Math.random() * stampList.length);
  const selectedStamp = stampList[randomIndex];

  // #stamp-image 의 src를 바꿔주기만 하면
  // 기존에 찍혀있던 도장은 자동으로 "교체"된다 (쌓이지 않음)
  stampImage.src = selectedStamp;
  stampImage.style.display = "block";

  // 어떤 도장이 찍혔는지, 실제로 찍혔다는 사실을 기록해둔다
  currentStampKey = selectedStamp;
  hasStamp = true;
}


/* ---- 여자 도장 랜덤 선택 코드 ---- */
btnFemale.addEventListener("click", function () {
  stampRandomImage(FEMALE_STAMPS);
});

/* ---- 남자 도장 랜덤 선택 코드 ---- */
btnMale.addEventListener("click", function () {
  stampRandomImage(MALE_STAMPS);
});


/* ============================================================
   3) 완성된 이미지 다운로드 기능
   ============================================================
   화면에 보이는 화면(HTML)을 그대로 캡처하는 대신,
   눈에 보이지 않는 <canvas> 위에
     1. 배경
     2. 업로드 이미지 (지정된 프레임에 꽉 채워서, object-fit: cover와 동일한 방식)
     3. 도장 (있는 경우에만, object-fit: contain과 동일한 방식)
   순서로 직접 그린 뒤, 그 결과를 PNG 파일로 다운로드한다.
   이렇게 하면 화면 크기와 상관없이 항상 원본 고화질(1080 x 1440px)로
   완성된 이미지를 받을 수 있다.
   ============================================================ */

// 이미지 경로(또는 base64 데이터)를 넣으면 로딩이 끝난 <img> 객체를 돌려주는 함수 (Promise 사용)
function loadImage(src) {
  return new Promise(function (resolve, reject) {
    const img = new Image();
    img.onload = function () {
      resolve(img);
    };
    img.onerror = function () {
      reject(new Error("이미지를 불러오지 못했습니다: " + src));
    };
    img.src = src;
  });
}

// object-fit: cover 방식으로 이미지를 프레임 안에 꽉 채워 그리는 함수
// (이미지 비율은 유지하면서 프레임을 넘치는 부분은 잘라낸다)
function drawImageCover(ctx, img, frameX, frameY, frameWidth, frameHeight) {
  const imgRatio = img.width / img.height;
  const frameRatio = frameWidth / frameHeight;

  let sx, sy, sWidth, sHeight; // 원본 이미지에서 잘라낼 영역

  if (imgRatio > frameRatio) {
    // 이미지가 프레임보다 가로로 더 넓은 경우 -> 좌우를 잘라낸다
    sHeight = img.height;
    sWidth = sHeight * frameRatio;
    sx = (img.width - sWidth) / 2;
    sy = 0;
  } else {
    // 이미지가 프레임보다 세로로 더 긴 경우 -> 위아래를 잘라낸다
    sWidth = img.width;
    sHeight = sWidth / frameRatio;
    sx = 0;
    sy = (img.height - sHeight) / 2;
  }

  ctx.drawImage(img, sx, sy, sWidth, sHeight, frameX, frameY, frameWidth, frameHeight);
}

// object-fit: contain 방식으로 이미지를 프레임 안에 비율 유지한 채 그리는 함수
// (도장 이미지는 잘리지 않고 프레임 안에 전체가 다 보여야 하므로 cover 대신 contain 사용)
function drawImageContain(ctx, img, frameX, frameY, frameWidth, frameHeight) {
  const imgRatio = img.width / img.height;
  const frameRatio = frameWidth / frameHeight;

  let drawWidth, drawHeight;

  if (imgRatio > frameRatio) {
    drawWidth = frameWidth;
    drawHeight = drawWidth / imgRatio;
  } else {
    drawHeight = frameHeight;
    drawWidth = drawHeight * imgRatio;
  }

  const drawX = frameX + (frameWidth - drawWidth) / 2;
  const drawY = frameY + (frameHeight - drawHeight) / 2;

  ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
}

// 다운로드 버튼 클릭 시 실행되는 메인 함수
btnDownload.addEventListener("click", async function () {
  // 사용자가 아직 이미지를 업로드하지 않았다면 미리 알려준다
  // (hasUploadedImage 변수로 정확하게 확인한다 — img.src만 보면 판단이 틀릴 수 있다)
  if (!hasUploadedImage) {
    alert("먼저 이미지를 업로드해주세요.");
    return;
  }

  try {
    // 다운로드 중에는 버튼을 잠시 비활성화해서 중복 클릭을 막는다
    btnDownload.disabled = true;
    btnDownload.textContent = "이미지 생성 중...";

    const cfg = DOWNLOAD_CONFIG;

    // 원본 크기(1080 x 1440)의 보이지 않는 캔버스를 새로 만든다
    const canvas = document.createElement("canvas");
    canvas.width = cfg.canvasWidth;
    canvas.height = cfg.canvasHeight;
    const ctx = canvas.getContext("2d");

    // 필요한 이미지를 미리 불러온다 (배경, 업로드 이미지)
    // 배경은 파일 경로가 아니라 images-base64.js에 내장된 데이터를 사용한다.
    // -> 이렇게 하면 file://로 직접 열었을 때도 캔버스가 "오염(tainted)"되지 않아서
    //    어떤 환경에서든 다운로드가 항상 정상적으로 작동한다.
const [bgImg, userImg] = await Promise.all([
  loadImage("./Main.png"),
  loadImage(uploadedImage.src)
]);
    // 도장은 실제로 찍은 경우에만 불러온다 (hasStamp / currentStampKey로 정확하게 확인)
let stampImg = null;

if (hasStamp && currentStampKey) {
  stampImg = await loadImage(currentStampKey);
}

    /* ---- 레이어 순서를 지켜서 순서대로 그린다 (테이프 없음) ---- */

    // 1. 배경 (캔버스 전체를 꽉 채운다)
    ctx.drawImage(bgImg, 0, 0, cfg.canvasWidth, cfg.canvasHeight);

    // 2. 업로드 이미지 (지정된 프레임 안에 cover 방식으로 그린다)
    drawImageCover(
      ctx, userImg,
      cfg.uploadFrame.x, cfg.uploadFrame.y,
      cfg.uploadFrame.width, cfg.uploadFrame.height
    );

    // 3. 도장 (있다면 지정된 프레임 안에 contain 방식으로 그린다)
    if (stampImg) {
      drawImageContain(
        ctx, stampImg,
        cfg.stampFrame.x, cfg.stampFrame.y,
        cfg.stampFrame.width, cfg.stampFrame.height
      );
    }

    // 완성된 캔버스를 PNG 파일로 변환해서 다운로드한다
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "완성된_이미지.png"; // 다운로드될 파일 이름 (원하는 이름으로 수정 가능)
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

  } catch (error) {
    console.error(error);
    alert("이미지를 만드는 중 오류가 발생했습니다. 페이지를 새로고침한 뒤 다시 시도해주세요.");
  } finally {
    // 버튼을 다시 원래 상태로 되돌린다
    btnDownload.disabled = false;
    btnDownload.textContent = "이미지 다운로드";
  }
});
