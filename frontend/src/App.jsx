import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from './firebase';
import { 
  LogOut, 
  ShieldCheck, 
  Activity, 
  Database, 
  Cpu, 
  Fingerprint,
  Github,
  Linkedin,
  Key 
} from 'lucide-react';

// Components
import { Login } from './components/Login';
import Dashboard from './components/Dashboard';
import Scanner from './components/Scanner';
import History from './components/History';
import ApiKeys from './components/ApiKeys'; 

function App() {
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [activeTab, setActiveTab] = useState('engine');
  
  const [scanData, setScanData] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [originalCode, setOriginalCode] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setScanData(null);
  };

  const handleScan = async (payload) => {
    setIsScanning(true);
    setOriginalCode(payload.vulnerable_code);
    setScanData(null);

    try {
      const token = await user.getIdToken();

      console.log("1. Sending payload to backend...", payload);
      const response = await fetch('https://cipher-sentinel.onrender.com/api/v1/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          language: payload.language || "java",
          vulnerable_code: payload.vulnerable_code,
          algorithm: "auto-detect", 
          variables: [],            
          in_transit: true          
        }),
      });

      if (!response.ok) throw new Error(`Initiate API Error: ${response.status}`);
      
      const data = await response.json();
      console.log("2. Backend accepted! Task ID:", data);
      
      const taskId = data.task_id || data.id; 
      if (!taskId) throw new Error("No Task ID returned from backend.");

      let isDone = false;
      let attempts = 0;

      while (!isDone && attempts < 20) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log(`3. Polling attempt ${attempts} for Task: ${taskId}`);
        const pollResponse = await fetch(`https://cipher-sentinel.onrender.com/api/v1/scan/${taskId}`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!pollResponse.ok) throw new Error(`Polling failed: ${pollResponse.status}`);

        const pollData = await pollResponse.json();
        console.log("4. Polling Result received:", pollData);

        if (!pollData) {
          console.warn("Backend returned null, waiting for next cycle...");
          continue; 
        }

        const currentStatus = pollData.status || pollData.task_status || pollData.state;
        
        if (currentStatus === 'SUCCESS' || currentStatus === 'COMPLETED') {
          console.log("5. TASK COMPLETE! Setting Dashboard Data...");
          const finalResult = pollData.result || pollData.task_result || pollData;
          setScanData(finalResult); 
          isDone = true;
        } else if (currentStatus === 'FAILED' || currentStatus === 'FAILURE') {
          console.error("Task failed on backend.");
          isDone = true;
        }
      }

    } catch (error) {
      console.error("Transmission Interrupted:", error);
    } finally {
      setIsScanning(false);
    }
  };

        if (!pollResponse.ok) throw new Error(`Polling failed: ${pollResponse.status}`);

        const pollData = await pollResponse.json();
        console.log("4. Polling Result received:", pollData);

        if (!pollData) {
          console.warn("Backend returned null, waiting for next cycle...");
          continue; 
        }

        const currentStatus = pollData.status || pollData.task_status || pollData.state;
        
        if (currentStatus === 'SUCCESS' || currentStatus === 'COMPLETED') {
          console.log("5. TASK COMPLETE! Setting Dashboard Data...");
          const finalResult = pollData.result || pollData.task_result || pollData;
          setScanData(finalResult); 
          isDone = true;
        } else if (currentStatus === 'FAILED' || currentStatus === 'FAILURE') {
          console.error("Task failed on backend.");
          isDone = true;
        }
      }

    } catch (error) {
      console.error("Transmission Interrupted:", error);
    } finally {
      setIsScanning(false);
    }
  };

  if (!isAuthReady) return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="text-cyan-500 font-mono tracking-[1em] uppercase text-xs"
      >
        Decrypting Core...
      </motion.div>
    </div>
  );

  if (!user) return <Login />;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-cyan-500/30 overflow-x-hidden relative flex flex-col">
      
      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div 
          animate={{ translateY: ['-100vh', '100vh'] }}
          transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
          className="w-full h-[2px] bg-cyan-500/20 shadow-[0_0_20px_#06b6d4] z-0"
        />
        <div className="absolute top-10 left-10 w-20 h-20 border-t-2 border-l-2 border-white/5" />
        <div className="absolute top-10 right-10 w-20 h-20 border-t-2 border-r-2 border-white/5" />
        <div className="absolute bottom-10 left-10 w-20 h-20 border-b-2 border-l-2 border-white/5" />
        <div className="absolute bottom-10 right-10 w-20 h-20 border-b-2 border-r-2 border-white/5" />
        <div className="absolute top-[-20%] right-[-10%] w-[70vw] h-[70vw] bg-cyan-900/10 rounded-full blur-[150px]" />
      </div>

      {/* Navbar */}
      <nav className="fixed top-8 left-1/2 -translate-x-1/2 w-[90%] max-w-6xl z-50 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-2xl px-8 py-4 flex justify-between items-center shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="relative">
            <ShieldCheck className="w-6 h-6 text-cyan-400" />
            <motion.div 
              animate={{ scale: [1, 1.5, 1], opacity: [0, 0.5, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="absolute inset-0 bg-cyan-400 rounded-full blur-md"
            />
          </div>
          <span className="font-black tracking-[0.5em] text-white text-lg">
            CIPHER<span className="text-cyan-400">SENTINEL</span>
          </span>
        </div>

        <div className="flex items-center gap-10">
          <div className="flex gap-2">
            {[
              { id: 'engine', label: 'PQC ENGINE', icon: Cpu },
              { id: 'archive', label: 'ARCHIVE', icon: Database },
              { id: 'keys', label: 'API KEYS', icon: Key } // 👈 Added API Keys Tab
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group relative px-6 py-2 flex items-center gap-2 transition-all ${activeTab === tab.id ? 'text-cyan-400' : 'text-white/40 hover:text-white'}`}
              >
                <tab.icon className={`w-4 h-4 transition-transform group-hover:scale-110`} />
                <span className="font-mono text-[10px] font-black tracking-widest uppercase">{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div layoutId="nav-line" className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-400 shadow-[0_0_15px_#22d3ee]" />
                )}
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-white/10" />

          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-[9px] text-white/30 font-mono tracking-widest uppercase mb-1">Authenticated</p>
              <p className="text-xs font-bold text-cyan-200">{user.email.split('@')[0]}</p>
            </div>
            <motion.button 
              whileHover={{ scale: 1.1, color: '#ef4444' }}
              onClick={handleLogout} 
              className="p-2 text-white/40 bg-white/5 rounded-lg border border-white/5 transition-all"
            >
              <LogOut className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 pt-40 px-8 pb-32 max-w-7xl mx-auto flex-1 w-full">
        <div className="grid grid-cols-4 gap-4 mb-12">
          {[
            { label: 'Engine Status', val: 'Online', color: 'text-emerald-400', icon: Activity },
            { label: 'Detection Method', val: 'Dual-Engine', color: 'text-cyan-400', icon: Cpu },
            { label: 'PQC Standard', val: 'FIPS-203', color: 'text-cyan-400', icon: ShieldCheck },
            { label: 'Audit Trail', val: 'Encrypted', color: 'text-slate-300', icon: Database }
          ].map((stat, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-[#1E293B] border border-slate-700 p-5 rounded-xl flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{stat.label}</p>
                <p className={`text-base font-bold uppercase ${stat.color}`}>{stat.val}</p>
              </div>
              <stat.icon className="w-6 h-6 text-slate-500" />
            </motion.div>
          ))}
        </div>

        {/* 👈 Updated Animation logic to support 3 distinct tabs */}
        <AnimatePresence mode="wait">
          {activeTab === 'engine' && (
            <motion.div 
              key="engine"
              initial={{ opacity: 0, x: -30 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: 30 }}
              transition={{ type: "spring", stiffness: 100 }}
            >
              {scanData ? (
                <Dashboard data={scanData} originalCode={originalCode} onReset={() => setScanData(null)} />
              ) : (
                <div className="relative group">
                   <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-3xl blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
                   <Scanner onScan={handleScan} isScanning={isScanning} />
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'archive' && (
            <motion.div 
              key="archive"
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 1.05 }}
              className="relative"
            >
              <History />
            </motion.div>
          )}

          {activeTab === 'keys' && (
            <motion.div 
              key="keys"
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 1.05 }}
              className="relative"
            >
              <ApiKeys />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Hybrid Footer */}
      <footer className="fixed bottom-0 left-0 w-full bg-[#0F172A]/90 backdrop-blur-md border-t border-slate-800 z-50">
        <div className="px-8 py-2 border-b border-slate-800/50 flex justify-between items-center text-[9px] font-mono tracking-widest text-cyan-500/70 uppercase">
          <div className="flex gap-6">
            <span className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse" /> SYSTEM READY
            </span>
            <span>LATENCY: 12ms</span>
            <span>CRYPT-CORE: v4.02</span>
          </div>
          <div className="flex items-center gap-2">
            <Fingerprint className="w-3 h-3 opacity-50" />
            <span>ENCRYPTED SESSION : {user?.uid?.substring(0,8) || '0x7F'}...A2</span>
          </div>
        </div>

        <div className="px-8 py-3 flex justify-between items-center text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-500" />
            <span className="font-bold text-slate-300 tracking-widest">
              Cipher<span className="text-cyan-500">Sentinel</span> © 2026
            </span>
          </div>

          <div className="text-slate-400 font-mono text-[10px] uppercase tracking-widest">
            Made by the Guy who got bored coz his girlfriend went to Mysore
          </div>

          <div className="flex items-center gap-5">
            <a href="#" className="hover:text-cyan-400 transition-colors"><Github className="w-4 h-4" /></a>
            <a href="#" className="hover:text-cyan-400 transition-colors"><Linkedin className="w-4 h-4" /></a>
          </div>
        </div>
      </footer>
      
    </div>
  );
}

export default App;
