import { Pencil } from 'lucide-react';
import { Link } from 'react-router-dom';

interface HeaderProps {
  showSignIn?: boolean;
}

export default function Header({ showSignIn = true }: HeaderProps) {
  return (
    <nav className="relative z-10 px-6 py-6 flex items-center justify-between max-w-7xl mx-auto">
      <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
          <Pencil className="w-6 h-6 text-white" />
        </div>
        <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
          Excelidraw
        </span>
      </Link>
      {showSignIn && (
        <Link
          to="/signin"
          className="px-6 py-2.5 bg-white text-blue-600 rounded-lg font-medium shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 border border-blue-100"
        >
          Sign In
        </Link>
      )}
    </nav>
  );
}

