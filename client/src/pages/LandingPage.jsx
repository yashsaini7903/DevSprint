import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Code, Terminal, Video, Users, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading, logout } = useAuth();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="landing-container" style={{ minHeight: '100vh', background: 'var(--background)', overflow: 'hidden' }}>
      <div className="bg-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      <nav style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '1rem 2rem', 
        position: 'relative', 
        zIndex: 10,
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/logo.png" alt="DevSprint Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <h2 style={{ fontSize: '1.5rem', margin: 0 }}>DevSprint</h2>
        </div>
        <div style={{ display: 'flex', gap: '2rem' }}>
          {!loading && (
             isAuthenticated ? (
               <>
                 <button className="btn-secondary" onClick={() => { if(window.confirm('Are you sure you want to sign out?')) logout(); }}>Sign Out</button>
                 <button className="btn-primary" onClick={() => navigate('/dashboard')}>Enter DevSprint</button>
               </>
             ) : (
               <>
                 <button className="btn-secondary" onClick={() => navigate('/login')}>Login</button>
                 <button className="btn-primary" onClick={() => navigate('/dashboard')}>Enter DevSprint</button>
               </>
             )
          )}
        </div>
      </nav>

      <main style={{ padding: '2rem 1rem', position: 'relative', zIndex: 1 }}>
        {/* Hero Section */}
        <section style={{ textAlign: 'center', maxWidth: '1000px', margin: '0 auto 8rem' }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', marginBottom: '1.5rem', lineHeight: '1.1' }}>
              Master Coding Through <br />
              <span className="gradient-text">Real-Time Challenges</span>
            </h1>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: '3rem', maxWidth: '700px', margin: '0 auto 3rem' }}>
              Participate in coding challenges, solve problems, and learn from live solution sessions by developers.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button 
                className="btn-primary" 
                style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}
                onClick={() => navigate('/dashboard')}
              >
                Start Solving <ArrowRight size={20} />
              </button>
              <button 
                className="btn-secondary"
                style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}
              >
                Browse Challenges
              </button>
            </div>
          </motion.div>
        </section>

        {/* How it works */}
        <section style={{ marginBottom: '8rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>How It Works</h2>
            <p style={{ color: 'var(--text-muted)' }}>Everything you need to level up your engineering skills.</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            {[
              { icon: Code, title: "Create Challenges", desc: "Design complex coding problems to test the community's skills." },
              { icon: Zap, title: "Submit Solutions", desc: "Write clean, efficient code to solve challenges and earn reputation." },
              { icon: Video, title: "Go Live", desc: "Host live solution sessions to explain your logic and mentor others." }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                className="glass-panel"
                whileHover={{ y: -10 }}
                style={{ padding: '2rem', textAlign: 'center' }}
              >
                <div style={{ 
                  width: '64px', height: '64px', borderRadius: '16px', 
                  background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1.5rem'
                }}>
                  <feature.icon size={32} />
                </div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{feature.title}</h3>
                <p style={{ color: 'var(--text-muted)' }}>{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>


      </main>

      {/* Footer */}
      <footer style={{ padding: '4rem', borderTop: '1px solid var(--border)', textAlign: 'center', color: 'var(--text-muted)', background: '#020617' }}>
         <p>© 2026 DevSprint Platform. Built for the next generation of engineers.</p>
      </footer>
    </div>
  );
};

export default LandingPage;