import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Tag, Image as ImageIcon, Heart, Share2, MoreHorizontal, Terminal, Code } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const PostsTab = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const response = await axios.get('/api/post/getAll');
        setChallenges(Array.isArray(response.data.posts) ? response.data.posts : []);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };
    fetchChallenges();
  }, []);

  const handleLike = async (e, id, hasLiked) => {
    e.stopPropagation();
    if (!user) return toast.error("Please login to vote");
    try {
      const endpoint = hasLiked ? `/api/post/unlike/${id}` : `/api/post/like/${id}`;
      await axios.post(endpoint);
      setChallenges(prev => prev.map(c => {
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

  const getDifficulty = (likesCount, manualDiff) => {
     if (manualDiff) return manualDiff;
     if (likesCount > 15) return 'Hard';
     if (likesCount > 5) return 'Medium';
     return 'Easy';
  };

  const getDiffClass = (diff) => {
    switch (diff) {
      case 'Easy': return 'diff-easy';
      case 'Medium': return 'diff-medium';
      case 'Hard': return 'diff-hard';
      default: return 'diff-easy';
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <div className="gradient-text" style={{ fontSize: '1.2rem', fontWeight: 600 }}>Syncing DevSprint data...</div>
      </div>
    );
  }

  if (challenges.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center' }}>
        <Terminal size={48} style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', opacity: 0.5 }} />
        <h3 style={{ marginBottom: '0.5rem' }}>No challenges deployed yet</h3>
        <p style={{ color: 'var(--text-muted)' }}>Create your first coding challenge to start building your reputation.</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
        gap: '1.5rem' 
      }}
    >
      <AnimatePresence>
        {challenges.map((item, index) => {
          const diff = getDifficulty(item.likes?.length, item.difficulty);
          return (
              <motion.div 
              key={item._id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-panel hover-scale" 
              style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
              onClick={() => navigate(`/challenge/${item._id}`)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                <span className={`diff-badge ${getDiffClass(diff)}`}>{diff}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>

              <div style={{ position: 'relative', height: '180px', width: '100%', borderRadius: '8px', overflow: 'hidden', marginBottom: '1.5rem', background: '#020617' }}>
                {item.image ? (
                  <img  
                    src={item.image.url.startsWith('http') ? item.image.url : `/uploads/${item.image.url}`} 
                    alt="Challenge" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(59, 130, 246, 0.05)' }}>
                     <Code size={40} color="var(--primary)" style={{ opacity: 0.3 }} />
                  </div>
                )}
              </div>

              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', fontWeight: 600 }}>{item.title || "Untitled Challenge"}</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem', flexGrow: 1 }}>
                {item.text?.substring(0, 100) || "No description provided."}...
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)' }}>
                  <button 
                    onClick={(e) => handleLike(e, item._id, user && item.likes?.includes(user._id || user.id))}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}
                  >
                    <Heart 
                        size={16} 
                        fill={user && item.likes?.includes(user._id || user.id) ? "var(--primary)" : "none"} 
                        color={user && item.likes?.includes(user._id || user.id) ? "var(--primary)" : "currentColor"} 
                    /> 
                    {item.likes?.length || 0}
                  </button>
                </div>
                <button 
                  className="btn-secondary" 
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                  onClick={() => navigate(`/challenge/${item._id}`)}
                >
                  View Solutions
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
};

export default PostsTab;

