import { useEffect, useState } from 'react';
import { X, ChevronRight } from 'lucide-react';
import { HELP_CONTENT } from '../../lib/helpContent';
import { useLocation } from 'react-router-dom';

export function HelpDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const location = useLocation();
  const [visiblePath, setVisiblePath] = useState(location.pathname);

  useEffect(() => {
    if (open) {
      setVisiblePath(location.pathname);
    }
  }, [open, location.pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const help = HELP_CONTENT[visiblePath] ?? HELP_CONTENT['/'];

  return (
    <>
      {open ? (
        <div
          className="fixed inset-0 z-40 bg-black/30"
          onClick={onClose}
        />
      ) : null}
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-full sm:w-[380px] bg-bg-surface border-l border-border shadow-card transform transition-transform duration-300 ease-out flex flex-col ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{help.icon}</span>
            <h2 className="font-display text-lg text-text-primary">
              {help.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded text-text-secondary hover:bg-bg-surface-2 hover:text-text-primary"
            aria-label="Close help"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {help.sections.map((s, i) => (
            <section key={i}>
              <h3 className="text-sm font-semibold text-text-primary mb-1.5 flex items-start gap-1">
                {i > 0 ? (
                  <ChevronRight size={14} className="mt-0.5 text-brand-blue shrink-0" />
                ) : null}
                <span>{s.title}</span>
              </h3>
              {s.body.length > 0 ? (
                <div className="space-y-1 text-sm text-text-secondary leading-relaxed">
                  {s.body.map((line, j) => (
                    <p key={j}>{line}</p>
                  ))}
                </div>
              ) : null}
            </section>
          ))}
        </div>
        <div className="px-5 py-3 border-t border-border text-[11px] text-text-muted">
          Press <span className="kbd">Esc</span> to close · Updates as you navigate.
        </div>
      </aside>
    </>
  );
}
