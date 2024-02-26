var something = document.getElementById('tri');
const pattern = trianglify({
    width: window.innerWidth,
    height: window.innerHeight,
    cellSize: 90,
    variance: 0.85,
    seed: null,
    strokeWidth: 0.5,
  })
something.appendChild(pattern.toCanvas());

var lastPeerId = null;
var peer = null;
var conn = null;
var local_stream;
var remote_stream;
var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
var recvIdInput = document.getElementById("receiver-id");
var messages = document.getElementById("messages");
var sendMessageBox = document.getElementById("sendMessageBox");
var sendButton = document.getElementById("sendButton");
var clearMsgsButton = document.getElementById("clearMsgsButton");
var connectButton = document.getElementById("connect-button");
var cueString = "<span class=\"cueMsg\">Cue: </span>";

function initialize() {
    peer = new Peer();

    peer.on('open', function (id) {
        if (peer.id === null) {
            console.log('Received null id from peer open');
            peer.id = lastPeerId;
        } else {
            lastPeerId = peer.id;
        }
        console.log('ID: ' + peer.id);
        getUserMedia({ video: true, audio: true }, (stream) => {
            local_stream = stream;
        }, (err) => {
            console.log(err)
        })
    });
    peer.on('connection', function (c) {
        c.on('open', function() {
            c.send("Sender does not accept incoming connections");
            setTimeout(function() { c.close(); }, 500);
        });
    });
    peer.on('disconnected', function () {
        console.log('Connection lost. Please reconnect');
        peer.id = lastPeerId;
        peer._lastServerId = lastPeerId;
        peer.reconnect();
    });
    peer.on('close', function() {
        conn = null;
        console.log('Connection destroyed');
    });
    peer.on('error', function (err) {
        console.log(err);
        alert('' + err);
    });
};

function join() {
    if (conn) {
        conn.close();
    }
    conn = peer.connect(recvIdInput.value, {
        reliable: true
    });
    conn.on('open', function () {
        console.log("Connected to: " + conn.peer);
        alert("Connected !!");
        var command = getUrlParam("command");
        if (command)
            conn.send(command);
    });
    conn.on('data', function (data) {
        addMessage("<span class=\"peerMsg\">Peer:</span> " + data);
    });
    conn.on('close', function () {
        console.log("Connection closed");
    });

    var call = peer.call(conn.peer, local_stream);
    call.on('stream', function(stream) {
        remote_stream = stream;
        setLocalStream(local_stream);
        setRemoteStream(remote_stream)
    })
};

function getUrlParam(name) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(window.location.href);
    if (results == null)
        return null;
    else
        return results[1];
};

function addMessage(msg) {
    var now = new Date();
    var h = now.getHours();
    var m = addZero(now.getMinutes());

    if (h > 12)
        h -= 12;
    else if (h === 0)
        h = 12;

    function addZero(t) {
        if (t < 10)
            t = "0" + t;
        return t;
    };

    messages.innerHTML = "<br><span class=\"msg-time\">" + "(" + h + ":" + m + "</span>) " + msg + messages.innerHTML;
};

function clearMessages() {
    messages.innerHTML = "";
    addMessage("Msgs cleared");
};

sendMessageBox.addEventListener('keypress', function (e) {
    var event = e || window.event;
    var char = event.which || event.keyCode;
    if (char == '13')
        sendButton.click();
});

sendButton.addEventListener('click', function () {
    if (conn && conn.open) {
        var msg = sendMessageBox.value;
        sendMessageBox.value = "";
        conn.send(msg);
        console.log("Sent: " + msg);
        addMessage("<span class=\"selfMsg\">Self: </span> " + msg);
    } else {
        console.log('Connection is closed');
    }
});

function setLocalStream(stream) {
    let video = document.getElementById("local-video");
    video.srcObject = stream;
    video.muted = true;
    video.play();
}

function setRemoteStream(stream) {
    let video = document.getElementById("remote-video");
    video.srcObject = stream;
    video.play();
}

clearMsgsButton.addEventListener('click', clearMessages);
connectButton.addEventListener('click', join);

initialize();