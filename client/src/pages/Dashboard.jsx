import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/sidebar';
import { Bell, Search, User, FileImage } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import HomeTab from '../components/HomeTab';
import PostsTab from '../components/PostsTab';
import CreatePostTab from '../components/CreatePostTab';
import CoderProfile from '../components/CoderProfile';

const Topbar = ({ title, user, setActiveTab }) => (
  <header style={{ 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: '1rem', 
    marginBottom: '1rem', 
    background: 'rgba(15, 23, 42, 0.4)', 
    backdropFilter: 'blur(20px)',
    borderRadius: '12px', 
    border: '1px solid rgba(255, 255, 255, 0.05)',
  }}>
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <h1 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>{title}</h1>
    </div>
    
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{ position: 'relative', display: 'none', md: 'block' }}>
        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input 
          type="text" 
          placeholder="Search..." 
          className="form-input"
          style={{ 
            background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--card-border)', 
            borderRadius: '20px', padding: '0.5rem 1rem 0.5rem 2.5rem', color: 'white', outline: 'none', width: '200px'
          }} 
        />
      </div>

      <div 
        style={{ 
          display: 'flex', alignItems: 'center', gap: '1rem', 
          background: 'rgba(255,255,255,0.03)', padding: '0.5rem 1rem', 
          borderRadius: '12px', border: '1px solid var(--card-border)',
          cursor: 'pointer' 
        }}
        onClick={() => setActiveTab('profile')}
      >
        <div style={{ 
          width: '44px', height: '44px', borderRadius: '50%', 
          background: 'var(--primary)', display: 'flex', 
          alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', border: '2px solid rgba(255,255,255,0.1)',
          flexShrink: 0
        }}>
          {user?.profilePic?.url ? (
            <img src={user.profilePic.url} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <User size={22} color="white" />
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
          <p style={{ fontSize: '0.9rem', fontWeight: '600', margin: 0, color: 'white' }}>
            {user?.name || user?.username || user?.email || 'User'}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
            {user?.email || 'No Email Available'}
          </p>
        </div>
      </div>
    </div>
  </header>
);

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('home');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const getTitle = () => {
    switch (activeTab) {
      case 'home': return 'DevSprint';
      case 'posts': return 'Challenges';
      case 'create': return 'New Challenge';
      case 'profile': return 'Coder Profile';
      default: return 'DevSprint';
    }
  };

  return (
    <div className="app-container" style={{ position: 'relative' }}>
      <Toaster position="top-right" />
      <div className="bg-blobs">
        <div className="blob blob-1" style={{ width: '40vw', height: '40vw', top: '-10%', left: '10%' }}></div>
        <div className="blob blob-2" style={{ width: '35vw', height: '35vw', bottom: '-5%', right: '-5%' }}></div>
      </div>
      
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main style={{ 
        flex: 1, 
        marginLeft: 'calc(var(--sidebar-w) + 1.5rem)', 
        padding: '1rem', 
        minHeight: '100vh',
        display: 'flex', 
        flexDirection: 'column',
        width: '100%',
        transition: 'margin-left 0.3s ease'
      }}>
        <Topbar title={getTitle()} user={user} setActiveTab={setActiveTab} />
        
        <div style={{ flex: 1, position: 'relative' }}>
          <AnimatePresence mode="wait">
            {activeTab === 'home' && <HomeTab key="home" />}
            {activeTab === 'posts' && <PostsTab key="posts" />}
            {activeTab === 'create' && <CreatePostTab key="create" />}
            {activeTab === 'profile' && <CoderProfile key="profile" />}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;