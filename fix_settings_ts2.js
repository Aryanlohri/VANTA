const fs = require('fs');

// Fix Settings page
let page = fs.readFileSync('client/src/app/dashboard/settings/page.tsx', 'utf8');
page = page.replace('Github, Bell, AlertTriangle', 'GitBranch, Bell, AlertTriangle');
page = page.replace('<Github size={20} className="text-[#e8e8e8]" />', '<GitBranch size={20} className="text-[#e8e8e8]" />');
fs.writeFileSync('client/src/app/dashboard/settings/page.tsx', page);

// Fix Sidebar
let sidebar = fs.readFileSync('client/src/components/dashboard/Sidebar.tsx', 'utf8');
sidebar = sidebar.replace('setShowProfileMenu(false)', 'setPopoverOpen(false)');
fs.writeFileSync('client/src/components/dashboard/Sidebar.tsx', sidebar);
