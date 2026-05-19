import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Mail } from 'lucide-react';

export default function Login({ users, setCurrentUser, setCurrentView }) {
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setAuthError('');

    const matchedUser = users.find(u => u.email.toLowerCase() === emailInput.toLowerCase() && u.password === passwordInput);
    if (!matchedUser) {
      setAuthError('Invalid credentials. Double check email/password.');
      return;
    }

    setCurrentUser(matchedUser);
    if (matchedUser.role === 'super_admin') {
      setCurrentView('super_admin');
    } else {
      setCurrentView('restaurant_admin');
    }
  };

  const handleQuickFill = (roleType, email, password) => {
    setEmailInput(email);
    setPasswordInput(password);
    setAuthError('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-md mx-auto bg-slate-900 border border-white/5 rounded-3xl p-8 shadow-2xl space-y-6"
    >
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto shadow-md">
          <Lock className="w-5 h-5" />
        </div>
        <h2 className="text-2xl font-black text-white">Admin Secure Gate</h2>
        <p className="text-xs text-slate-400">Log in to manage restaurant catalogs or SaaS operations</p>
      </div>

      {authError && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl text-center font-bold">
          {authError}
        </div>
      )}

      <form onSubmit={handleLoginSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1">
            <Mail className="w-3.5 h-3.5" />
            Email Address
          </label>
          <input
            type="email"
            required
            placeholder="admin@brand.com"
            className="w-full bg-slate-800 border border-slate-700 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-white"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1">
            <Lock className="w-3.5 h-3.5" />
            Security Password
          </label>
          <input
            type="password"
            required
            placeholder="••••••••"
            className="w-full bg-slate-800 border border-slate-700 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-white"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition hover:scale-102"
        >
          Sign In to Dashboard
        </button>
      </form>

      {/* QUICK FILL DEMO CREDENTIALS SHORTCUTS */}
      <div className="space-y-3 pt-4 border-t border-white/5">
        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block text-center">Quick Explore Credentials</span>
        
        <div className="grid grid-cols-2 gap-2 text-[9px]">
          <button
            onClick={() => handleQuickFill('super', 'admin@restrosaas.com', 'admin123')}
            className="bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-300 font-bold p-2.5 rounded-xl transition text-left"
          >
            👑 Super Admin Plan
            <span className="block font-normal text-slate-400 mt-0.5">admin@restrosaas.com</span>
          </button>

          <button
            onClick={() => handleQuickFill('pizza', 'pizza@pizzahub.com', 'pizza123')}
            className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-300 font-bold p-2.5 rounded-xl transition text-left"
          >
            🍕 Pizza Hub Owner
            <span className="block font-normal text-slate-400 mt-0.5">pizza@pizzahub.com</span>
          </button>

          <button
            onClick={() => handleQuickFill('curry', 'curry@currypalace.com', 'curry123')}
            className="bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 text-yellow-300 font-bold p-2.5 rounded-xl transition text-left"
          >
            🍛 Curry Palace Owner
            <span className="block font-normal text-slate-400 mt-0.5">curry@currypalace.com</span>
          </button>

          <button
            onClick={() => handleQuickFill('vegan', 'green@greengarden.com', 'green123')}
            className="bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-300 font-bold p-2.5 rounded-xl transition text-left"
          >
            🥗 Vegan Cafe Owner
            <span className="block font-normal text-slate-400 mt-0.5">green@greengarden.com</span>
          </button>
        </div>
      </div>

    </motion.div>
  );
}
