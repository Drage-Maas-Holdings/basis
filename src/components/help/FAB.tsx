import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { HelpDrawer } from './HelpDrawer';

export function FAB() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-brand-teal text-white flex items-center justify-center shadow-fab hover:brightness-110 active:scale-95 transition-transform"
        aria-label="Open help"
        title="Help"
      >
        <HelpCircle size={26} />
      </button>
      <HelpDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
