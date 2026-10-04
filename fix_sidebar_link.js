const fs = require('fs');

let sidebar = fs.readFileSync('client/src/components/dashboard/Sidebar.tsx', 'utf8');

const oldSettingsBtn = `<button className="w-full text-left px-3 py-1.5 text-xs text-[#898989] hover:text-[#e8e8e8] hover:bg-white/5 transition-colors flex items-center gap-2">
                  <Settings size={14} /> Settings
                </button>`;

const newSettingsBtn = `<Link 
                  href="/dashboard/settings"
                  onClick={() => setShowProfileMenu(false)}
                  className="w-full text-left px-3 py-1.5 text-xs text-[#898989] hover:text-[#e8e8e8] hover:bg-white/5 transition-colors flex items-center gap-2"
                >
                  <Settings size={14} /> Settings
                </Link>`;

sidebar = sidebar.replace(oldSettingsBtn, newSettingsBtn);
fs.writeFileSync('client/src/components/dashboard/Sidebar.tsx', sidebar);
