import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '../firebase';
import { 
  Clock, Search, Terminal as TerminalIcon, ChevronRight, Fingerprint, X, ShieldAlert, Cpu
} from 'lucide-react';

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedScan, setSelectedScan] = useState(null); // 👈 New state for the modal

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = await auth.currentUser.getIdToken();
        const response = await fetch('http://127.0.0.1:8000/api/v1/history', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (Array.isArray(data)) setHistory(data);
      } catch (err) {
        console.error("Archive fetch failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center mt-32 text-cyan-500 gap-6">
      <div className="relative"><Clock className="w-12 h-12 animate-[spin_3s_linear_infinite]" /></div>
      <p className="font-mono text-[10px] uppercase tracking-[0.5em] animate-pulse">Accessing Encrypted Nodes...</p>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-1000">
      <div className="flex justify-between items-end mb-12 px-2">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter mb-2">ARCHIVE_LOGS</h2>
          <div className="flex items-center gap-3 text-cyan-500/50 font-mono text-[10px] uppercase tracking-widest">
            <TerminalIcon className="w-3 h-3" />
            <span>Post-Quantum Audit Trail // Session: {auth.currentUser?.uid?.slice(0,8)}</span>
          </div>
        </div>
      </div>

      {/* The Tactical Table */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-cyan-500/20 rounded-[2rem] blur-2xl opacity-0 group-hover:opacity-100 transition duration-1000" />
        <div className="relative bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="p-6 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Timestamp</th>
                <th className="p-6 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Target</th>
                <th className="p-6 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Risk Profile</th>
                <th className="p-6 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Remediation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {history.map((scan, idx) => {
                const isVulnerable = scan.risk_score > 0 || scan.severity === "HIGH";
                let remediationText = scan.remediation_data?.recommended_algorithm || scan.remediation_data?.migration_plan || "Verified Secure Standard";

                return (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                    key={scan.id || idx} 
                    onClick={() => setSelectedScan(scan)} // 👈 Triggers the modal
                    className="hover:bg-cyan-500/[0.05] transition-all group/row cursor-pointer"
                  >
                    <td className="p-6 font-mono text-xs text-cyan-100/70">
                      <span className="text-cyan-500/40 mr-2">[{idx + 1}]</span>
                      {new Date(scan.created_at || Date.now()).toLocaleString()}
                    </td>
                    <td className="p-6">
                      <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-bold text-slate-300 tracking-tighter uppercase">
                        {scan.algorithm_scanned || scan.language || 'UNKNOWN'}
                      </span>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-1.5 h-1.5 rounded-full ${isVulnerable ? 'bg-red-500 animate-pulse shadow-[0_0_10px_#ef4444]' : 'bg-emerald-500 shadow-[0_0_10px_#10b981]'}`} />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${isVulnerable ? 'text-red-400' : 'text-emerald-400'}`}>
                          {isVulnerable ? `Score: ${scan.risk_score} (CRITICAL)` : 'Verified_Secure'}
                        </span>
                      </div>
                    </td>
                    <td className="p-6 text-slate-400 font-mono text-[10px] italic flex justify-between items-center">
                      <span className="truncate max-w-md">{remediationText}</span>
                      <ChevronRight className="w-4 h-4 text-white/0 group-hover/row:text-cyan-500 group-hover/row:translate-x-1 transition-all" />
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- THE AUDIT MODAL (TIME MACHINE) --- */}
      <AnimatePresence>
        {selectedScan && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-[#0f172a] border border-cyan-500/30 rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-y-auto shadow-[0_0_50px_rgba(6,182,212,0.15)] relative"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-[#0f172a]/90 backdrop-blur-md border-b border-white/10 p-6 flex justify-between items-center z-10">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${selectedScan.risk_score > 0 ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                    {selectedScan.risk_score > 0 ? <ShieldAlert className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-wider">Audit Report: {selectedScan.algorithm_scanned}</h3>
                    <p className="font-mono text-[10px] text-slate-400 uppercase tracking-widest">{new Date(selectedScan.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedScan(null)} className="p-2 text-white/40 hover:text-white bg-white/5 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-8 space-y-8">
                {/* AI Explanation */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-cyan-400 font-mono text-[10px] uppercase tracking-widest mb-2">
                    <Cpu className="w-3 h-3" /> AI Threat Analysis
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed bg-white/[0.02] p-4 rounded-xl border border-white/5">
                    {selectedScan.remediation_data?.vulnerability_explanation || "No advanced threat data available for this sector."}
                  </p>
                </div>

                {/* Code Snippet */}
                {selectedScan.remediation_data?.code_snippet && (
                  <div className="space-y-2">
                     <div className="flex items-center gap-2 text-slate-400 font-mono text-[10px] uppercase tracking-widest mb-2">
                        <TerminalIcon className="w-3 h-3" /> Intercepted Payload
                      </div>
                    <pre className="p-4 rounded-xl bg-black/50 border border-slate-800 overflow-x-auto">
                      <code className="text-xs font-mono text-cyan-100/70">{selectedScan.remediation_data.code_snippet}</code>
                    </pre>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default History;