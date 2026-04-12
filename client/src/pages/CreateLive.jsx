import React, { useState, useRef, useEffect } from 'react';
import { useSocket } from '../providers/Socket';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Rocket, Terminal, ArrowLeft, Shield, User } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const CreateLive = () => {
    const titleRef = useRef();
    const socket = useSocket();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isLaunching, setIsLaunching] = useState(false);

    useEffect(() => {
        if (!socket) return;

        const handleRoomCreated = ({ roomId }) => {
            toast.success("Solution Session Ready!");
            navigate(`/createLive/${roomId}`);
        };

        const handleError = ({ message }) => {
            toast.error(message || "Failed to launch session");
            setIsLaunching(false);
        };

        socket.on("room-created", handleRoomCreated);
        socket.on("error", handleError);

        return () => {
            socket.off("room-created", handleRoomCreated);
            socket.off("error", handleError);
        };
    }, [socket, navigate]);

    const handleLaunchSession = () => {
        if (!titleRef.current.value) {
            toast.error("Please specify session goal/title");
            return;
        }

        if (!socket || !socket.connected) {
            toast.error("Connecting to DevSprint server... Try again in a moment");
            return;
        }

        setIsLaunching(true);
        socket.emit("create-room", { 
            Id: user._id, 
            title: titleRef.current.value 
        });
    };

    return (
        <div className="app-container" style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#020617' }}>
            <Toaster position="top-center" />
            <div className="bg-blobs">
                <div className="blob blob-1" style={{ width: '400px', height: '400px', top: '10%', left: '10%' }}></div>
                <div className="blob blob-2" style={{ width: '300px', height: '300px', bottom: '10%', right: '10%' }}></div>
            </div>

            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-panel" 
                style={{ 
                    padding: '1.5rem', borderRadius: '24px', maxWidth: '500px', width: '90%', 
                    position: 'relative', zIndex: 10, textAlign: 'center' 
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ArrowLeft size={18} /> Back
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem' }}>
                        <Shield size={14} /> Encrypted Session
                    </div>
                </div>

                <div style={{ 
                    width: '80px', height: '80px', borderRadius: '20px', 
                    background: 'rgba(59, 130, 246, 0.1)', display: 'flex', 
                    alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' 
                }}>
                    <Rocket size={40} color="var(--primary)" />
                </div>

                <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Launch Session</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>Start a live solution stream to guide participants through your challenge logic.</p>

                <div className="form-group" style={{ textAlign: 'left', marginBottom: '2rem' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', marginLeft: '0.5rem' }}>SESSION TITLE / TOPIC</label>
                    <div style={{ position: 'relative' }}>
                        <Terminal size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input 
                            type="text" 
                            ref={titleRef} 
                            placeholder="e.g. Explaining Dynamic Programming solutions..." 
                            className="form-input" 
                            style={{ paddingLeft: '3rem' }}
                        />
                    </div>
                </div>

                <button 
                    onClick={handleLaunchSession} 
                    className="btn-primary" 
                    disabled={isLaunching}
                    style={{ width: '100%', padding: '1rem', fontSize: '1rem', gap: '0.75rem' }}
                >
                    {isLaunching ? (
                        <>Preparing Studio...</>
                    ) : (
                        <><Play size={18} fill="currentColor" /> Go Live Now</>
                    )}
                </button>

                <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <User size={20} color="white" />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                         <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>AUTHORIZED SETTER</p>
                         <p style={{ margin: 0, fontWeight: 600 }}>{user?.name}</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default CreateLive;
