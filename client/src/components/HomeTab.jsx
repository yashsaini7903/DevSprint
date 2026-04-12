import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Terminal, Play, User, Eye, Rocket, TrendingUp, Clock, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../providers/Socket';

const HomeTab = () => {
  const [challenges, setChallenges] = useState([]);
  const [liveRooms, setLiveRooms] = useState([]);
  const navigate = useNavigate();
  const socket = useSocket();

  useEffect(() => {
    axios.get('/api/post/getAll')
      .then(r => setChallenges(r.data.posts))
      .catch(err => console.error('challenges fetch err:', err));

    axios.get('/api/live/getAllLiveRooms')
      .then(r => setLiveRooms(r.data.liveRooms))
      .catch(err => console.error('live rooms fetch err:', err));
  }, []);

  useEffect(() => {
    if (!socket) return;
    const onLiveCreated = (newRoom) => {
      setLiveRooms(prev => [...prev, { ...newRoom, viewerCount: 0 }]);
    };
    const onLiveEnded = ({ roomId }) => {
      setLiveRooms(prev => prev.filter(r => r.roomId !== roomId));
    };
    const onLiveViewerCount = ({ roomId, count }) => {
      setLiveRooms(prev => prev.map(r => r.roomId === String(roomId) ? { ...r, viewerCount: count } : r));
    };

    socket.on('live-created', onLiveCreated);
    socket.on('live-ended', onLiveEnded);
    socket.on('live-viewer-count', onLiveViewerCount);

    return () => {
      socket.off('live-created', onLiveCreated);
      socket.off('live-ended', onLiveEnded);
      socket.off('live-viewer-count', onLiveViewerCount);
    };
  }, [socket]);

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

  const sortedChallenges = [...challenges].sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
  const topChallenges = sortedChallenges.slice(0, 5);
  const latestChallenges = challenges.slice(0, 6);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="arena-container"
      style={{ display: 'flex', flexDirection: 'column', gap: '3rem', paddingBottom: '4rem' }}
    >
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            Live Solutions
          </h2>
          <button className="btn-primary" onClick={() => navigate('/createLive')}>
            <Play size={16} fill="currentColor" /> Host Session
          </button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {liveRooms.length > 0 ? liveRooms.map((room) => (
            <motion.div
              key={room.roomId}
              whileHover={{ y: -5 }}
              onClick={() => navigate(`/live/${room.roomId}`)}
              className="glass-panel"
              style={{ padding: '1.5rem', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#ef4444' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#ef4444', letterSpacing: '1px' }}>LIVE NOW</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Eye size={14} /> {room.viewerCount || 0}
                </span>
              </div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{room.title}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Setter: {room.user?.name || 'Anonymous'}</p>
            </motion.div>
          )) : (
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', gridColumn: '1/-1', opacity: 0.6 }}>
              <p>No live sessions active. Start one to showcase your solution!</p>
            </div>
          )}
        </div>
      </section>

      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <TrendingUp size={24} color="#f59e0b" />
          <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Top Challenges</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {topChallenges.map((challenge) => {
            const diff = getDifficulty(challenge.likes?.length || 0, challenge.difficulty);
            return (
              <motion.div 
                key={challenge._id} 
                className="glass-panel hover-scale" 
                style={{ padding: '1.25rem', cursor: 'pointer' }}
                onClick={() => navigate(`/challenge/${challenge._id}`)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <span className={`diff-badge ${getDiffClass(diff)}`}>{diff}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{challenge.comments?.length || 0} Solutions</span>
                </div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', minHeight: '3rem' }}>{challenge.title || challenge.text?.substring(0, 40) + '...'}</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                   <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>Solve Challenge</span>
                   <ChevronRight size={18} color="var(--primary)" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <Clock size={24} color="var(--primary)" />
          <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Latest Challenges</h2>
        </div>
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          {latestChallenges.map((challenge, i) => (
            <div 
              key={challenge._id} 
              style={{ 
                padding: '1.25rem 2rem', 
                borderBottom: i === latestChallenges.length - 1 ? 'none' : '1px solid var(--border)',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'background 0.2s',
                gap: '1rem'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <Rocket size={20} color="var(--text-muted)" />
                <div>
                  <h4 style={{ margin: 0, fontWeight: 500 }}>{challenge.title || "Untitled Challenge"}</h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>by {challenge.user?.name || 'Unknown'}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                 <span className={`diff-badge ${getDiffClass(getDifficulty(challenge.likes?.length, challenge.difficulty))}`}>
                   {getDifficulty(challenge.likes?.length, challenge.difficulty)}
                 </span>
                 <button 
                  className="btn-secondary" 
                  style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                  onClick={() => navigate(`/challenge/${challenge._id}`)}
                >View</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </motion.div>
  );
};

export default HomeTab;

