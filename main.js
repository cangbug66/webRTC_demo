function hasUserMedia() {
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
    return !!navigator.getUserMedia;
}

function getUserMedia() {
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia || navigator.msGetUserMedia;
    return navigator.getUserMedia;
}

function hasRTCPeerConnection() {
    window.RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
    return !!window.RTCPeerConnection;
}

var yourVideo = document.querySelector('#yours'),
    theirVideo = document.querySelector('#theirs'),
    yourConnection, theirConnection;

if (hasUserMedia() && (navigator.getUserMedia=getUserMedia())) {
    navigator.getUserMedia({ video: true, audio: false }, function (stream) {

        yourVideo.src = window.URL.createObjectURL(stream);
        // theirVideo.src = window.URL.createObjectURL(stream);

        if (hasRTCPeerConnection()) {
            startPeerConnection(stream);
        } else {
            alert("Sorry, your browser does not support WebRTC.");
        }
    }, function (error) {
        console.log(error);
    });
} else {
    alert("Sorry, your browser does not support WebRTC.");
}

function startPeerConnection(stream) {

    var configuration = {
        // "iceServers": [{ "url": "stun:127.0.0.1:9876" }]
    };
    var RTC = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
    // console.log(RTC)
    yourConnection = new RTC();
    theirConnection = new RTC();
    // console.log(yourConnection)
    // console.log(theirConnection)
    // console.log('stream',stream)
    // Setup stream listening

    theirConnection.onaddstream = function (e) {
    	console.log('their_onaddstream',e)
        theirVideo.src = window.URL.createObjectURL(e.stream);
    };
    console.log(yourConnection)
    // yourConnection.onaddstream=function (e) {
    //     console.log('your_onaddstream',e)
    //     // yourVideo.src = window.URL.createObjectURL(e.stream);
    // };
    yourConnection.addStream(stream);


    // console.log(yourConnection)
    // Setup ice handling
    yourConnection.onicecandidate = function (event) {
    	console.log('yourConnection_onicecandidate',event)
        if (event.candidate) {
            theirConnection.addIceCandidate(new RTCIceCandidate(event.candidate));
        }
    };

    theirConnection.onicecandidate = function (event) {
        console.log('theirConnection_onicecandidate',event)
        if (event.candidate) {
            yourConnection.addIceCandidate(new RTCIceCandidate(event.candidate));
        }
    };

    // Begin the offer
    yourConnection.createOffer(function(offer) {
    	console.log('offer')
        yourConnection.setLocalDescription(offer);
        theirConnection.setRemoteDescription(offer);

        theirConnection.createAnswer(function(offer) {
        	console.log('theirConnection createAnswer offer')
            theirConnection.setLocalDescription(offer);
            yourConnection.setRemoteDescription(offer);
        },function (err) {
            console.log(err);
        });
    },function (err) {
		console.log(err);
    });
    // console.log(yourConnection)
};
