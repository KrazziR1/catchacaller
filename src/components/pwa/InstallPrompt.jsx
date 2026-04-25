import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download } from 'lucide-react';

export default function InstallPrompt() {
  const [prompt, setPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (prompt) {
      prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === 'accepted') {
        setPrompt(null);
        setDismissed(true);
      }
    }
  };

  // Show nothing if already installed or dismissed
  if (dismissed || (!prompt && !isIOS)) return null;

  return (
    <div className="fixed bottom-6 right-6 max-w-sm z-50">
      <div className="bg-card border border-border rounded-xl shadow-lg p-4 flex items-start gap-4">
        <div className="flex-1">
          <p className="text-sm font-semibold">Pin CatchACaller</p>
          <p className="text-xs text-muted-foreground mt-1">
            {isIOS
              ? 'Tap Share, then "Add to Home Screen" for quick access'
              : 'Add to your home screen for offline access & notifications'}
          </p>
        </div>
        <div className="flex gap-2">
          {!isIOS && (
            <Button size="sm" onClick={handleInstall} className="h-8 px-3 rounded-lg">
              <Download className="w-3 h-3 mr-1" />
              Install
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDismissed(true)}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}