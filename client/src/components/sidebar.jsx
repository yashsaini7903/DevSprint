import React from 'react';
import { motion } from 'framer-motion';
import { Home, Image as ImageIcon, PlusCircle, LogOut, Settings, User, List, Terminal, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const navItems = [
    { id: 'home', label: 'DevSprint', icon: Home },
    { id: 'posts', label: 'Challenges', icon: List },
    { id: 'create', label: 'New Challenge', icon: PlusCircle },
    { id: 'profile', label: 'Coder Profile', icon: User },
  ];

  return (
    <motion.aside 
      className="glass-panel"
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{
        width: 'var(--sidebar-w)',
        height: 'calc(100vh - 2rem)',
        position: 'fixed',
        top: '1rem',
        left: '1rem',
        display: 'flex',
        flexDirection: 'column',
        padding: '0.75rem',
        borderRadius: '16px',
        zIndex: 50,
        overflow: 'hidden',
        transition: 'width 0.3s ease'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '64px', marginBottom: '1.5rem' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Terminal size={20} color="white" />
        </div>
        <h2 style={{ color: 'white', marginLeft: '0.75rem', fontSize: '1.25rem' }} className="sidebar-label">
          DevSprint
        </h2>
      </div>

      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`nav-btn ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} style={{ flexShrink: 0 }} />
              <span style={{ marginLeft: '1rem' }} className="sidebar-label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <button 
          onClick={() => navigate('/')}
          className="nav-btn"
        >
          <ArrowLeft size={20} />
          <span style={{ marginLeft: '1rem' }} className="sidebar-label">Landing</span>
        </button>
        <button 
          onClick={() => { if(window.confirm('Sign out?')) logout(); }}
          className="nav-btn"
          style={{ color: '#ef4444' }}
        >
          <LogOut size={20} />
          <span style={{ marginLeft: '1rem' }} className="sidebar-label">Sign Out</span>
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;