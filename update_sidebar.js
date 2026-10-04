const fs = require('fs');

let sidebar = fs.readFileSync('client/src/components/dashboard/Sidebar.tsx', 'utf8');
if (!sidebar.includes("href: '/dashboard/settings'")) {
  // Add Settings to bottomLinks
  const target = `const bottomLinks = [
  { icon: Shield, label: 'Admin', href: '/dashboard/admin' },
];`;
  
  const replacement = `const bottomLinks = [
  { icon: Shield, label: 'Admin', href: '/dashboard/admin' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
];`;
  
  // Make sure Settings is imported
  if (!sidebar.includes("Settings,")) {
    sidebar = sidebar.replace("import { Home, FileCode, FolderGit2, BarChart2, Shield, LogOut, ChevronLeft, ChevronRight, X }", "import { Home, FileCode, FolderGit2, BarChart2, Shield, LogOut, ChevronLeft, ChevronRight, X, Settings }");
  }

  sidebar = sidebar.replace(target, replacement);
  fs.writeFileSync('client/src/components/dashboard/Sidebar.tsx', sidebar);
}
