import React, { useEffect, useRef, useState } from 'react'
import io from "socket.io-client";
import { Badge, IconButton, TextField, Box, Paper, Typography, Avatar } from '@mui/material';
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
import CloseIcon from '@mui/icons-material/Close'
import SendIcon from '@mui/icons-material/Send'
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

    // Fix: Changed from array to boolean
    let [video, setVideo] = useState(true);
    let [audio, setAudio] = useState(true);

    let [screen, setScreen] = useState(false);

    let [showModal, setModal] = useState(false);
    let [screenAvailable, setScreenAvailable] = useState(false);

    let [messages, setMessages] = useState([])
    let [message, setMessage] = useState("");
    let [newMessages, setNewMessages] = useState(0);

    let [askForUsername, setAskForUsername] = useState(true);
    let [username, setUsername] = useState("");

    const videoRef = useRef([])
    let [videos, setVideos] = useState([])

    // Fix: Added dependency array to prevent infinite loop
    useEffect(() => {
        getPermissions();
        return () => {
            // Cleanup on unmount
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
            if (window.localStream) {
                window.localStream.getTracks().forEach(track => track.stop());
            }
            Object.keys(connections).forEach(id => {
                if (connections[id]) {
                    connections[id].close();
                }
            });
        };
    }, []);

    let getDisplayMedia = () => {
        if (screen) {
            if (navigator.mediaDevices.getDisplayMedia) {
                navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                    .then(getDisplayMediaSuccess)
                    .catch((e) => {
                        console.error("Error getting display media:", e);
                        setScreen(false);
                    })
            }
        } else {
            // Stop screen share and return to camera
            if (window.localStream) {
                window.localStream.getTracks().forEach(track => {
                    if (track.kind === 'video' && track.label.includes('screen')) {
                        track.stop();
                    }
                });
            }
            getUserMedia();
        }
    }

    const getPermissions = async () => {
        try {
            const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoPermission) {
                setVideoAvailable(true);
                console.log('Video permission granted');
                videoPermission.getTracks().forEach(track => track.stop());
            } else {
                setVideoAvailable(false);
                console.log('Video permission denied');
            }

            const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (audioPermission) {
                setAudioAvailable(true);
                console.log('Audio permission granted');
                audioPermission.getTracks().forEach(track => track.stop());
            } else {
                setAudioAvailable(false);
                console.log('Audio permission denied');
            }

            if (navigator.mediaDevices.getDisplayMedia) {
                setScreenAvailable(true);
            } else {
                setScreenAvailable(false);
            }
        } catch (error) {
            console.error("Error getting permissions:", error);
        }
    };

    useEffect(() => {
        if (video !== undefined && audio !== undefined && socketRef.current?.connected) {
            getUserMedia();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [video, audio])

    let getMedia = () => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        connectToSocketServer();
    }

    let getUserMediaSuccess = async (stream) => {
        try {
            if (window.localStream) {
                window.localStream.getTracks().forEach(track => track.stop())
            }
        } catch (e) { 
            console.error("Error stopping old stream:", e);
        }

        window.localStream = stream;
        if (localVideoref.current) {
            localVideoref.current.srcObject = stream;
        }

        // Update existing connections with new stream
        for (let id in connections) {
            if (id === socketIdRef.current) continue;

            try {
                // Remove old tracks
                const senders = connections[id].getSenders();
                senders.forEach(sender => {
                    if (sender.track) {
                        connections[id].removeTrack(sender);
                    }
                });

                // Add new tracks - Updated to use addTrack instead of deprecated addStream
                stream.getTracks().forEach(track => {
                    connections[id].addTrack(track, stream);
                });

                // Create and send new offer
                const description = await connections[id].createOffer();
                await connections[id].setLocalDescription(description);
                socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }));
            } catch (e) {
                console.error("Error updating connection:", e);
            }
        }

        stream.getTracks().forEach(track => {
            track.onended = async () => {
                setVideo(false);
                setAudio(false);

                try {
                    let tracks = localVideoref.current?.srcObject?.getTracks() || [];
                    tracks.forEach(track => track.stop())
                } catch (e) { 
                    console.error("Error stopping tracks:", e);
                }

                let blackSilence = new MediaStream([black(), silence()]);
                window.localStream = blackSilence;
                if (localVideoref.current) {
                    localVideoref.current.srcObject = window.localStream;
                }

                // Update peer connections
                for (let id in connections) {
                    try {
                        const senders = connections[id].getSenders();
                        senders.forEach(sender => {
                            if (sender.track) {
                                connections[id].removeTrack(sender);
                            }
                        });
                        blackSilence.getTracks().forEach(track => {
                            connections[id].addTrack(track, blackSilence);
                        });

                        const description = await connections[id].createOffer();
                        await connections[id].setLocalDescription(description);
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }));
                    } catch (e) {
                        console.error("Error updating connection on track end:", e);
                    }
                }
            };
        });
    }

    let getUserMedia = () => {
        if ((video && videoAvailable) || (audio && audioAvailable)) {
            navigator.mediaDevices.getUserMedia({ video: video && videoAvailable, audio: audio && audioAvailable })
                .then(getUserMediaSuccess)
                .catch((e) => {
                    console.error("Error getting user media:", e);
                    alert("Failed to access camera/microphone. Please check permissions.");
                })
        } else {
            // If both video and audio are off, create black/silence stream
            try {
                if (localVideoref.current?.srcObject) {
                    let tracks = localVideoref.current.srcObject.getTracks();
                    tracks.forEach(track => track.stop());
                }
                
                let blackSilence = new MediaStream([black(), silence()]);
                window.localStream = blackSilence;
                if (localVideoref.current) {
                    localVideoref.current.srcObject = window.localStream;
                }

                // Update all connections
                for (let id in connections) {
                    if (id === socketIdRef.current) continue;
                    try {
                        const senders = connections[id].getSenders();
                        senders.forEach(sender => {
                            if (sender.track) {
                                connections[id].removeTrack(sender);
                            }
                        });
                        blackSilence.getTracks().forEach(track => {
                            connections[id].addTrack(track, blackSilence);
                        });

                        connections[id].createOffer().then((description) => {
                            connections[id].setLocalDescription(description).then(() => {
                                socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }));
                            }).catch(e => console.error("Error setting local description:", e));
                        }).catch(e => console.error("Error creating offer:", e));
                    } catch (e) {
                        console.error("Error updating connection:", e);
                    }
                }
            } catch (e) {
                console.error("Error handling media off:", e);
            }
        }
    }

    let getDisplayMediaSuccess = async (stream) => {
        console.log("Screen share started");
        try {
            if (window.localStream) {
                window.localStream.getTracks().forEach(track => track.stop())
            }
        } catch (e) { 
            console.error("Error stopping old stream:", e);
        }

        window.localStream = stream;
        if (localVideoref.current) {
            localVideoref.current.srcObject = stream;
        }

        for (let id in connections) {
            if (id === socketIdRef.current) continue;

            try {
                const senders = connections[id].getSenders();
                senders.forEach(sender => {
                    if (sender.track) {
                        connections[id].removeTrack(sender);
                    }
                });

                stream.getTracks().forEach(track => {
                    connections[id].addTrack(track, stream);
                });

                const description = await connections[id].createOffer();
                await connections[id].setLocalDescription(description);
                socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }));
            } catch (e) {
                console.error("Error updating connection with screen share:", e);
            }
        }

        stream.getTracks().forEach(track => {
            track.onended = () => {
                setScreen(false);

                try {
                    if (localVideoref.current?.srcObject) {
                        let tracks = localVideoref.current.srcObject.getTracks();
                        tracks.forEach(track => track.stop());
                    }
                } catch (e) { 
                    console.error("Error stopping screen share:", e);
                }

                getUserMedia();
            };
        });
    }

    let gotMessageFromServer = (fromId, message) => {
        try {
            var signal = JSON.parse(message);

            if (fromId !== socketIdRef.current && connections[fromId]) {
                if (signal.sdp) {
                    connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                        if (signal.sdp.type === 'offer') {
                            connections[fromId].createAnswer().then((description) => {
                                connections[fromId].setLocalDescription(description).then(() => {
                                    socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': connections[fromId].localDescription }));
                                }).catch(e => console.error("Error setting local description:", e))
                            }).catch(e => console.error("Error creating answer:", e))
                        }
                    }).catch(e => console.error("Error setting remote description:", e))
                }

                if (signal.ice) {
                    connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.error("Error adding ICE candidate:", e))
                }
            }
        } catch (e) {
            console.error("Error processing signal:", e);
        }
    }

    let connectToSocketServer = () => {
        socketRef.current = io.connect(server_url, { 
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5
        });

        socketRef.current.on('signal', gotMessageFromServer);

        socketRef.current.on('connect', () => {
            socketRef.current.emit('join-call', window.location.href);
            socketIdRef.current = socketRef.current.id;

            socketRef.current.on('chat-message', addMessage);

            socketRef.current.on('user-left', (id) => {
                setVideos((videos) => videos.filter((video) => video.socketId !== id));
                if (connections[id]) {
                    connections[id].close();
                    delete connections[id];
                }
            });

            socketRef.current.on('user-joined', async (id, clients) => {
                clients.forEach((socketListId) => {
                    if (socketListId === socketIdRef.current || connections[socketListId]) {
                        return;
                    }

                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections);
                    
                    // Wait for their ice candidate       
                    connections[socketListId].onicecandidate = function (event) {
                        if (event.candidate != null && socketRef.current) {
                            socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }));
                        }
                    }

                    // Updated to use ontrack instead of deprecated onaddstream
                    connections[socketListId].ontrack = (event) => {
                        console.log("Received track from:", socketListId);
                        const stream = event.streams[0];

                        let videoExists = videoRef.current.find(video => video.socketId === socketListId);

                        if (videoExists) {
                            // Update the stream of the existing video
                            setVideos(videos => {
                                const updatedVideos = videos.map(video =>
                                    video.socketId === socketListId ? { ...video, stream: stream } : video
                                );
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        } else {
                            // Create a new video
                            let newVideo = {
                                socketId: socketListId,
                                stream: stream,
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

                    // Add the local video stream - Updated to use addTrack
                    if (window.localStream !== undefined && window.localStream !== null) {
                        window.localStream.getTracks().forEach(track => {
                            connections[socketListId].addTrack(track, window.localStream);
                        });
                    } else {
                        let blackSilence = new MediaStream([black(), silence()]);
                        window.localStream = blackSilence;
                        blackSilence.getTracks().forEach(track => {
                            connections[socketListId].addTrack(track, blackSilence);
                        });
                    }
                });

                if (id === socketIdRef.current) {
                    for (let id2 in connections) {
                        if (id2 === socketIdRef.current) continue;

                        try {
                            if (window.localStream) {
                                window.localStream.getTracks().forEach(track => {
                                    connections[id2].addTrack(track, window.localStream);
                                });
                            }
                        } catch (e) { 
                            console.error("Error adding stream to connection:", e);
                        }

                        connections[id2].createOffer().then((description) => {
                            connections[id2].setLocalDescription(description)
                                .then(() => {
                                    socketRef.current.emit('signal', id2, JSON.stringify({ 'sdp': connections[id2].localDescription }));
                                })
                                .catch(e => console.error("Error setting local description:", e))
                        }).catch(e => console.error("Error creating offer:", e))
                    }
                }
            });
        });

        socketRef.current.on('disconnect', () => {
            console.log("Disconnected from server");
        });

        socketRef.current.on('connect_error', (error) => {
            console.error("Connection error:", error);
            alert("Failed to connect to server. Please check your connection.");
        });
    }

    let silence = () => {
        let ctx = new AudioContext();
        let oscillator = ctx.createOscillator();
        let dst = oscillator.connect(ctx.createMediaStreamDestination());
        oscillator.start();
        ctx.resume();
        return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
    }

    let black = ({ width = 640, height = 480 } = {}) => {
        let canvas = Object.assign(document.createElement("canvas"), { width, height });
        let ctx = canvas.getContext('2d');
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);
        let stream = canvas.captureStream();
        return Object.assign(stream.getVideoTracks()[0], { enabled: false });
    }

    let handleVideo = () => {
        setVideo(!video);
    }

    let handleAudio = () => {
        setAudio(!audio);
    }

    useEffect(() => {
        if (screen !== undefined && socketRef.current?.connected) {
            getDisplayMedia();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [screen])

    let handleScreen = () => {
        setScreen(!screen);
    }

    let handleEndCall = () => {
        try {
            if (localVideoref.current?.srcObject) {
                let tracks = localVideoref.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            }
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
            Object.keys(connections).forEach(id => {
                if (connections[id]) {
                    connections[id].close();
                }
            });
        } catch (e) { 
            console.error("Error ending call:", e);
        }
        window.location.href = "/";
    }

    let openChat = () => {
        setModal(true);
        setNewMessages(0);
    }

    let closeChat = () => {
        setModal(false);
    }

    const addMessage = (data, sender, socketIdSender) => {
        setMessages((prevMessages) => [
            ...prevMessages,
            { sender: sender, data: data, timestamp: new Date() }
        ]);
        if (socketIdSender !== socketIdRef.current) {
            setNewMessages((prevNewMessages) => prevNewMessages + 1);
        }
    };

    let sendMessage = (e) => {
        e?.preventDefault();
        if (message.trim() && socketRef.current && username) {
            socketRef.current.emit('chat-message', message, username);
            setMessage("");
        }
    }

    let connect = () => {
        if (!username.trim()) {
            alert("Please enter a username");
            return;
        }
        setAskForUsername(false);
        getMedia();
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            sendMessage(e);
        }
    };

    return (
        <div className={styles.mainContainer}>
            {askForUsername === true ? (
                <Box className={styles.lobbyContainer}>
                    <Paper elevation={10} className={styles.lobbyPaper}>
                        <Typography variant="h4" gutterBottom className={styles.lobbyTitle}>
                            Join Meeting
                        </Typography>
                        <Typography variant="body1" color="textSecondary" gutterBottom>
                            Enter your name to join the video call
                        </Typography>
                        <Box className={styles.lobbyForm}>
                            <TextField 
                                id="username-input" 
                                label="Your Name" 
                                value={username} 
                                onChange={e => setUsername(e.target.value)}
                                variant="outlined" 
                                fullWidth
                                onKeyPress={(e) => e.key === 'Enter' && connect()}
                                autoFocus
                                className={styles.usernameInput}
                            />
                            <Button 
                                variant="contained" 
                                onClick={connect}
                                size="large"
                                className={styles.connectButton}
                                disabled={!username.trim()}
                            >
                                Join Meeting
                            </Button>
                        </Box>
                        <Box className={styles.previewVideo}>
                            <video 
                                ref={localVideoref} 
                                autoPlay 
                                muted 
                                playsInline
                                className={styles.previewVideoElement}
                            />
                        </Box>
                    </Paper>
                </Box>
            ) : (
                <div className={styles.meetVideoContainer}>
                    {showModal && (
                        <div className={styles.chatRoom}>
                            <div className={styles.chatContainer}>
                                <Box className={styles.chatHeader}>
                                    <Typography variant="h6">Chat</Typography>
                                    <IconButton onClick={closeChat} size="small">
                                        <CloseIcon />
                                    </IconButton>
                                </Box>

                                <div className={styles.chattingDisplay}>
                                    {messages.length !== 0 ? (
                                        messages.map((item, index) => (
                                            <div className={styles.messageItem} key={index}>
                                                <Box className={styles.messageHeader}>
                                                    <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                                                        {item.sender?.[0]?.toUpperCase() || 'U'}
                                                    </Avatar>
                                                    <Typography variant="subtitle2" className={styles.messageSender}>
                                                        {item.sender}
                                                    </Typography>
                                                </Box>
                                                <Typography variant="body2" className={styles.messageText}>
                                                    {item.data}
                                                </Typography>
                                            </div>
                                        ))
                                    ) : (
                                        <Typography variant="body2" color="textSecondary" className={styles.noMessages}>
                                            No messages yet. Start the conversation!
                                        </Typography>
                                    )}
                                </div>

                                <div className={styles.chattingArea}>
                                    <TextField 
                                        value={message} 
                                        onChange={(e) => setMessage(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        id="chat-input" 
                                        label="Type a message..." 
                                        variant="outlined" 
                                        fullWidth
                                        size="small"
                                        className={styles.chatInput}
                                    />
                                    <IconButton 
                                        onClick={sendMessage} 
                                        color="primary"
                                        disabled={!message.trim()}
                                        className={styles.sendButton}
                                    >
                                        <SendIcon />
                                    </IconButton>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className={styles.buttonContainers}>
                        <IconButton 
                            onClick={handleVideo} 
                            className={`${styles.controlButton} ${!video ? styles.controlButtonInactive : ''}`}
                            title={video ? "Turn off camera" : "Turn on camera"}
                        >
                            {video ? <VideocamIcon /> : <VideocamOffIcon />}
                        </IconButton>
                        <IconButton 
                            onClick={handleAudio} 
                            className={`${styles.controlButton} ${!audio ? styles.controlButtonInactive : ''}`}
                            title={audio ? "Mute microphone" : "Unmute microphone"}
                        >
                            {audio ? <MicIcon /> : <MicOffIcon />}
                        </IconButton>
                        {screenAvailable && (
                            <IconButton 
                                onClick={handleScreen} 
                                className={`${styles.controlButton} ${screen ? styles.controlButtonActive : ''}`}
                                title={screen ? "Stop sharing" : "Share screen"}
                            >
                                {screen ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                            </IconButton>
                        )}
                        <Badge badgeContent={newMessages} max={99} color='error'>
                            <IconButton 
                                onClick={() => {
                                    if (showModal) {
                                        closeChat();
                                    } else {
                                        openChat();
                                    }
                                }} 
                                className={styles.controlButton}
                                title="Toggle chat"
                            >
                                <ChatIcon />
                            </IconButton>
                        </Badge>
                        <IconButton 
                            onClick={handleEndCall} 
                            className={`${styles.controlButton} ${styles.endCallButton}`}
                            title="End call"
                        >
                            <CallEndIcon />
                        </IconButton>
                    </div>

                    <video 
                        className={styles.meetUserVideo} 
                        ref={localVideoref} 
                        autoPlay 
                        muted 
                        playsInline
                    />

                    <div className={styles.conferenceView}>
                        {videos.length === 0 && (
                            <Box className={styles.waitingMessage}>
                                <Typography variant="h6" color="textSecondary">
                                    Waiting for others to join...
                                </Typography>
                            </Box>
                        )}
                        {videos.map((video) => (
                            <div key={video.socketId} className={styles.remoteVideoContainer}>
                                <video
                                    data-socket={video.socketId}
                                    ref={ref => {
                                        if (ref && video.stream) {
                                            ref.srcObject = video.stream;
                                        }
                                    }}
                                    autoPlay
                                    playsInline
                                    className={styles.remoteVideo}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
