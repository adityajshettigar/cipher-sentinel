import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { auth } from '../firebase';
import { Key, Copy, Check, Terminal, ShieldAlert } from 'lucide-react';

const ApiKeys = () => {
  const [keyName, setKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const generateKey = async (e) => {
    e.preventDefault();
    if (!keyName) return;
    
    setLoading(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch('http://127.0.0.1:8000/api/v1/keys/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: keyName })
      });
      
      const data = await response.json();
      if (data.api_key) {
        setGeneratedKey(data.api_key);
        setKeyName('');
      }
    } catch (err) {
      console.error("Failed to generate key", err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="animate-in fade-in duration-1000 max-w-4xl mx-auto mt-8">
      <div className="mb-12">
        <h2 className="text-4xl font-black text-white tracking-tighter mb-2">ACCESS_TOKENS</h2>
        <div className="flex items-center gap-3 text-cyan-500/50 font-mono text-[10px] uppercase tracking-widest">
          <Key className="w-3 h-3" />
          <span>Machine-to-Machine Authentication</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Generator Form */}
        <div className="bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-600 opacity-50"></div>
          
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyan-400" /> Issue New Token
          </h3>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Generate a long-lived API key to authenticate your CI/CD pipelines, GitHub Actions, or local CLI agents with the CipherSentinel Core.
          </p>

          <form onSubmit={generateKey} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2">Agent Name</label>
              <input
                type="text"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="e.g., GitHub Actions Pipeline"
                className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-white/20"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || !keyName}
              className="w-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 p-4 rounded-xl font-bold text-sm tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'PROVISIONING...' : 'GENERATE KEY'}
            </button>
          </form>
        </div>

        {/* Right Column: Key Display */}
        <div className="flex flex-col justify-center">
          {generatedKey ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }}
              className="bg-cyan-500/10 border border-cyan-500/30 rounded-[2rem] p-8 shadow-[0_0_30px_rgba(6,182,212,0.15)] relative"
            >
              <div className="flex items-center gap-2 text-cyan-400 font-mono text-[10px] uppercase tracking-widest mb-4">
                <ShieldAlert className="w-3 h-3" /> Warning: Copy this now
              </div>
              <p className="text-sm text-slate-300 mb-4">
                This token will only be displayed once. If you lose it, you will need to generate a new one.
              </p>
              
              <div className="bg-black/60 border border-white/10 rounded-xl p-4 flex items-center justify-between gap-4 mb-4">
                <code className="text-cyan-300 font-mono text-xs truncate select-all">{generatedKey}</code>
                <button 
                  onClick={copyToClipboard}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors flex-shrink-0"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-white/5 border-dashed rounded-[2rem] bg-white/[0.01]">
              <Key className="w-12 h-12 text-white/10 mb-4" />
              <p className="text-sm text-white/30 font-mono">No token generated yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApiKeys;