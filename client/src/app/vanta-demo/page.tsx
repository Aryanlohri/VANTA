'use client';

import { useState } from 'react';
import { VantaMark } from '@/components/ui/VantaMark';
import { VantaLogo } from '@/components/ui/VantaLogo';

export default function VantaDemoPage() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#050505] text-[#e8e8e8] p-12 font-sans flex flex-col gap-16">
      <div>
        <h1 className="text-xl font-bold mb-6 text-[#616161]">VantaMark Sizes</h1>
        <div className="flex items-center gap-8 border border-[var(--color-border)] p-8 rounded-xl bg-[#0a0a0a]">
          <div className="flex flex-col items-center gap-2">
            <VantaMark size={24} />
            <span className="text-xs text-[#616161]">24px</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <VantaMark size={28} />
            <span className="text-xs text-[#616161]">28px (Default)</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <VantaMark size={40} />
            <span className="text-xs text-[#616161]">40px</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <VantaMark size={120} />
            <span className="text-xs text-[#616161]">120px (Inspection)</span>
          </div>
        </div>
      </div>

      <div>
        <h1 className="text-xl font-bold mb-6 text-[#616161]">VantaLogo Morph Toggle</h1>
        <div className="border border-[var(--color-border)] p-8 rounded-xl bg-[#0a0a0a] flex flex-col items-start gap-8">
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="px-4 py-2 border border-[var(--color-border)] rounded-md text-sm hover:bg-white/5 transition-colors"
          >
            Toggle Collapsed (Currently: {collapsed ? 'True' : 'False'})
          </button>

          {/* Simulate 64px vs 240px rail */}
          <div className="flex border border-[#333] border-dashed">
            <div 
              className="h-16 flex items-center border-r border-[#333] border-dashed transition-all duration-500 overflow-hidden"
              style={{ width: collapsed ? 64 : 240 }}
            >
              {/* VantaLogo internally handles the morph smoothly */}
              {/* To perfectly center the V in the 64px rail when collapsed, we add padding or justify. */}
              {/* In the real Sidebar, we use specific layouts to center it. */}
              <div className="px-4 flex w-[240px]">
                <div className={`flex items-center h-8 shrink-0 ${collapsed ? "w-8 justify-center" : "justify-start"}`}>
                  <VantaLogo collapsed={collapsed} />
                </div>
              </div>
            </div>
            <div className="h-16 flex items-center px-4 text-[#616161] text-sm">
              Content Area
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
