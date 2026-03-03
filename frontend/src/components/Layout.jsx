import { Link, useLocation } from "react-router-dom";
import { Shield, History, BarChart3, Menu, X, Upload, Globe } from "lucide-react";
import { useState } from "react";

const Layout = ({ children }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: "/", label: "ANALYZE", icon: Shield },
    { path: "/url-analysis", label: "URL CHECK", icon: Globe },
    { path: "/bulk", label: "BULK", icon: Upload },
    { path: "/history", label: "HISTORY", icon: History },
    { path: "/dashboard", label: "DASHBOARD", icon: BarChart3 },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Decorative background gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-blue/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-brand-blue/10 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50" data-testid="header">
        <div className="max-w-full glass-header shadow-md border-b border-white/30">
          <div className="flex items-center justify-between h-16 px-2 sm:px-6">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-2 sm:gap-3 group"
              data-testid="logo-link"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-brand-blue to-blue-800 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-brand-blue/30 group-hover:scale-105 transition-transform duration-300">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2} />
              </div>
              <div>
                <span className="font-heading font-black text-base sm:text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                  REVIEW<span className="text-brand-blue">GUARD</span>
                </span>
                <p className="text-[8px] sm:text-[9px] uppercase tracking-widest text-gray-400 -mt-1 font-semibold">
                  Fake Detection System
                </p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-2" data-testid="desktop-nav">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                  className={`
                    flex items-center gap-2 px-4 py-2 font-heading text-xs uppercase tracking-widest rounded-full font-semibold
                    transition-all duration-300
                    ${isActive(item.path)
                      ? "bg-brand-blue text-white shadow-md shadow-brand-blue/20"
                      : "text-gray-500 hover:text-gray-900 hover:bg-black/5"
                    }
                  `}
                >
                  <item.icon className={`w-4 h-4 ${isActive(item.path) ? "opacity-100" : "opacity-70"}`} strokeWidth={isActive(item.path) ? 2 : 1.5} />
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="mobile-menu-button"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" strokeWidth={1.5} />
              ) : (
                <Menu className="w-6 h-6" strokeWidth={1.5} />
              )}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="md:hidden py-4 border-t border-gray-100 px-4 space-y-1" data-testid="mobile-nav">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid={`mobile-nav-${item.label.toLowerCase()}`}
                  className={`
                    flex items-center gap-3 px-4 py-3 font-heading text-sm tracking-wider rounded-2xl transition-all duration-200
                    ${isActive(item.path)
                      ? "bg-brand-blue text-white shadow-md shadow-brand-blue/20"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }
                  `}
                >
                  <item.icon className="w-5 h-5" strokeWidth={1.5} />
                  {item.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </header>

      {/* Main Content (with top padding for fixed header) */}
      <main className="flex-1 pt-20">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white" data-testid="footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-brand-blue" strokeWidth={1.5} />
              <span className="font-heading font-bold text-sm tracking-tight">
                REVIEWGUARD
              </span>
            </div>
            <p className="text-sm text-gray-500 text-center">
              Powered by ML • Built for Trust
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[10px] sm:text-xs text-gray-400">
              <span className="bg-gray-50 px-2 py-1 rounded-md border border-gray-100">Logistic Regression</span>
              <span className="bg-gray-50 px-2 py-1 rounded-md border border-gray-100">Naive Bayes</span>
              <span className="bg-gray-50 px-2 py-1 rounded-md border border-gray-100">SVM</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
