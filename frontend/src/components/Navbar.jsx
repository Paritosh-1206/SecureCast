// components/Navbar.jsx — Top navigation bar with links and mobile menu
import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineLogout, HiOutlineShieldCheck, HiOutlineMenu, HiOutlineX } from 'react-icons/hi';
import { HiOutlineBolt, HiOutlineClipboardDocumentList, HiOutlineUserPlus, HiOutlineCog6Tooth, HiOutlineHome } from 'react-icons/hi2';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-primary/15 text-primary-light'
        : 'text-text-muted hover:text-text-primary hover:bg-surface-light'
    }`;

  const mobileNavLinkClass = ({ isActive }) =>
    `flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-primary/15 text-primary-light border border-primary/20'
        : 'text-text-secondary hover:text-text-primary hover:bg-surface-light'
    }`;

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="glass sticky top-0 z-40"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center shadow-lg shadow-primary/20">
              <HiOutlineShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-primary-light to-accent bg-clip-text text-transparent">
              SecureCast
            </span>
          </Link>

          {/* Desktop Nav Links */}
          {user && (
            <div className="hidden md:flex items-center gap-1">
              <NavLink to="/dashboard" className={navLinkClass} end>
                <HiOutlineHome className="w-4 h-4" />Dashboard
              </NavLink>

              {user.role !== 'admin' && (
                <NavLink to="/candidate/apply" className={navLinkClass}>
                  <HiOutlineUserPlus className="w-4 h-4" />Apply as Candidate
                </NavLink>
              )}

              {user.role === 'admin' && (
                <NavLink to="/admin" className={navLinkClass}>
                  <HiOutlineCog6Tooth className="w-4 h-4" />Admin Panel
                </NavLink>
              )}
            </div>
          )}

          {/* Right side */}
          {user && (
            <div className="flex items-center gap-3">
              {/* Face Setup Indicator */}
              {!user.faceSetupComplete && (
                <Link
                  to="/face-setup"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-warning/10 border border-warning/30 text-warning text-xs font-medium hover:bg-warning/20 transition"
                >
                  <HiOutlineBolt className="w-3.5 h-3.5" />
                  Setup Face ID
                </Link>
              )}

              {/* Role Badge */}
              <span className={`badge hidden sm:inline-flex ${
                user.role === 'admin' ? 'badge-primary' :
                user.role === 'candidate' ? 'badge-info' : 'badge-success'
              }`}>
                {user.role}
              </span>

              {/* User info */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <span className="text-xs font-bold text-white">
                    {user.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm text-text-secondary hidden lg:block">
                  {user.name}
                </span>
              </div>

              {/* Desktop Logout */}
              <button
                onClick={handleLogout}
                className="hidden md:flex p-2 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition"
                title="Logout"
              >
                <HiOutlineLogout className="w-5 h-5" />
              </button>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-light transition"
              >
                {mobileOpen ? <HiOutlineX className="w-5 h-5" /> : <HiOutlineMenu className="w-5 h-5" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && user && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="md:hidden overflow-hidden border-t border-border"
          >
            <div className="p-4 space-y-1">
              <NavLink to="/dashboard" className={mobileNavLinkClass} end onClick={() => setMobileOpen(false)}>
                <HiOutlineHome className="w-4.5 h-4.5" />Dashboard
              </NavLink>

              {user.role !== 'admin' && (
                <NavLink to="/candidate/apply" className={mobileNavLinkClass} onClick={() => setMobileOpen(false)}>
                  <HiOutlineUserPlus className="w-4.5 h-4.5" />Apply as Candidate
                </NavLink>
              )}

              {user.role === 'admin' && (
                <NavLink to="/admin" className={mobileNavLinkClass} onClick={() => setMobileOpen(false)}>
                  <HiOutlineCog6Tooth className="w-4.5 h-4.5" />Admin Panel
                </NavLink>
              )}

              {!user.faceSetupComplete && (
                <NavLink to="/face-setup" className={mobileNavLinkClass} onClick={() => setMobileOpen(false)}>
                  <HiOutlineBolt className="w-4.5 h-4.5 text-warning" />Setup Face ID
                </NavLink>
              )}

              <div className="pt-2 mt-2 border-t border-border">
                <button
                  onClick={() => { handleLogout(); setMobileOpen(false); }}
                  className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium text-danger hover:bg-danger/10 transition-all duration-200 w-full"
                >
                  <HiOutlineLogout className="w-4.5 h-4.5" />Sign Out
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
