const socket = io(); //소켓io 서버를 자동으로 찾는 함수 

let myStream;

async function getMedia() {
myStream = await navigator.mediaDevices.getUserMedia();
console.log(myStream);
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

        
      //myFace.srcObject = myStream; // 내 카메라에 띄움. 

      if (!deviceId) {
        await getCameras();
      }

    } catch (e) {
      console.log(e);
    }

    console.log(myStream);
}

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
    //console.log("addstream 이벤트 실행")
    //myPeerConnection.addEventListener("addstream", handleAddStream); 

    

    //2. 비디오나 오디오 스트림을 peer connetion 과정 안에 넣어 준다. addStream();
    //console.log("비디오나 오디오 스트림을 peer connetion 과정 안에 넣어 준다.")
    // myStream
    // .getTracks()
    // .forEach((track) => myPeerConnection.addTrack(track, myStream)); //비디오와 오디오 스트림에 각각 넣어준다. 
   

}

//ice candidate 보내기 
function handleIce(data){
    console.log("ice candidate 얻음");
    console.log(data);

    console.log(" candidate 보냄 ");
    socket.emit("ice", data.candidate, roomName); 

}

function createOffer(){
    const offer = myPeerConnection.createOffer(); // 3. offer를 만든다.  
    //const socket_id = socket.id;
        
        myPeerConnection.setLocalDescription(offer); //4. offer 를 로컬(peerA)에 set 한다. 
        console.log("offer를 서버로 보낸다.");
        socket.emit("offer", offer, "123"); // 5. "offer"라는 이름으로 offer를 소켓io를 이용해 서버로 보낸다. 어떤 방으로 가야할지도 같이 보낸다. 
    
}

getMedia();
makeConnetion();
createOffer();

