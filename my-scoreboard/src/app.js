console.log("--------this is Scorebard's APP JS-----------");
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
  onChildChanged,
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

//  요소 가져오기 실제로 할땐 변수명은 생명이다.
const team1NameEl = document.getElementById('team1Name');
const team1ScoreEl = document.getElementById('team1Score');

// 데이터 베이스 참조 가져오기
// * DB에서 데이터를 읽거나 쓰려면 DB에 대한 레퍼런스 인스턴스가 필요함
const DB = getDatabase();
console.log('DB ref', DB);

const UID = 0; // 인증 관련 메서드를 사용해서 찾아와야 할듯
let userData = {};

// * 첫 로딩 시 화면에 기존 데이터 적용
get(child(ref(DB), `scoreboard/${UID}`))
  .then(async snapshot => {
    if (snapshot.exists()) {
      userData = await snapshot.val();
      team1NameEl.innerText = userData.team1Name;
      team1ScoreEl.innerText = userData.team1Score;
    } else {
      console.log('No data available');
    }
  })
  .catch(error => {
    console.error('ERR', error);
  });

const userScoreboardRef = ref(DB, 'scoreboard/' + UID);

// * onValue, onChildChanged 모두 값이 변경될 경우에 실행 된다.
// * 단, onValue는 전체 값을 가져오고 onChildChanged는 바뀐 부분의 값만 가져온다.
// * 따라서 onChildChanged가 onValue보다 빠르다.

// onValue(userScoreboardRef, snapshot => console.log(snapshot.val()));

onChildChanged(userScoreboardRef, async snapshot => {
  const [key, value] = [snapshot.key, await snapshot.val()];
  // console.log(key, value);
  userData[key] = value;
  updateData(key);
});

// 화면에 값을 반영하는 코드
// 전체 요소의 innerText를 조정하는 것보다 동적으로 요소를 찾아서 값을 반영하도록 (딱 그 요소만) 함수를 구현 함
// 그런데... 크리켓 같이 여러개가 한번에 수정되는 경우에는? => 순차적으로 값이 변경된 내용을 하나씩 snapshot에 담겨서 실행된다.
// onChildChanged가 2번 실행됨 (변경된 요소 만큼)

const updateData = key => {
  const changedEl = document.getElementById(`${key}`);
  changedEl.innerText = userData[key];
};
