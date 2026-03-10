import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, ShieldCheck, Activity, ArrowRight, Code2, Download, AlertTriangle } from 'lucide-react';
import jsPDF from 'jspdf';

const Dashboard = ({ data, originalCode, onReset }) => {
  if (!data || !data.risk_profile || !data.remediation) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-quantum-800/80 backdrop-blur-xl border border-quantum-alert/50 p-8 rounded-2xl text-center max-w-lg mx-auto mt-10 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
        <ShieldAlert className="w-16 h-16 text-quantum-alert mx-auto mb-4 animate-pulse" />
        <h2 className="text-2xl font-black text-slate-100 mb-2 tracking-widest uppercase">Payload Error</h2>
        <p className="text-slate-400 mb-6 font-mono text-sm">The backend AI engine failed to return a valid JSON structure.</p>
        <button onClick={onReset} className="bg-quantum-alert hover:bg-red-500 text-white font-bold px-8 py-3 rounded-xl transition-colors tracking-widest uppercase">Return to Scanner</button>
      </motion.div>
    );
  }

  const { risk_profile, remediation } = data;
  const isCritical = risk_profile.score >= 75;

  // 🛠️ BUG FIX 1: Forcefully un-escape the LLM's double-escaped newlines
  const formatCode = (codeStr) => {
    if (!codeStr) return "AI failed to generate code.";
    return codeStr.replace(/\\n/g, '\n').replace(/\\"/g, '"');
  };

  const safeCode = formatCode(remediation.code_snippet);
  
  // 🛠️ BUG FIX 2: Default Fallback if the AI is lazy and forgets the migration plan
  const migrationWarning = remediation.migration_plan || 
    "WARNING: Upgrading to PQC standards (like ML-KEM) drastically increases key and ciphertext sizes compared to RSA/ECC. Ensure your database schemas (VARCHAR -> TEXT) and network packet limits are updated.";

  // 📄 ENTERPRISE GRADE VISUAL PDF GENERATOR
  const generatePDF = () => {
    const doc = new jsPDF();
    let yPos = 0;
    const margin = 14;
    const pageWidth = 210;
    const pageHeight = 297; 
    const contentWidth = pageWidth - margin * 2;

    const checkPageBreak = (neededHeight) => {
      if (yPos + neededHeight >= pageHeight - 20) {
        doc.addPage();
        yPos = 20;
      }
    };

    // --- COVER & HEADER ---
    doc.setFillColor(15, 23, 42); 
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(6, 182, 212); 
    doc.setFont("helvetica", "bold"); doc.setFontSize(24); 
    doc.text("CipherSentinel", margin, 22);
    doc.setTextColor(200, 200, 200); doc.setFont("helvetica", "normal"); doc.setFontSize(12); 
    doc.text("Official Post-Quantum Cryptography Audit", margin, 30);

    yPos = 55; 

    // --- 1. VISUAL EXECUTIVE SUMMARY ---
    doc.setTextColor(0, 0, 0); 
    doc.setFont("helvetica", "bold"); doc.setFontSize(16); 
    doc.text("1. Executive Summary", margin, yPos);
    
    yPos += 15;
    
    // Determine Colors (Red for Critical/High, Green for Safe)
    const isCrit = risk_profile.score >= 50;
    const r = isCrit ? 239 : 16;
    const g = isCrit ? 68 : 185;
    const b = isCrit ? 68 : 129;

    // Draw Score Circle
    doc.setLineWidth(1.5);
    doc.setDrawColor(r, g, b);
    doc.setFillColor(250, 250, 250);
    doc.circle(margin + 20, yPos + 12, 16, 'FD'); // x, y, radius, style

    // Draw Score Text Inside Circle
    doc.setFontSize(24);
    doc.setTextColor(r, g, b);
    const scoreStr = risk_profile.score.toString();
    const textWidth = doc.getTextWidth(scoreStr);
    doc.text(scoreStr, margin + 20 - (textWidth / 2), yPos + 15);

    // Draw Severity Label under circle
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    const sevStr = `${risk_profile.severity} RISK`;
    const sevWidth = doc.getTextWidth(sevStr);
    doc.text(sevStr, margin + 20 - (sevWidth / 2), yPos + 36);

    // Draw Threat Vector Progress Bars (Right Side)
    const barX = margin + 60;
    const barW = contentWidth - 65;
    
    // Algo Vuln Bar
    doc.setTextColor(100, 100, 100); doc.setFontSize(10);
    doc.text(`Algorithm Vulnerability (${Math.round(risk_profile.metrics.algorithm_vulnerability * 100)}%)`, barX, yPos);
    doc.setFillColor(230, 230, 230); doc.rect(barX, yPos + 3, barW, 5, 'F'); // Background
    doc.setFillColor(239, 68, 68); doc.rect(barX, yPos + 3, barW * risk_profile.metrics.algorithm_vulnerability, 5, 'F'); // Red Fill

    // Data Sensitivity Bar
    doc.setTextColor(100, 100, 100);
    doc.text(`Data Sensitivity Weight (${Math.round(risk_profile.metrics.data_sensitivity * 100)}%)`, barX, yPos + 18);
    doc.setFillColor(230, 230, 230); doc.rect(barX, yPos + 21, barW, 5, 'F'); // Background
    doc.setFillColor(249, 115, 22); doc.rect(barX, yPos + 21, barW * risk_profile.metrics.data_sensitivity, 5, 'F'); // Orange Fill

    yPos += 55; // Push content down past the visual UI block

    // --- 2. THREAT ANALYSIS ---
    checkPageBreak(30);
    doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "bold"); doc.setFontSize(14);
    doc.text("2. Threat Vector Analysis", margin, yPos);
    yPos += 7; 
    doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    const splitExplanation = doc.splitTextToSize(remediation.vulnerability_explanation || "No explanation provided.", contentWidth);
    doc.text(splitExplanation, margin, yPos); 
    yPos += (splitExplanation.length * 5) + 10;

    // --- 3. ARCHITECTURAL IMPACT WARNING ---
    checkPageBreak(30);
    doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.setTextColor(234, 88, 12); 
    doc.text("3. Architectural Migration Impact", margin, yPos);
    yPos += 7;
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(0, 0, 0); 
    const splitWarning = doc.splitTextToSize(migrationWarning, contentWidth);
    doc.text(splitWarning, margin, yPos);
    yPos += (splitWarning.length * 5) + 12;

    // --- CODE BLOCK RENDERING ENGINE (Bulletproofed for Newlines) ---
    const printCodeBlock = (title, codeString) => {
      checkPageBreak(20);
      doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(0, 0, 0);
      doc.text(title, margin, yPos); yPos += 8;

      doc.setFont("courier", "normal"); doc.setFontSize(8.5); doc.setTextColor(50, 50, 50);
      
      // 🛠️ Force replace literal '\n' text into actual line breaks before splitting
      const safeString = codeString ? codeString.replace(/\\n/g, '\n').replace(/\\"/g, '"') : "No code provided.";
      const lines = safeString.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const wrappedLines = doc.splitTextToSize(lines[i] || " ", contentWidth);
        for (let j = 0; j < wrappedLines.length; j++) {
            checkPageBreak(10);
            doc.text(wrappedLines[j], margin + 2, yPos);
            yPos += 4.5; 
        }
      }
      yPos += 10;
    };

    // Print the codes!
    printCodeBlock("4. Legacy Implementation Payload:", originalCode);
    
    checkPageBreak(25);
    doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(0, 0, 0);
    const splitAlgo = doc.splitTextToSize(`Recommended PQC Standard: ${remediation.recommended_algorithm}`, contentWidth);
    doc.text(splitAlgo, margin, yPos); 
    yPos += (splitAlgo.length * 5) + 6;

    printCodeBlock("5. Secure PQC Remediation Code:", safeCode);

    // --- FOOTER & PAGINATION ---
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setDrawColor(200, 200, 200); doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
        doc.setFontSize(9); doc.setFont("helvetica", "italic"); doc.setTextColor(150, 150, 150); 
        doc.text(`Generated by CipherSentinel | Page ${i} of ${totalPages}`, margin, pageHeight - 9);
        
        if (i === totalPages) {
            doc.setFont("helvetica", "normal");
            doc.text("Eng: Aditya J Shettigar", pageWidth - 80, pageHeight - 9);
            doc.setTextColor(6, 182, 212); 
            doc.textWithLink("GitHub", pageWidth - 35, pageHeight - 9, { url: "https://github.com/adityajshettigar" });
            doc.textWithLink("LinkedIn", pageWidth - 20, pageHeight - 9, { url: "https://www.linkedin.com/in/aditya-j-shettigar" });
        }
    }

    doc.save(`CipherSentinel_Enterprise_Audit_${new Date().getTime()}.pdf`);
  };

  // 🎬 Staggered Animation Configuration
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="w-full max-w-6xl mx-auto space-y-6">
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Risk Score Card - 3D Hover */}
        <motion.div variants={itemVariants} whileHover={{ scale: 1.02, rotateY: 5, rotateX: 5 }} style={{ perspective: 1000 }} className="bg-quantum-800/60 backdrop-blur-2xl border border-quantum-700/50 p-6 rounded-[2rem] flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
          <div className={`absolute top-0 w-full h-1.5 ${isCritical ? 'bg-quantum-alert shadow-[0_0_20px_#EF4444]' : 'bg-quantum-safe shadow-[0_0_20px_#10B981]'}`}></div>
          <h3 className="text-slate-400 font-bold mb-4 tracking-widest text-sm uppercase">Vulnerability Score</h3>
          <div className="relative flex items-center justify-center w-36 h-36 rounded-full border-8 border-quantum-900 shadow-inner bg-quantum-950/50">
            <span className={`text-6xl font-black ${isCritical ? 'text-quantum-alert drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]' : 'text-quantum-safe drop-shadow-[0_0_15px_rgba(16,185,129,0.8)]'}`}>
              {risk_profile.score}
            </span>
          </div>
          <p className={`mt-6 font-black tracking-[0.2em] text-xl ${isCritical ? 'text-quantum-alert' : 'text-quantum-safe'}`}>
            {risk_profile.severity} RISK
          </p>
        </motion.div>

        {/* Threat Metrics Card */}
        <motion.div variants={itemVariants} className="col-span-2 bg-quantum-800/60 backdrop-blur-2xl border border-quantum-700/50 p-8 rounded-[2rem] shadow-2xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-quantum-accent/10 rounded-lg"><Activity className="text-quantum-accent w-6 h-6" /></div>
            <h3 className="text-xl font-bold text-white tracking-widest uppercase">Threat Vector Metrics</h3>
          </div>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2 font-bold tracking-wider">
                <span className="text-slate-400 uppercase">Algorithm Vulnerability</span>
                <span className="text-quantum-accent">{risk_profile.metrics.algorithm_vulnerability * 100}%</span>
              </div>
              <div className="w-full bg-quantum-950 rounded-full h-3 overflow-hidden shadow-inner border border-quantum-800">
                <motion.div initial={{ width: 0 }} animate={{ width: `${risk_profile.metrics.algorithm_vulnerability * 100}%` }} transition={{ duration: 1, delay: 0.5 }} className="bg-gradient-to-r from-quantum-alert to-orange-500 h-full rounded-full"></motion.div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2 font-bold tracking-wider">
                <span className="text-slate-400 uppercase">Data Sensitivity Weight</span>
                <span className="text-orange-400">{risk_profile.metrics.data_sensitivity * 100}%</span>
              </div>
              <div className="w-full bg-quantum-950 rounded-full h-3 overflow-hidden shadow-inner border border-quantum-800">
                <motion.div initial={{ width: 0 }} animate={{ width: `${risk_profile.metrics.data_sensitivity * 100}%` }} transition={{ duration: 1, delay: 0.7 }} className="bg-gradient-to-r from-orange-500 to-yellow-500 h-full rounded-full"></motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Code & Remediation Section */}
      <motion.div variants={itemVariants} className="bg-quantum-800/60 backdrop-blur-2xl border border-quantum-700/50 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
        
        {/* Architectural Warning Box (Now Guaranteed to Show) */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }}
          className="mb-8 bg-gradient-to-r from-orange-950/80 to-quantum-900 border-l-4 border-orange-500 rounded-r-xl p-5 shadow-lg relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.03)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] pointer-events-none"></div>
          <div className="flex items-start gap-4 relative z-10">
            <AlertTriangle className="w-8 h-8 text-orange-400 flex-shrink-0 animate-pulse" />
            <div>
              <h4 className="text-orange-400 font-black mb-1 tracking-widest uppercase text-sm">Architectural Impact Warning</h4>
              <p className="text-orange-100/80 text-sm leading-relaxed font-mono">
                {migrationWarning}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Side-by-Side Code View with Laser Scanners */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Legacy Code */}
          <div className="border border-quantum-alert/30 rounded-2xl overflow-hidden shadow-lg relative group">
            <div className="bg-quantum-alert/15 px-5 py-3 border-b border-quantum-alert/30 flex items-center gap-3 backdrop-blur-md">
              <ShieldAlert className="w-5 h-5 text-quantum-alert" />
              <span className="text-sm font-bold text-quantum-alert tracking-widest uppercase">Legacy Payload</span>
            </div>
            <div className="relative h-72 bg-[#0A0F1C] overflow-hidden">
              <pre className="p-5 text-slate-300 font-mono text-xs md:text-sm overflow-auto h-full whitespace-pre-wrap relative z-10">
                {originalCode}
              </pre>
            </div>
          </div>

          {/* Secure Code */}
          <div className="border border-quantum-safe/40 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.1)] relative group">
            <div className="bg-quantum-safe/15 px-5 py-3 border-b border-quantum-safe/40 flex items-center gap-3 backdrop-blur-md">
              <ShieldCheck className="w-5 h-5 text-quantum-safe" />
              <span className="text-sm font-bold text-quantum-safe tracking-widest uppercase">PQC Standard: {remediation.recommended_algorithm}</span>
            </div>
            <div className="relative h-72 bg-[#0A0F1C] overflow-hidden">
               {/* Holographic Laser Scan Effect */}
               <motion.div 
                animate={{ y: [-10, 300, -10] }} 
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 right-0 h-10 bg-gradient-to-b from-transparent via-quantum-safe/20 to-transparent z-20 pointer-events-none border-b border-quantum-safe/50"
              />
              <pre className="p-5 text-quantum-safe font-mono text-xs md:text-sm overflow-auto h-full whitespace-pre-wrap relative z-10">
                {safeCode}
              </pre>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Action Bar */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-center gap-6 mt-10">
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onReset} className="bg-quantum-900 hover:bg-quantum-800 border-2 border-quantum-700 text-slate-200 font-bold py-3 px-8 rounded-xl transition-colors flex items-center justify-center gap-3 tracking-widest uppercase shadow-lg">
          Analyze Next Payload <ArrowRight className="w-5 h-5" />
        </motion.button>
        
        <motion.button whileHover={{ scale: 1.05, boxShadow: "0px 0px 30px rgba(6,182,212,0.6)" }} whileTap={{ scale: 0.95 }} onClick={generatePDF} className="bg-gradient-to-r from-quantum-accent to-blue-600 text-white font-black py-3 px-8 rounded-xl transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(6,182,212,0.3)] tracking-widest uppercase">
          <Download className="w-5 h-5" /> Export Audit PDF
        </motion.button>
      </motion.div>

    </motion.div>
  );
};

export default Dashboard;