import React from 'react';
import {
  Shield, Lock, Server, Database, Cloud, Terminal,
  Cpu, Network, GitBranch, Binary, Globe, Activity,
  Radio, Key, AlertTriangle, Fingerprint
} from 'lucide-react';

export const TechBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#070B14] text-cyan-400">
      {/* Cyber Grid Background */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #06B6D4 1px, transparent 1px),
            linear-gradient(to bottom, #06B6D4 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Radial ambient glow gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-cyan-600/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-600/10 blur-[130px]" />
      <div className="absolute top-[40%] right-[20%] w-[35vw] h-[35vw] rounded-full bg-blue-600/8 blur-[140px]" />

      {/* Floating Animated Cybersecurity Icons */}
      <div className="absolute top-[12%] left-[8%] animate-float opacity-20 hover:opacity-40 transition-opacity">
        <Shield className="w-10 h-10 text-cyan-400" />
      </div>

      <div className="absolute top-[22%] right-[12%] animate-float-delayed opacity-20">
        <Lock className="w-9 h-9 text-purple-400" />
      </div>

      <div className="absolute top-[65%] left-[14%] animate-float-slow opacity-20">
        <Server className="w-11 h-11 text-blue-400" />
      </div>

      <div className="absolute bottom-[18%] right-[18%] animate-float opacity-25">
        <Database className="w-10 h-10 text-cyan-400" />
      </div>

      <div className="absolute top-[38%] left-[22%] animate-float-delayed opacity-15">
        <Cloud className="w-8 h-8 text-sky-400" />
      </div>

      <div className="absolute top-[80%] left-[35%] animate-float opacity-20">
        <Terminal className="w-9 h-9 text-emerald-400" />
      </div>

      <div className="absolute top-[18%] left-[45%] animate-float-slow opacity-20">
        <Cpu className="w-12 h-12 text-purple-400" />
      </div>

      <div className="absolute bottom-[30%] left-[8%] animate-float-delayed opacity-15">
        <Network className="w-10 h-10 text-cyan-300" />
      </div>

      <div className="absolute top-[48%] right-[8%] animate-float opacity-20">
        <GitBranch className="w-9 h-9 text-pink-400" />
      </div>

      <div className="absolute bottom-[12%] left-[55%] animate-float-slow opacity-15">
        <Binary className="w-10 h-10 text-cyan-400" />
      </div>

      <div className="absolute top-[8%] right-[32%] animate-float-delayed opacity-20">
        <Fingerprint className="w-9 h-9 text-teal-400" />
      </div>

      <div className="absolute top-[60%] right-[30%] animate-float opacity-15">
        <Radio className="w-8 h-8 text-indigo-400" />
      </div>

      {/* Floating Binary Code Streams */}
      <div className="absolute top-[15%] left-[75%] font-mono text-xs text-cyan-500/15 select-none leading-relaxed hidden md:block">
        01001001 01000100 01010011<br />
        01010011 01001111 01000011<br />
        01001101 01001100 01010000<br />
        01010111 01000001 01000110
      </div>

      <div className="absolute bottom-[20%] left-[30%] font-mono text-xs text-purple-500/15 select-none leading-relaxed hidden lg:block">
        [ANOMALY_ENGINE: ACTIVE]<br />
        [ISO_FOREST: TRAINED]<br />
        [RULES: 8 ENFORCED]<br />
        [MITRE: ATT&CK v14]
      </div>
    </div>
  );
};
