
"use strict";

const loginButton = document.getElementById("button");
loginButton.addEventListener("click", login);


var url = 'http://ec2-3-35-3-77.ap-northeast-2.compute.amazonaws.com/italki/login.php';

function login() {

        //iput으로 id, password 받아오기 
        const id = document.getElementById("id").value
        const password = document.getElementById("password").value

        //aws 서버로 id, pw 요청 
        var params = `email=${id}&password=${password}`;
        //console.log(params)
        const http = new XMLHttpRequest()
        http.open('POST', url, true)
        http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        http.send(params) // 서버로 id,pw 전송하기 
        http.onload = function() {
            
            //서버로부터 받은 respose 값 json파싱하기 
            console.log(http.responseText);
            var jsonObj = JSON.parse(http.responseText); 
            
            var success = jsonObj.success;
            console.log(success)

            var json_array = jsonObj.login;
            console.log(json_array)

            for(var i=0; i<json_array.length; i++){ //배열 값 순차적으로 확인
				var jsonObject = JSON.parse(JSON.stringify(json_array[i])); //각 배열에 있는 jsonObject 참조
				console.log("[parsing] : [user_id] : " + jsonObject.user_id);
				console.log("[parsing] : [state] : " + jsonObject.state);
				console.log("[parsing] : [email] : " + jsonObject.email);			
			}
            
            //로그인 성공시 
            if(success){
                console.log('로그인 성공')
                //세션 저장 
                //메인 화면으로 이동 
                window.location.replace('main')
                //
            }


    }
}

