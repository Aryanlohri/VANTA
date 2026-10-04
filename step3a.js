const fs = require('fs');

// 1. FirstRunGuide.tsx
const guide = `'use client';
import { useState, useEffect } from 'react';
import { GlowCard } from './dashboard/GlowCard';
import { CheckCircle2, ChevronRight, X, GitFork, Bot, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface FirstRunGuideProps {
  reposCount: number;
  reviewsCount: number;
}

export function FirstRunGuide({ reposCount, reviewsCount }: FirstRunGuideProps) {
  const [dismissed, setDismissed] = useState(true); // default true to prevent flash
  
  useEffect(() => {
    setDismissed(localStorage.getItem('vanta_first_run_dismissed') === 'true');
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('vanta_first_run_dismissed', 'true');
    setDismissed(true);
  };

  const step1Done = reposCount > 0;
  const step2Done = reviewsCount > 0;
  // Step 3 is reading the report (implicit once review is done, user will naturally click it)
  const isComplete = step2Done; 

  if (dismissed || isComplete) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
        className="mb-8"
      >
        <GlowCard className="p-6 relative overflow-hidden">
          <button 
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-[#616161] hover:text-[#e8e8e8] transition-colors"
            aria-label="Dismiss guide"
          >
            <X size={16} />
          </button>
          
          <div className="mb-6">
            <h3 className="text-[15px] font-bold text-[#e8e8e8] mb-1">Get started with VANTA</h3>
            <p className="text-[13px] text-[#898989]">Follow these steps to set up your AI code review pipeline.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
            {/* Connecting line on desktop */}
            <div className="hidden md:block absolute top-[28px] left-[15%] right-[15%] h-px bg-[var(--color-border)] z-0" />

            {/* Step 1 */}
            <div className="relative z-10 flex flex-col items-center text-center group">
              <div className="w-14 h-14 rounded-full bg-[#0a0a0a] border border-[var(--color-border)] flex items-center justify-center mb-4 transition-colors">
                {step1Done ? <CheckCircle2 className="text-[#22c55e]" size={24} /> : <GitFork className="text-[#e8e8e8]" size={24} />}
              </div>
              <h4 className="text-[13px] font-bold text-[#e8e8e8] mb-1">1. Connect a repository</h4>
              <p className="text-[12px] text-[#616161] mb-3">Link your codebase</p>
              {!step1Done && (
                <Link href="/dashboard/repositories" className="px-4 py-1.5 bg-white/10 hover:bg-white/15 text-[#e8e8e8] rounded-md text-[11px] font-medium tracking-wide uppercase transition-colors">
                  Connect
                </Link>
              )}
            </div>

            {/* Step 2 */}
            <div className={\`relative z-10 flex flex-col items-center text-center \${!step1Done ? 'opacity-50' : ''}\`}>
              <div className="w-14 h-14 rounded-full bg-[#0a0a0a] border border-[var(--color-border)] flex items-center justify-center mb-4">
                {step2Done ? <CheckCircle2 className="text-[#22c55e]" size={24} /> : <Bot className={step1Done ? "text-[#e8e8e8]" : "text-[#616161]"} size={24} />}
              </div>
              <h4 className="text-[13px] font-bold text-[#e8e8e8] mb-1">2. Run a review</h4>
              <p className="text-[12px] text-[#616161] mb-3">Trigger the AI analysis</p>
              {step1Done && !step2Done && (
                <Link href="/dashboard/reviews/new" className="px-4 py-1.5 bg-white/10 hover:bg-white/15 text-[#e8e8e8] rounded-md text-[11px] font-medium tracking-wide uppercase transition-colors">
                  New Review
                </Link>
              )}
            </div>

            {/* Step 3 */}
            <div className={\`relative z-10 flex flex-col items-center text-center \${!step2Done ? 'opacity-50' : ''}\`}>
              <div className="w-14 h-14 rounded-full bg-[#0a0a0a] border border-[var(--color-border)] flex items-center justify-center mb-4">
                <FileText className={step2Done ? "text-[#e8e8e8]" : "text-[#616161]"} size={24} />
              </div>
              <h4 className="text-[13px] font-bold text-[#e8e8e8] mb-1">3. Read the report</h4>
              <p className="text-[12px] text-[#616161] mb-3">Review the findings</p>
            </div>
          </div>
        </GlowCard>
      </motion.div>
    </AnimatePresence>
  );
}`;
fs.writeFileSync('client/src/components/ui/FirstRunGuide.tsx', guide);

// 2. Add empty states to List Pages (Reviews)
let revPage = fs.readFileSync('client/src/app/dashboard/reviews/page.tsx', 'utf8');
const revEmpty = `<div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#0a0a0a] border border-[var(--color-border)] flex items-center justify-center mb-6">
              <Bot size={28} className="text-[#616161]" />
            </div>
            <h3 className="text-[15px] font-bold text-[#e8e8e8] mb-2">No reviews found</h3>
            <p className="text-[13px] text-[#898989] max-w-sm mb-6">Your code review history will appear here. Start a new review to analyze your codebase.</p>
            <Link href="/dashboard/reviews/new" className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-[#e8e8e8] rounded-md text-[13px] font-medium tracking-wide transition-colors">
              New Review
            </Link>
          </div>`;
revPage = revPage.replace(/<div className="text-center py-20 text-\[\#616161\]">No reviews found.*<\/div>/, revEmpty);
// Ensure Bot and Link are imported
if (!revPage.includes("import { Bot")) {
  revPage = revPage.replace("import { Loader2", "import { Loader2, Bot");
}
fs.writeFileSync('client/src/app/dashboard/reviews/page.tsx', revPage);

// 3. Add empty states to Repositories
let repoPage = fs.readFileSync('client/src/app/dashboard/repositories/page.tsx', 'utf8');
const repoEmpty = `<div className="flex flex-col items-center justify-center py-20 text-center col-span-full">
              <div className="w-16 h-16 rounded-2xl bg-[#0a0a0a] border border-[var(--color-border)] flex items-center justify-center mb-6">
                <GitFork size={28} className="text-[#616161]" />
              </div>
              <h3 className="text-[15px] font-bold text-[#e8e8e8] mb-2">No repositories connected</h3>
              <p className="text-[13px] text-[#898989] max-w-sm mb-6">Connect a GitHub repository to begin tracking code quality and running AI reviews.</p>
              <button onClick={() => setShowConnect(true)} className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-[#e8e8e8] rounded-md text-[13px] font-medium tracking-wide transition-colors">
                Connect Repository
              </button>
            </div>`;
repoPage = repoPage.replace(/<div className="col-span-full text-center py-20 text-\[\#616161\]">No repositories connected.*<\/div>/, repoEmpty);
if (!repoPage.includes("import { GitFork")) {
  repoPage = repoPage.replace("import { FileCode", "import { FileCode, GitFork");
}
fs.writeFileSync('client/src/app/dashboard/repositories/page.tsx', repoPage);
