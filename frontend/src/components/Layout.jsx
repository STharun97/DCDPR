import { Link, useLocation } from "react-router-dom";
import { Shield, History, BarChart3, Menu, X, Upload } from "lucide-react";
import { useState } from "react";

const Layout = ({ children }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const navItems = [
    { path: "/", label: "ANALYZE", icon: Shield },
    { path: "/bulk", label: "BULK", icon: Upload },
    { path: "/history", label: "HISTORY", icon: History },
    { path: "/dashboard", label: "DASHBOARD", icon: BarChart3 },
  ];
  
  const isActive = (path) => location.pathname === path;
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="glass-header sticky top-0 z-50" data-testid="header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link 
              to="/" 
              className="flex items-center gap-3 group"
              data-testid="logo-link"
            >
              <div className="w-10 h-10 bg-brand-blue flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" strokeWidth={1.5} />
              </div>
              <div>
                <span className="font-heading font-bold text-lg tracking-tight text-gray-900">
                  REVIEW<span className="text-brand-blue">GUARD</span>
                </span>
                <p className="text-[10px] uppercase tracking-widest text-gray-500 -mt-1">
                  Fake Detection System
                </p>
              </div>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1" data-testid="desktop-nav">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                  className={`
                    flex items-center gap-2 px-4 py-2 font-heading text-sm tracking-wider
                    transition-colors duration-200
                    ${isActive(item.path) 
                      ? "bg-brand-blue text-white" 
                      : "text-gray-600 hover:bg-gray-100"
                    }
                  `}
                >
                  <item.icon className="w-4 h-4" strokeWidth={1.5} />
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
            <nav className="md:hidden py-4 border-t border-gray-100" data-testid="mobile-nav">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid={`mobile-nav-${item.label.toLowerCase()}`}
                  className={`
                    flex items-center gap-3 px-4 py-3 font-heading text-sm tracking-wider
                    ${isActive(item.path) 
                      ? "bg-brand-blue text-white" 
                      : "text-gray-600 hover:bg-gray-50"
                    }
                  `}
                >
                  <item.icon className="w-4 h-4" strokeWidth={1.5} />
                  {item.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white" data-testid="footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-brand-blue" strokeWidth={1.5} />
              <span className="font-heading font-bold text-sm tracking-tight">
                REVIEWGUARD
              </span>
            </div>
            <p className="text-sm text-gray-500">
              Powered by ML • Built for Trust
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span>Logistic Regression</span>
              <span className="w-1 h-1 bg-gray-300 rounded-full" />
              <span>Naive Bayes</span>
              <span className="w-1 h-1 bg-gray-300 rounded-full" />
              <span>SVM</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
