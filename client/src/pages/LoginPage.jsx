import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const LoginPage = () => {
  const navigate = useNavigate();
  const email = useRef();
  const password = useRef();
  const { login } = useAuth();

  const handelLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/user/login', {
        email: email.current.value,
        password: password.current.value
      });
      toast.success('Welcome back to DevSprint!');
      await login(response.data);
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed. Please check your credentials.');
      console.error(error);
    }
  }

  return (
    <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="bg-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2" style={{ background: 'var(--primary)', bottom: '-10%', right: '10%' }}></div>
      </div>

      <motion.div
        className="glass-panel"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        style={{ width: '100%', maxWidth: '400px', padding: '2.5rem', zIndex: 1, position: 'relative' }}
      >
        <button
          onClick={() => navigate('/')}
          className="btn-secondary"
          style={{ position: 'absolute', top: '2rem', left: '2rem', padding: '0.5rem', border: 'none', background: 'transparent' }}
        >
          <ArrowLeft size={20} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '2rem', marginTop: '1rem' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Welcome Back</h2>
          <p style={{ color: 'var(--text-muted)' }}>Enter your details to sign in to your account</p>
        </div>

        <form onSubmit={handelLogin}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="email" id="email" ref={email} className="form-input" style={{ paddingLeft: '2.5rem' }} placeholder="you@example.com" required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="password" id="password" ref={password} className="form-input" style={{ paddingLeft: '2.5rem' }} placeholder="••••••••" required />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" /> Remember me
            </label>
            <a href="#" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Forgot Password?</a>
          </div>

          <button type="submit" className="btn-primary hover-scale">
            Sign In <LogIn size={18} />
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Don't have an account? <a href="#" onClick={(e) => { e.preventDefault(); navigate('/signup'); }} style={{ color: 'var(--primary)', fontWeight: '500' }}>Sign up</a>
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;