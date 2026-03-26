import { Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface HeroProps {
  isVisible: boolean;
}

export default function Hero({ isVisible }: HeroProps) {
  return (
    <div
      className={`text-center transition-all duration-1000 transform ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
      }`}
    >
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-8 shadow-sm">
        <Sparkles className="w-4 h-4" />
        <span>Visual collaboration made simple</span>
      </div>

      <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
        <span className="bg-gradient-to-r from-slate-800 via-blue-800 to-slate-800 bg-clip-text text-transparent">
          Draw, Design,
        </span>
        <br />
        <span className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
          Collaborate
        </span>
      </h1>

      <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed">
        The virtual whiteboard that brings your ideas to life. Create beautiful diagrams,
        wireframes, and sketches with the simplicity of pen and paper.
      </p>

      <div className="flex items-center justify-center gap-4 mb-16">
        <Link
          to="/signup"
          className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 flex items-center gap-2"
        >
          Start Drawing
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>
        <button className="px-8 py-4 bg-white text-slate-700 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-slate-200">
          View Demo
        </button>
      </div>

      <div className="relative max-w-5xl mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl blur-3xl opacity-20"></div>
        <div className="relative bg-white rounded-2xl shadow-2xl p-8 border border-slate-200">
          <div className="aspect-video bg-gradient-to-br from-slate-100 to-blue-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl transform hover:rotate-6 transition-transform duration-300">
                <Pencil className="w-12 h-12 text-white" />
              </div>
              <p className="text-slate-500 font-medium">Interactive canvas preview</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Pencil } from 'lucide-react';

