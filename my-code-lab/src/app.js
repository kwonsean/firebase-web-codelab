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
import { getAuth } from 'firebase/auth';

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
