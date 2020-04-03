/**
 * Created by Administrator on 2019/5/12.
 */
var name,connectedUser;
var connection = new WebSocket('ws://localhost:8888');

var loginPage = document.querySelector('#login-page'),
    usernameInput = document.querySelector('#username'),
    loginButton = document.querySelector('#login'),
    callPage = document.querySelector('#call-page'),
    theirUsernameInput = document.querySelector('#their-username'),
    callButton = document.querySelector('#call'),
    hangUpButton = document.querySelector('#hang-up');
    messageInput = document.querySelector('#message'),
    sendButton = document.querySelector('#send'),
    received = document.querySelector('#received');

callPage.style.display = "none";

//点击按钮登录
loginButton.addEventListener("click",function (event) {
    name = usernameInput.value;
    if(name.length > 0){
        send({type:"login","name":name});
    }
});

//点击发起通话
callButton.addEventListener("click",function (event) {
    var theirUsername = theirUsernameInput.value;
    if(theirUsername.length > 0){
        startPeerConnection(theirUsername);
    }
});


//挂断
hangUpButton.addEventListener("click", function () {
    send({
        type: "leave"
    });

    onLeave();
});

//发送文字消息
sendButton.addEventListener("click", function (event) {
    var val = messageInput.value;
    received.innerHTML += +"我："+ val + "<br />";
    received.scrollTop = received.scrollHeight;
    dataChannel.send(val)
    // console.log();

    // channel.postMessage(val);
    // channel.send(val);
});

connection.onopen = function () { console.log("connected") }

connection.onmessage = function (message) {
    // console.log("get message:",message.data);

    var data = JSON.parse(message.data)

    switch (data.type){
        case "login":
            onLogin(data.success);
            break;
        case "offer":
            onOffer(data.offer, data.name);
            break;
        case "answer":
            onAnswer(data.answer);
            break;
        case "candidate":
            onCandidate(data.candidate);
            break;
        case "leave":
            onLeave();
            break;
        default:
            break;
    }
}

function onLogin(suceess) {
    if(suceess === false){
        alert("Login unsuccessful, please try a different name.");
    }else{
        loginPage.style.display = "none";
        callPage.style.display = "block";

        // 准备好通话通道
        startConnection();
    }
}

function onLeave() {
    connectedUser = null;
    theirVideo,src = null;
    yourConnection.close();
    yourConnection.onicecandidate = null;
    yourConnection.onaddstream = null;
    setupPeerConnection(stream);
}

var yourVideo = document.querySelector('#yours'),
    theirVideo = document.querySelector('#theirs'),
    yourConnection, connectedUser, stream,dataChannel,channel;

function startConnection() {
    if (hasUserMedia()) {
        navigator.getUserMedia({ video: true, audio: false }, function (myStream) {
            stream = myStream;
            yourVideo.src = window.URL.createObjectURL(stream);

            if (hasRTCPeerConnection()) {
                setupPeerConnection(stream);
            } else {
                alert("Sorry, your browser does not support WebRTC.");
            }
        }, function (error) {
            console.log(error);
        });
    } else {
        alert("Sorry, your browser does not support WebRTC.");
    }
}

function setupPeerConnection(stream) {
    var configuration = {
        "iceServers": [{ "url": "stun:127.0.0.1:9876" }]
    };
    yourConnection = new RTCPeerConnection(configuration);

    // Setup stream listening
    yourConnection.addStream(stream);
    yourConnection.onaddstream = function (e) {
        theirVideo.src = window.URL.createObjectURL(e.stream);
    };

    // Setup ice handling
    yourConnection.onicecandidate = function (event) {
        // console.log("yourConnection onicecandidate")
        if (event.candidate) {
            send({
                type: "candidate",
                candidate: event.candidate
            });
        }
    };
    //创建数据通道
    openDataChannel();

}

function startPeerConnection(username) {
    connectedUser = username;

    // Begin the offer
    yourConnection.createOffer(function (offer) {
        console.log("yourConnection createOffer")
        send({
            type: "offer",
            offer: offer
        });
        yourConnection.setLocalDescription(offer);
    }, function (error) {
        alert("An error has occurred.");
    });


}

function onOffer(offer,username) {
    connectedUser = username;

    onDataChannel();

    yourConnection.setRemoteDescription(new RTCSessionDescription(offer));

    yourConnection.createAnswer(function (answer) {
        // console.log("yourConnection createAnswer")
        yourConnection.setLocalDescription(answer);
        send({
            type: "answer",
            answer: answer
        });
    },function (err) {
        alert("An error has cocurred in cteateAnswer:",err)
    })


}

function onAnswer(answer) {

    // console.log("onAnswer")
    yourConnection.setRemoteDescription(new RTCSessionDescription(answer));


    onDataChannel();
};

function onCandidate(candidate) {
    // console.log("onCandidate")
    yourConnection.addIceCandidate(new RTCIceCandidate(candidate));
};

function send(message) {
    if (connectedUser) {
        message.name = connectedUser;
    }
    connection.send(JSON.stringify(message));
};

function hasUserMedia() {
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
    return !!navigator.getUserMedia;
};

function hasRTCPeerConnection() {
    window.RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
    window.RTCSessionDescription = window.RTCSessionDescription || window.webkitRTCSessionDescription || window.mozRTCSessionDescription;
    window.RTCIceCandidate = window.RTCIceCandidate || window.webkitRTCIceCandidate || window.mozRTCIceCandidate;
    return !!window.RTCPeerConnection;
};

function openDataChannel() {

    dataChannel = yourConnection.createDataChannel('myLabel');
    
}

function onDataChannel()
{
    yourConnection.ondatachannel = function (event) {
        console.log(event)
        var channel =event.channel
        channel.onerror = function (error) {
            console.log("Data Channel Error:", error);
        };
        channel.onopen = function () {
            console.log('dataChannel onopen')
            channel.send(name + " has connected.");
        };
        channel.onmessage = function (event) {
            console.log('dataChannel onmessage onDataChannel')
            console.log("Got Data Channel Message:", event.data);
            received.innerHTML += event.data + "<br />";
            received.scrollTop = received.scrollHeight;

        };
        channel.onclose = function () {
            console.log("The Data Channel is Closed");
        };
    }
}
