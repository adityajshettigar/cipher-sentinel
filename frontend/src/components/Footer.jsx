import React from 'react';
import { motion } from 'framer-motion';
import { Github, Linkedin, ShieldAlert } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  // HCI Principle: Delightful micro-interactions on hover
  const iconVariants = {
    hover: { scale: 1.2, rotate: 5, color: '#06B6D4', transition: { type: 'spring', stiffness: 300 } },
    tap: { scale: 0.9 }
  };

  return (
    <footer className="w-full border-t border-quantum-700 bg-quantum-800/50 backdrop-blur-md py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
        
        {/* Left Side: Branding */}
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-quantum-accent" />
          <span className="font-semibold text-slate-300 tracking-wide">
            Cipher<span className="text-quantum-accent">Sentinel</span>
          </span>
          <span className="text-slate-500 text-sm ml-2">© {currentYear}</span>
        </div>

        {/* Center: Creator Info */}
        <div className="text-center">
          <p className="text-sm text-slate-400">
            Made by the Guy who got bored coz his girlfriend went to Mysore
          </p>
          <p className="text-base font-medium text-slate-200 mt-1">
            [Aditya J Shettigar]
          </p>
        </div>

        {/* Right Side: Interactive Socials */}
        <div className="flex gap-6 items-center">
          <motion.a 
            href="https://github.com/adityajshettigar" 
            target="_blank" 
            rel="noopener noreferrer"
            variants={iconVariants}
            whileHover="hover"
            whileTap="tap"
            className="text-slate-400"
            aria-label="GitHub Profile"
          >
            <Github className="w-6 h-6" />
          </motion.a>
          
          <motion.a 
            href="https://www.linkedin.com/in/aditya-j-shettigar" 
            target="_blank" 
            rel="noopener noreferrer"
            variants={iconVariants}
            whileHover="hover"
            whileTap="tap"
            className="text-slate-400"
            aria-label="LinkedIn Profile"
          >
            <Linkedin className="w-6 h-6" />
          </motion.a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;