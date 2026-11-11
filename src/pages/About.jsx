import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  ArrowRight,
  Menu,
  X,
  Mail,
  Linkedin,
  User,
  ExternalLink
} from 'lucide-react';

export default function About() {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: '💌',
      title: 'A unique link',
      desc: 'Made only for them'
    },
    {
      icon: '🎬',
      title: 'Cinematic design',
      desc: '& immersive animation'
    },
    {
      icon: '❤️',
      title: 'Personal & emotional',
      desc: 'An intimate experience'
    },
    {
      icon: '🔒',
      title: 'Private by design',
      desc: 'Secured with secret code'
    }
  ];

  return (
    <div className="min-h-screen bg-cream text-espresso font-sans antialiased selection:bg-rose selection:text-espresso flex flex-col justify-between overflow-x-hidden">
      {/* ─── 1. TOP NAVBAR (CONSISTENT WITH LANDING) ──────────────── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-cream/95 backdrop-blur-md shadow-sm border-b border-espresso/5 py-3'
            : 'bg-cream/90 backdrop-blur-sm py-4 sm:py-5 border-b border-espresso/5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-1.5 text-2xl sm:text-3xl font-serif tracking-widest text-espresso group min-h-[44px]"
          >
            <span className="font-semibold">AEVA</span>
            <span className="w-1.5 h-1.5 rounded-full bg-gold transition-transform duration-300 group-hover:scale-125" />
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide text-espresso-muted">
            <a
              href="/#templates"
              className="transition-colors hover:text-espresso min-h-[44px] inline-flex items-center"
            >
              Templates
            </a>
            <a
              href="/#pricing"
              className="transition-colors hover:text-espresso min-h-[44px] inline-flex items-center"
            >
              Pricing
            </a>
            <Link
              to="/about"
              className="text-espresso font-semibold min-h-[44px] inline-flex items-center"
            >
              About
            </Link>
            <a
              href="/#faq"
              className="transition-colors hover:text-espresso min-h-[44px] inline-flex items-center"
            >
              FAQ
            </a>
          </div>

          {/* Right Action: Desktop Navbar Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => navigate('/login?mode=login')}
              className="inline-flex items-center justify-center px-4 py-2 rounded-full text-sm font-medium text-espresso border border-espresso/20 hover:bg-espresso/5 transition-all min-h-[44px] cursor-pointer"
            >
              <User className="w-3.5 h-3.5 mr-1.5 text-gold-dark" />
              <span>Sign In</span>
            </button>
            <button
              onClick={() => navigate('/login?mode=signup')}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-full text-sm font-medium bg-espresso text-cream hover:bg-espresso-pure shadow-sm active:scale-[0.98] transition-all min-h-[44px] cursor-pointer"
            >
              <span>Sign Up</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </button>
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
            className="md:hidden flex items-center justify-center w-11 h-11 rounded-full text-espresso hover:bg-rose transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Slide-in Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="md:hidden bg-cream border-b border-espresso/10 px-6 py-6 shadow-xl overflow-hidden"
            >
              <div className="flex flex-col gap-3 text-base font-medium text-espresso">
                <a
                  href="/#templates"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 min-h-[44px] flex items-center border-b border-espresso/5 text-left text-espresso-muted hover:text-espresso"
                >
                  Templates
                </a>
                <a
                  href="/#pricing"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 min-h-[44px] flex items-center border-b border-espresso/5 text-left text-espresso-muted hover:text-espresso"
                >
                  Pricing
                </a>
                <Link
                  to="/about"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 min-h-[44px] flex items-center border-b border-espresso/5 text-left text-espresso font-semibold"
                >
                  About
                </Link>
                <a
                  href="/#faq"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 min-h-[44px] flex items-center border-b border-espresso/5 text-left text-espresso-muted hover:text-espresso"
                >
                  FAQ
                </a>

                {/* Mobile Menu Action Buttons */}
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/login?mode=login');
                    }}
                    className="w-full flex items-center justify-center py-3 rounded-full border border-espresso/20 text-espresso font-medium text-center hover:bg-espresso/5 min-h-[44px] cursor-pointer"
                  >
                    <span>Sign In</span>
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/login?mode=signup');
                    }}
                    className="w-full flex items-center justify-center py-3 rounded-full bg-espresso text-cream hover:bg-espresso-pure font-medium text-center shadow-md min-h-[44px] cursor-pointer"
                  >
                    <span>Sign Up</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ─── 2. MAIN HERO SECTION (COMPACT & BALANCED SCALE) ──────── */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-32 md:pt-40 pb-16 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* LEFT COLUMN: About AEVA */}
          <div className="lg:col-span-7 space-y-5">
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-gold inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>About AEVA</span>
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-espresso leading-[1.18]">
                Don't just send a message.{' '}
                <span className="block text-gold italic font-normal font-emotional-italic">
                  Create a moment.
                </span>
              </h1>
            </div>

            <div className="space-y-3 text-sm sm:text-[15px] text-espresso-muted font-light leading-relaxed">
              <p>
                AEVA is a premium digital platform where you can send a love proposal or a special message to someone you care about — delivered through a beautifully crafted, cinematic website link made just for them.
              </p>
              <p>
                Instead of an ordinary text, AEVA gives you an interactive, animated, and emotional experience — designed for one person, and one person only.
              </p>
            </div>

            {/* Why AEVA Section */}
            <div className="pt-2">
              <h2 className="font-serif text-xl sm:text-2xl font-semibold text-espresso mb-3">
                Why AEVA?
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {features.map((feat) => (
                  <div
                    key={feat.title}
                    className="p-3.5 rounded-2xl bg-cream-light border border-espresso/10 hover:border-gold/40 hover:shadow-sm transition-all duration-200 flex items-start gap-3 group"
                  >
                    <span className="text-xl shrink-0 group-hover:scale-110 transition-transform">
                      {feat.icon}
                    </span>
                    <div>
                      <h3 className="font-serif text-sm font-bold text-espresso">
                        {feat.title}
                      </h3>
                      <p className="text-[11px] text-espresso-muted font-light mt-0.5">
                        {feat.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Meet the Founder Card (Premium Styling) */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-md rounded-3xl bg-cream-light border border-gold/25 shadow-lg p-6 sm:p-8 flex flex-col justify-center relative overflow-hidden">
              {/* Subtle Ambient Radial Glow */}
              <div className="absolute -top-16 -right-16 w-44 h-44 bg-gold/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-rose/40 rounded-full blur-xl pointer-events-none" />

              {/* Founder Avatar Placeholder */}
              <div className="relative">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-serif font-bold text-gold bg-cream-warm ring-2 ring-gold/40 ring-offset-2 ring-offset-cream-light shadow-sm">
                  OD
                </div>
              </div>

              {/* Founder Info */}
              <div className="mt-3.5">
                <h3 className="text-2xl font-serif font-bold text-espresso">
                  Ovi Dev
                </h3>
                <p className="text-[11px] uppercase tracking-widest text-gold font-semibold mt-0.5">
                  Founder, AEVA
                </p>
              </div>

              {/* Quote */}
              <blockquote className="italic font-serif text-base text-espresso/90 mt-4 border-l-2 border-gold pl-3.5 py-1 leading-relaxed bg-cream/40 rounded-r-xl">
                “Some feelings deserve more than a message — they deserve a moment. AEVA exists to turn love into an experience.”
              </blockquote>

              {/* Bio */}
              <p className="text-xs sm:text-[13px] text-espresso-muted font-light leading-relaxed mt-3.5">
                Ovi Dev is the founder of AEVA, driven by a simple belief: the way we express love should be as beautiful as the feeling itself. He founded AEVA to help people turn their emotions into unforgettable, cinematic moments — one link, one person, one memory at a time.
              </p>

              {/* Contact Row */}
              <div className="mt-5 pt-4 border-t border-espresso/10 flex flex-wrap items-center gap-4 text-xs font-medium text-gold">
                <a
                  href="mailto:hello@aeva.app"
                  className="inline-flex items-center gap-1.5 hover:text-gold-dark transition-colors min-h-[44px]"
                >
                  <Mail className="w-3.5 h-3.5 text-gold" />
                  <span>hello@aeva.app</span>
                </a>

                <span className="text-espresso/20 hidden sm:inline">&bull;</span>

                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-gold-dark transition-colors min-h-[44px]"
                >
                  <Linkedin className="w-3.5 h-3.5 text-gold" />
                  <span>LinkedIn</span>
                  <ExternalLink className="w-3 h-3 text-gold/70" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ─── 3. FOOTER (CONSISTENT WITH LANDING) ──────────────────── */}
      <footer className="border-t border-espresso/10 bg-cream pt-12 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          {/* Logo & Tagline */}
          <div className="space-y-1.5">
            <Link
              to="/"
              className="flex items-center justify-center md:justify-start gap-1.5 text-2xl font-serif tracking-widest text-espresso"
            >
              <span className="font-semibold">AEVA</span>
              <span className="w-1.5 h-1.5 rounded-full bg-gold" />
            </Link>
            <p className="text-xs sm:text-sm text-espresso-muted font-light max-w-xs">
              Bespoke, cinematic love proposals designed for forever. Delivered as a tender link.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-espresso-muted">
            <a
              href="/#templates"
              className="hover:text-espresso transition-colors min-h-[44px] inline-flex items-center"
            >
              Templates
            </a>
            <a
              href="/#pricing"
              className="hover:text-espresso transition-colors min-h-[44px] inline-flex items-center"
            >
              Pricing
            </a>
            <Link
              to="/about"
              className="text-espresso font-semibold hover:text-espresso transition-colors min-h-[44px] inline-flex items-center"
            >
              About
            </Link>
            <a
              href="/#faq"
              className="hover:text-espresso transition-colors min-h-[44px] inline-flex items-center"
            >
              FAQ
            </a>
            <a
              href="#"
              className="hover:text-espresso transition-colors min-h-[44px] inline-flex items-center"
            >
              Privacy &amp; Terms
            </a>
          </div>

          {/* Copyright */}
          <div className="text-xs text-espresso-muted/60 font-light">
            &copy; {new Date().getFullYear()} AEVA Inc. All romantic rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
