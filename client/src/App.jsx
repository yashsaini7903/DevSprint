import { useState } from 'react'
import './App.css'
import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import Dashboard from './pages/Dashboard.jsx' 
import ProtectedRoute from './components/ProtectedRoute'
import {SocketProvider} from './providers/Socket.jsx'
import {PeerProvider} from './providers/peer.jsx'
import CreateLivePage from './pages/CreateLive.jsx'
import CreatorLivePage from './pages/creatorlivePage.jsx'
import ViewerLivePage from './pages/ViewerLivePage.jsx'
import ChallengeDetail from './pages/ChallengeDetail.jsx'

import { Toaster } from 'react-hot-toast';

function App() {

  return (
    <PeerProvider>
    <SocketProvider>
    <Toaster position="top-center" reverseOrder={false} />
    <Routes>
      <Route path="/" element={<LandingPage/>}/>
      <Route path="/login" element={<LoginPage/>}/>
      <Route path="/signup" element={<SignupPage />}/>
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      }/>
      <Route path="/createLive" element={
        <ProtectedRoute>
          <CreateLivePage />
        </ProtectedRoute>
      }/>
      <Route path="/createLive/:roomId" element={
        <ProtectedRoute>
          <CreatorLivePage />
        </ProtectedRoute>
      }/>
      <Route path="/live/:roomId" element={
        <ProtectedRoute>
          <ViewerLivePage />
        </ProtectedRoute>
      }/>
      <Route path="/challenge/:id" element={
        <ProtectedRoute>
          <ChallengeDetail />
        </ProtectedRoute>
      }/>
    </Routes>
    </SocketProvider>
    </PeerProvider>
  )
}

export default App
