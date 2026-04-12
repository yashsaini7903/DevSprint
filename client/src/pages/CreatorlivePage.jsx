import { useState, useCallback, useEffect, useRef } from 'react';
import { useSocket } from '../providers/Socket';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as mediasoupClient from 'mediasoup-client';
import { Mic, MicOff, Video, VideoOff, StopCircle, Users, Terminal, Code } from 'lucide-react';

const CreatorLivePage = () => {
    const { roomId } = useParams();
    const { user } = useAuth();
    const socket = useSocket();
    const navigate = useNavigate();
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const [myStream, setMyStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [viewerCount, setViewerCount] = useState(0);
    const [viewers, setViewers] = useState([]);

    const isEndedRef = useRef(false);
    const deviceRef = useRef(null);
    const producerTransportRef = useRef(null);
    const audioProducerRef = useRef(null);
    const videoProducerRef = useRef(null);

    const stopMedia = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        if (videoRef.current) videoRef.current.srcObject = null;
        if (audioProducerRef.current) audioProducerRef.current.close();
        if (videoProducerRef.current) videoProducerRef.current.close();
        if (producerTransportRef.current) producerTransportRef.current.close();
    }, []);

    const endStream = useCallback(() => {
        if (isEndedRef.current) return;
        isEndedRef.current = true;
        stopMedia();
        if (socket) socket.emit('end-room');
        navigate('/dashboard');
    }, [socket, stopMedia, navigate]);

    const handleToggleMute = useCallback(() => {
        if (!myStream) return;
        const nextMuted = myStream.getAudioTracks().some((t) => t.enabled);
        myStream.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
        setIsMuted(nextMuted);
        if (socket) socket.emit('creator-muted', { muted: nextMuted });
    }, [myStream, socket]);

    const handleToggleVideo = useCallback(() => {
        if (!myStream) return;
        const nextVideoOff = myStream.getVideoTracks().some((t) => t.enabled);
        myStream.getVideoTracks().forEach((t) => { t.enabled = !t.enabled; });
        setIsVideoOff(nextVideoOff);
        if (socket) socket.emit('creator-video-off', { videoOff: nextVideoOff });
    }, [myStream, socket]);

    const startStreaming = useCallback(async (stream) => {
        if (!socket) return;
        socket.emit('getRouterRtpCapabilities', async (rtpCapabilities) => {
            try {
                const device = new mediasoupClient.Device();
                await device.load({ routerRtpCapabilities: rtpCapabilities });
                deviceRef.current = device;
                socket.emit('createProducerTransport', async (params) => {
                    if (params.error) return;
                    const transport = device.createSendTransport(params);
                    producerTransportRef.current = transport;
                    transport.on('connect', ({ dtlsParameters }, cb) => socket.emit('connectProducerTransport', { dtlsParameters }, cb));
                    transport.on('produce', ({ kind, rtpParameters }, cb) => socket.emit('produce', { kind, rtpParameters }, ({ id }) => cb({ id })));
                    
                    const vTrack = stream.getVideoTracks()[0];
                    if (vTrack) videoProducerRef.current = await transport.produce({ track: vTrack });
                    const aTrack = stream.getAudioTracks()[0];
                    if (aTrack) audioProducerRef.current = await transport.produce({ track: aTrack });
                });
            } catch (err) { }
        });
    }, [socket]);

    const getUserMediaStream = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
            streamRef.current = stream;
            if (videoRef.current) videoRef.current.srcObject = stream;
            setMyStream(stream);
            await startStreaming(stream);
        } catch (err) { }
    }, [startStreaming]);

    useEffect(() => {
        getUserMediaStream();
        return () => {
            stopMedia();
            if (!isEndedRef.current) {
                isEndedRef.current = true;
                if (socket) socket.emit('end-room');
            }
        };
    }, [getUserMediaStream, socket, stopMedia]);

    useEffect(() => {
        if (!socket || !user || !roomId) return;
        socket.emit('join-creator', { roomId, userId: user._id });
        const onViewerCount = ({ count }) => setViewerCount(count);
        const onViewersUpdate = ({ viewers }) => setViewers(viewers);
        socket.on('viewer-count', onViewerCount);
        socket.on('viewers-update', onViewersUpdate);
        return () => {
             socket.off('viewer-count', onViewerCount);
             socket.off('viewers-update', onViewersUpdate);
        };
    }, [socket, user, roomId]);

    useEffect(() => {
        if (!socket) return;
        const onRoomEnded = () => { if (!isEndedRef.current) { stopMedia(); navigate('/dashboard'); } };
        socket.on('room-ended', onRoomEnded);
        return () => socket.off('room-ended', onRoomEnded);
    }, [socket, navigate, stopMedia]);

    return (
        <div style={{ background: '#020617', minHeight: '100vh', display: 'flex', flexDirection: 'column', color: 'white', fontFamily: "'Inter', sans-serif" }}>
            {/* Session Header */}
            <header style={{ 
                minHeight: '70px', background: '#0f172a', borderBottom: '1px solid rgba(255,255,255,0.05)', 
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', flexWrap: 'wrap', gap: '1rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: '#ef4444', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800 }}>LIVE</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Terminal size={18} color="var(--primary)" />
                        <h2 style={{ fontSize: '1rem', margin: 0 }}>Studio: <span style={{ color: 'var(--text-muted)' }}>{roomId}</span></h2>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        <Users size={16} /> {viewerCount} Participants
                    </div>
                    <button onClick={endStream} className="btn-primary" style={{ background: '#ef4444', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                        Stop
                    </button>
                </div>
            </header>

            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }} className="live-main-container">
                {/* Center Video Panel */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem', background: '#020617', minHeight: '300px' }}>
                    <div style={{ 
                        flex: 1, background: '#000', borderRadius: '16px', position: 'relative', 
                        overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' 
                    }}>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            style={{ 
                                width: '100%', height: '100%', objectFit: 'contain', 
                                filter: isVideoOff ? 'brightness(0)' : 'none',
                                transition: 'filter 0.5s ease'
                            }}
                        />
                        {isVideoOff && (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.95)' }}>
                                <VideoOff size={48} color="var(--text-muted)" />
                                <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.85rem' }}>Paused</p>
                            </div>
                        )}
                        
                        <div style={{ 
                            position: 'absolute', bottom: '1rem', left: '50%', transform: 'translateX(-50%)',
                            display: 'flex', gap: '1rem', padding: '0.75rem 1.5rem', background: 'rgba(15,23,42,0.8)',
                            backdropFilter: 'blur(20px)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                             <button onClick={handleToggleMute} style={{ background: 'none', border: 'none', cursor: 'pointer', color: isMuted ? '#ef4444' : 'white' }}>
                                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                             </button>
                             <button onClick={handleToggleVideo} style={{ background: 'none', border: 'none', cursor: 'pointer', color: isVideoOff ? '#ef4444' : 'white' }}>
                                {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
                             </button>
                        </div>
                    </div>
                </div>

                <aside style={{ 
                    maxHeight: '400px', background: '#0f172a', borderTop: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex', flexDirection: 'column', paddingBottom: '2rem'
                }} className="live-sidebar">
                    <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <h3 style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Code size={16} color="var(--primary)" /> Audience
                        </h3>
                    </div>
                    <div style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto' }}>
                        {viewers.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>No viewers yet</p>
                        ) : (
                            viewers.map((v, idx) => (
                                <div key={idx} className="glass-panel" style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--background)', overflow: 'hidden' }}>
                                        {v.profilePic?.url ? <img src={v.profilePic.url} alt="v" style={{width:'100%',height:'100%',objectFit:'cover'}} /> : <Terminal size={14} color="var(--primary)" style={{margin:'9px'}}/>}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>{v.name}</p>
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

export default CreatorLivePage;