import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Terminal, Code, Heart, MessageSquare, ArrowLeft, Send, Sparkles, User, Award, Trash2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const ChallengeDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [challenge, setChallenge] = useState(null);
    const [loading, setLoading] = useState(true);
    const [solutionText, setSolutionText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchChallenge();
    }, [id]);

    const fetchChallenge = async () => {
        try {
            const r = await axios.get(`/api/post/getPost/${id}`);
            setChallenge(r.data.post);
        } catch (err) {
            toast.error("Failed to load challenge details");
            navigate('/dashboard');
        } finally {
            setLoading(false);
        }
    };

    const handleVote = async () => {
        if (!user) return toast.error("Please login to vote");
        try {
            const userId = user._id || user.id;
            const hasLiked = challenge.likes?.includes(userId);
            if (hasLiked) {
                await axios.post(`/api/post/unlike/${id}`);
                setChallenge(prev => ({ ...prev, likes: prev.likes.filter(uid => uid !== userId) }));
            } else {
                await axios.post(`/api/post/like/${id}`);
                setChallenge(prev => ({ ...prev, likes: [...(prev.likes || []), userId] }));
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Vote failed");
        }
    };

    const submitSolution = async (e) => {
        e.preventDefault();
        if (!solutionText) return;
        setIsSubmitting(true);
        try {
            // Backend uses /api/post/comment/:id (likely)
            await axios.post(`/api/post/comment/${id}`, { text: solutionText });
            toast.success("Solution submitted to DevSprint!");
            setSolutionText('');
            fetchChallenge();
        } catch (err) {
            toast.error("Submission failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm("Delete your solution?")) return;
        try {
            await axios.post(`/api/post/deleteComment/${commentId}`);
            toast.success("Solution deleted!");
            fetchChallenge();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to delete solution");
        }
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }} className="gradient-text">Entering DevSprint...</div>;

    return (
        <div className="app-container" style={{ flexDirection: 'column', background: '#020617', minHeight: '100vh', padding: '1rem' }}>
            <header style={{ marginBottom: '2rem', display: 'flex', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                <button onClick={() => navigate('/dashboard')} className="btn-secondary" style={{ padding: '0.6rem' }}>
                   <ArrowLeft size={18} />
                </button>
                <div style={{ flex: 1 }}>
                   <span className="diff-badge diff-medium" style={{ fontSize: '0.65rem' }}>{challenge.difficulty || 'Medium'}</span>
                   <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', margin: '0.5rem 0' }}>{challenge.title}</h1>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.75rem' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         {challenge.user?.profilePic?.url ? (
                             <img src={challenge.user.profilePic.url} alt={challenge.user?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                         ) : (
                             <User size={20} color="white" />
                         )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, color: 'white', fontSize: '0.95rem' }}>{challenge.user?.name || "Anonymous"}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{challenge.user?.email}</span>
                      </div>
                   </div>
                </div>
            </header>

            <main style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="challenge-detail-main">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', flex: 1 }}>
                    <div className="glass-panel" style={{ padding: '2.5rem' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                           <Terminal size={20} color="var(--primary)" /> Context & Requirements
                        </h3>
                        <div style={{ position: 'relative', background: '#0f172a', borderRadius: '12px', border: '1px solid var(--border)', padding: '2rem', marginBottom: '2rem' }}>
                           <p style={{ lineHeight: '1.8', fontSize: '1.1rem', color: '#e2e8f0', whiteSpace: 'pre-wrap' }}>
                             {challenge.text}
                           </p>
                        </div>
                        {challenge.image && (
                            <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                               <img src={challenge.image.url} style={{ width: '100%', display: 'block' }} alt="Challenge logic" />
                            </div>
                        )}
                        
                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem', flexWrap: 'wrap' }}>
                           <button onClick={handleVote} className="btn-secondary" style={{ gap: '0.5rem', fontSize: '0.9rem' }}>
                              <Heart size={16} fill={challenge.likes?.includes(user?._id || user?.id) ? "var(--primary)" : "none"} color={challenge.likes?.includes(user?._id || user?.id) ? "var(--primary)" : "currentColor"} /> Votes ({challenge.likes?.length || 0})
                           </button>
                           <button className="btn-secondary" style={{ fontSize: '0.9rem' }}>Share Context</button>
                        </div>
                    </div>

                    {/* Solutions Listing */}
                    <section>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                           <Sparkles size={20} color="#f59e0b" /> Community Solutions ({challenge.comments?.length || 0})
                        </h2>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                           {challenge.comments?.length > 0 ? challenge.comments.map((sol, i) => (
                             <motion.div 
                                key={sol._id} 
                                initial={{ opacity: 0, x: -20 }} 
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="glass-panel" 
                                style={{ padding: '1.5rem', borderLeft: i === 0 ? '4px solid #10b981' : 'none' }}
                             >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                         <User size={16} color="white" />
                                      </div>
                                      <div>
                                         <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>{sol.user?.name}</p>
                                         <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(sol.createdAt).toLocaleString()}</p>
                                      </div>
                                   </div>
                                   <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                        {i === 0 && <span style={{ color: '#10b981', fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}><Award size={14} /> TOP SOLUTION</span>}
                                        {user && (sol.user?._id === user._id || sol.user?._id === user.id || sol.user === user._id || sol.user === user.id) && (
                                            <button 
                                                onClick={() => handleDeleteComment(sol._id)}
                                                style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex' }}
                                                title="Delete Solution"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div style={{ background: '#020617', padding: '1.25rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                   <pre style={{ margin: 0, fontSize: '0.9rem', color: '#60a5fa', overflowX: 'auto' }}>
                                      <code>{sol.text}</code>
                                   </pre>
                                </div>
                             </motion.div>
                           )) : (
                             <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Be the first to propose a solution!</p>
                           )}
                        </div>
                    </section>
                </div>

                {/* Right: Submission Form */}
                <aside>
                    <div className="glass-panel" style={{ padding: '2rem', position: 'sticky', top: '2rem' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                           <Code size={20} color="var(--primary)" /> Propose Solution
                        </h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                           Write your logic as a solution. Clean, efficient code is prioritized.
                        </p>
                        
                        <form onSubmit={submitSolution}>
                           <div className="form-group">
                              <textarea 
                                className="form-input" 
                                placeholder="Paste your code or explanation here..." 
                                style={{ minHeight: '300px', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.9rem' }}
                                value={solutionText}
                                onChange={(e) => setSolutionText(e.target.value)}
                              ></textarea>
                           </div>
                           <button 
                             type="submit" 
                             className="btn-primary" 
                             style={{ width: '100%', gap: '0.75rem' }}
                             disabled={isSubmitting}
                           >
                              {isSubmitting ? 'Transmitting...' : <><Send size={18} /> Submit to DevSprint</>}
                           </button>
                        </form>
                    </div>
                </aside>
            </main>
        </div>
    );
};

export default ChallengeDetail;
