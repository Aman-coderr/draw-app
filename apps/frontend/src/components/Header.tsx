import { Pencil, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

interface HeaderProps {
  showSignIn?: boolean;
}

export default function Header({ showSignIn = true }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="relative z-10 px-4 sm:px-6 py-4 sm:py-6 flex items-center justify-between max-w-7xl mx-auto">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
          <Pencil className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
          Excelidraw
        </span>
      </Link>

      {/* Desktop Sign In */}
      {showSignIn && (
        <Link
          to="/signin"
          className="hidden sm:block px-6 py-2.5 bg-white text-blue-600 rounded-lg font-medium shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 border border-blue-100"
        >
          Sign In
        </Link>
      )}

      {/* Mobile menu button */}
      {showSignIn && (
        <button
          className="sm:hidden p-2 rounded-lg bg-white border border-blue-100 shadow"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="w-5 h-5 text-blue-600" /> : <Menu className="w-5 h-5 text-blue-600" />}
        </button>
      )}

      {/* Mobile dropdown */}
      {menuOpen && showSignIn && (
        <div className="absolute top-full right-4 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 p-4 sm:hidden z-50">
          <Link
            to="/signin"
            className="block px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium text-center"
            onClick={() => setMenuOpen(false)}
          >
            Sign In
          </Link>
        </div>
      )}
    </nav>
  );
}
