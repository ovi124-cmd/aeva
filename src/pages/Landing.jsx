import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Heart,
  Sparkles,
  ArrowRight,
  Menu,
  X,
  ChevronDown,
  Check,
  Eye,
  Loader2,
  Coins,
  User,
  Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase, fetchActiveTemplates } from '../lib/supabase.js';

export default function Landing() {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Dynamic Supabase templates state
  const [templates, setTemplates] = useState([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);

  // Search & Category Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Extract unique categories from templates
  const categories = ['All', ...new Set(templates.map((t) => t.category).filter(Boolean))];

  // Filter templates based on search query and selected category
  const filteredTemplates = templates.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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

  // Fetch active templates from Supabase
  useEffect(() => {
    async function fetchTemplates() {
      try {
        const { data, error } = await fetchActiveTemplates();
        if (error) {
          console.warn('Templates fetch notice:', error.message);
        }
        if (data && data.length > 0) {
          setTemplates(data);
        }
      } catch (err) {
        console.warn('Fetch exception:', err);
      } finally {
        setIsLoadingTemplates(false);
      }
    }
    fetchTemplates();
  }, []);

  const pricingPlans = [
    {
      name: 'Starter',
      price: '৳50',
      credits: '3 credits',
      amount: 50,
      creditsNum: 3,
      desc: 'Perfect for an unforgettable first surprise or anniversary note.',
      features: [
        '3 Animated Proposal links',
        'Full HD mobile & desktop viewing',
        'Custom audio track integration',
        'Standard interactive response button',
        'Active for 30 days'
      ],
      popular: false,
      cta: 'Get Starter'
    },
    {
      name: 'Plus',
      price: '৳100',
      credits: '7 credits',
      amount: 100,
      creditsNum: 7,
      desc: 'Our most loved package for couples preparing a truly monumental question.',
      features: [
        '7 Bespoke Proposal links',
        'All Luxury Editorial themes',
        'Custom background music & voice note',
        'Confetti & champagne unlock animation',
        'Private PIN security & custom URL slug',
        'Active indefinitely (permanent keepsake)'
      ],
      popular: true,
      cta: 'Choose Plus'
    },
    {
      name: 'Premium',
      price: '৳1000',
      credits: 'Unlimited / year',
      amount: 1000,
      creditsNum: 40,
      desc: 'For romantic perfectionists, anniversary archives, and proposal planners.',
      features: [
        'Unlimited proposals for 1 full year',
        'Exclusive VIP bespoke design presets',
        'High-resolution PDF commemorative printout',
        'Priority concierge delivery support',
        'Real-time view & acceptance notification'
      ],
      popular: false,
      cta: 'Go Premium'
    }
  ];

  const faqs = [
    {
      q: 'How does my partner view the proposal?',
      a: 'Once you customize your proposal, AEVA generates an elegant, private web link. You can send it via WhatsApp, SMS, or QR code. When opened, it reveals an immersive, cinema-grade animated experience that adapts seamlessly to any screen.'
    },
    {
      q: 'Can I add our own photos, voice notes, and favorite song?',
      a: 'Yes. Every proposal allows you to upload photos of your favorite milestones, select romantic background melodies (or upload your song), and write a deeply personal letter.'
    },
    {
      q: 'How does the interactive proposal moment work?',
      a: 'After scrolling through your personal love story and soundtrack, your partner reaches the interactive question screen. They can tap "Yes!", triggering bespoke golden confetti and an intimate celebratory screen.'
    },
    {
      q: 'Is our proposal private and secure?',
      a: 'Absolutely. Proposals are unlisted and accessible only to individuals with your unique link. You can also add an optional secret PIN or passphrase for maximum privacy.'
    },
    {
      q: 'How do credits work and how long do links stay live?',
      a: 'One credit unlocks one full published proposal. Starter links remain live for 30 days, while Plus and Premium links remain active permanently as a lifetime digital keepsake.'
    }
  ];

  return (
    <div className="min-h-screen bg-cream text-espresso font-sans antialiased overflow-x-hidden selection:bg-rose selection:text-espresso">
      {/* 1. NAVBAR */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-cream/95 backdrop-blur-md shadow-sm border-b border-espresso/5 py-3'
            : 'bg-transparent py-4 sm:py-6'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo */}
          <a
            href="#"
            className="flex items-center gap-1.5 text-2xl sm:text-3xl font-serif tracking-widest text-[#2B1F1A] group min-h-[44px]"
          >
            <span className="font-semibold">AEVA</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#C59B63] transition-transform duration-300 group-hover:scale-125" />
          </a>

          {/* Desktop Navigation Section Smooth-Scroll Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide text-espresso-muted">
            <a
              href="#templates"
              className="transition-colors hover:text-espresso min-h-[44px] inline-flex items-center"
            >
              Templates
            </a>
            <a
              href="#pricing"
              className="transition-colors hover:text-espresso min-h-[44px] inline-flex items-center"
            >
              Pricing
            </a>
            <button
              onClick={() => navigate('/about')}
              className="transition-colors hover:text-espresso min-h-[44px] inline-flex items-center cursor-pointer"
            >
              About
            </button>
            <a
              href="#faq"
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
                  href="#templates"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 min-h-[44px] flex items-center border-b border-espresso/5 text-left text-espresso-muted hover:text-espresso"
                >
                  Templates
                </a>
                <a
                  href="#pricing"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 min-h-[44px] flex items-center border-b border-espresso/5 text-left text-espresso-muted hover:text-espresso"
                >
                  Pricing
                </a>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/about');
                  }}
                  className="py-2.5 min-h-[44px] flex items-center border-b border-espresso/5 text-left text-espresso-muted hover:text-espresso cursor-pointer"
                >
                  About
                </button>
                <a
                  href="#faq"
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

      {/* 2. HERO SECTION */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Emotional Copy */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left z-10">
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cream-warm border border-espresso/10 text-xs font-medium text-espresso-muted tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-gold-dark" />
              <span>Cinematic Digital Love Proposals</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[52px] font-serif font-medium tracking-tight text-espresso leading-[1.12]">
              Don't just send a message.{' '}
              <span className="block font-normal italic text-gold font-emotional-italic">
                Create a moment.
              </span>
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-espresso-muted font-light max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Turn the things you feel into something they can open, discover, and keep. A personal message, made into a little world of its own.
            </p>

            {/* CTA Button */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                onClick={() => navigate('/create')}
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-full bg-espresso text-cream hover:bg-espresso-pure font-medium text-base shadow-lg shadow-espresso/15 active:scale-[0.98] transition-all min-h-[48px] cursor-pointer"
              >
                <span>Create Proposal</span>
              </button>
            </div>
          </div>

          {/* Right Column: Editorial Hero Graphic */}
          <div className="lg:col-span-5 relative flex justify-center">
            {/* Ambient Warm Blur Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[420px] h-[340px] sm:h-[420px] bg-gradient-to-tr from-rose to-gold/25 rounded-full blur-3xl pointer-events-none -z-10" />

            {/* Editorial Card Frame */}
            <div className="max-h-[500px] w-full object-cover rounded-3xl overflow-hidden relative shadow-xl border border-espresso/15">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCKk5iZ7TQ-BO2uWbGUujDzyoSYYESJ-VzmUof5z8kdRsw34aQVK7SGX7WG9A5NRPvB9ja7XPCRMTWEcAtTS5H2CHbDL3ZKHPzXVQMixjDO4fAnfa_3fKuYennYNoJHXYXTYHkvMWTDDk_CEdUPikF66_tVYNbRt0Hv5CGu6oPqDi9Q92dCycwns0RTFejVKChWKOqYN6L6yuvYI6ttRP0Kj8LNMc2jktDvEwroRpfXA4pVH-7WaA2QV94_6g0JyeMJvTVc094RPBsbZIU"
                alt="Romantic proposal moment"
                className="w-full h-full max-h-[500px] object-cover"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

              {/* Floating Note Card */}
              <div className="absolute bottom-5 left-5 right-5 sm:right-auto sm:max-w-xs p-5 rounded-2xl bg-[#FCFAF7] border border-espresso/15 shadow-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold tracking-widest text-gold-dark uppercase">
                    A little note for him/her
                  </span>
                </div>
                <p className="font-emotional-italic text-[15px] text-espresso-pure leading-snug font-medium">
                  "Of all my ordinary days, the ones with you are my favourite."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS */}
      <section className="py-16 md:py-20 bg-cream border-t border-espresso/5 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-14 sm:mb-16">
          <span className="text-xs font-semibold uppercase tracking-widest text-gold-dark block">
            Three Effortless Steps
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-[38px] text-espresso">
            How AEVA Delivers Your Heart
          </h2>
          <p className="text-sm sm:text-base text-espresso-muted font-light leading-relaxed">
            No design expertise needed. We turn your tender moments into an unforgettable cinematic story.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Step 1 */}
          <div className="bg-cream-light p-8 rounded-3xl border border-espresso/10 text-center flex flex-col items-center hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full bg-cream-warm text-gold-dark font-serif text-xl font-bold flex items-center justify-center mb-6">
              1
            </div>
            <h3 className="font-serif text-xl font-semibold mb-3 text-espresso">
              Choose Your Aesthetic
            </h3>
            <p className="text-sm text-espresso-muted font-light leading-relaxed">
              Select from our curated gallery of editorial palettes, subtle animations, and typographic styling.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-cream-light p-8 rounded-3xl border border-espresso/10 text-center flex flex-col items-center hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full bg-cream-warm text-gold-dark font-serif text-xl font-bold flex items-center justify-center mb-6">
              2
            </div>
            <h3 className="font-serif text-xl font-semibold mb-3 text-espresso">
              Compose Your Letter
            </h3>
            <p className="text-sm text-espresso-muted font-light leading-relaxed">
              Add your heartfelt words, memories, and secret passcode to personalize your unforgettable surprise.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-cream-light p-8 rounded-3xl border border-espresso/10 text-center flex flex-col items-center hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full bg-cream-warm text-gold-dark font-serif text-xl font-bold flex items-center justify-center mb-6">
              3
            </div>
            <h3 className="font-serif text-xl font-semibold mb-3 text-espresso">
              Deliver the Moment
            </h3>
            <p className="text-sm text-espresso-muted font-light leading-relaxed">
              Share your generated private link. Your partner experiences the proposal and records their joyful answer.
            </p>
          </div>
        </div>
      </section>

      {/* 4. TEMPLATES GALLERY */}
      <section id="templates" className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <span className="text-xs font-semibold uppercase tracking-widest text-gold-dark block mb-2">
            Curated Themes
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-[38px] text-espresso">
            The Design Collection
          </h2>
          <p className="mt-3 text-sm sm:text-base text-espresso-muted font-light">
            Every love story is distinct. Discover the visual identity that speaks to yours.
          </p>
        </div>

        {/* Search & Category Filter */}
        <div className="w-full max-w-2xl mx-auto mb-10">
          {/* Search Input */}
          <div className="relative w-full max-w-md mx-auto mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-espresso/40" />
            <input
              type="text"
              placeholder="Search templates by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-full border border-espresso/20 bg-cream-light text-espresso placeholder:text-espresso/40 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-espresso/40 hover:text-espresso text-xs p-1 cursor-pointer"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-2 scrollbar-none hide-scrollbar flex-nowrap sm:flex-wrap">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer min-h-[36px] ${
                    isActive
                      ? 'bg-espresso text-cream shadow-sm'
                      : 'bg-cream border border-espresso/20 text-espresso hover:border-gold/60'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Templates Fetch Grid */}
        {isLoadingTemplates ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-gold-dark" />
            <span className="text-sm text-espresso-muted font-light">Loading template collection...</span>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="py-16 px-6 text-center bg-cream-light rounded-3xl border border-espresso/10 shadow-sm max-w-md mx-auto space-y-3">
            <Sparkles className="w-8 h-8 text-gold mx-auto" />
            <h3 className="font-serif text-xl font-semibold text-espresso">
              No templates found for this search.
            </h3>
            <p className="text-xs sm:text-sm text-espresso-muted font-light leading-relaxed">
              Try adjusting your search terms or selecting a different category.
            </p>
            {(searchQuery || selectedCategory !== 'All') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-espresso/20 text-xs text-espresso hover:bg-rose transition-colors min-h-[36px] cursor-pointer"
              >
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredTemplates.map((tmpl) => (
              <div
                key={tmpl.id}
                className="bg-cream-light rounded-2xl overflow-hidden border border-espresso/10 hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* Visual Card Header */}
                  <div className="relative aspect-[16/10] bg-gradient-to-br from-espresso via-[#3D2E28] to-gold p-6 flex flex-col justify-between text-white overflow-hidden shadow-inner">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-xs font-light text-white/90">
                        {tmpl.category || 'Romantic'}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-white/90 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full">
                        <Coins className="w-3.5 h-3.5 text-gold" />
                        <span>
                          {tmpl.credit_cost !== undefined
                            ? `${tmpl.credit_cost} Credit${tmpl.credit_cost === 1 ? '' : 's'}`
                            : '1 Credit'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-serif text-2xl font-semibold text-white tracking-wide">
                        {tmpl.name}
                      </h3>
                      <p className="text-xs text-white/70 line-clamp-1 mt-1 font-light">
                        {tmpl.description || 'A timeless proposal experience crafted with poetic elegance.'}
                      </p>
                    </div>
                  </div>

                  <div className="p-6">
                    <p className="text-xs sm:text-sm text-espresso-muted font-light line-clamp-2">
                      {tmpl.description || 'Cinematic animations, bespoke typography, and personal love letter reveal.'}
                    </p>
                  </div>
                </div>

                <div className="p-6 pt-0 flex items-center gap-3">
                  <button
                    onClick={() => setSelectedTemplate(tmpl)}
                    className="flex-1 py-3 rounded-full border border-espresso/15 bg-cream hover:bg-cream-warm text-espresso text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-gold-dark" />
                    <span>Preview</span>
                  </button>
                  <button
                    onClick={() => navigate(`/create?template=${tmpl.id}`)}
                    className="flex-1 py-3 rounded-full bg-espresso text-cream hover:bg-espresso-pure text-xs font-semibold transition-colors text-center flex items-center justify-center gap-1 min-h-[44px] cursor-pointer"
                  >
                    <span>Select</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 5. PRICING SECTION */}
      <section id="pricing" className="py-16 md:py-20 bg-cream-warm/40 border-y border-espresso/5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-14">
            <span className="text-xs font-semibold uppercase tracking-widest text-gold-dark block mb-2">
              Transparent &amp; Simple
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-[38px] text-espresso">
              Invest in a Memory
            </h2>
            <p className="mt-3 text-sm sm:text-base text-espresso-muted font-light">
              Simple one-time credit bundles. No recurring subscriptions or hidden costs.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 relative ${
                  plan.popular
                    ? 'bg-cream-light text-espresso shadow-xl ring-2 ring-gold border border-gold scale-100 lg:-translate-y-2'
                    : 'bg-cream text-espresso border border-espresso/10 shadow-sm hover:shadow-md'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gold text-cream text-xs font-semibold uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" />
                    <span>Most Popular</span>
                  </span>
                )}

                <div>
                  <div className="flex justify-between items-baseline mb-4">
                    <h3 className="font-serif text-2xl font-bold text-espresso">{plan.name}</h3>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full ${
                        plan.popular
                          ? 'bg-cream-warm text-gold-dark font-medium'
                          : 'bg-rose text-espresso'
                      }`}
                    >
                      {plan.credits}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="font-serif text-4xl sm:text-5xl font-bold text-espresso">
                      {plan.price}
                    </span>
                    <span className="text-xs font-light text-espresso-muted">
                      one-time
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm font-light mb-6 leading-relaxed text-espresso-muted">
                    {plan.desc}
                  </p>

                  <div className="space-y-3 pt-6 border-t border-espresso/10 mb-8">
                    {plan.features.map((feat) => (
                      <div key={feat} className="flex items-center gap-3 text-xs sm:text-sm">
                        <Check className="w-4 h-4 shrink-0 text-gold-dark" />
                        <span className="text-espresso/90 font-light">
                          {feat}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/dashboard?buy=true&amount=${plan.amount}&credits=${plan.creditsNum}`)}
                  className={`w-full py-4 rounded-full font-medium text-sm transition-all min-h-[48px] flex items-center justify-center cursor-pointer ${
                    plan.popular
                      ? 'bg-espresso text-cream hover:bg-espresso-pure shadow-md active:scale-[0.98]'
                      : 'border border-espresso/20 bg-cream-light hover:bg-cream-warm text-espresso active:scale-[0.98]'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. FAQ SECTION */}
      <section id="faq" className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="text-center mb-12 sm:mb-14">
          <span className="text-xs font-semibold uppercase tracking-widest text-gold-dark block mb-2">
            Clarifications
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-[38px] text-espresso">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-base text-espresso-muted font-light">
            Everything you need to know about creating, sending, and sharing your proposal.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = activeFaq === index;
            return (
              <div
                key={faq.q}
                className="bg-cream rounded-2xl border border-espresso/10 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : index)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 font-serif text-base sm:text-lg font-semibold text-espresso hover:text-gold-dark transition-colors cursor-pointer min-h-[44px]"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-gold-dark shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="px-6 pb-6 text-xs sm:text-sm text-espresso-muted font-light leading-relaxed border-t border-espresso/5 pt-4"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="border-t border-espresso/10 bg-cream pt-14 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          {/* Logo & Tagline */}
          <div className="space-y-2">
            <a href="#" className="flex items-center justify-center md:justify-start gap-1.5 text-2xl font-serif tracking-widest text-[#2B1F1A] group">
              <span className="font-semibold">AEVA</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#C59B63] transition-transform duration-300 group-hover:scale-125" />
            </a>
            <p className="text-xs sm:text-sm text-espresso-muted font-light max-w-xs">
              Bespoke, cinematic love proposals designed for forever. Delivered as a tender link.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-espresso-muted">
            <a href="#templates" className="hover:text-espresso transition-colors min-h-[44px] inline-flex items-center">
              Templates
            </a>
            <a href="#pricing" className="hover:text-espresso transition-colors min-h-[44px] inline-flex items-center">
              Pricing
            </a>
            <button
              onClick={() => navigate('/about')}
              className="hover:text-espresso transition-colors min-h-[44px] inline-flex items-center cursor-pointer"
            >
              About
            </button>
            <a href="#faq" className="hover:text-espresso transition-colors min-h-[44px] inline-flex items-center">
              FAQ
            </a>
            <a href="#" className="hover:text-espresso transition-colors min-h-[44px] inline-flex items-center">
              Privacy &amp; Terms
            </a>
          </div>

          {/* Copyright */}
          <div className="text-xs text-espresso-muted/60 font-light">
            &copy; {new Date().getFullYear()} AEVA Inc. All romantic rights reserved.
          </div>
        </div>
      </footer>

      {/* Template Preview Modal */}
      <AnimatePresence>
        {selectedTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-cream-light text-espresso rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative border border-gold/30 overflow-hidden"
            >
              <button
                onClick={() => setSelectedTemplate(null)}
                aria-label="Close Preview"
                className="absolute top-5 right-5 w-9 h-9 rounded-full bg-espresso/5 flex items-center justify-center hover:bg-espresso/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-espresso" />
              </button>

              <div className="w-full aspect-video rounded-xl bg-gradient-to-br from-espresso via-[#3D2E28] to-gold p-5 flex flex-col justify-end text-white shadow-md mb-5">
                <span className="text-xs font-light text-white/70 uppercase tracking-widest">
                  {selectedTemplate.category || 'Romantic'}
                </span>
                <h4 className="font-serif text-2xl font-bold">{selectedTemplate.name}</h4>
                <div className="flex items-center gap-1.5 text-xs text-white/80 mt-1">
                  <Coins className="w-3.5 h-3.5 text-gold" />
                  <span>
                    {selectedTemplate.credit_cost !== undefined
                      ? `${selectedTemplate.credit_cost} Credit${selectedTemplate.credit_cost === 1 ? '' : 's'}`
                      : '1 Credit'}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-serif text-xl font-semibold">About this experience</h3>
                <p className="text-sm text-espresso-muted font-light leading-relaxed">
                  {selectedTemplate.description || 'A timeless proposal experience crafted with poetic elegance.'}
                </p>
                <div className="p-3 bg-cream-warm rounded-xl text-xs text-espresso-muted flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-gold-dark shrink-0" />
                  <span>Includes responsive mobile layout, custom music, and instant response reveal.</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-espresso/10 flex gap-3">
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="w-1/2 py-2.5 rounded-full border border-espresso/20 text-xs font-semibold text-espresso hover:bg-cream-warm transition-colors min-h-[44px] cursor-pointer"
                >
                  Close
                </button>

                {/* Modal "Use Template" Button */}
                <button
                  onClick={() => {
                    const id = selectedTemplate.id;
                    setSelectedTemplate(null);
                    navigate(`/create?template=${id}`);
                  }}
                  className="w-1/2 py-2.5 rounded-full bg-espresso text-cream hover:bg-espresso-pure text-xs font-semibold text-center flex items-center justify-center transition-colors min-h-[44px] cursor-pointer"
                >
                  <span>Use Template</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
