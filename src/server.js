import http from "http"; // node js 에 이미 저장되어 있음.  
import SocketIo from "socket.io";

import express from "express";
import res from "express/lib/response";


//import globalRouter from "./routers/globalRouter";



const app = express();

app.set("view engine","pug"); //pug 가져오기 
app.set("views", __dirname +"/views"); // pug 파일 경로 
app.use("/public", express.static(__dirname + "/public")); // 파일 static 처리 

//
app.get("/", (_, res)=> res.render("home"));

app.get('/login',(req,res)=>{
    res.render('login');
});
app.get('/main',(req,res)=>{
    res.render('main');
});

app.get('/home',(req,res)=>{
    res.render('home');
});




//app.get("/*", (_, res)=> res.redirect("/"));
//app.get("/",(req,res) => res.render("home"));


//app.use("/", globalRouter);


//시그널링 서버
const httpServer = http.createServer(app); // http 서버 만들기 
const wsServer = SocketIo(httpServer); // http 서버 위에 소켓io 서버 만들기 
const PORT = 8080;

wsServer.on("connection",(socket) => { // socket에 접근하는 코드 

    socket.on("join_room", (roomName) => {
        console.log("서버 : 방 입장 ")
        socket.join(roomName); // socket io 방에 입장하기 
        //console.log("서버 : 방 입장2 ")
        socket.to(roomName).emit("welcome"); // 밣신자를 제외한 모든 소켓에 전달 
        //console.log("서버 : 방 입장3 ")

    });
    // socket.on("join_room", (room, id) => {
    //     socket.join(room);

    //     socket.to(room).emit("welcome", id); // id = socket id 
    // });

    //6. peerA에서 보낸 offer 받기 
    socket.on("offer", (offer,roomName) =>{
        console.log("offer 받음 ")
        console.log(offer)
        console.log("서버에서 offer를 보낸다.")
        socket.to(roomName).emit("offer",offer);// 7. roomName 방에 있는 모두(peer B)에게 offer를 보낸다. 

    });
    // socket.on("offer", (offer, room, newbieID, offersId) => {
    //     socket.to(newbieID).emit("offer", offer, offersId);
    // });

    //13. peerB에서 보낸 answer 받기 
    socket.on("answer", (answer, roomName, ) =>{
        console.log("서버에서 answer를 보낸다.")
        socket.to(roomName).emit("answer",answer);// 14. roomName 방에 있는 모두(peer A)에게 answer를 보낸다. 

    });
    // socket.on("answer", (offer, offersId, newbieId) => {
    //     socket.to(offersId).emit("answer", offer, newbieId);
    // });


    socket.on("ice", (ice, roomName) => {
        socket.to(roomName).emit("ice", ice);
      });
    // socket.on("ice", (ice, room, othersId, myId) => {
    //     socket.to(othersId).emit("ice", ice, myId);
    // });




    //------------------------------------------------------------------------------

    // socket.onAny((event) => {
    //     console.log(`socket event : ${event}`)
    // });

    // socket.on("enter_room", (roomName, done) => {
    
    //     socket.join(roomName); // socket io 방에 입장하기 
    //     done(); // front end에 있는 showRoom()함수 실행 
    //     socket.to(roomName).emit("welcome");

    // });

    // socket.on("disconnecting", () => { // socket io 방에서 나가기 직전
    // socket.rooms.forEach((room) => socket.to(room).emit("bye")); // 나간다는 메세지 방에 있는 모든 사람에게 보낸다. 
    // });
    

    // socket.on("new_message", (msg,roomName, done) => {
    
    //     socket.to(roomName).emit("new_message",msg);
    //     done(); // front end에 있는 함수 실행 
       

    // });

});

const handleListen = () => console.log(`... http://localhost:${PORT}`);
httpServer.listen(PORT,handleListen);

