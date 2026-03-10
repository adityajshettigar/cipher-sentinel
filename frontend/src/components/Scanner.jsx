import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Code2, Zap, Terminal, Search, Cpu } from 'lucide-react';

const Scanner = ({ onScan, isScanning }) => {
  const [code, setCode] = useState('');
  const [lang, setLang] = useState('python');

  const handleSubmit = () => {
    if (!code.trim()) return;
    
    // 🎯 THE 422 FIX: Construct the exact payload FastAPI demands
    const payload = {
      language: lang,
      vulnerable_code: code,
      algorithm: "auto-detect", // Default string so FastAPI doesn't crash
      variables: [],            // Empty array to satisfy the List[str] requirement
      in_transit: true          // Boolean value it expects
    };

    onScan(payload);
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto mt-12 group">
      {/* HUD Accent Glows */}
      <div className="absolute -top-20 -left-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-cyan-500/20 transition-all duration-1000" />
      <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-blue-600/20 transition-all duration-1000" />

      {/* Main Terminal Box */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_-20px_rgba(0,0,0,0.5)]"
      >
        {/* Terminal Header */}
        <div className="flex justify-between items-center px-8 py-6 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-6">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
              <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
            </div>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.3em] text-white/40 uppercase">
              <Terminal className="w-3 h-3 text-cyan-500" />
              <span>Vector_Input_Node</span>
            </div>
          </div>

          <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
            {['python', 'java', 'javascript'].map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-4 py-1.5 rounded-lg font-mono text-[10px] uppercase tracking-widest transition-all ${
                  lang === l ? 'bg-cyan-500 text-black font-black shadow-[0_0_20px_#06b6d4]' : 'text-white/40 hover:text-white'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Code Input Area */}
        <div className="relative">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="// Paste legacy cryptographic implementation here..."
            className="w-full h-[450px] bg-transparent p-10 font-mono text-sm text-cyan-100/90 placeholder:text-white/10 focus:outline-none resize-none leading-relaxed"
          />
          
          {/* Decorative Corner Lines */}
          <div className="absolute top-4 right-4 text-white/5 font-mono text-[8px] flex flex-col items-end uppercase tracking-[0.2em]">
            <span>LN_AUTO_DETECT: ENABLED</span>
            <span>MEM_BUFFER: 0x442A</span>
          </div>
        </div>

        {/* Action Bar */}
        <div className="px-8 py-8 border-t border-white/5 bg-white/[0.01] flex justify-between items-center">
          <div className="flex gap-8">
            <div className="flex items-center gap-3">
              <Cpu className="w-4 h-4 text-cyan-500/50" />
              <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Core: Kyber-768</span>
            </div>
            <div className="flex items-center gap-3">
              <Code2 className="w-4 h-4 text-cyan-500/50" />
              <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Mode: Deep_Scan</span>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02, boxShadow: "0 0 40px rgba(6,182,212,0.4)" }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={isScanning}
            className={`flex items-center gap-4 px-10 py-4 rounded-2xl font-black uppercase tracking-[0.3em] text-xs transition-all ${
              isScanning 
                ? 'bg-white/5 text-white/20 cursor-wait border border-white/10' 
                : 'bg-cyan-500 text-black hover:bg-cyan-400'
            }`}
          >
            {isScanning ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-current" />
                Initiate Scan
              </>
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Animated Bottom Info Grid */}
      <div className="mt-8 grid grid-cols-3 gap-6 px-4 text-[9px] font-mono text-white/20 uppercase tracking-[0.2em]">
        <div className="flex items-center gap-2"><div className="w-1 h-1 bg-cyan-500 rounded-full" /> NIST-FIPS-203 COMPLIANT</div>
        <div className="flex items-center justify-center gap-2"><div className="w-1 h-1 bg-cyan-500 rounded-full" /> AES-GCM-256 ENCRYPTION</div>
        <div className="flex items-center justify-end gap-2"><div className="w-1 h-1 bg-cyan-500 rounded-full" /> END-TO-END VERIFIED</div>
      </div>
    </div>
  );
};

export default Scanner;