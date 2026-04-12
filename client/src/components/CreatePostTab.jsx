import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Terminal, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const CreatePostTab = () => {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleCreateChallenge = async (e) => {
    e.preventDefault();
    if (!title || !text) {
      return toast.error("Title and Description are required!");
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('text', text);
    formData.append('difficulty', difficulty);

    if (image) formData.append('image', image);

    try {
      await axios.post('/api/post/createPost', formData);
      toast.success('Challenge Published to DevSprint!');
      setTitle('');
      setText('');
      setImage(null);
      setPreview(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to publish challenge');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
           <Terminal size={24} color="var(--primary)" />
           <h2 style={{ fontSize: '1.5rem' }}>Set New Challenge</h2>
        </div>

        <form onSubmit={handleCreateChallenge} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }} className="create-post-grid">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Challenge Title</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Implement a Scalable SFU" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Problem Description</label>
                <textarea 
                  className="form-input" 
                  placeholder="Describe the logic, constraints, and requirements..." 
                  style={{ minHeight: '200px', resize: 'vertical' }}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                ></textarea>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Initial Difficulty</label>
                <select 
                  className="form-input" 
                  value={difficulty} 
                  onChange={(e) => setDifficulty(e.target.value)}
                  style={{ appearance: 'none' }}
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Reference Diagram / Image</label>
                <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" style={{ display: 'none' }} />
                <div 
                  onClick={() => fileInputRef.current.click()}
                  style={{ 
                    border: '2px dashed var(--border)', borderRadius: '12px', padding: '2rem', 
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: '1rem', color: 'var(--text-muted)', background: '#020617', cursor: 'pointer',
                    minHeight: '200px'
                  }}
                >
                  {preview ? (
                    <img src={preview} alt="Preview" style={{ width: '100%', maxHeight: '160px', objectFit: 'contain', borderRadius: '8px' }} />
                  ) : (
                    <>
                      <Upload size={32} />
                      <p style={{ fontSize: '0.9rem' }}>Click to upload asset</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ padding: '1rem', fontSize: '1.1rem', width: '100%' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Publishing...' : 'Publish Challenge'}
          </button>
        </form>
      </div>
    </motion.div>
  );
};

export default CreatePostTab;

