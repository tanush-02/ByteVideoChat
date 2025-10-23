import React, { useEffect, useRef, useState } from 'react'
import io from "socket.io-client";
import { Badge, IconButton, TextField } from '@mui/material';
import { Button } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff'
import styles from "../styles/videoComponent.module.css";
import CallEndIcon from '@mui/icons-material/CallEnd'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare'
import ChatIcon from '@mui/icons-material/Chat'
import server from '../environment';

const server_url = server;

var connections = {};

const peerConfigConnections = {
    "iceServers": [
        { "urls": "stun:stun.l.google.com:19302" }
    ]
}

export default function VideoMeetComponent() {

    var socketRef = useRef();
    let socketIdRef = useRef();

    let localVideoref = useRef();

    let [videoAvailable, setVideoAvailable] = useState(true);

    let [audioAvailable, setAudioAvailable] = useState(true);

    let [video, setVideo] = useState([]);

    let [audio, setAudio] = useState();

    let [screen, setScreen] = useState();

    let [showModal, setModal] = useState(true);

    let [screenAvailable, setScreenAvailable] = useState();

    let [messages, setMessages] = useState([])

    let [message, setMessage] = useState("");

    let [newMessages, setNewMessages] = useState(3);

    let [askForUsername, setAskForUsername] = useState(true);

    let [username, setUsername] = useState("");

    const videoRef = useRef([])

    let [videos, setVideos] = useState([])

    // TODO
    // if(isChrome() === false) {


    // }

    useEffect(() => {
        console.log("HELLO")
        getPermissions();

    })

    let getDislayMedia = () => {
        if (screen) {
            if (navigator.mediaDevices.getDisplayMedia) {
                navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                    .then(getDislayMediaSuccess)
                    .then((stream) => { })
                    .catch((e) => console.log(e))
            }
        }
    }

    const getPermissions = async () => {
        try {
            const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoPermission) {
                setVideoAvailable(true);
                console.log('Video permission granted');
            } else {
                setVideoAvailable(false);
                console.log('Video permission denied');
            }

            const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (audioPermission) {
                setAudioAvailable(true);
                console.log('Audio permission granted');
            } else {
                setAudioAvailable(false);
                console.log('Audio permission denied');
            }

            if (navigator.mediaDevices.getDisplayMedia) {
                setScreenAvailable(true);
            } else {
                setScreenAvailable(false);
            }

            if (videoAvailable || audioAvailable) {
                const userMediaStream = await navigator.mediaDevices.getUserMedia({ video: videoAvailable, audio: audioAvailable });
                if (userMediaStream) {
                    window.localStream = userMediaStream;
                    if (localVideoref.current) {
                        localVideoref.current.srcObject = userMediaStream;
                    }
                }
            }
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        if (video !== undefined && audio !== undefined) {
            getUserMedia();
            console.log("SET STATE HAS ", video, audio);

        }


    }, [video, audio])
    let getMedia = () => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        connectToSocketServer();

    }




    let getUserMediaSuccess = (stream) => {
        try {
            if (window.localStream) {
                window.localStream.getTracks().forEach(track => track.stop())
            }
        } catch (e) { console.log(e) }

        window.localStream = stream
        localVideoref.current.srcObject = stream

        // Update video and audio state based on actual track availability
        const videoTracks = stream.getVideoTracks();
        const audioTracks = stream.getAudioTracks();
        
        setVideo(videoTracks.length > 0 && videoTracks[0].enabled);
        setAudio(audioTracks.length > 0 && audioTracks[0].enabled);

        for (let id in connections) {
            if (id === socketIdRef.current) continue

            connections[id].addStream(window.localStream)

            connections[id].createOffer().then((description) => {
                console.log(description)
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                    })
                    .catch(e => console.log(e))
            })
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setVideo(false);
            setAudio(false);

            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { console.log(e) }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()])
            window.localStream = blackSilence()
            localVideoref.current.srcObject = window.localStream

            for (let id in connections) {
                connections[id].addStream(window.localStream)

                connections[id].createOffer().then((description) => {
                    connections[id].setLocalDescription(description)
                        .then(() => {
                            socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                        })
                        .catch(e => console.log(e))
                })
            }
        })
    }

    let getUserMedia = () => {
        // Determine what media to request based on current state
        const requestVideo = video && videoAvailable;
        const requestAudio = audio && audioAvailable;
        
        if (requestVideo || requestAudio) {
            navigator.mediaDevices.getUserMedia({ 
                video: requestVideo, 
                audio: requestAudio 
            })
                .then(getUserMediaSuccess)
                .then((stream) => { })
                .catch((e) => {
                    console.log('Error getting user media:', e);
                    // If we can't get the requested media, create a black/silence stream
                    let blackSilence = (...args) => new MediaStream([black(...args), silence()])
                    window.localStream = blackSilence()
                    localVideoref.current.srcObject = window.localStream
                })
        } else {
            // If both video and audio are off, create a black/silence stream
            try {
                if (window.localStream) {
                    let tracks = window.localStream.getTracks()
                    tracks.forEach(track => track.stop())
                }
                let blackSilence = (...args) => new MediaStream([black(...args), silence()])
                window.localStream = blackSilence()
                localVideoref.current.srcObject = window.localStream
            } catch (e) { 
                console.log('Error creating black stream:', e);
            }
        }
    }





    let getDislayMediaSuccess = (stream) => {
        console.log("Screen sharing started")
        try {
            if (window.localStream) {
                window.localStream.getTracks().forEach(track => track.stop())
            }
        } catch (e) { console.log(e) }

        window.localStream = stream
        localVideoref.current.srcObject = stream

        // Update states for screen sharing
        setScreen(true);
        setVideo(true); // Screen share includes video

        for (let id in connections) {
            if (id === socketIdRef.current) continue

            connections[id].addStream(window.localStream)

            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                    })
                    .catch(e => console.log(e))
            })
        }

        stream.getTracks().forEach(track => track.onended = () => {
            console.log("Screen sharing ended by user")
            setScreen(false)
            setVideo(false)

            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { console.log(e) }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()])
            window.localStream = blackSilence()
            localVideoref.current.srcObject = window.localStream

            // Return to camera/mic based on current audio state
            getUserMedia()
        })
    }

    let gotMessageFromServer = (fromId, message) => {
        var signal = JSON.parse(message)

        if (fromId !== socketIdRef.current) {
            if (signal.sdp) {
                connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                    if (signal.sdp.type === 'offer') {
                        connections[fromId].createAnswer().then((description) => {
                            connections[fromId].setLocalDescription(description).then(() => {
                                socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': connections[fromId].localDescription }))
                            }).catch(e => console.log(e))
                        }).catch(e => console.log(e))
                    }
                }).catch(e => console.log(e))
            }

            if (signal.ice) {
                connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e))
            }
        }
    }




    let connectToSocketServer = () => {
        socketRef.current = io.connect(server_url, { secure: false })

        socketRef.current.on('signal', gotMessageFromServer)

        socketRef.current.on('connect', () => {
            socketRef.current.emit('join-call', window.location.href)
            socketIdRef.current = socketRef.current.id

            socketRef.current.on('chat-message', addMessage)

            socketRef.current.on('user-left', (id) => {
                setVideos((videos) => videos.filter((video) => video.socketId !== id))
            })

            socketRef.current.on('user-joined', (id, clients) => {
                clients.forEach((socketListId) => {

                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections)
                    // Wait for their ice candidate       
                    connections[socketListId].onicecandidate = function (event) {
                        if (event.candidate != null) {
                            socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }))
                        }
                    }

                    // Wait for their video stream
                    connections[socketListId].onaddstream = (event) => {
                        console.log("BEFORE:", videoRef.current);
                        console.log("FINDING ID: ", socketListId);

                        let videoExists = videoRef.current.find(video => video.socketId === socketListId);

                        if (videoExists) {
                            console.log("FOUND EXISTING");

                            // Update the stream of the existing video
                            setVideos(videos => {
                                const updatedVideos = videos.map(video =>
                                    video.socketId === socketListId ? { ...video, stream: event.stream } : video
                                );
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        } else {
                            // Create a new video
                            console.log("CREATING NEW");
                            let newVideo = {
                                socketId: socketListId,
                                stream: event.stream,
                                autoplay: true,
                                playsinline: true
                            };

                            setVideos(videos => {
                                const updatedVideos = [...videos, newVideo];
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        }
                    };


                    // Add the local video stream
                    if (window.localStream !== undefined && window.localStream !== null) {
                        connections[socketListId].addStream(window.localStream)
                    } else {
                        let blackSilence = (...args) => new MediaStream([black(...args), silence()])
                        window.localStream = blackSilence()
                        connections[socketListId].addStream(window.localStream)
                    }
                })

                if (id === socketIdRef.current) {
                    for (let id2 in connections) {
                        if (id2 === socketIdRef.current) continue

                        try {
                            connections[id2].addStream(window.localStream)
                        } catch (e) { }

                        connections[id2].createOffer().then((description) => {
                            connections[id2].setLocalDescription(description)
                                .then(() => {
                                    socketRef.current.emit('signal', id2, JSON.stringify({ 'sdp': connections[id2].localDescription }))
                                })
                                .catch(e => console.log(e))
                        })
                    }
                }
            })
        })
    }

    let silence = () => {
        let ctx = new AudioContext()
        let oscillator = ctx.createOscillator()
        let dst = oscillator.connect(ctx.createMediaStreamDestination())
        oscillator.start()
        ctx.resume()
        return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false })
    }
    let black = ({ width = 640, height = 480 } = {}) => {
        let canvas = Object.assign(document.createElement("canvas"), { width, height })
        canvas.getContext('2d').fillRect(0, 0, width, height)
        let stream = canvas.captureStream()
        return Object.assign(stream.getVideoTracks()[0], { enabled: false })
    }

    let handleVideo = () => {
        const newVideoState = !video;
        setVideo(newVideoState);
        
        if (window.localStream) {
            // If turning off video, stop all video tracks completely
            if (!newVideoState) {
                const videoTracks = window.localStream.getVideoTracks();
                videoTracks.forEach(track => {
                    track.stop(); // Completely stop the track
                });
                
                // Create a new stream with only audio (if audio is on) or black video
                let newStream;
                if (audio) {
                    // Keep audio, add black video
                    const audioTracks = window.localStream.getAudioTracks();
                    newStream = new MediaStream([...audioTracks, black()]);
                } else {
                    // No audio, just black video
                    newStream = new MediaStream([black()]);
                }
                
                window.localStream = newStream;
                localVideoref.current.srcObject = newStream;
                
                // Update all connections with the new stream
                for (let id in connections) {
                    if (id === socketIdRef.current) continue
                    connections[id].addStream(window.localStream)
                    connections[id].createOffer().then((description) => {
                        connections[id].setLocalDescription(description)
                            .then(() => {
                                socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                            })
                            .catch(e => console.log(e))
                    })
                }
            } else {
                // If turning on video, get fresh camera stream
                getUserMedia()
            }
        }
    }
    
    let handleAudio = () => {
        const newAudioState = !audio;
        setAudio(newAudioState);
        
        if (window.localStream) {
            // If turning off audio, stop all audio tracks completely
            if (!newAudioState) {
                const audioTracks = window.localStream.getAudioTracks();
                audioTracks.forEach(track => {
                    track.stop(); // Completely stop the track
                });
                
                // Create a new stream with only video (if video is on) or silence
                let newStream;
                if (video) {
                    // Keep video, add silence
                    const videoTracks = window.localStream.getVideoTracks();
                    newStream = new MediaStream([...videoTracks, silence()]);
                } else {
                    // No video, just silence
                    newStream = new MediaStream([silence()]);
                }
                
                window.localStream = newStream;
                localVideoref.current.srcObject = newStream;
                
                // Update all connections with the new stream
                for (let id in connections) {
                    if (id === socketIdRef.current) continue
                    connections[id].addStream(window.localStream)
                    connections[id].createOffer().then((description) => {
                        connections[id].setLocalDescription(description)
                            .then(() => {
                                socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                            })
                            .catch(e => console.log(e))
                    })
                }
            } else {
                // If turning on audio, get fresh camera stream
                getUserMedia()
            }
        }
    }

    useEffect(() => {
        if (screen !== undefined) {
            getDislayMedia();
        }
    }, [screen])
    let handleScreen = () => {
        const newScreenState = !screen;
        setScreen(newScreenState);
        
        if (newScreenState) {
            // Start screen sharing
            if (navigator.mediaDevices.getDisplayMedia) {
                navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                    .then(getDislayMediaSuccess)
                    .catch((e) => {
                        console.log('Screen sharing error:', e);
                        setScreen(false); // Reset state if failed
                    });
            }
        } else {
            // Stop screen sharing and return to camera
            try {
                if (window.localStream) {
                    window.localStream.getTracks().forEach(track => track.stop());
                }
                // Get back to camera/mic
                getUserMedia();
            } catch (e) {
                console.log('Error stopping screen share:', e);
            }
        }
    }

    let handleEndCall = () => {
        try {
            let tracks = localVideoref.current.srcObject.getTracks()
            tracks.forEach(track => track.stop())
        } catch (e) { }
        window.location.href = "/"
    }

    let openChat = () => {
        setModal(true);
        setNewMessages(0);
    }
    let closeChat = () => {
        setModal(false);
    }
    let handleMessage = (e) => {
        setMessage(e.target.value);
    }

    const addMessage = (data, sender, socketIdSender) => {
        setMessages((prevMessages) => [
            ...prevMessages,
            { sender: sender, data: data }
        ]);
        if (socketIdSender !== socketIdRef.current) {
            setNewMessages((prevNewMessages) => prevNewMessages + 1);
        }
    };



    let sendMessage = () => {
        console.log(socketRef.current);
        socketRef.current.emit('chat-message', message, username)
        setMessage("");

        // this.setState({ message: "", sender: username })
    }

    
    let connect = () => {
        setAskForUsername(false);
        getMedia();
    }


    return (
        <div className="videoMeetContainer">
            {/* Background */}
            <div className="videoBackground">
                <div className="videoGradient"></div>
                <div className="videoPattern"></div>
            </div>

            {askForUsername === true ? (
                <div className="lobbyContainer">
                    <div className="lobbyCard">
                        <div className="lobbyHeader">
                            <div className="lobbyIcon">🎥</div>
                            <h2>Enter Meeting Lobby</h2>
                            <p>Enter your name to join the video call</p>
                        </div>
                        
                        <div className="lobbyForm">
                            <div className="inputGroup">
                                <label htmlFor="username">Your Name</label>
                                <input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    placeholder="Enter your display name"
                                    className="lobbyInput"
                                />
                            </div>
                            
                            <button 
                                className="lobbyButton"
                                onClick={connect}
                                disabled={!username.trim()}
                            >
                                <span>Join Meeting</span>
                                <span className="buttonIcon">→</span>
                            </button>
                        </div>

                        <div className="lobbyPreview">
                            <div className="previewVideo">
                                <video ref={localVideoref} autoPlay muted></video>
                                <div className="previewOverlay">
                                    <span>Preview</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="meetingContainer">
                    {/* Chat Modal */}
                    {showModal && (
                        <div className="chatModal">
                            <div className="chatContainer">
                                <div className="chatHeader">
                                    <h3>Chat</h3>
                                    <button 
                                        className="closeChatButton"
                                        onClick={closeChat}
                                    >
                                        ✕
                                    </button>
                                </div>
                                
                                <div className="chatMessages">
                                    {messages.length !== 0 ? (
                                        messages.map((item, index) => (
                                            <div key={index} className="messageItem">
                                                <div className="messageSender">{item.sender}</div>
                                                <div className="messageContent">{item.data}</div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="noMessages">
                                            <span>No messages yet</span>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="chatInput">
                                    <input
                                        type="text"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Type your message..."
                                        className="messageInput"
                                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                    />
                                    <button 
                                        className="sendButton"
                                        onClick={sendMessage}
                                        disabled={!message.trim()}
                                    >
                                        Send
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Video Grid */}
                    <div className="videoGrid">
                        <div className="localVideo">
                            <video ref={localVideoref} autoPlay muted></video>
                            <div className="videoLabel">You</div>
                        </div>
                        
                        {videos.map((video) => (
                            <div key={video.socketId} className="remoteVideo">
                                <video
                                    data-socket={video.socketId}
                                    ref={ref => {
                                        if (ref && video.stream) {
                                            ref.srcObject = video.stream;
                                        }
                                    }}
                                    autoPlay
                                />
                                <div className="videoLabel">Participant</div>
                            </div>
                        ))}
                    </div>

                    {/* Control Bar */}
                    <div className="controlBar">
                        <div className="controlGroup">
                            <button 
                                className={`controlButton ${video ? 'active' : 'inactive'}`}
                                onClick={handleVideo}
                            >
                                <span className="controlIcon">
                                    {video ? '📹' : '📷'}
                                </span>
                                <span className="controlLabel">
                                    {video ? 'Camera On' : 'Camera Off'}
                                </span>
                            </button>
                            
                            <button 
                                className={`controlButton ${audio ? 'active' : 'inactive'}`}
                                onClick={handleAudio}
                            >
                                <span className="controlIcon">
                                    {audio ? '🎤' : '🎙️'}
                                </span>
                                <span className="controlLabel">
                                    {audio ? 'Mic On' : 'Mic Off'}
                                </span>
                            </button>

                            {screenAvailable && (
                                <button 
                                    className={`controlButton ${screen ? 'active' : 'inactive'}`}
                                    onClick={handleScreen}
                                >
                                    <span className="controlIcon">
                                        {screen ? '🛑' : '🖥️'}
                                    </span>
                                    <span className="controlLabel">
                                        {screen ? 'Stop Share' : 'Share Screen'}
                                    </span>
                                </button>
                            )}

                            <button 
                                className="controlButton chatButton"
                                onClick={() => setModal(!showModal)}
                            >
                                <span className="controlIcon">💬</span>
                                <span className="controlLabel">Chat</span>
                                {newMessages > 0 && (
                                    <span className="messageBadge">{newMessages}</span>
                                )}
                            </button>
                        </div>

                        <button 
                            className="endCallButton"
                            onClick={handleEndCall}
                        >
                            <span className="controlIcon">📞</span>
                            <span className="controlLabel">End Call</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
