import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import logoNgang from '../../assets/logongangtachnen.png';

const navLinks = [
  { label: 'Giới thiệu', href: '#', active: true },
  { label: 'Nhạc cụ', href: '#instruments' },
  { label: 'Hướng dẫn', href: '#' },
];

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-surface dark:bg-surface-dim shadow-sm w-full top-0 z-50 sticky">
      <div className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-md max-w-[1280px] mx-auto">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center"
        >
          <img
            src={logoNgang}
            alt="VietStage"
            className="h-9 md:h-11 w-auto object-contain"
          />
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center space-x-xl">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={`font-body-md text-body-md transition-colors ${
                link.active
                  ? 'text-primary dark:text-primary-fixed-dim border-b-2 border-primary dark:border-primary-fixed-dim pb-1'
                  : 'text-on-surface-variant dark:text-outline hover:text-primary dark:hover:text-primary-fixed-dim'
              }`}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-sm">
          <Link
            to="/login"
            className="bg-primary text-on-primary px-lg py-sm rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity active:scale-95 hidden sm:block"
          >
            Đăng nhập
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-sm text-on-surface"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden overflow-hidden bg-surface border-t border-outline-variant"
          >
            <div className="flex flex-col px-margin-mobile py-md space-y-md">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className={`font-body-md text-body-md py-sm ${
                    link.active
                      ? 'text-primary font-semibold'
                      : 'text-on-surface-variant hover:text-primary'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <Link
                to="/login"
                className="bg-primary text-on-primary px-lg py-sm rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity w-full sm:hidden text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Đăng nhập
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
