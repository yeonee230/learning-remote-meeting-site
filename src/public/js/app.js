const socket = io(); //소켓io 서버를 자동으로 찾는 함수 

// const welcome = document.getElementById("welcome");
// const form = welcome.querySelector("form");
// const room = document.getElementById("room");


const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");

const call = document.getElementById("call");

call.hidden = true;
let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;






//카메라 가져오기 
async function getCameras() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices(); // 사용자가 가진 모든 장치 가져오기 
      const cameras = devices.filter((device) => device.kind === "videoinput"); // 사용자가 가진 장치 중 카메라 장치만 가져오기 
      const currentCamera = myStream.getVideoTracks()[0]; //최근 카메라 

      //카메라 선택 기능 
      cameras.forEach((camera) => {
        const option = document.createElement("option");
        option.value = camera.deviceId;
        option.innerText = camera.label;
        if (currentCamera.label === camera.label) { //선택된 카메라가 셀렉트 되어 있도록 
            option.selected = true;
          }
        camerasSelect.appendChild(option);
      });
    } catch (e) {
      console.log(e);
    }
  }


//유저 미디어 가져오기 
async function getMedia(deviceId) {
    const initialConstrains = {
      audio: true,
      video: { facingMode: "user" },
    };
    const cameraConstraints = {
      audio: true,
      video: { deviceId: { exact: deviceId } },
    };

    try {
        myStream = await navigator.mediaDevices.getUserMedia(
        deviceId ? cameraConstraints : initialConstrains
        );

      myFace.srcObject = myStream; // 내 카메라에 띄움. 

      if (!deviceId) {
        await getCameras();
      }

    } catch (e) {
      console.log(e);
    }
}
//getMedia(); // 사용자 카메라,오디오 가져오기 


//뮤트 버튼 클릭시 버튼 텍스트 바뀜
function handleMuteClick() {
    myStream
    .getAudioTracks()
    .forEach((track) => (track.enabled = !track.enabled));

    if (!muted) {
      muteBtn.innerText = "소리 켜기";
      muted = true;
    } else {
      muteBtn.innerText = "소리 끄기";
      muted = false;
    }
}

//카메라 버튼 클릭시 버튼 텍스트 바뀜
function handleCameraClick() {
    myStream
    .getVideoTracks()
    .forEach((track) => (track.enabled = !track.enabled));

    if (cameraOff) {
      cameraBtn.innerText = "카메라 끄기";
      cameraOff = false;
    } else {
      cameraBtn.innerText = "카메라 켜기";
      cameraOff = true;
    }
  }

//카메라 변경하기 
async function handleCameraChange() {
    await getMedia(camerasSelect.value);

    if (myPeerConnection) { // peer conncetion이 생긴 이후에는 
        const videoTrack = myStream.getVideoTracks()[0]; 
        const videoSender = myPeerConnection
          .getSenders()
          .find((sender) => sender.track.kind === "video");
        videoSender.replaceTrack(videoTrack);
      }

  }
  

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
camerasSelect.addEventListener("input", handleCameraChange);


/////////////////////////////////////// 방 들어오기 /////////////////////////////////////////////////////

const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");

// let peerConnections = {}; // peer Connection 객체 모음 
// let room = "";

if (location.hostname !== 'localhost') {
    requestTurn(
      'https://computeengineondemand.appspot.com/turn?username=41784574&key=4080218913'
    );
  }

// 미디어 시작 // 모든 클라이언트에서 실행되는 함수 
async function initCall() {
    welcome.hidden = true; // 방 번호 적는 것 숨기고
    call.hidden = false; // 비디오 화면 보여주고 

   

    await getMedia(); // 비디오 스트림 가져와 연결해줌. 
    makeConnetion(); // rtc peerConnetion을 만들어서 p2p 연결 준비하고, 유저의 미디어 스트림을 peer connection 안에 넣어줌. 

}

//방 이름 입력 
async function handleWelcomeSubmit(event){
    event.preventDefault();
    const input = welcomeForm.querySelector("input");
    await initCall();

    console.log("방에 입장");
    socket.emit("join_room", input.value); // 방에 입장 
    //socket.emit("join_room", input.value, socket.id); // 방에 입장 

    roomName = input.value;
    input.value="";
}

welcomeForm.addEventListener("submit",handleWelcomeSubmit);


//socket code  => Peer A 코드 
//누군가 방에 입장하면 방주인이 받는 메세지임. 
socket.on("welcome", async ()=>{
    console.log("stranger 입장");

    const offer = await myPeerConnection.createOffer(); // 3. offer를 만든다.  
    
    myPeerConnection.setLocalDescription(offer); //4. offer 를 로컬(peerA)에 set 한다. 
    console.log("offer를 서버로 보낸다.");
    socket.emit("offer", offer, roomName); // 5. "offer"라는 이름으로 offer를 소켓io를 이용해 서버로 보낸다. 어떤 방으로 가야할지도 같이 보낸다. 
    
})





//RTC 코드 

function makeConnetion(){

    console.log("peerConnetion 만들기 ")
    // 1. peerConnection 만들어 주기 
    myPeerConnection = new RTCPeerConnection({
        iceServers: [
          {
            urls: [
              "stun:stun.l.google.com:19302",
              "stun:stun1.l.google.com:19302",
              "stun:stun2.l.google.com:19302",
              "stun:stun3.l.google.com:19302",
              "stun:stun4.l.google.com:19302",
            ],
          },
        ],
      });

    console.log("icecandidate 찾기")
    myPeerConnection.addEventListener("icecandidate", handleIce); // ice candidate 이벤트 실행 
    console.log("addstream 이벤트 실행")
    myPeerConnection.addEventListener("addstream", handleAddStream); 

    

    //2. 비디오나 오디오 스트림을 peer connetion 과정 안에 넣어 준다. addStream();
    //console.log("비디오나 오디오 스트림을 peer connetion 과정 안에 넣어 준다.")
    myStream
    .getTracks()
    .forEach((track) => myPeerConnection.addTrack(track, myStream)); //비디오와 오디오 스트림에 각각 넣어준다. 

}


//peer B
//8. offer를 클라이언트 B가 받는다. 
socket.on("offer", async (offer) => {
    console.log("서버로 부터 offer를 받았다. ");
    myPeerConnection.setRemoteDescription(offer); // 9.받은 offer를 setting 한다. 

    console.log("answer 만들기  ");
    const answer = await myPeerConnection.createAnswer(); // 10. answer를 만든다.
    console.log("answer 228  "); 
    myPeerConnection.setLocalDescription(answer); // 11. answer를 로컬에 setting 한다. 
    console.log("answer를 서버로 보낸다. ");
    socket.emit("answer", answer, roomName); // 12. answer를 서버로 보낸다. 
});


//Peer A
//15. 서버에서 보낸 answer를 받는다. 
socket.on("answer", async (answer) => {
    console.log("서버로 부터 answer 받았다. ");
    myPeerConnection.setRemoteDescription(answer); // 16.받은 answer를 setting 한다. 

});


//ice candidate 보내기 
function handleIce(data){
    console.log("ice candidate 얻음");
    console.log(data);

    console.log(" candidate 보냄 ");
    socket.emit("ice", data.candidate, roomName); 

}

//ice candidate 받기 
socket.on("ice", ice => {
    console.log("ice candidate 받았다.");
    myPeerConnection.addIceCandidate(ice); // ice candidate 받고 추가하기 
});

function handleAddStream(data){
    console.log("stream 받기 ");
    console.log("상대방 스트림 : ", data.stream);
    console.log("내 스트림 : ", myStream);
    const peerFace = document.getElementById("peerFace");
    peerFace.srcObject = data.stream;
}

//턴서버 코드 
function requestTurn(turnURL) {
    var turnExists = false;
    for (var i in pcConfig.iceServers) {
      if (pcConfig.iceServers[i].urls.substr(0, 5) === 'turn:') {
        turnExists = true;
        turnReady = true;
        break;
      }
    }
    if (!turnExists) {
      console.log('Getting TURN server from ', turnURL);
      // No TURN server. Get one from computeengineondemand.appspot.com:
      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
          var turnServer = JSON.parse(xhr.responseText);
          console.log('Got TURN server: ', turnServer);
          pcConfig.iceServers.push({
            'urls': 'turn:' + turnServer.username + '@' + turnServer.turn,
            'credential': turnServer.password
          });
          turnReady = true;
        }
      };
      xhr.open('GET', turnURL, true);
      xhr.send();
    }
  }

// RTC Code==========================================
// async function makeConnection(othersId, _offer) {
//     const myPeerConnection = new RTCPeerConnection({
//         iceServers: [
//             {
//                 urls: [
//                     "stun:stun.l.google.com:19302",
//                     "stun:stun1.l.google.com:19302",
//                     "stun:stun2.l.google.com:19302",
//                     "stun:stun3.l.google.com:19302",
//                     "stun:stun4.l.google.com:19302"
            
//                 ]
//             }
//         ]
//     });
//     peerConnections[othersId] = myPeerConnection;

//     myPeerConnection.addEventListener("icecandidate", (data) => handleIce(data, othersId));
//     myPeerConnection.addEventListener("addstream", (data) => handleAddStream(data, othersId));
//     myStream.getTracks().forEach(track => myPeerConnection.addTrack(track, myStream));

//     let offer = _offer;
//     let answer;
//     if(!offer) {
//         offer = await myPeerConnection.createOffer();
//         myPeerConnection.setLocalDescription(offer);
//     }
//     else {
//         myPeerConnection.setRemoteDescription(offer);
//         answer = await myPeerConnection.createAnswer();
//         myPeerConnection.setLocalDescription(answer);
//     }

//     return answer || offer;
// }

//socket =====================================================================

// socket.on("welcome", async(newbieID) => { // newbieID == socket
//     // 뉴비를 위해 새로운 커넥션을 만들고
//     const offer = await makeConnection(newbieID);
//     console.log("someone joined");
//     // 뉴비에게 내 정보와 offer를 전달한다.
//     socket.emit("offer", offer, room, newbieID, socket.id);
//     console.log("send the offer");
// });
// socket.on("leave", (leaveId) => {
//     const video = document.getElementById(leaveId);
//     video.remove();
// });
// socket.on("offer", async(offer, offersId) => {
//     console.log("receive the offer");
//     console.log(offer);
//     // 뉴비는 현재 방안에 있던 모든사람의 offer를 받아 새로운 커넥션을 만들고, 답장을 만든다.
//     const answer = await makeConnection(offersId, offer);
//     // 답장을 현재 있는 받은 커넥션들에게 각각 보내준다.
//     socket.emit("answer", answer, offersId, socket.id);
//     console.log("send the answer");
// });
// socket.on("answer", async(answer, newbieID) => {
//     console.log("receive the answer", newbieID);
//     // 방에 있던 사람들은 뉴비를 위해 생성한 커섹션에 answer를 추가한다.
//     peerConnections[newbieID].setRemoteDescription(answer);
// });
// socket.on("ice", (ice, othersId) => {
//     console.log("receive candidate");
//     /** 다른 사람에게서 받은 ice candidate를 각 커넥션에 넣는다. */
//     peerConnections[othersId].addIceCandidate(ice);
// });

// function handleIce(data, othersId) {
//     // ice breack가 생기면? 이를 해당 사람들에게 전달한다.
//     console.log("got ice candidate");
//     socket.emit("ice", data.candidate, room, othersId, socket.id);
//     console.log("send ice candidate");
// }

// function handleAddStream(data, othersId) {
//     console.log("got an stream from my peer");
//     // stream을 받아오면, 비디오를 새로 생성하고 넣어준다.
//     const video = document.createElement("video");
//     document.getElementById("othersStream").appendChild(video);
//     video.id = othersId;
//     video.autoplay = true;
//     video.playsInline = true;
//     video.style.backgroundColor = "blue";
//     video.width = 400;
//     video.height = 400;
//     video.srcObject = data.stream;
// }

//====================================================================


// room.hidden = true;

// let roomName;

// function addMsg(msg){
//     const ul = room.querySelector("ul");
//     const li = document.createElement("li");
//     li.innerText = msg;
//     ul.appendChild(li);
// }

// function showRoom(){ // 방 보여주기 
//     welcome.hidden = true;
//     room.hidden = false;
//     const h3 = room.querySelector("h3");
//     h3.innerText = `Room ${roomName}`;
//     const form = room.querySelector("form");
//     form.addEventListener("submit",handleMsgSubmit)
// }

// function handleMsgSubmit(event) { // 방 이름 입력하고,  서버로 방 이름 보내는 함수 
//     event.preventDefault();
//     const input = room.querySelector("input");
//     const value = input.value;
//     socket.emit("new_message", input.value, roomName, () => { //메세지를 해당 방에 보낸다. 
//         addMsg(`You: ${value}`);
//     });

//     input.value = "";
    
//   }

// function handleRoomSubmit(event) { // 방 이름 입력하고,  서버로 방 이름 보내는 함수 
//   event.preventDefault();
//   const input = form.querySelector("input");
  
//   socket.emit("enter_room", input.value, showRoom);
//   roomName = input.value;
//   input.value = "";
// }

// form.addEventListener("submit", handleRoomSubmit);

// //방 입장시 
// socket.on("welcome", () => {
//     addMsg("누군가 입장했습니다.");
// });

// //방 나갈때 
// socket.on("bye", () => {
//     addMsg("누군가 퇴장했습니다.");
// });

// //메세지 받았을 때 띄우기 
// socket.on("new_message",addMsg);
