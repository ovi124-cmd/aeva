import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing.jsx';
import Create from './pages/Create.jsx';
import Receiver from './pages/Receiver.jsx';
import Admin from './pages/Admin.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import About from './pages/About.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/create" element={<Create />} />
        <Route path="/p/:id" element={<Receiver />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/about" element={<About />} />
        {/* Catch-all fallback */}
        <Route path="*" element={<Landing />} />
      </Routes>
    </BrowserRouter>
  );
}
