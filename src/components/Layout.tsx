import React, { useEffect, useState } from 'react';
import { LayoutDashboard, Package, ClipboardList, Settings, Menu, Calculator, FileText, Cylinder, Download, Beer } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeView: string;
  setActiveView: (view: string) => void;
}

const NavItem = ({ icon: Icon, label, id, active, onClick }: any) => (
  <button
    onClick={() => onClick(id)}
    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
      active
        ? 'bg-brew-500 text-white shadow-md'
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`}
  >
    <Icon size={20} />
    <span>{label}</span>
  </button>
);

export const Layout: React.FC<LayoutProps> = ({ children, activeView, setActiveView }) => {
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      // Impede o Chrome de mostrar a barra nativa automaticamente para podermos customizar
      e.preventDefault();
      // Salva o evento para disparar quando o usuário clicar no botão
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          setDeferredPrompt(null);
        }
      });
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-industrial-900 text-white transform transition-transform duration-200 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 flex flex-col
      `}>
        <div className="flex items-center justify-center p-6 border-b border-slate-700">
          <img src="logo.png" alt="BrewFlow Logo" className="w-48 object-contain" />
        </div>

        <nav className="mt-6 flex-1 space-y-1 overflow-y-auto">
          <NavItem icon={LayoutDashboard} label="Dashboard" id="dashboard" active={activeView === 'dashboard'} onClick={setActiveView} />
          <NavItem icon={ClipboardList} label="Tanques & Produção" id="production" active={activeView === 'production'} onClick={setActiveView} />
          <NavItem icon={Calculator} label="Receitas & Cálculos" id="recipes" active={activeView === 'recipes'} onClick={setActiveView} />
          <NavItem icon={Package} label="Estoque Insumos" id="inventory" active={activeView === 'inventory'} onClick={setActiveView} />
          <NavItem icon={Cylinder} label="Gestão de Barris" id="kegs" active={activeView === 'kegs'} onClick={setActiveView} />
          <NavItem icon={Beer} label="Gestão de Garrafas" id="bottles" active={activeView === 'bottles'} onClick={setActiveView} />
          <NavItem icon={FileText} label="Relatórios" id="reports" active={activeView === 'reports'} onClick={setActiveView} />
        </nav>

        <div className="p-4 border-t border-slate-700 space-y-4">
           {/* Install App Button - Only shows if browser supports/allows it */}
           {deferredPrompt && (
            <button 
              onClick={handleInstallClick}
              className="w-full flex items-center justify-center gap-2 bg-brew-600 hover:bg-brew-700 text-white py-2 rounded-lg font-bold text-sm transition-colors shadow-lg animate-pulse"
            >
              <Download size={16} />
              Instalar App
            </button>
           )}

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-xs">EO</div>
            <div className="text-sm">
              <p className="font-medium">Engineer One</p>
              <p className="text-slate-400 text-xs">Head Brewer</p>
            </div>
            <Settings size={16} className="ml-auto text-slate-400 cursor-pointer hover:text-white" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="md:hidden flex items-center p-4 bg-white border-b border-slate-200">
            <button onClick={() => setIsMobileOpen(!isMobileOpen)} className="p-2">
                <Menu size={24} className="text-slate-700" />
            </button>
            <span className="ml-3 font-bold text-lg text-industrial-900">BrewFlow</span>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};