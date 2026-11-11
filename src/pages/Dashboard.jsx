import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  LogOut,
  Coins,
  PlusCircle,
  Clock,
  Heart,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Copy,
  ExternalLink,
  Check,
  AlertCircle,
  X,
  CreditCard,
  QrCode,
  Download
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { supabase, handleJwtExpiration } from '../lib/supabase.js';

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Proposal History State
  const [proposals, setProposals] = useState([]);
  const [isLoadingProposals, setIsLoadingProposals] = useState(true);

  // QR Modal State
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrLink, setQrLink] = useState('');
  const qrWrapperRef = useRef(null);

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

  // bKash Manual Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState({ amount: 100, credits: 7 });
  const [bkashNumber, setBkashNumber] = useState('');
  const [trxId, setTrxId] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const BKASH_MERCHANT_NUMBER = '01753238247';

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  useEffect(() => {
    async function loadUserAndProfile() {
      setIsLoading(true);
      try {
        const {
          data: { session: currentSession },
          error: sessionError
        } = await supabase.auth.getSession();

        if (sessionError || !currentSession) {
          navigate('/login');
          return;
        }

        // Handle expired session JWT proactively
        let activeSession = currentSession;
        if (currentSession.expires_at && currentSession.expires_at * 1000 < Date.now()) {
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError || !refreshData?.session) {
            await supabase.auth.signOut().catch(() => {});
            navigate('/login');
            return;
          }
          activeSession = refreshData.session;
        }

        setSession(activeSession);

        // Open bKash payment modal if buy=true param is present
        if (searchParams.get('buy') === 'true') {
          const paramAmount = searchParams.get('amount');
          const paramCredits = searchParams.get('credits');
          if (paramAmount && paramCredits) {
            setSelectedPlan({
              amount: Number(paramAmount),
              credits: Number(paramCredits)
            });
          }
          setIsPaymentModalOpen(true);
        }

        // 1. Fetch user profile
        let { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', activeSession.user.id)
          .single();

        if (profileError && (await handleJwtExpiration(profileError))) {
          const retry = await supabase
            .from('profiles')
            .select('*')
            .eq('id', activeSession.user.id)
            .single();
          profileData = retry.data;
          profileError = retry.error;
        }

        if (profileError) {
          console.warn('Profile fetch note:', profileError.message);
        } else if (profileData) {
          setProfile(profileData);
        }

        // 2. Fetch user's proposals history
        setIsLoadingProposals(true);
        let { data: proposalsData, error: proposalsError } = await supabase
          .from('user_proposals')
          .select('*')
          .eq('user_id', activeSession.user.id)
          .order('created_at', { ascending: false });

        if (proposalsError && (await handleJwtExpiration(proposalsError))) {
          const retry = await supabase
            .from('user_proposals')
            .select('*')
            .eq('user_id', activeSession.user.id)
            .order('created_at', { ascending: false });
          proposalsData = retry.data;
          proposalsError = retry.error;
        }

        if (proposalsError) {
          console.warn('Proposals fetch note:', proposalsError.message);
        } else if (proposalsData) {
          setProposals(proposalsData);
        }
      } catch (err) {
        console.error('Session loading error:', err);
      } finally {
        setIsLoading(false);
        setIsLoadingProposals(false);
      }
    }

    loadUserAndProfile();
  }, [navigate, searchParams]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Sign out error:', e);
    }
    navigate('/login');
  };

  const handleCopyLink = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      showToast('Proposal link copied to clipboard!');
    } catch {
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      showToast('Proposal link copied to clipboard!');
    }
  };

  const handleCopyBkashNumber = async () => {
    try {
      await navigator.clipboard.writeText(BKASH_MERCHANT_NUMBER);
      showToast('bKash number copied to clipboard!');
    } catch {
      showToast('bKash number: ' + BKASH_MERCHANT_NUMBER);
    }
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    setPaymentError('');

    if (!bkashNumber.trim()) {
      setPaymentError('Please enter your bKash phone number.');
    }
    if (!trxId.trim()) {
      setPaymentError('Please enter the bKash Transaction ID (TrxID).');
      return;
    }

    if (!session?.user) {
      setPaymentError('Authentication error. Please log in again.');
      return;
    }

    setIsSubmittingPayment(true);

    try {
      const { error } = await supabase.from('credit_requests').insert({
        user_id: session.user.id,
        user_email: session.user.email,
        bkash_number: bkashNumber.trim(),
        transaction_id: trxId.trim().toUpperCase(),
        amount: selectedPlan.amount,
        credits_requested: selectedPlan.credits,
        status: 'pending'
      });

      if (error) {
        throw error;
      }

      setIsPaymentModalOpen(false);
      setBkashNumber('');
      setTrxId('');
      showToast(`Payment submitted! ${selectedPlan.credits} credits will be added once verified.`);
    } catch (err) {
      console.error('Payment request error:', err);
      setPaymentError(err.message || 'Failed to submit payment request. Please try again.');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream text-espresso font-sans flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-9 h-9 animate-spin text-gold mb-3" />
        <p className="font-serif text-lg font-medium text-espresso">
          Loading your dashboard...
        </p>
      </div>
    );
  }

  const userEmail = session?.user?.email || 'User';
  const availableCredits = profile?.credits ?? 5;

  return (
    <div className="min-h-screen bg-cream text-espresso font-sans antialiased selection:bg-rose selection:text-espresso pb-24">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-cream/95 backdrop-blur-md border-b border-espresso/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-xl sm:text-2xl font-serif tracking-widest text-espresso hover:opacity-80 transition-opacity min-h-[44px]"
          >
            <span className="font-semibold">AEVA</span>
            <span className="w-1.5 h-1.5 rounded-full bg-gold" />
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-espresso/20 text-xs font-medium text-espresso hover:bg-rose transition-colors min-h-[44px] cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 space-y-8">
        {/* Welcome Banner */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-gold font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Member Dashboard</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-espresso">
            Welcome back, <span className="font-normal italic">{userEmail}</span>
          </h1>
          <p className="text-xs sm:text-sm text-espresso-muted font-light">
            Manage your romantic proposal balance, review past moments, and acquire more credits.
          </p>
        </div>

        {/* Available Credits Card */}
        <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-espresso-pure via-espresso to-[#1C1411] text-white shadow-xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6 border border-gold/30">
          <div className="absolute -top-16 -right-16 w-44 h-44 bg-gold/20 rounded-full blur-2xl pointer-events-none" />

          <div className="space-y-2">
            <span className="text-xs font-light text-white/70 uppercase tracking-widest flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-gold" />
              <span>Proposal Credits Balance</span>
            </span>
            <div className="flex items-baseline gap-3">
              <span className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-white">
                {availableCredits}
              </span>
              <span className="text-sm text-gold font-medium uppercase tracking-wider">
                Credits Available
              </span>
            </div>
            <p className="text-xs text-white/70 font-light max-w-sm">
              Each credit unlocks 1 published animated romantic proposal link with custom music &amp; response alerts.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full border border-white/20 text-xs font-semibold text-white hover:bg-white/10 transition-colors min-h-[44px] cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5 text-gold" />
              <span>Buy More (৳100)</span>
            </button>
            <button
              onClick={() => navigate('/create')}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gold text-white text-xs font-semibold hover:bg-gold-dark shadow-md active:scale-[0.98] transition-all min-h-[44px] cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create New Proposal</span>
            </button>
          </div>
        </div>

        {/* Quick Actions / Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-cream-light rounded-3xl p-6 border border-espresso/10 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-full bg-rose text-gold flex items-center justify-center">
              <Heart className="w-5 h-5 fill-gold text-gold" />
            </div>
            <h3 className="font-serif text-lg font-bold text-espresso">
              Craft a Love Proposal
            </h3>
            <p className="text-xs text-espresso-muted font-light leading-relaxed">
              Choose from our curated templates, compose your personal letter, and seal with a 4-digit unlock code.
            </p>
            <button
              onClick={() => navigate('/create')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold hover:underline pt-1 cursor-pointer min-h-[44px]"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-cream-light rounded-3xl p-6 border border-espresso/10 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-full bg-rose text-gold flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-gold" />
            </div>
            <h3 className="font-serif text-lg font-bold text-espresso">
              Private &amp; Secure Delivery
            </h3>
            <p className="text-xs text-espresso-muted font-light leading-relaxed">
              Every proposal link is unlisted and encoded. Responses are privately returned to you on WhatsApp.
            </p>
            <Link
              to="/#faq"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold hover:underline pt-1 min-h-[44px]"
            >
              <span>Learn how it works</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Proposal History Section */}
        <section className="bg-cream-light rounded-3xl p-6 sm:p-8 border border-espresso/10 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-espresso/10 pb-4">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-widest text-gold block">
                Activity
              </span>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-espresso">
                Your Proposals History
              </h2>
            </div>
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-rose text-espresso">
              {proposals.length} Saved
            </span>
          </div>

          {isLoadingProposals ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-gold" />
              <span className="text-xs text-espresso-muted">Loading your proposal history...</span>
            </div>
          ) : proposals.length === 0 ? (
            <div className="py-12 text-center text-xs text-espresso-muted space-y-3">
              <Clock className="w-8 h-8 text-gold/60 mx-auto" />
              <p className="font-medium text-sm text-espresso">
                No proposals created yet
              </p>
              <p className="max-w-xs mx-auto font-light leading-relaxed">
                Your generated links will appear here so you can re-open or share them with your partner at any time.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => navigate('/create')}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-espresso text-cream text-xs font-semibold hover:bg-espresso-pure shadow-sm transition-all min-h-[44px] cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-gold" />
                  <span>Create Your First Proposal</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {proposals.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl border border-espresso/10 bg-cream flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-gold/40"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Heart className="w-4 h-4 text-gold fill-gold" />
                      <span className="font-serif text-base font-bold text-espresso">
                        For {item.receiver_name || 'Partner'}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose text-espresso">
                        {item.template_name || 'AEVA Proposal'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-espresso-muted font-mono">
                      <span>
                        {item.created_at
                          ? new Date(item.created_at).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })
                          : 'Recent'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => handleCopyLink(item.generated_link)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-espresso/15 bg-cream-light text-espresso hover:bg-rose transition-colors min-h-[44px] cursor-pointer"
                      title="Copy sharable link"
                    >
                      <Copy className="w-3.5 h-3.5 text-gold" />
                      <span>Copy Link</span>
                    </button>

                    <button
                      onClick={() => {
                        setQrLink(item.generated_link);
                        setQrModalOpen(true);
                      }}
                      className="bg-[#F7ECE8] text-[#2B1F1A] hover:bg-[#C59B63] hover:text-white rounded-xl px-3 py-2 text-xs font-medium border border-[#2B1F1A]/15 flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer transition-colors"
                      title="View QR Code"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>QR</span>
                    </button>

                    <a
                      href={item.generated_link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-espresso text-cream hover:bg-espresso-pure transition-colors min-h-[44px]"
                      title="Open proposal"
                    >
                      <span>Open</span>
                      <ExternalLink className="w-3.5 h-3.5 text-gold" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* bKash Manual Payment Modal */}
      <AnimatePresence>
        {isPaymentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg max-h-[90vh] overflow-y-auto hide-scrollbar bg-cream-light rounded-3xl p-6 sm:p-8 border border-espresso/10 shadow-2xl relative space-y-6"
            >
              {/* Close Button */}
              <button
                onClick={() => {
                  setIsPaymentModalOpen(false);
                  setPaymentError('');
                }}
                className="absolute top-5 right-5 w-9 h-9 rounded-full bg-cream text-espresso/60 hover:text-espresso flex items-center justify-center cursor-pointer min-h-[44px] min-w-[44px] z-10"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-1">
                <span className="text-xs uppercase tracking-widest text-gold font-semibold flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5" />
                  <span>Manual bKash Checkout</span>
                </span>
                <h2 className="font-serif text-2xl font-bold text-espresso">
                  Acquire {selectedPlan.credits} Proposal Credits
                </h2>
                <p className="text-xs text-espresso-muted font-light">
                  Follow the steps below to complete your payment via bKash Personal.
                </p>
              </div>

              {/* Select Package */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-espresso/80">
                  Select Package
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPlan({ amount: 50, credits: 3 })}
                    className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border text-center cursor-pointer min-h-[44px] flex flex-col items-center justify-center ${
                      selectedPlan.amount === 50 && selectedPlan.credits === 3
                        ? 'bg-gold text-white border-gold shadow-sm'
                        : 'bg-cream text-espresso border-espresso/15 hover:border-gold/50'
                    }`}
                  >
                    <span className="font-bold">Starter</span>
                    <span className={`text-[10px] ${selectedPlan.amount === 50 ? 'text-white/90' : 'text-espresso-muted'}`}>
                      ৳50 / 3 Credits
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPlan({ amount: 100, credits: 7 })}
                    className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border text-center cursor-pointer min-h-[44px] flex flex-col items-center justify-center ${
                      selectedPlan.amount === 100 && selectedPlan.credits === 7
                        ? 'bg-gold text-white border-gold shadow-sm'
                        : 'bg-cream text-espresso border-espresso/15 hover:border-gold/50'
                    }`}
                  >
                    <span className="font-bold">Plus</span>
                    <span className={`text-[10px] ${selectedPlan.amount === 100 ? 'text-white/90' : 'text-espresso-muted'}`}>
                      ৳100 / 7 Credits
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPlan({ amount: 1000, credits: 40 })}
                    className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border text-center cursor-pointer min-h-[44px] flex flex-col items-center justify-center ${
                      selectedPlan.amount === 1000 && selectedPlan.credits === 40
                        ? 'bg-gold text-white border-gold shadow-sm'
                        : 'bg-cream text-espresso border-espresso/15 hover:border-gold/50'
                    }`}
                  >
                    <span className="font-bold">Premium</span>
                    <span className={`text-[10px] ${selectedPlan.amount === 1000 ? 'text-white/90' : 'text-espresso-muted'}`}>
                      ৳1000 / 40 Credits
                    </span>
                  </button>
                </div>
              </div>

              {/* Offer & Instructions Box */}
              <div className="p-4 rounded-2xl bg-rose border border-gold/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-espresso">Package</span>
                  <span className="text-xs font-bold font-mono text-gold bg-cream px-2.5 py-1 rounded-full border border-gold/30">
                    ৳{selectedPlan.amount} = {selectedPlan.credits} Credits
                  </span>
                </div>

                <div className="pt-2 border-t border-gold/20 space-y-2">
                  <p className="text-xs text-espresso leading-relaxed">
                    1. Send <strong className="font-bold text-espresso">৳{selectedPlan.amount}</strong> via "Send Money" to bKash Personal:
                  </p>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-cream border border-espresso/10">
                    <span className="font-mono text-sm font-bold text-espresso">
                      {BKASH_MERCHANT_NUMBER}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyBkashNumber}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-gold hover:underline cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy Number</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-espresso-muted font-light leading-relaxed">
                    2. After sending the payment, enter your bKash phone number and the 10-character Transaction ID below.
                  </p>
                </div>
              </div>

              {/* Error Message */}
              {paymentError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{paymentError}</span>
                </div>
              )}

              {/* Input Form */}
              <form onSubmit={handleSubmitPayment} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-espresso/80 mb-1.5">
                    Your bKash Phone Number
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 01700000000"
                    value={bkashNumber}
                    onChange={(e) => setBkashNumber(e.target.value)}
                    disabled={isSubmittingPayment}
                    className="w-full px-4 py-3 rounded-xl border border-espresso/20 bg-cream text-sm font-mono text-espresso focus:outline-none focus:ring-2 focus:ring-gold min-h-[48px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-espresso/80 mb-1.5">
                    bKash Transaction ID (TrxID)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 9J4K2L8MNP"
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value)}
                    disabled={isSubmittingPayment}
                    className="w-full px-4 py-3 rounded-xl border border-espresso/20 bg-cream text-sm font-mono uppercase text-espresso focus:outline-none focus:ring-2 focus:ring-gold min-h-[48px]"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingPayment}
                    className={`w-full h-12 min-h-[48px] rounded-full text-cream font-semibold text-sm transition-all shadow-md flex items-center justify-center gap-2 ${
                      isSubmittingPayment
                        ? 'bg-espresso/50 cursor-not-allowed'
                        : 'bg-espresso hover:bg-espresso-pure active:scale-[0.98] cursor-pointer'
                    }`}
                  >
                    {isSubmittingPayment ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-gold" />
                        <span>Submitting Request...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 text-gold" />
                        <span>Submit for Verification</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QR Code Modal */}
      <AnimatePresence>
        {qrModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-sm max-h-[90vh] overflow-y-auto hide-scrollbar bg-cream-light rounded-3xl p-6 sm:p-8 border border-espresso/10 shadow-2xl relative space-y-5 text-center"
            >
              {/* Close Button */}
              <button
                onClick={() => setQrModalOpen(false)}
                className="absolute top-5 right-5 w-9 h-9 rounded-full bg-cream text-espresso/60 hover:text-espresso flex items-center justify-center cursor-pointer min-h-[44px] min-w-[44px] z-10"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-1">
                <span className="text-xs uppercase tracking-widest text-gold font-semibold flex items-center justify-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-gold" />
                  <span>Scan to Open</span>
                </span>
                <h2 className="font-serif text-2xl font-bold text-espresso">
                  Scan to Open Proposal
                </h2>
                <p className="text-xs text-espresso-muted font-light">
                  Point any phone camera or QR scanner at the screen to immediately reveal the proposal.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-espresso/10 shadow-sm flex flex-col items-center justify-center">
                <div ref={qrWrapperRef} className="p-2 bg-white flex items-center justify-center">
                  <QRCode value={qrLink} size={200} fgColor="#2B1F1A" bgColor="#FFFFFF" />
                </div>
                <button
                  type="button"
                  onClick={downloadQRCode}
                  className="mt-4 flex items-center gap-2 px-6 py-2.5 rounded-full border border-espresso/20 text-espresso font-medium text-xs hover:bg-espresso hover:text-cream transition-colors min-h-[44px] cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download QR</span>
                </button>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleCopyLink(qrLink)}
                  className="w-full py-3 rounded-full bg-espresso text-cream hover:bg-espresso-pure text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer shadow-md"
                >
                  <Copy className="w-3.5 h-3.5 text-gold" />
                  <span>Copy Proposal Link</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Success Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full bg-espresso text-cream text-xs font-medium shadow-2xl flex items-center gap-2 border border-gold"
          >
            <Check className="w-4 h-4 text-gold" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
