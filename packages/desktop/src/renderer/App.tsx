import { Routes, Route, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ExternalLink, Copy, Sparkles, Server, Monitor, RefreshCw } from 'lucide-react';

function TitleBar() {
  const [platform, setPlatform] = useState<string>('');

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getPlatform().then(setPlatform);
    }
  }, []);

  const handleMinimize = () => window.electronAPI?.minimizeWindow();
  const handleMaximize = () => window.electronAPI?.maximizeWindow();
  const handleClose = () => window.electronAPI?.closeWindow();

  if (platform === 'darwin') return null;

  return (
    <div className="h-9 bg-[#efe5d4] border-b-2 border-[#221b14] flex items-center justify-between select-none" style={{ WebkitAppRegion: 'drag' } as any}>
      <div className="flex items-center gap-2 px-4 text-sm font-medium text-[#221b14]">
        Comic Universe Desktop
      </div>
      <div className="flex" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <button
          onClick={handleMinimize}
          className="w-12 h-9 flex items-center justify-center text-[#221b14]/60 hover:bg-[#f3b700]/30 transition-colors"
        >
          <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor">
            <rect width="10" height="1" />
          </svg>
        </button>
        <button
          onClick={handleMaximize}
          className="w-12 h-9 flex items-center justify-center text-[#221b14]/60 hover:bg-[#1c9a8a]/20 transition-colors"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor">
            <rect x="0.5" y="0.5" width="9" height="9" />
          </svg>
        </button>
        <button
          onClick={handleClose}
          className="w-12 h-9 flex items-center justify-center text-[#221b14]/60 hover:bg-[#d6452a] hover:text-[#fff7ea] transition-colors"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
            <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function DesktopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col page-shell">
      <TitleBar />
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}

function Home() {
  const [version, setVersion] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getAppVersion().then(setVersion);
    }
  }, []);

  const handleOpenWeb = () => {
    window.open('http://localhost', '_blank');
  };

  const handleCopyApi = async () => {
    try {
      await navigator.clipboard.writeText('http://localhost:3001');
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <DesktopLayout>
      <div className="min-h-full page-shell relative overflow-hidden">
        <div className="absolute inset-0 halftone" />
        <div className="absolute top-16 left-10 w-72 h-72 bg-[#d6452a]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-16 right-10 w-80 h-80 bg-[#1c9a8a]/10 rounded-full blur-[120px]" />

        <div className="p-8 relative z-10">
          <div className="max-w-5xl mx-auto grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
            <div className="panel-frame p-8 relative">
              <div className="inline-flex items-center gap-2 px-3 py-1 badge-sticker text-xs uppercase tracking-wider mb-5">
                <Sparkles className="w-4 h-4" />
                Desktop Edition
              </div>

              <h1 className="font-display text-5xl text-accent mb-4">
                Comic Universe
              </h1>
              <p className="ink-muted text-lg mb-6">
                Десктопное приложение для чтения интерактивных комиксов. Запусти контейнеры и открой веб-плеер внутри браузера.
              </p>

              <div className="flex flex-wrap gap-4">
                <button onClick={handleOpenWeb} className="btn-comic btn-primary">
                  <ExternalLink className="w-4 h-4" />
                  Открыть веб-приложение
                </button>
                <button onClick={handleCopyApi} className="btn-comic btn-secondary">
                  <Copy className="w-4 h-4" />
                  Скопировать API URL
                </button>
              </div>

              {copied && (
                <div className="mt-4 text-sm text-[#1c9a8a] font-semibold">
                  Ссылка скопирована
                </div>
              )}

              <div className="mt-6 flex items-center gap-3 text-sm ink-faint">
                <RefreshCw className="w-4 h-4" />
                Версия приложения: {version || '1.0.0'}
              </div>
            </div>

            <div className="space-y-6">
              <div className="panel-frame p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Server className="w-5 h-5 text-[#d6452a]" />
                  <h2 className="font-display text-xl">Подключение к серверу</h2>
                </div>
                <p className="ink-muted">
                  Убедитесь, что backend запущен на <strong>http://localhost:3001</strong>.
                </p>
              </div>

              <div className="panel-frame p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Monitor className="w-5 h-5 text-[#1c9a8a]" />
                  <h2 className="font-display text-xl">Рекомендации</h2>
                </div>
                <ul className="ink-muted space-y-2 list-disc ml-4">
                  <li>Запускайте Docker-стек перед чтением</li>
                  <li>Используйте полноэкранный режим для комиксов</li>
                  <li>Включите звук для атмосферы</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DesktopLayout>
  );
}

export default function App() {
  const navigate = useNavigate();

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onNavigate((path: string) => {
        navigate(path);
      });
    }
  }, [navigate]);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  );
}

