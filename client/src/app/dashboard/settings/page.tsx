
'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Save, Bot, Shield, Zap, Sliders, Check, FileCode, Github, Bell, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '@/lib/auth';
import { toast } from '@/lib/toast';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('ai');
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState({
    reviewMode: (user as any)?.settings?.reviewMode || 'standard',
    customInstructions: (user as any)?.settings?.customInstructions || '',
    ignoredPaths: (user as any)?.settings?.ignoredPaths || 'node_modules/, dist/, *.min.js, package-lock.json',
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const { authApi } = await import('@/lib/api');
      await authApi.updateSettings(settings);
      
      // Update local user store
      if (user) {
        useAuthStore.setState({ user: { ...user, settings } as any });
      }
      
      toast.notify('Settings saved successfully');
    } catch (error) {
      toast.notify('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl pb-20">
      <PageHeader 
        title="Settings" 
        subtitle="Customize your AI review experience and account preferences."
      />

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-[var(--color-border)] mb-8 overflow-x-auto hide-scrollbar">
        {[
          { id: 'ai', label: 'AI Customization', icon: Bot },
          { id: 'preferences', label: 'Preferences', icon: Sliders },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                active 
                  ? 'border-[#e8e8e8] text-[#e8e8e8]' 
                  : 'border-transparent text-[#898989] hover:text-[#e8e8e8]'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'ai' && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Review Strictness */}
          <section>
            <h3 className="text-lg font-bold text-[#e8e8e8] mb-4">Review Strictness</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { id: 'standard', icon: Check, title: 'Standard', desc: 'Balanced reviews covering logic, style, and security.' },
                { id: 'strict', icon: Shield, title: 'Strict Enforcer', desc: 'Highly nitpicky on types, SOLID principles, and best practices.' },
                { id: 'performance', icon: Zap, title: 'Performance', desc: 'Hyper-focused on Big O, allocations, and async bottlenecks.' },
              ].map(mode => (
                <button
                  key={mode.id}
                  onClick={() => setSettings(s => ({ ...s, reviewMode: mode.id }))}
                  className={`flex flex-col text-left p-4 rounded-xl border transition-all ${
                    settings.reviewMode === mode.id 
                      ? 'border-[#e8e8e8] bg-white/5' 
                      : 'border-[var(--color-border)] bg-[#0A0A0A] hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <mode.icon size={16} className={settings.reviewMode === mode.id ? 'text-[#e8e8e8]' : 'text-[#898989]'} />
                    <span className="font-semibold text-[#e8e8e8] tracking-wide uppercase text-xs">{mode.title}</span>
                  </div>
                  <p className="text-sm text-[#898989]">{mode.desc}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Custom Instructions */}
          <section>
            <h3 className="text-lg font-bold text-[#e8e8e8] mb-4">Custom Context</h3>
            <div className="bg-[#0A0A0A] rounded-xl border border-[var(--color-border)] overflow-hidden">
              <div className="p-4 border-b border-[var(--color-border)] bg-[#121212]">
                <label className="block text-sm font-medium text-[#e8e8e8]">System Prompt Injection</label>
                <p className="text-xs text-[#898989] mt-1">These instructions will be appended to VANTA's base LLM prompt.</p>
              </div>
              <textarea
                value={settings.customInstructions}
                onChange={e => setSettings(s => ({ ...s, customInstructions: e.target.value }))}
                placeholder="e.g. We use React Server Components exclusively. Avoid suggesting useEffect. Enforce early returns."
                className="w-full bg-transparent p-4 min-h-[120px] text-sm text-[#e8e8e8] placeholder-[#616161] focus:outline-none resize-none font-mono"
              />
            </div>
          </section>

          {/* Ignore Paths */}
          <section>
            <h3 className="text-lg font-bold text-[#e8e8e8] mb-4">Ignore Rules</h3>
            <div className="bg-[#0A0A0A] rounded-xl border border-[var(--color-border)] p-4 flex gap-4">
              <div className="pt-1"><FileCode size={20} className="text-[#898989]" /></div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-[#e8e8e8] mb-1">Global .vantaignore</label>
                <p className="text-xs text-[#898989] mb-3">Comma-separated glob patterns for files AI should never review.</p>
                <input
                  type="text"
                  value={settings.ignoredPaths}
                  onChange={e => setSettings(s => ({ ...s, ignoredPaths: e.target.value }))}
                  className="w-full bg-[#121212] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[#e8e8e8] font-mono focus:outline-none focus:border-[#e8e8e8]"
                />
              </div>
            </div>
          </section>

          {/* Save Action */}
          <div className="pt-4 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-[#e8e8e8] text-black px-6 py-2.5 rounded-lg font-medium hover:bg-white transition-colors disabled:opacity-50"
            >
              {saving ? <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : <Save size={16} />}
              {saving ? 'Saving...' : 'Save AI Settings'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'preferences' && (
        <div className="space-y-8 animate-fade-in pb-12">
          {/* GitHub Connection */}
          <section>
            <h3 className="text-lg font-bold text-[#e8e8e8] mb-4">Connected Accounts</h3>
            <div className="bg-[#0A0A0A] rounded-xl border border-[var(--color-border)] p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-[var(--color-border)]">
                    <Github size={20} className="text-[#e8e8e8]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-[#e8e8e8]">GitHub</h4>
                    <p className="text-xs text-[#898989] mt-0.5">Connected as {user?.username}</p>
                  </div>
                </div>
                <button className="px-4 py-2 text-xs font-medium text-[#e8e8e8] bg-white/5 hover:bg-white/10 border border-[var(--color-border)] rounded-lg transition-colors">
                  Re-authenticate
                </button>
              </div>
            </div>
          </section>

          {/* Notifications */}
          <section>
            <h3 className="text-lg font-bold text-[#e8e8e8] mb-4">Notifications</h3>
            <div className="bg-[#0A0A0A] rounded-xl border border-[var(--color-border)] divide-y divide-[var(--color-border)]">
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell size={16} className="text-[#898989]" />
                  <div>
                    <h4 className="text-sm font-medium text-[#e8e8e8]">Review Alerts</h4>
                    <p className="text-xs text-[#898989] mt-0.5">Email me when a review fails or finds critical issues.</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-9 h-5 bg-[#1a1a1a] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#898989] peer-checked:after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-white/20"></div>
                </label>
              </div>
              <div className="p-4 flex items-center justify-between opacity-50">
                <div className="flex items-center gap-3">
                  <Sliders size={16} className="text-[#898989]" />
                  <div>
                    <h4 className="text-sm font-medium text-[#e8e8e8]">Weekly Digest</h4>
                    <p className="text-xs text-[#898989] mt-0.5">A summary of your code quality trends. (Coming soon)</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-not-allowed">
                  <input type="checkbox" className="sr-only peer" disabled />
                  <div className="w-9 h-5 bg-[#1a1a1a] rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#616161] after:rounded-full after:h-4 after:w-4"></div>
                </label>
              </div>
            </div>
          </section>

          {/* Danger Zone */}
          <section>
            <h3 className="text-lg font-bold text-red-500 mb-4 flex items-center gap-2">
              <AlertTriangle size={18} /> Danger Zone
            </h3>
            <div className="bg-red-500/5 rounded-xl border border-red-500/20 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-medium text-[#e8e8e8]">Delete Account</h4>
                  <p className="text-xs text-[#898989] mt-1 max-w-md">
                    Permanently delete your account, disconnected repositories, and all review history. This action cannot be undone.
                  </p>
                </div>
                <button className="px-4 py-2 text-xs font-medium text-red-400 bg-red-400/10 hover:bg-red-400/20 border border-red-400/20 rounded-lg transition-colors whitespace-nowrap">
                  Delete Account
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
