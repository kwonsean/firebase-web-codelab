console.log('--------this is APP JS-----------');
// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import {
  getDatabase,
  ref,
  set,
  onValue,
  get,
  child,
  remove,
  runTransaction,
} from 'firebase/database';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  setDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import {
  getStorage,
  uploadBytesResumable,
  getDownloadURL,
  ref as storage_ref,
} from 'firebase/storage';
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
console.log('analytics', analytics);

//  요소 가져오기 실제로 할땐 변수명은 생명이다.
const team1NameEl = document.getElementById('team1NamePreview');
const nameSetBtn = document.getElementById('nameBtn--set');
const name1Input = document.getElementById('team1NameInput');
const team1ScoreEl = document.getElementById('team1ScorePreview');
const scorePlusBtn = document.getElementById('scoreBtn--plus');
const scoreMinusBtn = document.getElementById('scoreBtn--minus');
const scoreSetBtn = document.getElementById('scoreBtn--set');
const score1Input = document.getElementById('team1ScoreInput');

// 데이터 베이스 참조 가져오기
// * DB에서 데이터를 읽거나 쓰려면 DB에 대한 레퍼런스 인스턴스가 필요함
const DB = getDatabase();
console.log('DB ref', DB);

// * set을 이용하여 데이터 DB에 입력
// * 지정한 위치가 같은 경우에는 데이터를 덮어씀
function writeUserData(uid, name, email, imageUrl) {
  set(ref(DB, 'users/' + uid), {
    username: name,
    email,
    profile_picture: imageUrl,
  })
    .then(() => {
      console.log('set user data success!!');
    })
    .catch(err => {
      console.log('set user data error..', err);
    });
}

writeUserData(100, 'KSH100', 'ksh100@naver.com', 'imageURL');

const defaultScoreboardObj = {
  team1Name: 'Team 1',
  team2Name: 'Team 2',
  team1Score: '00',
  team2Score: '00',
  team1Img: 'defaultImg1.png',
  team2Img: 'defaultImg2.png',
};

const setUserScoreboard = (uid, data) => {
  set(ref(DB, 'scoreboard/' + uid), data);
};

setUserScoreboard(0, defaultScoreboardObj);

const user1Data = {
  ...defaultScoreboardObj,
  team1Name: 'KING',
  team2Name: 'COOLEST',
  team1Score: '200',
  team2Score: '99',
};

setUserScoreboard(1, user1Data);

// * onValue를 이용하여 데이터 읽어오기
function getUserData(uid) {
  const userRef = ref(DB, 'users/' + uid + '/username');
  onValue(userRef, snapshot => {
    console.log(`user ID : ${uid} user Name : ${snapshot.val()}`);
  });
}

getUserData(2);

// * 특정 데이터 뿐만 아니라 전체 리스트도 가져올 수 있다.
// * 결국 레퍼런스를 어떻게 잡냐에 따라 snapshot이 달라진다.
function getAllUserDatas() {
  const allUserDatasRef = ref(DB, 'users/');
  onValue(allUserDatasRef, snapshot => {
    snapshot.forEach(user => console.log(user.val()));
  });
}

getAllUserDatas();

// * get 데이터가 한번만 필요한 경우 사용
get(child(ref(DB), `users/`))
  .then(snapshot => {
    if (snapshot.exists()) {
      console.log(snapshot.val());
    } else {
      console.log('No data available');
    }
  })
  .catch(error => {
    console.error('ERR', error);
  });

// * remove
function removeUserData(uId) {
  remove(ref(DB, 'users/' + uId))
    .then(() => console.log('REMOVE!!! ID:', uId, ' user'))
    .catch(err => console.log('REMOVE ERROR', err.message));
}

removeUserData(0);

// ! 이거 사용해야 할 듯한 느낌
// * runTransaction 동시에 같은 값을 수정해도 충돌이 발생하지 않도록 함
function handleScoreBtn(uId, diff) {
  const db = getDatabase();
  const scoreRef = ref(db, 'scoreboard/' + uId);
  runTransaction(scoreRef, data => {
    if (data) {
      const { team1Score } = data;
      const gap = Number(team1Score) + diff;
      if (gap > 0) {
        data.team1Score = String(gap).padStart(2, '0');
      } else {
        data.team1Score = '00';
      }
      team1ScoreEl.innerText = data.team1Score;
    }
    return data;
  });
}

function handleSetScore(uId) {
  const scoreRef = ref(DB, 'scoreboard/' + uId);
  runTransaction(scoreRef, data => {
    if (data) {
      const inputValue = score1Input.value;
      if (inputValue < 0) {
        data.team1Score = '00';
      } else {
        data.team1Score = inputValue.padStart(2, '0');
      }
      team1ScoreEl.innerText = data.team1Score;
      score1Input.value = data.team1Score;
    }
    return data;
  });
}

// TODO 입력값 띄어쓰기도 반영
function handleSetName(uId) {
  const scoreRef = ref(DB, 'scoreboard/' + uId);
  runTransaction(scoreRef, data => {
    if (data) {
      const inputValue = name1Input.value;
      data.team1Name = inputValue;
      team1NameEl.innerText = data.team1Name;
      name1Input.value = '';
    }
    return data;
  });
}

// !! 한번에 여러개 값 변경도 가능 (data에 접근하여 값 수정 가능)
// function handleSetName(uId) {
//   const scoreRef = ref(DB, 'scoreboard/' + uId);
//   runTransaction(scoreRef, data => {
//     if (data) {
//       const inputValue = name1Input.value;
//       data.team1Name = inputValue;
//       data.team1Score = Number(data.team1Score) + 10;
//       team1NameEl.innerText = data.team1Name;
//       team1ScoreEl.innerText = data.team1Score;
//       name1Input.value = '';
//     }
//     return data;
//   });
// }

// 이벤트 등록 (이게 최선일지 고민 필요) 일단 html에 onclick으로 붙이는건 오류가 발생함
scorePlusBtn.addEventListener('click', () => handleScoreBtn(0, +1));
scoreMinusBtn.addEventListener('click', () => handleScoreBtn(0, -1));
scoreSetBtn.addEventListener('click', () => handleSetScore(0));
nameSetBtn.addEventListener('click', () => handleSetName(0));

// * 처음 저장된 값 브리뷰 요소에 반영
get(child(ref(DB), `scoreboard/0`))
  .then(snapshot => {
    if (snapshot.exists()) {
      const { team1Name, team1Score } = snapshot.val();
      team1NameEl.innerText = team1Name;
      team1ScoreEl.innerText = team1Score;
    } else {
      console.log('No data available');
    }
  })
  .catch(error => {
    console.error('ERR', error);
  });

var imageFormElement = document.getElementById('image-form');
const mediaCaptureElement = document.getElementById('mediaCapture');
const imageButtonElement = document.getElementById('submitImage');
var LOADING_IMAGE_URL = 'https://www.google.com/images/spin-32.gif?a';

// * 파일을 선택하면(바뀌면) change 이벤트 발생
// * event.target.files[0]에서 파일 가져옴
function onMediaFileSelected(event) {
  event.preventDefault();
  var file = event.target.files[0];
  console.log(file);
  // Clear the selection in the file picker input.
  // 업로드한 파일을 받았으면 폼은 리셋 시킴
  imageFormElement.reset();

  // Check if the file is an image.
  if (!file.type.match('image.*')) {
    var data = {
      message: 'You can only share images',
      timeout: 2000,
    };
    signInSnackbarElement.MaterialSnackbar.showSnackbar(data);
    return;
  }
  // // Check if the user is signed-in
  // if (checkSignedInWithMessage()) {
  //   saveImageMessage(file);
  // }
  saveImageMessage(file);
}

async function saveImageMessage(file) {
  // TODO 9: Posts a new image as a message.
  // 권한에 제한이 있었어서 오류가 발생했었음
  try {
    // 1 - We add a message with a loading icon that will get updated with the shared image.
    const messageRef = await addDoc(collection(getFirestore(), 'messages'), {
      name: 'ksh',
      imageUrl: LOADING_IMAGE_URL,
      profilePicUrl:
        'https://pbs.twimg.com/profile_images/1374979417915547648/vKspl9Et_400x400.jpg',
      timestamp: serverTimestamp(),
    });

    // 2 - Upload the image to Cloud Storage.
    // console.log(messageRef.id); // 문서의 아이디
    // const filePath = `${getAuth().currentUser.uid}/${messageRef.id}/${
    //   file.name
    // }`;
    const filePath = `12345/${file.name}`;
    // 유저 ID 폴더 안에 메시지 ID 폴더 안에 이미지가 저장됨
    const newImageRef = storage_ref(getStorage(), filePath);
    const fileSnapshot = await uploadBytesResumable(newImageRef, file);
    // console.log(fileSnapshot.metadata.fullPath);

    // 3 - Generate a public URL for the file.
    const publicImageUrl = await getDownloadURL(newImageRef);
    // console.log(publicImageUrl); // 이미지를 보여주는 URL로 변경

    // 4 - Update the chat message placeholder with the image's URL.
    await updateDoc(messageRef, {
      imageUrl: publicImageUrl,
      storageUri: fileSnapshot.metadata.fullPath,
    });
  } catch (error) {
    console.error(
      'There was an error uploading a file to Cloud Storage:',
      error
    );
  }
}

// Events for image upload.
imageButtonElement.addEventListener('click', function (e) {
  e.preventDefault();
  mediaCaptureElement.click();
});
mediaCaptureElement.addEventListener('change', onMediaFileSelected);

const imagesEl = document.getElementById('images');

function loadMessages() {
  // TODO 8: Load and listen for new messages.
  // 데이터를 가져오는 쿼리 작성 (컬렉션에 메시지에 접근해서 시간순으로 내림차순(최신순) 12개 가져오기)
  const recentMessagesQuery = query(
    collection(getFirestore(), 'messages'),
    orderBy('timestamp', 'desc'),
    limit(12)
  );
  // onSanpshot은 (쿼리, 콜백함수) 형식을 가지고 쿼리와 일치하는 문서에 변경이 있을 경우 콜백함수가 실행됨
  // DB에서 값을 직접 수정해도 바로 반영이 됨 그렇다는 것은 여기서 말하는 문서는 DB에 컬렉션 밑에 있는 부분을 뜻하는 것 같음

  // change는 데이터의 상태? 를 알려주는 요소 같고 여기서 진짜 데이터는 change.doc.data()를 통해 가져옴
  onSnapshot(recentMessagesQuery, function (snapshot) {
    snapshot.docChanges().forEach(function (change) {
      console.log('change', change);
      if (change.type === 'removed') {
        deleteMessage(change.doc.id);
      } else {
        let message = change.doc.data();
        const img = document.createElement('img');
        img.src = message.imageUrl;
        imagesEl.appendChild(img);
      }
    });
  });
}

function deleteMessage(id) {
  var div = document.getElementById(id);
  // If an element for that message exists we delete it.
  if (div) {
    div.parentNode.removeChild(div);
  }
}
loadMessages();
