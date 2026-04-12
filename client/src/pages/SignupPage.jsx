import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import { Mail, Lock, User, UserPlus, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const SignupPage = () => {
  const navigate = useNavigate();

  const name = useRef();
  const email = useRef();
  const password = useRef();
  const { login } = useAuth();

  const handelSignup = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/user/register', {
        name: name.current.value,
        email: email.current.value,
        password: password.current.value
      });
      toast.success('Joined DevSprint!');
      await login(response.data);
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Signup failed. Please try again.');
      console.error(error);
    }
  }

  return (
    <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="bg-blobs">
        <div className="blob blob-1" style={{ background: 'var(--secondary)', top: '10%', left: '-20%' }}></div>
        <div className="blob blob-2" style={{ background: 'var(--primary)' }}></div>
      </div>

      <motion.div
        className="glass-panel"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        style={{ width: '100%', maxWidth: '450px', padding: '2.5rem', zIndex: 1, position: 'relative' }}
      >
        <button
          onClick={() => navigate('/')}
          className="btn-secondary"
          style={{ position: 'absolute', top: '2rem', left: '2rem', padding: '0.5rem', border: 'none', background: 'transparent' }}
        >
          <ArrowLeft size={20} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '2rem', marginTop: '1rem' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Create Account</h2>
          <p style={{ color: 'var(--text-muted)' }}>Join us to discover more dimensions</p>
        </div>

        <form onSubmit={handelSignup}>
          <div className="form-group">
            <label className="form-label" htmlFor="name">Full Name</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" id="name" ref={name} className="form-input" style={{ paddingLeft: '2.5rem' }} placeholder="John Doe" required />
            </div>
          </div>

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

          <button type="submit" className="btn-primary hover-scale" style={{ marginTop: '1rem' }}>
            Get Started <UserPlus size={18} />
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); navigate('/login'); }} style={{ color: 'var(--primary)', fontWeight: '500' }}>Sign in</a>
        </p>
      </motion.div>
    </div>
  );
};

export default SignupPage;