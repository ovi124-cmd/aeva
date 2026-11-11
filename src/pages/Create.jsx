import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  RefreshCw,
  Heart,
  KeyRound,
  Eye,
  Lock,
  Music,
  Play,
  Pause,
  X,
  Loader2,
  Coins,
  AlertCircle,
  Search,
  QrCode,
  Link as LinkIcon,
  Download
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { encodeProposal } from '../lib/encode.js';
import { supabase, fetchActiveTemplates, handleJwtExpiration } from '../lib/supabase.js';

export default function Create() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back

  // Auth & Credits State
  const [user, setUser] = useState(null);
  const [userCredits, setUserCredits] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Dynamic Supabase templates state
  const [templates, setTemplates] = useState([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);

  // Search & Category Filter States (Step 1)
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

  // Form State
  const [formData, setFormData] = useState(() => ({
    templateId: searchParams.get('template') || '',
    senderName: '',
    receiverName: '',
    message: '',
    secretCode: String(Math.floor(1000 + Math.random() * 9000)),
    musicUrl: ''
  }));

  // Audio Preview States & Ref
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const previewAudioRef = useRef(null);

  // Generated Link & Toast
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [shareMethod, setShareMethod] = useState('link'); // 'link' | 'qr'
  const qrWrapperRef = useRef(null);
  const [encodedPayload, setEncodedPayload] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastText, setToastText] = useState('');
  const [errors, setErrors] = useState({});

  const downloadQRCode = () => {
    if (!qrWrapperRef.current) return;
    const svg = qrWrapperRef.current.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    // Set high resolution for print quality
    const size = 1000;
    canvas.width = size;
    canvas.height = size;

    img.onload = () => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = 'AEVA-Proposal-QR.png';
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  // 1. Route Protection & Fetch Profile on mount
  useEffect(() => {
    async function checkAuthAndProfile() {
      setIsAuthChecking(true);
      try {
        const {
          data: { session },
          error: sessionError
        } = await supabase.auth.getSession();

        if (sessionError || !session) {
          navigate('/login');
          return;
        }

        // Handle expired JWT session proactively
        let activeSession = session;
        if (session.expires_at && session.expires_at * 1000 < Date.now()) {
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError || !refreshData?.session) {
            await supabase.auth.signOut().catch(() => {});
            navigate('/login');
            return;
          }
          activeSession = refreshData.session;
        }

        setUser(activeSession.user);

        // Fetch user profile credits
        let { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('credits')
          .eq('id', activeSession.user.id)
          .single();

        if (profileError && (await handleJwtExpiration(profileError))) {
          const retry = await supabase
            .from('profiles')
            .select('credits')
            .eq('id', activeSession.user.id)
            .single();
          profileData = retry.data;
          profileError = retry.error;
        }

        if (profileError) {
          console.warn('Profile fetch warning:', profileError.message);
          setUserCredits(5); // fallback default
        } else if (profileData) {
          setUserCredits(profileData.credits);
        }
      } catch (err) {
        console.error('Auth verification error:', err);
        navigate('/login');
      } finally {
        setIsAuthChecking(false);
      }
    }

    checkAuthAndProfile();
  }, [navigate]);

  // 2. Fetch active templates from Supabase
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
        console.warn('Supabase fetch exception:', err);
      } finally {
        setIsLoadingTemplates(false);
      }
    }
    fetchTemplates();
  }, []);

  // Synchronize ?template= query param and default selection with fetched templates
  useEffect(() => {
    const templateParam = searchParams.get('template');
    if (templateParam && templates.some((t) => t.id === templateParam)) {
      setFormData((prev) => ({ ...prev, templateId: templateParam }));
    } else if (
      templates.length > 0 &&
      (!formData.templateId || !templates.some((t) => t.id === formData.templateId))
    ) {
      setFormData((prev) => ({ ...prev, templateId: templates[0].id }));
    }
  }, [searchParams, templates, formData.templateId]);

  // Reset preview player when musicUrl changes
  useEffect(() => {
    setIsPreviewPlaying(false);
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.currentTime = 0;
    }
  }, [formData.musicUrl]);

  // Generate random 4-digit secret code
  const refreshSecretCode = () => {
    const newCode = String(Math.floor(1000 + Math.random() * 9000));
    setFormData((prev) => ({ ...prev, secretCode: newCode }));
  };

  const selectedTemplate =
    templates.find((t) => t.id === formData.templateId) || templates[0] || null;

  const validateStep2 = () => {
    const newErrors = {};
    if (!formData.senderName.trim()) {
      newErrors.senderName = 'Your name is required to create this proposal';
    }
    if (!formData.receiverName.trim()) {
      newErrors.receiverName = 'Their name is required to create this proposal';
    }
    if (!formData.secretCode || formData.secretCode.length < 4) {
      newErrors.secretCode = 'Secret code must be 4 digits';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goToStep = (nextStep) => {
    if (nextStep > step) {
      if (step === 1 && !formData.templateId && templates.length > 0) {
        setFormData((prev) => ({ ...prev, templateId: templates[0].id }));
      }
      if (step === 2 && !validateStep2()) {
        return;
      }
      setDirection(1);
    } else {
      setDirection(-1);
    }
    setStep(nextStep);
  };

  const handleGenerate = async () => {
    // Safety check for sender and receiver names
    if (!formData.senderName.trim() || !formData.receiverName.trim()) {
      setToastText('Please go back and enter both names');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3500);
      return;
    }

    const requiredCredits =
      selectedTemplate?.credit_cost !== undefined ? selectedTemplate.credit_cost : 1;

    // Check if user has sufficient credits
    if (userCredits !== null && userCredits < requiredCredits) {
      setToastText('Not enough credits!');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3500);
      return;
    }

    const payload = {
      templateId: formData.templateId || (templates[0] ? templates[0].id : 'custom'),
      senderName: formData.senderName.trim(),
      receiverName: formData.receiverName.trim(),
      message: (formData.message || '').trim(),
      secretCode: formData.secretCode,
      createdAt: Date.now()
    };

    if (formData.musicUrl && formData.musicUrl.trim()) {
      payload.musicUrl = formData.musicUrl.trim();
    }

    const encoded = encodeProposal(payload);
    setEncodedPayload(encoded);

    const baseUrl = window.location.origin;
    const fullUrl = `${baseUrl}/p/${encoded}`;
    setGeneratedUrl(fullUrl);

    // Deduct credits from Supabase & update local state
    if (user && userCredits !== null) {
      const nextCredits = Math.max(0, userCredits - requiredCredits);
      try {
        let { error } = await supabase
          .from('profiles')
          .update({ credits: nextCredits })
          .eq('id', user.id);

        if (error && (await handleJwtExpiration(error))) {
          const retry = await supabase
            .from('profiles')
            .update({ credits: nextCredits })
            .eq('id', user.id);
          error = retry.error;
        }

        if (!error) {
          setUserCredits(nextCredits);
        } else {
          console.warn('Credits update note:', error.message);
        }
      } catch (err) {
        console.warn('Credits deduction error:', err);
      }
    }

    // Save proposal to user_proposals table in Supabase
    if (user) {
      try {
        let { error: insertError } = await supabase.from('user_proposals').insert({
          user_id: user.id,
          template_name: selectedTemplate ? selectedTemplate.name : 'AEVA Proposal',
          receiver_name: formData.receiverName.trim(),
          generated_link: fullUrl
        });

        if (insertError && (await handleJwtExpiration(insertError))) {
          const retry = await supabase.from('user_proposals').insert({
            user_id: user.id,
            template_name: selectedTemplate ? selectedTemplate.name : 'AEVA Proposal',
            receiver_name: formData.receiverName.trim(),
            generated_link: fullUrl
          });
          insertError = retry.error;
        }

        if (insertError) {
          console.error('Failed to save to user_proposals:', insertError.message);
        }
      } catch (err) {
        console.error('Failed to save proposal history:', err);
      }
    }
  };

  const copyToClipboard = async () => {
    if (!generatedUrl) return;
    try {
      await navigator.clipboard.writeText(generatedUrl);
      setToastText('Proposal link copied to clipboard!');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch {
      const input = document.createElement('input');
      input.value = generatedUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setToastText('Proposal link copied to clipboard!');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const slideVariants = {
    enter: (dir) => ({
      x: dir > 0 ? 40 : -40,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (dir) => ({
      x: dir > 0 ? -40 : 40,
      opacity: 0
    })
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-cream text-espresso font-sans flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-9 h-9 animate-spin text-gold mb-3" />
        <p className="font-serif text-lg font-medium text-espresso">
          Verifying your account...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream text-espresso font-sans antialiased selection:bg-rose selection:text-espresso pb-24">
      {/* Top Navigation Bar with Credits Display */}
      <header className="sticky top-0 z-40 bg-cream/95 backdrop-blur-md border-b border-espresso/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-xl sm:text-2xl font-serif tracking-widest text-espresso hover:opacity-80 transition-opacity min-h-[44px] cursor-pointer"
          >
            <span className="font-semibold">AEVA</span>
            <span className="w-1.5 h-1.5 rounded-full bg-gold" />
          </button>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* User Credits Pill */}
            <button
              onClick={() => navigate('/dashboard')}
              title="View member dashboard"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-cream-warm border border-gold/40 text-xs font-semibold text-espresso hover:bg-rose transition-colors min-h-[36px] cursor-pointer"
            >
              <Coins className="w-3.5 h-3.5 text-gold" />
              <span>
                {userCredits !== null
                  ? `${userCredits} Credit${userCredits === 1 ? '' : 's'}`
                  : '...'}
              </span>
            </button>

            <div className="text-xs sm:text-sm font-medium text-espresso-muted">
              Step <span className="text-gold font-bold">{step}</span> of 3
            </div>
          </div>
        </div>

        {/* Full-width Responsive Progress Bar */}
        <div className="w-full bg-espresso/10 h-1">
          <motion.div
            className="bg-gold h-full"
            initial={false}
            animate={{ width: `${(step / 3) * 100}%` }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
          />
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12">
        {/* Step Indicator Header */}
        <div className="text-center mb-8 sm:mb-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose text-espresso text-xs font-semibold tracking-wider uppercase mb-2">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            {step === 1 && 'Step 1: Visual Theme'}
            {step === 2 && 'Step 2: Words of the Heart'}
            {step === 3 && 'Step 3: Preview & Share'}
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif text-espresso">
            {step === 1 && 'Choose Your Canvas'}
            {step === 2 && 'Compose Your Moment'}
            {step === 3 && 'Seal & Deliver'}
          </h1>
          <p className="text-xs sm:text-sm text-espresso-muted mt-1 font-light">
            {step === 1 && 'Select the visual aesthetic that honors your relationship.'}
            {step === 2 && 'Fill in your names, your personal letter, and a secret unlock code.'}
            {step === 3 && 'Inspect your interactive proposal before sending it across.'}
          </p>
        </div>

        {/* Animated Slide Steps */}
        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            {/* STEP 1: CHOOSE TEMPLATE */}
            {step === 1 && (
              <motion.div
                key="step-1"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="space-y-6"
              >
                {/* Search & Category Filter Section */}
                <div className="space-y-4 mb-2">
                  <div className="relative w-full max-w-md mx-auto">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-espresso/40" />
                    <input
                      type="text"
                      placeholder="Search templates by name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 rounded-full border border-espresso/20 bg-cream-light text-espresso placeholder:text-espresso/40 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-gold"
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
                  <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-1 scrollbar-none hide-scrollbar flex-nowrap sm:flex-wrap">
                    {categories.map((cat) => {
                      const isActive = selectedCategory === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer min-h-[36px] ${
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

                {isLoadingTemplates ? (
                  <div className="py-16 flex flex-col items-center justify-center gap-3 text-center bg-cream-light rounded-3xl border border-espresso/10 p-8 shadow-sm">
                    <Loader2 className="w-8 h-8 animate-spin text-gold" />
                    <span className="text-sm text-espresso-muted font-light">Loading templates...</span>
                  </div>
                ) : filteredTemplates.length === 0 ? (
                  <div className="py-16 px-6 text-center bg-cream-light rounded-3xl border border-espresso/10 shadow-sm space-y-3">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTemplates.map((tmpl) => {
                      const isSelected = formData.templateId === tmpl.id;
                      return (
                        <div
                          key={tmpl.id}
                          onClick={() =>
                            setFormData((prev) => ({ ...prev, templateId: tmpl.id }))
                          }
                          className={`cursor-pointer rounded-2xl p-3.5 transition-all duration-200 border text-left flex flex-col justify-between ${
                            isSelected
                              ? 'bg-cream-light border-gold shadow-[0_8px_20px_rgba(197,155,99,0.22)] ring-2 ring-gold'
                              : 'bg-cream-light border-espresso/10 hover:border-gold/60 hover:shadow-sm'
                          }`}
                        >
                          <div>
                            {/* Default Elegant Gradient Visual Placeholder */}
                            <div className="w-full aspect-[16/10] rounded-xl bg-gradient-to-br from-espresso-pure via-espresso to-gold p-3 flex flex-col justify-between relative overflow-hidden shadow-inner">
                              <span className="self-start px-2 py-0.5 rounded-full bg-black/40 text-[10px] text-white/90">
                                {tmpl.category || 'Romantic'}
                              </span>
                              {isSelected && (
                                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gold text-white flex items-center justify-center shadow-md">
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                </div>
                              )}
                              <div>
                                <span className="font-serif text-sm font-semibold text-white/95 block">
                                  {tmpl.name}
                                </span>
                                <span className="text-[10px] text-white/70 flex items-center gap-1 mt-0.5">
                                  <Coins className="w-2.5 h-2.5 text-gold" />
                                  <span>
                                    {tmpl.credit_cost !== undefined
                                      ? `${tmpl.credit_cost} Credit${tmpl.credit_cost === 1 ? '' : 's'}`
                                      : '1 Credit'}
                                  </span>
                                </span>
                              </div>
                            </div>

                            <div className="mt-3">
                              <h3 className="font-serif text-base font-bold text-espresso">
                                {tmpl.name}
                              </h3>
                              <p className="text-xs text-espresso-muted line-clamp-2 mt-0.5 font-light">
                                {tmpl.description || 'A timeless proposal experience crafted with poetic elegance.'}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 pt-2 border-t border-espresso/5 flex items-center justify-between text-[11px] font-medium text-gold">
                            <span>{isSelected ? 'Selected Canvas' : 'Tap to Select'}</span>
                            <Heart
                              className={`w-3.5 h-3.5 ${
                                isSelected ? 'fill-gold text-gold' : 'text-gold'
                              }`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={() => goToStep(2)}
                    disabled={templates.length === 0}
                    className={`w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-full text-cream font-medium text-sm shadow-md transition-all min-h-[48px] ${
                      templates.length === 0
                        ? 'bg-espresso/40 cursor-not-allowed text-cream/60'
                        : 'bg-espresso hover:bg-espresso-pure active:scale-[0.98] cursor-pointer'
                    }`}
                  >
                    <span>Next: Write Details</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: WRITE DETAILS */}
            {step === 2 && (
              <motion.div
                key="step-2"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="space-y-6 bg-cream-light rounded-3xl p-6 sm:p-8 border border-espresso/10 shadow-sm"
              >
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-espresso/80 mb-2">
                      Your Name (Sender) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Alexander"
                      value={formData.senderName}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, senderName: e.target.value }));
                        if (errors.senderName) setErrors((prev) => ({ ...prev, senderName: null }));
                      }}
                      className={`w-full px-4 py-3 rounded-xl border bg-cream text-espresso text-sm focus:outline-none focus:ring-2 focus:ring-gold min-h-[48px] ${
                        errors.senderName ? 'border-red-400' : 'border-espresso/20'
                      }`}
                    />
                    <p className="text-[10px] text-espresso/60 mt-1">This is how they will know who it's from.</p>
                    {errors.senderName && (
                      <p className="text-red-500 text-xs mt-1">{errors.senderName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-espresso/80 mb-2">
                      Their Name (Receiver) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Sarah"
                      value={formData.receiverName}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, receiverName: e.target.value }));
                        if (errors.receiverName)
                          setErrors((prev) => ({ ...prev, receiverName: null }));
                      }}
                      className={`w-full px-4 py-3 rounded-xl border bg-cream text-espresso text-sm focus:outline-none focus:ring-2 focus:ring-gold min-h-[48px] ${
                        errors.receiverName ? 'border-red-400' : 'border-espresso/20'
                      }`}
                    />
                    <p className="text-[10px] text-espresso/60 mt-1">This is who the proposal is meant for.</p>
                    {errors.receiverName && (
                      <p className="text-red-500 text-xs mt-1">{errors.receiverName}</p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-espresso/80">
                        Your Love Letter &amp; Proposal Message <span className="text-espresso/50 font-normal normal-case">(optional)</span>
                      </label>
                      <span
                        className={`text-xs ${
                          formData.message.length > 500
                            ? 'text-red-500 font-bold'
                            : 'text-espresso-muted'
                        }`}
                      >
                        {formData.message.length} / 500
                      </span>
                    </div>
                    <textarea
                      rows={5}
                      maxLength={500}
                      placeholder="Every morning I wake up thanking the stars for your smile. From our quiet rainy mornings to all our chaotic adventures..."
                      value={formData.message}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, message: e.target.value }));
                      }}
                      className="w-full p-4 rounded-xl border border-espresso/20 bg-cream text-espresso text-sm focus:outline-none focus:ring-2 focus:ring-gold leading-relaxed resize-none"
                    />
                  </div>

                  {/* Background Music Selector Section */}
                  <div className="pt-2 space-y-3">
                    <div className="flex items-center gap-2">
                      <Music className="w-4 h-4 text-gold" />
                      <label className="text-xs font-semibold uppercase tracking-wider text-espresso/80">
                        Background Music <span className="text-espresso/50 font-normal normal-case">(optional)</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'No music', value: '' },
                        { label: 'Soft Piano', value: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
                        { label: 'Acoustic', value: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
                        { label: 'Strings', value: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' }
                      ].map((opt) => {
                        const isActive = formData.musicUrl === opt.value;
                        return (
                          <button
                            key={opt.label}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, musicUrl: opt.value }))}
                            className={`min-h-[44px] rounded-xl text-xs font-medium border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                              isActive
                                ? 'bg-gold text-white border-gold shadow-md'
                                : 'bg-cream text-espresso border-espresso/15 hover:border-gold/60'
                            }`}
                          >
                            {isActive && <Check className="w-3 h-3 stroke-[3]" />}
                            <span>{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-2 my-2">
                      <div className="flex-1 h-px bg-espresso/10" />
                      <span className="text-[10px] uppercase tracking-wider text-espresso/50 font-medium">or paste your own</span>
                      <div className="flex-1 h-px bg-espresso/10" />
                    </div>

                    <div>
                      <input
                        type="url"
                        placeholder="https://example.com/song.mp3"
                        value={formData.musicUrl.startsWith('http') ? formData.musicUrl : ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, musicUrl: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-espresso/20 bg-cream text-sm font-mono text-espresso focus:outline-none focus:ring-2 focus:ring-gold min-h-[48px]"
                      />
                      <p className="text-[10px] text-espresso-muted mt-1">
                        Paste any direct audio URL (MP3 recommended). Pixabay, Archive.org, and direct links work.
                      </p>
                    </div>

                    {formData.musicUrl && (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-rose border border-gold/30">
                        <button
                          type="button"
                          onClick={() => {
                            if (isPreviewPlaying) {
                              previewAudioRef.current?.pause();
                              setIsPreviewPlaying(false);
                            } else {
                              previewAudioRef.current?.play()
                                .then(() => setIsPreviewPlaying(true))
                                .catch(() => setIsPreviewPlaying(false));
                            }
                          }}
                          className="w-10 h-10 rounded-full bg-gold text-white flex items-center justify-center shrink-0 min-h-[44px] min-w-[44px] cursor-pointer"
                        >
                          {isPreviewPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-espresso">Music Preview</p>
                          <p className="text-[10px] text-espresso-muted truncate">{formData.musicUrl}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, musicUrl: '' }))}
                          className="text-espresso/50 hover:text-red-500 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                          aria-label="Remove music"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <audio
                          ref={previewAudioRef}
                          src={formData.musicUrl}
                          onEnded={() => setIsPreviewPlaying(false)}
                          onError={() => setIsPreviewPlaying(false)}
                          style={{ display: 'none' }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="pt-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-espresso/80 mb-2">
                      Private Secret Passcode (4-digit unlock)
                    </label>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-cream-warm border border-gold/40 min-h-[44px]">
                        <KeyRound className="w-4 h-4 text-gold" />
                        <span className="text-xs text-espresso/70 font-medium">PIN:</span>
                        <input
                          type="text"
                          maxLength={4}
                          value={formData.secretCode || ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            setFormData((prev) => ({ ...prev, secretCode: val }));
                          }}
                          className="w-16 bg-transparent font-mono text-center font-bold tracking-widest text-base text-espresso focus:outline-none"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={refreshSecretCode}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-espresso/20 text-xs text-espresso hover:bg-rose transition-colors min-h-[44px] cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-gold" />
                        <span>Regenerate Random Code</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-espresso-muted mt-1.5">
                      Your partner will enter this code to unveil your secret proposal question.
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-espresso/10 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
                  <button
                    onClick={() => goToStep(1)}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-full border border-espresso/20 text-sm font-medium text-espresso hover:bg-rose transition-colors min-h-[48px] cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    <span>Back</span>
                  </button>

                  <button
                    onClick={() => goToStep(3)}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 rounded-full bg-espresso text-cream text-sm font-medium shadow-md hover:bg-espresso-pure active:scale-[0.98] transition-all min-h-[48px] cursor-pointer"
                  >
                    <span>Next: Preview Proposal</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: PREVIEW & GENERATE */}
            {step === 3 && (
              <motion.div
                key="step-3"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="space-y-8"
              >
                {/* Live Mini-Preview */}
                <div className="flex flex-col items-center">
                  <div className="text-xs uppercase tracking-widest text-espresso/60 font-semibold mb-3 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-gold" />
                    <span>Live Receiver Mobile Simulation</span>
                  </div>

                  <div className="w-full max-w-sm rounded-[2.5rem] p-3 bg-espresso shadow-2xl border-4 border-espresso-pure">
                    <div className="w-full rounded-[2rem] bg-gradient-to-br from-espresso-pure via-espresso to-gold p-6 text-center text-white relative overflow-hidden flex flex-col justify-between min-h-[420px]">
                      <div className="absolute -top-12 -right-12 w-32 h-32 bg-gold/25 rounded-full blur-xl pointer-events-none" />

                      <div className="flex items-center justify-between text-[11px] text-white/60 border-b border-white/10 pb-3">
                        <span className="font-serif italic tracking-wide">
                          {selectedTemplate ? selectedTemplate.name : 'AEVA Proposal'}
                        </span>
                        <span className="flex items-center gap-1 text-gold">
                          <Lock className="w-3 h-3" /> Passcode {formData.secretCode || '••••'}
                        </span>
                      </div>

                      {formData.musicUrl && (
                        <div className="flex items-center justify-center gap-1 text-[10px] text-gold/90 -mt-1 mb-2">
                          <Music className="w-2.5 h-2.5" />
                          <span>Music included</span>
                        </div>
                      )}

                      <div className="py-6 space-y-3">
                        <div className="w-12 h-12 mx-auto rounded-full bg-gold/20 flex items-center justify-center">
                          <Heart className="w-6 h-6 text-gold fill-gold" />
                        </div>

                        <p className="text-xs text-white/70 font-light uppercase tracking-widest">
                          A special letter for
                        </p>
                        <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white">
                          {formData.receiverName || 'My Love'}
                        </h2>

                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-xs text-white/90 font-light leading-relaxed max-h-36 overflow-y-auto italic border border-white/10">
                          "{formData.message || 'You are the melody to all my quiet moments...'}"
                        </div>

                        <p className="text-[11px] text-white/60 font-serif">
                          From your devotion,{' '}
                          <span className="text-gold font-semibold">
                            {formData.senderName || 'Forever Yours'}
                          </span>
                        </p>
                      </div>

                      <div className="pt-2">
                        <div className="w-full py-2.5 rounded-full bg-gold text-white font-semibold text-xs tracking-wider uppercase shadow-md">
                          Will you marry me?
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Generation & Action Card */}
                <div className="bg-cream-light rounded-3xl p-6 sm:p-8 border border-espresso/10 shadow-sm space-y-6">
                  {!generatedUrl ? (
                    <div className="text-center space-y-4">
                      <h3 className="font-serif text-2xl font-bold text-espresso">
                        Ready to Seal Your Proposal?
                      </h3>
                      <p className="text-xs sm:text-sm text-espresso-muted font-light max-w-md mx-auto">
                        Generating this proposal costs{' '}
                        <span className="font-semibold text-gold">
                          {selectedTemplate?.credit_cost !== undefined
                            ? selectedTemplate.credit_cost
                            : 1}{' '}
                          credit
                        </span>
                        . Your current balance is{' '}
                        <span className="font-semibold text-espresso">
                          {userCredits !== null ? `${userCredits} credits` : '...'}
                        </span>
                        .
                      </p>

                      <button
                        onClick={handleGenerate}
                        className="w-full sm:w-auto inline-flex items-center justify-center px-10 py-4 rounded-full bg-espresso text-cream font-semibold text-base shadow-lg hover:bg-espresso-pure active:scale-[0.98] transition-all min-h-[48px] cursor-pointer"
                      >
                        <Sparkles className="w-5 h-5 mr-2 text-gold" />
                        <span>Generate Link</span>
                      </button>
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="space-y-5"
                    >
                      <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose border border-gold/30">
                        <div className="w-10 h-10 rounded-full bg-gold text-white flex items-center justify-center shrink-0">
                          <Check className="w-5 h-5 stroke-[2.5]" />
                        </div>
                        <div>
                          <h4 className="font-serif text-base font-bold text-espresso">
                            Your Proposal Link is Live!
                          </h4>
                          <p className="text-xs text-espresso-muted font-light">
                            Passcode:{' '}
                            <span className="font-mono font-bold text-espresso">
                              {formData.secretCode}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Share Method Tabs (Link / QR Code) */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShareMethod('link')}
                            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all min-h-[44px] flex items-center justify-center gap-1.5 cursor-pointer ${
                              shareMethod === 'link'
                                ? 'bg-espresso text-cream shadow-sm'
                                : 'bg-cream border border-espresso/20 text-espresso hover:border-gold/60'
                            }`}
                          >
                            <LinkIcon className="w-3.5 h-3.5 text-gold" />
                            <span>Link</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setShareMethod('qr')}
                            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all min-h-[44px] flex items-center justify-center gap-1.5 cursor-pointer ${
                              shareMethod === 'qr'
                                ? 'bg-espresso text-cream shadow-sm'
                                : 'bg-cream border border-espresso/20 text-espresso hover:border-gold/60'
                            }`}
                          >
                            <QrCode className="w-3.5 h-3.5 text-gold" />
                            <span>QR Code</span>
                          </button>
                        </div>

                        {shareMethod === 'link' ? (
                          <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-espresso/70 mb-2">
                              Sharable Unique Link
                            </label>
                            <div className="flex flex-col sm:flex-row items-stretch gap-2">
                              <input
                                type="text"
                                readOnly
                                value={generatedUrl}
                                className="w-full px-4 py-3 rounded-xl border border-espresso/20 bg-cream text-xs font-mono text-espresso focus:outline-none min-h-[44px]"
                              />
                              <button
                                onClick={copyToClipboard}
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-espresso text-cream font-medium text-xs hover:bg-espresso-pure transition-colors shrink-0 min-h-[44px] cursor-pointer"
                              >
                                <Copy className="w-4 h-4" />
                                <span>Copy Link</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-white p-6 rounded-2xl border border-espresso/10 shadow-sm flex flex-col items-center justify-center mt-4">
                            <div ref={qrWrapperRef} className="p-2 bg-white flex items-center justify-center">
                              <QRCode value={generatedUrl} size={200} fgColor="#2B1F1A" bgColor="#FFFFFF" />
                            </div>
                            <p className="text-xs text-espresso/60 mt-4 text-center">
                              Scan this QR code with a phone camera to open the proposal.
                            </p>
                            <button
                              type="button"
                              onClick={downloadQRCode}
                              className="mt-4 flex items-center gap-2 px-6 py-2.5 rounded-full border border-espresso/20 text-espresso font-medium text-xs hover:bg-espresso hover:text-cream transition-colors min-h-[44px] cursor-pointer"
                            >
                              <Download className="w-4 h-4" />
                              <span>Download QR</span>
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <a
                          href={generatedUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-espresso text-cream font-semibold text-sm hover:bg-espresso-pure shadow-md transition-all min-h-[48px]"
                        >
                          <span>Open &amp; Experience Proposal</span>
                          <ExternalLink className="w-4 h-4 text-gold" />
                        </a>
                      </div>

                      <p className="text-[11px] text-espresso-muted italic text-center pt-3">
                        Once your partner says Yes, they'll be able to share their reply 
                        with you via WhatsApp. Keep your phone nearby. 💛
                      </p>
                    </motion.div>
                  )}

                  <div className="pt-4 border-t border-espresso/10 flex items-center justify-between">
                    <button
                      onClick={() => goToStep(2)}
                      className="inline-flex items-center justify-center px-6 py-2.5 rounded-full border border-espresso/20 text-xs font-medium text-espresso hover:bg-rose transition-colors min-h-[44px] cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                      <span>Back to Edit</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Floating Success / Error Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full text-xs font-medium shadow-2xl flex items-center gap-2 border ${
              toastText === 'Not enough credits!' || toastText === 'Please go back and enter both names'
                ? 'bg-red-800 text-white border-red-500'
                : 'bg-espresso text-cream border-gold'
            }`}
          >
            {toastText === 'Not enough credits!' || toastText === 'Please go back and enter both names' ? (
              <AlertCircle className="w-4 h-4 text-red-300" />
            ) : (
              <Check className="w-4 h-4 text-gold" />
            )}
            <span>{toastText || 'Proposal link copied to clipboard!'}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
