const fs = require('fs');

let page = fs.readFileSync('client/src/app/dashboard/settings/page.tsx', 'utf8');

// Replace mock handleSave with real one
const oldHandleSave = `  const handleSave = async () => {
    setSaving(true);
    // TODO: implement real API call
    setTimeout(() => {
      setSaving(false);
      toast.success('Settings saved successfully');
    }, 800);
  };`;

const newHandleSave = `  const handleSave = async () => {
    setSaving(true);
    try {
      const { authApi } = await import('@/lib/api');
      await authApi.updateSettings(settings);
      
      // Update local user store
      if (user) {
        useAuthStore.setState({ user: { ...user, settings } });
      }
      
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };`;

page = page.replace(oldHandleSave, newHandleSave);

// Make sure it loads existing settings
const oldState = `  // Mock state for now
  const [settings, setSettings] = useState({
    reviewMode: 'standard',
    customInstructions: '',
    ignoredPaths: 'node_modules/, dist/, *.min.js, package-lock.json',
  });`;

const newState = `  const [settings, setSettings] = useState({
    reviewMode: user?.settings?.reviewMode || 'standard',
    customInstructions: user?.settings?.customInstructions || '',
    ignoredPaths: user?.settings?.ignoredPaths || 'node_modules/, dist/, *.min.js, package-lock.json',
  });`;

page = page.replace(oldState, newState);

fs.writeFileSync('client/src/app/dashboard/settings/page.tsx', page);
