import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Fingerprint } from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

export const Login = () => { // 👈 Named export right here

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4 relative overflow-hidden">
      {/* HUD Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20"></div>
      
      {/* Riviera Glow Orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="bg-black/40 backdrop-blur-3xl border border-white/10 p-12 rounded-[2.5rem] shadow-2xl max-w-md w-full relative z-10 flex flex-col items-center text-center"
      >
        <div className="w-20 h-20 bg-black/60 border border-cyan-500/30 rounded-2xl flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
          <Shield className="w-10 h-10 text-cyan-500" />
        </div>
        
        <h1 className="text-3xl font-black text-white tracking-[0.3em] uppercase mb-2">CIPHERSENTINEL</h1>
        <p className="text-cyan-500/50 text-[10px] mb-10 tracking-[0.5em] uppercase font-bold">Post-Quantum Neural Link</p>

        <p className="text-slate-400 mb-10 font-mono text-xs leading-relaxed">
          SECURE_AUTH_REQUIRED TO ACCESS <br/> THE PQC ANALYSIS ENGINE.
        </p>

        <motion.button 
          whileHover={{ scale: 1.02, boxShadow: "0px 0px 30px rgba(6,182,212,0.3)" }}
          whileTap={{ scale: 0.98 }}
          onClick={handleGoogleLogin}
          className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-black py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-4 tracking-widest uppercase text-xs"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
          Authorize via Google
        </motion.button>
        
        <div className="mt-10 flex items-center gap-2 text-white/20 text-[10px] font-mono tracking-widest uppercase">
          <Fingerprint className="w-4 h-4" />
          <span>Vector-Shield Protocol v4.0</span>
        </div>
      </motion.div>
    </div>
  );
};