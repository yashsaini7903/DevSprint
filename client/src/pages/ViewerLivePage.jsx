import { useState, useCallback, useEffect, useRef } from 'react';
import { useSocket } from '../providers/Socket';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as mediasoupClient from 'mediasoup-client';
import { motion } from 'framer-motion';
import { MessageSquare, Users, VideoOff, Terminal, LogOut, Code, Zap, PlayCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const ViewerLivePage = () => {
    const { roomId } = useParams();
    const { user } = useAuth();
    const socket = useSocket();
    const navigate = useNavigate();
    const videoRef = useRef(null);
    const remoteStreamRef = useRef(null);
    const [viewerCount, setViewerCount] = useState(0);
    const [viewers, setViewers] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [isCreatorVideoOff, setIsCreatorVideoOff] = useState(false);
    const [isCreatorMuted, setIsCreatorMuted] = useState(false);
    const [needsInteraction, setNeedsInteraction] = useState(false);

    const deviceRef = useRef(null);
    const consumerTransportRef = useRef(null);
    const consumersRef = useRef([]);
    const pendingProducersRef = useRef([]);
    const isMounted = useRef(true);

    const consume = useCallback(async (producerId, kind) => {
        if (!socket || !isMounted.current || !consumerTransportRef.current || !deviceRef.current) {
            console.log(" [Client] Deferring consume: transport or device not ready");
            if (producerId) pendingProducersRef.current.push({ producerId, kind });
            return;
        }

        const transport = consumerTransportRef.current;
        const device = deviceRef.current;

        console.log(` [Client] Requesting to consume producerId=${producerId} kind=${kind}`);
        socket.emit('consume', { 
            rtpCapabilities: device.rtpCapabilities, 
            producerId, 
            kind,
            roomId 
        }, async (params) => {
            if (!isMounted.current || transport.closed) return;
            
            if (params.error) {
                console.error(" [Client] Consume error from server:", params.error);
                return;
            }

            console.log(` [Client] Server params received for kind=${params.kind}. Creating local consumer...`);
            try {
                const consumer = await transport.consume(params);
                consumersRef.current.push(consumer);
                const { track } = consumer;
                
                if (!remoteStreamRef.current) {
                    remoteStreamRef.current = new MediaStream();
                }
                
                // Add track to stream
                const existingTrack = remoteStreamRef.current.getTracks().find(t => t.kind === track.kind);
                if (existingTrack) {
                    remoteStreamRef.current.removeTrack(existingTrack);
                }
                
                remoteStreamRef.current.addTrack(track);
                console.log(` [Client] Track added to remoteStream: ${track.kind} (enabled: ${track.enabled}, state: ${track.readyState})`);

                // Only assign srcObject once. Subsequent tracks added to remoteStreamRef.current 
                // will automatically be detected by the video element.
                if (videoRef.current && !videoRef.current.srcObject) {
                    videoRef.current.srcObject = remoteStreamRef.current;
                    console.log(" [Client] Initialized video.srcObject");
                }
                
                // Ensure the video is playing. We catch errors (like autoplay blocks)
                // and show the "Click to Connect" button.
                if (videoRef.current && videoRef.current.paused) {
                    videoRef.current.play().catch(e => {
                        if (e.name !== 'AbortError') {
                            console.warn(" [Client] Autoplay blocked:", e);
                            setNeedsInteraction(true);
                        }
                    });
                }
                
                socket.emit('resume', { kind: consumer.kind, roomId });
                console.log(` [Client] Requested resume for kind=${consumer.kind}`);
            } catch (err) {
                console.error(" [Client] Local consume error:", err);
            }
        });
    }, [socket, roomId]);

    const connectToStream = useCallback(async () => {
        if (!socket || !isMounted.current) return;
        
        socket.emit('getRouterRtpCapabilities', async (rtpCapabilities) => {
            if (!isMounted.current) return;
            try {
                const device = new mediasoupClient.Device();
                await device.load({ routerRtpCapabilities: rtpCapabilities });
                deviceRef.current = device;
                
                socket.emit('createConsumerTransport', async (params) => {
                    if (!isMounted.current) return;
                    if (params.error) return;
                    
                    const transport = device.createRecvTransport(params);
                    consumerTransportRef.current = transport;
                    
                    transport.on('connect', ({ dtlsParameters }, cb) => {
                        socket.emit('connectConsumerTransport', { dtlsParameters }, cb);
                    });
                    
                    setIsConnected(true);

                    while (pendingProducersRef.current.length > 0) {
                        const { producerId, kind } = pendingProducersRef.current.shift();
                        consume(producerId, kind);
                    }
                });
            } catch (err) { }
        });
    }, [socket, roomId, consume]);

    useEffect(() => {
        isMounted.current = true;
        if (socket && user && roomId) {
            socket.on('viewer-count', ({ count }) => setViewerCount(count));
            socket.on('viewers-update', ({ viewers }) => setViewers(viewers));
            socket.on('creator-muted', ({ muted }) => setIsCreatorMuted(muted));
            socket.on('creator-video-off', ({ videoOff }) => setIsCreatorVideoOff(videoOff));
            socket.on('room-ended', () => { if (isMounted.current) navigate('/dashboard'); });
            socket.on('new-producer', ({ producerId, kind }) => {
                consume(producerId, kind);
            });

            socket.emit('join-room', { roomId, userId: user._id, email: user.email });
            connectToStream();

            return () => {
                socket.emit('leave-room');
                isMounted.current = false;
                socket.off('viewer-count');
                socket.off('viewers-update');
                socket.off('creator-muted');
                socket.off('creator-video-off');
                socket.off('room-ended');
                socket.off('new-producer');
                if (consumerTransportRef.current) {
                    consumerTransportRef.current.close();
                    consumerTransportRef.current = null;
                }
                consumersRef.current.forEach(c => c.close());
                consumersRef.current = [];
            };
        }
    }, [socket, user, roomId, connectToStream, consume, navigate]);

    const handleInitialPlay = () => {
        if (videoRef.current) {
            videoRef.current.play()
                .then(() => setNeedsInteraction(false))
                .catch(err => toast.error("Could not start video. Try clicking again."));
        }
    };

    return (
        <div style={{ background: '#020617', minHeight: '100vh', display: 'flex', flexDirection: 'column', color: 'white', fontFamily: "'Inter', sans-serif" }}>
             <Toaster position="top-right" />
             
             {/* Participant Header */}
             <header style={{ 
                minHeight: '70px', background: '#0f172a', borderBottom: '1px solid rgba(255,255,255,0.05)', 
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', flexWrap: 'wrap', gap: '1rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: '#10b981', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800 }}>LIVE</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Terminal size={18} color="var(--primary)" />
                        <h2 style={{ fontSize: '1rem', margin: 0 }}>Session: <span style={{ color: 'var(--text-muted)' }}>{roomId}</span></h2>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        <Users size={16} /> {viewerCount} Coders
                    </div>
                    <button onClick={() => navigate('/dashboard')} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                        Exit
                    </button>
                </div>
            </header>

            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }} className="live-main-container">
                {/* Immersive Stream View */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem', position: 'relative', minHeight: '300px' }}>
                    <div style={{ 
                        flex: 1, background: '#000', borderRadius: '16px', position: 'relative', 
                        overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' 
                    }}>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            style={{ 
                                width: '100%', height: '100%', objectFit: 'contain',
                                filter: isCreatorVideoOff ? 'brightness(0)' : 'none',
                                transition: 'filter 0.5s ease'
                            }}
                        />
                        
                        {!isConnected && (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.9)' }}>
                                <div style={{ width: '40px', height: '40px', border: '3px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Joining...</p>
                            </div>
                        )}

                        {needsInteraction && isConnected && (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(10px)', zIndex: 20 }}>
                                <motion.button 
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleInitialPlay}
                                    className="btn-primary" 
                                    style={{ padding: '0.8rem 1.5rem', gap: '0.5rem', fontSize: '1rem' }}
                                >
                                    <PlayCircle size={20} fill="currentColor" /> Click to Connect
                                </motion.button>
                            </div>
                        )}

                        {/* Status Overlay */}
                        <div style={{ position: 'absolute', top: '1rem', left: '1rem' }}>
                             <div style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                 <Zap size={12} color="#f59e0b" fill="#f59e0b" /> Live
                             </div>
                        </div>
                    </div>
                </div>

                <aside style={{ 
                    maxHeight: '400px', 
                    background: '#0f172a', 
                    borderLeft: 'none',
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex', 
                    flexDirection: 'column',
                    paddingBottom: '2rem'
                }} className="live-sidebar">
                    <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <h3 style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Users size={16} color="var(--primary)" /> Audience
                        </h3>
                    </div>
                    
                    <div style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto' }}>
                        {viewers.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>No other viewers</p>
                        ) : (
                            viewers.map((v, idx) => (
                                <div key={idx} className="glass-panel" style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--background)', overflow: 'hidden' }}>
                                        {v.profilePic?.url ? <img src={v.profilePic.url} alt="v" style={{width:'100%',height:'100%',objectFit:'cover'}} /> : <Terminal size={16} color="var(--primary)" style={{margin:'8px'}}/>}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.name}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </aside>
            </main>
        </div>
    );
};

export default ViewerLivePage;
