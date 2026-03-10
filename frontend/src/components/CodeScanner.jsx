import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Code2, ScanLine, ShieldCheck, Loader2, UploadCloud, FileCode2 } from 'lucide-react';
import axios from 'axios';

const CodeScanner = ({ onScanComplete }) => {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('Java');
  const [isScanning, setIsScanning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const processFile = (file) => {
    if (!file) return;
    if (file.name.endsWith('.java')) setLanguage('Java');
    else if (file.name.endsWith('.py')) setLanguage('Python');
    else if (file.name.endsWith('.cpp') || file.name.endsWith('.c')) setLanguage('C++');

    const reader = new FileReader();
    reader.onload = (event) => setCode(event.target.result);
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    processFile(e.dataTransfer.files[0]);
  };

  const handleScan = async () => {
    if (!code.trim()) return;
    setIsScanning(true);
    
    try {
      const res = await axios.post('http://127.0.0.1:8000/api/v1/scan', {
        language: language,
        vulnerable_code: code,
        algorithm: "Auto", // Let the backend AST figure it out
        variables: [],     // Let the backend AST figure it out
        in_transit: true
      });
      const taskId = res.data.task_id;

      const pollInterval = setInterval(async () => {
        const statusRes = await axios.get(`http://127.0.0.1:8000/api/v1/scan/${taskId}`);
        if (statusRes.data.status === "DONE") {
          clearInterval(pollInterval);
          setIsScanning(false);
          if (onScanComplete) onScanComplete(statusRes.data.data, code);
        }
      }, 2000);
    } catch (error) {
      console.error("Scanning failed:", error);
      setIsScanning(false);
      alert("Backend connection failed.");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      whileHover={{ boxShadow: "0px 20px 50px -10px rgba(6, 182, 212, 0.3)" }}
      className="w-full max-w-4xl mx-auto bg-quantum-800/60 backdrop-blur-3xl border border-quantum-700/80 rounded-[2rem] shadow-2xl overflow-hidden transition-all duration-300"
    >
      {/* Header */}
      <div className="bg-quantum-900/80 px-8 py-6 border-b border-quantum-700/50 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <motion.div whileHover={{ rotate: 180 }} transition={{ duration: 0.3 }} className="p-3 bg-gradient-to-br from-quantum-accent to-blue-600 rounded-xl shadow-lg shadow-cyan-500/30">
            <Code2 className="text-white w-6 h-6" />
          </motion.div>
          <h2 className="text-xl font-bold text-white tracking-widest uppercase">Payload Scanner</h2>
        </div>
        
        <select 
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="bg-quantum-950 border border-quantum-600 text-quantum-accent font-bold text-sm rounded-xl focus:ring-2 focus:ring-quantum-accent focus:outline-none cursor-pointer px-4 py-2 hover:bg-quantum-800 transition-colors shadow-inner"
        >
          <option value="Java">JAVA</option>
          <option value="Python">PYTHON</option>
          <option value="C++">C / C++</option>
        </select>
      </div>

      <div className="p-8">
        <input type="file" ref={fileInputRef} onChange={(e) => processFile(e.target.files[0])} className="hidden" accept=".java,.py,.cpp,.c,.txt" />

        {/* The Cyber-Grid Dropzone */}
        <motion.div 
          className="relative group rounded-2xl overflow-hidden shadow-inner border-2 border-transparent transition-colors duration-300"
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          animate={{ borderColor: isDragging ? "#06B6D4" : "rgba(31, 41, 55, 0.5)" }}
        >
          {/* Animated Edge Glow on Focus/Hover */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-quantum-accent via-blue-500 to-purple-600 rounded-2xl opacity-0 group-hover:opacity-30 group-focus-within:opacity-50 transition duration-500 blur"></div>
          
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder='Drop .java / .py file here, or paste vulnerable code...'
            className="relative w-full h-80 bg-[#0A0F1C] text-cyan-50 font-mono text-base p-6 rounded-2xl outline-none resize-none z-10 leading-relaxed custom-scrollbar bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]"
            spellCheck="false"
          />

          {/* Extreme Magnetic Drop Overlay */}
          <AnimatePresence>
            {isDragging && (
              <motion.div 
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="absolute inset-0 z-20 bg-quantum-900/90 backdrop-blur-lg flex flex-col items-center justify-center pointer-events-none"
              >
                <motion.div animate={{ y: [0, -15, 0] }} transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}>
                  <UploadCloud className="w-24 h-24 text-quantum-accent drop-shadow-[0_0_25px_rgba(6,182,212,0.8)]" />
                </motion.div>
                <h3 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 tracking-widest mt-6">DROP TO ANALYZE</h3>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Action Bar */}
        <div className="mt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          
          <div className="flex gap-4 items-center">
            <motion.button 
              whileHover={{ scale: 1.05, textShadow: "0px 0px 8px rgba(255,255,255,0.5)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => fileInputRef.current.click()}
              className="text-sm font-bold text-slate-300 hover:text-white transition-colors flex items-center gap-2 bg-quantum-700/50 px-4 py-2 rounded-xl"
            >
              <UploadCloud className="w-5 h-5" /> BROWSE FILES
            </motion.button>
            <motion.div 
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="flex items-center gap-2 text-xs text-quantum-safe bg-quantum-safe/10 px-4 py-2 rounded-xl border border-quantum-safe/30"
            >
              <ShieldCheck className="w-4 h-4" />
              <span className="font-bold tracking-widest">PQC ENGINE ACTIVE</span>
            </motion.div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0px 0px 30px rgba(6,182,212,0.6)" }}
            whileTap={{ scale: 0.95 }}
            onClick={handleScan}
            disabled={isScanning || !code.trim()}
            className="w-full md:w-auto bg-gradient-to-r from-quantum-accent to-blue-600 text-white font-black py-4 px-10 rounded-xl transition-all disabled:opacity-50 disabled:grayscale flex justify-center items-center gap-3 uppercase tracking-[0.15em]"
          >
            {isScanning ? (
              <><Loader2 className="w-6 h-6 animate-spin" /> EXTRACTING AST...</>
            ) : (
              <><ScanLine className="w-6 h-6" /> INITIATE SCAN</>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default CodeScanner;