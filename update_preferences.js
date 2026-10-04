const fs = require('fs');

let page = fs.readFileSync('client/src/app/dashboard/settings/page.tsx', 'utf8');

// Add some extra icons
if (!page.includes('Github,') && !page.includes('Github ')) {
  page = page.replace('import { Save, Bot, Shield, Zap, Sliders, Check, FileCode } from \'lucide-react\';', 
    'import { Save, Bot, Shield, Zap, Sliders, Check, FileCode, Github, Bell, AlertTriangle } from \'lucide-react\';');
}

// Check where to inject the preferences tab
if (!page.includes("activeTab === 'preferences'")) {
  const replacement = `        </div>
      )}

      {activeTab === 'preferences' && (
        <div className="space-y-8 animate-fade-in">
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
    </div>`;

  page = page.replace(/        <\/div>\s*\}\)\s*<\/div>\s*\)\}\s*<\/div>/, replacement);
  // Wait, regex might be tricky, let's use standard replace on the exact ending.
  // The ending of the file is:
  /*
          </div>
        </div>
      )}
    </div>
  );
}
  */
  
  const preciseTarget = `        </div>
      )}
    </div>
  );
}`;
  
  const preciseReplacement = `        </div>
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
}`;

  page = page.replace(preciseTarget, preciseReplacement);
  fs.writeFileSync('client/src/app/dashboard/settings/page.tsx', page);
}
