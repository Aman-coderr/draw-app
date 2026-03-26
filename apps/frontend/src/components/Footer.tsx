import { Pencil } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-slate-200 bg-white/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Pencil className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-800">Excelidraw</span>
          </div>
          <p className="text-slate-600 text-sm">
            © 2025 Excelidraw. Bringing creativity to life.
          </p>
        </div>
      </div>
    </footer>
  );
}

