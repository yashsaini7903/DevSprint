import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Camera, Mail, Terminal, Code, Heart, MessageSquare, ChevronRight, Award, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const CoderProfile = () => {
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [myChallenges, setMyChallenges] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMyChallenges();
    }, []);

    const fetchMyChallenges = async () => {
        try {
            const response = await axios.get('/api/post/getUserPost');
            setMyChallenges(response.data.posts || []);
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };

    const handleLike = async (e, id, hasLiked) => {
        e.stopPropagation();
        if (!user) return toast.error("Please login to vote");
        try {
            const endpoint = hasLiked ? `/api/post/unlike/${id}` : `/api/post/like/${id}`;
            await axios.post(endpoint);
            setMyChallenges(prev => prev.map(c => {
                if (c._id !== id) return c;
                const userId = user._id || user.id;
                const newLikes = hasLiked 
                    ? (c.likes || []).filter(uid => uid !== userId)
                    : [...(c.likes || []), userId];
                return { ...c, likes: newLikes };
            }));
        } catch (err) {
            toast.error(err.response?.data?.message || "Action failed");
        }
    };

    const handleDeleteChallenge = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this challenge?')) return;
        
        const deleteToast = toast.loading('Deleting challenge...');
        try {
            await axios.delete(`/api/post/deletePost/${id}`);
            toast.success('Challenge deleted successfully', { id: deleteToast });
            setMyChallenges(prev => prev.filter(c => c._id !== id));
        } catch (error) {
            console.error("Delete error:", error);
            toast.error(error.response?.data?.message || 'Failed to delete challenge', { id: deleteToast });
        }
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('profilePic', file);

        const uploadToast = toast.loading('Uploading profile picture...');
        try {
            await axios.post('/api/user/setProfilePic', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('Profile picture updated!', { id: uploadToast });
            refreshUser();
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to update profile picture.', { id: uploadToast });
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '4rem' }}
        >
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleUpload} 
                style={{ display: 'none' }} 
                accept="image/*"
            />

            {/* Header Profile Card */}
            <div className="glass-panel" style={{ padding: '2rem', display: 'flex', gap: '2rem', alignItems: 'center', marginBottom: '3rem', position: 'relative', overflow: 'hidden', flexWrap: 'wrap', justifyContent: 'center', textAlign: 'center' }}>
                <div style={{ position: 'absolute', top: 0, right: 0, width: '200px', height: '200px', background: 'var(--primary)', filter: 'blur(100px)', opacity: 0.1, borderRadius: '50%', pointerEvents: 'none' }}></div>
                
                <div 
                    style={{ 
                        width: '120px', height: '120px', borderRadius: '24px', 
                        background: 'linear-gradient(135deg, var(--primary), var(--secondary))', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 15px 30px rgba(0,0,0,0.3)', position: 'relative',
                        overflow: 'hidden', flexShrink: 0
                    }}
                >
                    {user?.profilePic?.url ? (
                        <img 
                            src={user.profilePic.url} 
                            alt={user.name} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                    ) : (
                        <User size={60} color="white" />
                    )}
                </div>

                <div style={{ flex: '1 1 300px' }}>
                    <h2 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>{user?.name || 'Anonymous Coder'}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '1rem' }}>
                        <Mail size={16} /> {user?.email}
                    </div>
                </div>

                <button 
                    onClick={() => fileInputRef.current.click()}
                    className="btn-primary" 
                    style={{ alignSelf: 'center', padding: '0.75rem 1.5rem', fontSize: '0.9rem' }}
                >
                    Update Avatar
                </button>
            </div>
            {/* User's Challenges Section */}
            <section style={{ marginTop: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                    <div style={{ padding: '0.5rem', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)' }}>
                        <Terminal size={22} />
                    </div>
                    <h3 style={{ fontSize: '1.5rem', margin: 0 }}>My Deployed Challenges ({myChallenges.length})</h3>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Analyzing DevSprint contributions...</div>
                ) : myChallenges.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        <AnimatePresence>
                            {myChallenges.map((challenge, index) => (
                                <motion.div
                                    key={challenge._id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="glass-panel hover-scale"
                                    style={{ padding: '1.5rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid var(--border)' }}
                                    onClick={() => navigate(`/challenge/${challenge._id}`)}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                            <span className={`diff-badge diff-${(challenge.difficulty || 'Medium').toLowerCase()}`} style={{ fontSize: '0.7rem' }}>
                                                {challenge.difficulty || 'Medium'}
                                            </span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                {new Date(challenge.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <button 
                                            onClick={(e) => handleDeleteChallenge(e, challenge._id)}
                                            style={{ 
                                                background: 'rgba(239, 68, 68, 0.1)', 
                                                border: 'none', 
                                                color: '#ef4444', 
                                                padding: '0.4rem', 
                                                borderRadius: '8px', 
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                transition: 'all 0.2s'
                                            }}
                                            title="Delete Challenge"
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    
                                    <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{challenge.title}</h4>
                                    
                                    <div style={{ flex: 1, color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                                        {challenge.text?.length > 80 ? challenge.text.substring(0, 80) + '...' : challenge.text}
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                            <button 
                                                onClick={(e) => handleLike(e, challenge._id, user && challenge.likes?.includes(user._id || user.id))}
                                                style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                                            >
                                                <Heart 
                                                    size={14} 
                                                    fill={user && challenge.likes?.includes(user._id || user.id) ? "var(--primary)" : "none"} 
                                                    color={user && challenge.likes?.includes(user._id || user.id) ? "var(--primary)" : "currentColor"} 
                                                />
                                                {challenge.likes?.length || 0}
                                            </button>
                                        </div>
                                        <ChevronRight size={18} color="var(--primary)" />
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', opacity: 0.7 }}>
                        <Code size={40} style={{ marginBottom: '1rem', color: 'var(--text-muted)' }} />
                        <p style={{ margin: 0 }}>You haven't deployed any challenges yet.</p>
                        <button 
                            className="btn-secondary" 
                            style={{ marginTop: '1.5rem', fontSize: '0.9rem' }}
                            onClick={() => navigate('/dashboard')} // Since dashboard manages tabs, this is tricky if we want to switch tab, but usually users can just click 'New Challenge'
                        >
                            Return to DevSprint
                        </button>
                    </div>
                )}
            </section>
        </motion.div>
    );
};

export default CoderProfile;
