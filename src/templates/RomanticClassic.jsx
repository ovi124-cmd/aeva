import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Link } from 'react-router-dom';
import {
  Heart,
  Sparkles,
  KeyRound,
  ArrowRight,
  Lock,
  MessageCircle,
  Volume2,
  VolumeX
} from 'lucide-react';
import { THEMES } from './themes.js';
import { sendAdminYesAlert } from '../lib/telegram.js';

export default function RomanticClassic({
  proposalId = '',
  templateId = 'celestial-vow',
  receiverName = 'My Love',
  senderName = 'Forever Yours',
  message = 'Every second with you feels like poetry written in the stars.',
  secretCode = '1234',
  musicUrl = '',
  onAnswer
}) {
  const t = THEMES[templateId] || THEMES['celestial-vow'];

  const [currentStep, setCurrentStep] = useState(1);
  const [inputCode, setInputCode] = useState('');
  const [codeError, setCodeError] = useState(false);
  const [typedMessage, setTypedMessage] = useState('');
  const [typingComplete, setTypingComplete] = useState(false);

  // Playful "No" button state
  const [noScale, setNoScale] = useState(1);
  const [noOffset, setNoOffset] = useState({ x: 0, y: 0 });
  const [noClickCount, setNoClickCount] = useState(0);

  // Accepted & Reply state
  const [isAccepted, setIsAccepted] = useState(false);
  const [customReply, setCustomReply] = useState('');
  const [shareToast, setShareToast] = useState('');

  // Audio & Mute State
  const [isMuted, setIsMuted] = useState(() => {
    try {
      return localStorage.getItem('aeva_muted') === 'true';
    } catch {
      return false;
    }
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const inputRef = useRef(null);

  // Sync mute state with audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted, musicUrl]);

  // LocalStorage persistence for answered state
  useEffect(() => {
    if (proposalId && typeof window !== 'undefined') {
      try {
        const savedAnswer = localStorage.getItem(`aeva_answered_${proposalId}`);
        if (savedAnswer === 'yes') {
          setCurrentStep(4);
          setIsAccepted(true);
        }
      } catch (e) {
        console.warn('localStorage read error:', e);
      }
    }
  }, [proposalId]);

  // Focus input on Step 2
  useEffect(() => {
    if (currentStep === 2) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 400);
    }
  }, [currentStep]);

  // Typewriter effect on Step 3
  useEffect(() => {
    if (currentStep === 3) {
      setTypedMessage('');
      setTypingComplete(false);
      let index = 0;
      const fullText = message || '';

      if (fullText.length === 0) {
        setTypingComplete(true);
        return;
      }

      const timer = setInterval(() => {
        index += 1;
        setTypedMessage(fullText.slice(0, index));
        if (index >= fullText.length) {
          clearInterval(timer);
          setTypingComplete(true);
        }
      }, 32);

      return () => clearInterval(timer);
    }
  }, [currentStep, message]);

  // Handle Open proposal & initiate audio playback
  const handleOpen = () => {
    setCurrentStep(2);
    if (musicUrl && audioRef.current) {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  // Handle Passcode verification in Step 2
  const handleCodeChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setInputCode(val);
    setCodeError(false);

    if (val.length === 4) {
      const normalizedTarget = String(secretCode || '').trim();
      if (val === normalizedTarget) {
        setTimeout(() => {
          setCurrentStep(3);
        }, 220);
      } else {
        setCodeError(true);
      }
    }
  };

  const handleManualCodeSubmit = (e) => {
    e.preventDefault();
    const normalizedTarget = String(secretCode || '').trim();
    if (inputCode === normalizedTarget) {
      setCurrentStep(3);
    } else {
      setCodeError(true);
    }
  };

  // Playful "No" button dodging/shrinking
  const handleNoInteraction = () => {
    setNoClickCount((prev) => prev + 1);
    setNoScale((prev) => Math.max(0.4, prev * 0.8));
    const randomX = (Math.random() - 0.5) * 80;
    const randomY = (Math.random() - 0.5) * 50;
    setNoOffset({ x: randomX, y: randomY });
  };

  // Celebrate "Yes"
  const handleYes = () => {
    setIsAccepted(true);
    if (proposalId && typeof window !== 'undefined') {
      try {
        localStorage.setItem(`aeva_answered_${proposalId}`, 'yes');
      } catch (e) {
        console.warn('localStorage save error:', e);
      }
    }
    if (onAnswer) onAnswer('yes');

    try {
      const count = 220;
      const defaults = {
        origin: { y: 0.7 },
        colors: [t.accent, '#FFFFFF', t.accentHighlight || '#FAF7F2', '#FF6B6B']
      };

      const fire = (particleRatio, opts) => {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio)
        });
      };

      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });
    } catch (err) {
      console.warn('Confetti error:', err);
    }

    sendAdminYesAlert({
      senderName,
      receiverName,
      templateName: t.name
    });
  };

  // Construct message for sharing response
  const getShareText = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return (
      `I said YES to ${senderName}'s proposal on AEVA 💛` +
      (customReply ? `\n\n"${customReply}"` : '') +
      `\n\nCreate your own moment → ${origin}/create`
    );
  };

  // Share via WhatsApp
  const handleWhatsAppShare = () => {
    const text = getShareText();
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  // Share via native share or clipboard
  const handleAlternativeShare = async () => {
    const text = getShareText();
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'My AEVA answer',
          text
        });
        return;
      } catch (err) {
        // Fallback to clipboard if user cancels or share fails
        if (err.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      setShareToast('Copied to clipboard!');
      setTimeout(() => setShareToast(''), 2500);
    } catch {
      const input = document.createElement('textarea');
      input.value = text;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setShareToast('Copied to clipboard!');
      setTimeout(() => setShareToast(''), 2500);
    }
  };

  // Screen animation variant: fade + slide up
  const stepVariants = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.25 } }
  };

  // Shake variant for incorrect code
  const shakeVariant = {
    shake: {
      x: [0, -10, 10, -10, 10, -5, 5, 0],
      transition: { duration: 0.4 }
    }
  };

  // Helper for dynamic primary CTA button styling
  const getButtonStyle = () => {
    if (t.buttonStyle === 'outline') {
      return {
        background: 'transparent',
        border: `2px solid ${t.accent}`,
        color: t.accent,
        boxShadow: `0 0 15px ${t.accentSoft}`
      };
    }
    if (t.buttonStyle === 'gradient') {
      return {
        background: t.buttonBg,
        color: t.buttonText,
        boxShadow: `0 8px 24px ${t.accentSoft}`
      };
    }
    return {
      background: t.buttonBg || t.accent,
      color: t.buttonText,
      boxShadow: `0 8px 24px ${t.accentSoft}`
    };
  };

  return (
    <div
      style={{
        backgroundColor: t.bg,
        color: t.textPrimary,
        fontFamily: t.sansFont
      }}
      className="min-h-screen font-sans antialiased flex flex-col justify-between items-center relative overflow-x-hidden px-4 sm:px-6 py-8 transition-colors duration-500"
    >
      {/* ─── OPTIONAL BACKGROUND MUSIC AUDIO ELEMENT ────────── */}
      {musicUrl && (
        <audio
          ref={audioRef}
          src={musicUrl}
          loop
          preload="auto"
          muted={isMuted}
          style={{ display: 'none' }}
        />
      )}

      {/* ─── DYNAMIC RADIAL GLOW BACKGROUND ─────────────────── */}
      <div
        style={{
          background: t.bgGlow
        }}
        className="absolute inset-0 pointer-events-none -z-10"
      />

      {/* ─── SUBTLE THEME DECORATIVE LAYER ──────────────────── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* 1. Celestial Vow: Twinkling Stars */}
        {t.decorative === 'stars' && (
          <>
            {Array.from({ length: 28 }).map((_, i) => {
              const top = `${(i * 17) % 95}%`;
              const left = `${(i * 23) % 95}%`;
              const size = i % 3 === 0 ? 3 : i % 2 === 0 ? 2 : 1.5;
              const delay = `${(i % 5) * 0.7}s`;
              const duration = `${2.5 + (i % 3)}s`;
              return (
                <div
                  key={i}
                  style={{
                    top,
                    left,
                    width: `${size}px`,
                    height: `${size}px`,
                    backgroundColor: i % 4 === 0 ? t.accent : '#FFFFFF',
                    borderRadius: '50%',
                    position: 'absolute',
                    animation: `twinkle ${duration} infinite ease-in-out ${delay}`,
                    boxShadow: i % 3 === 0 ? `0 0 6px ${t.accent}` : 'none'
                  }}
                />
              );
            })}
          </>
        )}

        {/* 2. Golden Hour: Sunburst & Warm Ambient Motes */}
        {t.decorative === 'sunburst' && (
          <>
            <div
              style={{
                position: 'absolute',
                bottom: '-15%',
                right: '-10%',
                width: '450px',
                height: '450px',
                background: 'radial-gradient(circle, rgba(230,167,110,0.3) 0%, rgba(230,167,110,0) 70%)',
                borderRadius: '50%',
                animation: 'sunPulse 6s infinite ease-in-out'
              }}
            />
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                style={{
                  top: `${(i * 21) % 85}%`,
                  left: `${(i * 31) % 85}%`,
                  width: `${(i % 3) + 2}px`,
                  height: `${(i % 3) + 2}px`,
                  backgroundColor: t.accent,
                  borderRadius: '50%',
                  opacity: 0.35,
                  position: 'absolute'
                }}
              />
            ))}
          </>
        )}

        {/* 3. Rosewater Whisper: Floating Blush Petals */}
        {t.decorative === 'petals' && (
          <>
            {Array.from({ length: 8 }).map((_, i) => {
              const top = `${15 + i * 11}%`;
              const left = `${8 + (i * 27) % 80}%`;
              const rotate = `${i * 35}deg`;
              const delay = `${i * 0.6}s`;
              return (
                <div
                  key={i}
                  style={{
                    top,
                    left,
                    width: '16px',
                    height: '11px',
                    backgroundColor: t.accent,
                    borderRadius: '60% 40% 60% 40%',
                    position: 'absolute',
                    opacity: 0.25,
                    transform: `rotate(${rotate})`,
                    animation: `floatPetal 5s infinite ease-in-out ${delay}`
                  }}
                />
              );
            })}
          </>
        )}

        {/* 4. Midnight in Paris: Subtle Cinema Rain Droplets */}
        {t.decorative === 'rain' && (
          <>
            {Array.from({ length: 16 }).map((_, i) => {
              const left = `${(i * 19) % 96}%`;
              const delay = `${(i % 6) * 0.4}s`;
              const duration = `${1.8 + (i % 3) * 0.4}s`;
              return (
                <div
                  key={i}
                  style={{
                    left,
                    top: '-20px',
                    width: '1px',
                    height: '24px',
                    background: 'linear-gradient(to bottom, rgba(212,175,55,0), rgba(212,175,55,0.45))',
                    position: 'absolute',
                    animation: `rainFall ${duration} infinite linear ${delay}`
                  }}
                />
              );
            })}
          </>
        )}

        {/* 5. Letters in Florence: Classical Wax Seal Badge */}
        {t.decorative === 'wax' && (
          <div
            style={{
              position: 'absolute',
              top: '28px',
              right: '24px',
              width: '46px',
              height: '46px',
              backgroundColor: t.accent,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(74, 53, 32, 0.35)',
              border: '2px solid rgba(255, 255, 255, 0.4)',
              opacity: 0.85
            }}
          >
            <span
              style={{
                fontFamily: t.serifFont,
                color: '#FFFBF5',
                fontSize: '22px',
                fontWeight: 'bold',
                lineHeight: 1
              }}
            >
              A
            </span>
          </div>
        )}

        {/* 6. Eternal Velvet: Crossing Gold Diagonal Ribbons */}
        {t.decorative === 'ribbon' && (
          <>
            <div
              style={{
                position: 'absolute',
                top: '-40px',
                right: '-40px',
                width: '180px',
                height: '1px',
                backgroundColor: t.accent,
                opacity: 0.35,
                transform: 'rotate(45deg)'
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '-30px',
                right: '-30px',
                width: '200px',
                height: '1px',
                backgroundColor: t.accent,
                opacity: 0.2,
                transform: 'rotate(45deg)'
              }}
            />
          </>
        )}
      </div>

      {/* ─── TOP HEADER ─────────────────────────────────────── */}
      <header className="w-full max-w-md mx-auto flex items-center justify-between text-xs tracking-widest uppercase py-2 z-10">
        <span
          style={{ fontFamily: t.serifFont, color: t.textPrimary }}
          className="tracking-widest font-semibold text-sm"
        >
          AEVA
        </span>
        <span
          style={{ color: t.textMuted }}
          className="flex items-center gap-1.5 font-medium"
        >
          <Sparkles style={{ color: t.accent }} className="w-3.5 h-3.5" />
          <span>{t.name}</span>
        </span>
      </header>

      {/* ─── MAIN CONTENT CONTAINER ─────────────────────────── */}
      <main className="w-full max-w-md mx-auto my-auto py-6 z-10">
        <AnimatePresence mode="wait">
          {/* ═════ STEP 1: INTRO ═════ */}
          {currentStep === 1 && (
            <motion.div
              key="step-1"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="text-center flex flex-col items-center justify-center space-y-8"
            >
              {/* Glowing Heart Icon Pulsing */}
              <motion.div
                animate={{
                  scale: [1, 1.12, 1],
                  filter: [
                    `drop-shadow(0 0 12px ${t.accentSoft})`,
                    `drop-shadow(0 0 28px ${t.accent})`,
                    `drop-shadow(0 0 12px ${t.accentSoft})`
                  ]
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
                style={{
                  backgroundColor: t.cardBg,
                  borderColor: t.cardBorder
                }}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border flex items-center justify-center shadow-lg"
              >
                <Heart
                  style={{ color: t.accent, fill: t.accent }}
                  className="w-12 h-12"
                />
              </motion.div>

              <div className="space-y-3">
                <span
                  style={{ color: t.accent }}
                  className="text-xs uppercase tracking-widest font-semibold block"
                >
                  For {receiverName}
                </span>

                <h1
                  style={{
                    fontFamily: t.serifFont,
                    color: t.textPrimary,
                    fontSize: 'clamp(1.85rem, 5vw + 0.8rem, 2.6rem)'
                  }}
                  className="font-normal tracking-tight leading-snug"
                >
                  A moment is waiting for you...
                </h1>

                <p
                  style={{ color: t.textMuted }}
                  className="text-xs sm:text-sm font-light max-w-xs mx-auto leading-relaxed"
                >
                  A personalized keepsake has been sealed for your eyes only.
                </p>
              </div>

              {/* Dynamic Styled "Open" Button */}
              <button
                onClick={handleOpen}
                style={getButtonStyle()}
                className="w-full max-w-xs h-14 min-h-[56px] rounded-full font-medium text-base active:scale-[0.98] transition-all flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>Open</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </motion.div>
          )}

          {/* ═════ STEP 2: SECRET CODE ═════ */}
          {currentStep === 2 && (
            <motion.div
              key="step-2"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="text-center flex flex-col items-center justify-center space-y-6"
            >
              <div
                style={{
                  backgroundColor: t.cardBg,
                  borderColor: t.cardBorder
                }}
                className="w-16 h-16 rounded-full border flex items-center justify-center shadow-sm"
              >
                <Lock style={{ color: t.accent }} className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <h2
                  style={{
                    fontFamily: t.serifFont,
                    color: t.textPrimary,
                    fontSize: 'clamp(1.5rem, 4vw + 0.8rem, 2.1rem)'
                  }}
                  className="font-normal"
                >
                  Enter the 4-digit code, {receiverName}
                </h2>
                <p
                  style={{ color: t.textMuted }}
                  className="text-xs font-light max-w-xs mx-auto"
                >
                  Given to you by {senderName} to unlock their private words.
                </p>
              </div>

              {/* Single Input with Theme-Styled Underline */}
              <form onSubmit={handleManualCodeSubmit} className="w-full max-w-xs space-y-4">
                <motion.div
                  variants={shakeVariant}
                  animate={codeError ? 'shake' : ''}
                  className="relative py-2"
                >
                  <input
                    ref={inputRef}
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    value={inputCode}
                    onChange={handleCodeChange}
                    placeholder="••••"
                    style={{
                      color: t.textPrimary,
                      borderColor: t.accent
                    }}
                    className="w-full bg-transparent text-center text-3xl sm:text-4xl font-mono tracking-[0.5em] pb-3 border-b-2 focus:outline-none transition-colors"
                  />

                  {/* Dot status lights */}
                  <div className="flex justify-center gap-3 mt-3">
                    {[0, 1, 2, 3].map((idx) => {
                      const filled = inputCode.length > idx;
                      return (
                        <div
                          key={idx}
                          style={{
                            backgroundColor: filled ? t.accent : t.textMuted,
                            opacity: filled ? 1 : 0.25
                          }}
                          className={`w-3 h-3 rounded-full transition-all duration-200 ${
                            filled ? 'scale-110' : ''
                          }`}
                        />
                      );
                    })}
                  </div>
                </motion.div>

                {codeError && (
                  <p className="text-xs text-red-400 font-medium animate-pulse">
                    Incorrect code. Please try again.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={inputCode.length !== 4}
                  style={
                    inputCode.length === 4
                      ? getButtonStyle()
                      : {
                          backgroundColor: 'rgba(150, 150, 150, 0.15)',
                          color: t.textMuted
                        }
                  }
                  className={`w-full h-14 min-h-[56px] rounded-full font-medium text-sm transition-all shadow-md flex items-center justify-center gap-2 ${
                    inputCode.length === 4
                      ? 'active:scale-[0.98] cursor-pointer'
                      : 'cursor-not-allowed opacity-60'
                  }`}
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Unlock Letter</span>
                </button>
              </form>
            </motion.div>
          )}

          {/* ═════ STEP 3: MESSAGE REVEAL (TYPEWRITER) ═════ */}
          {currentStep === 3 && (
            <motion.div
              key="step-3"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              style={{
                backgroundColor: t.cardBg,
                borderColor: t.cardBorder,
                boxShadow: t.cardShadow
              }}
              className="text-left backdrop-blur-md rounded-3xl p-6 sm:p-8 border space-y-6"
            >
              <div
                style={{ borderColor: t.cardBorder }}
                className="flex items-center justify-between border-b pb-4"
              >
                <span
                  style={{ color: t.accent }}
                  className="text-[11px] uppercase tracking-widest font-semibold flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Dearest {receiverName}</span>
                </span>
                <span
                  style={{ color: t.textMuted }}
                  className="text-[10px] uppercase tracking-widest font-mono"
                >
                  Personal Letter
                </span>
              </div>

              {/* Typewriter message display */}
              <div className="min-h-[140px] text-sm sm:text-base font-light leading-relaxed">
                <p
                  style={{
                    fontFamily: t.serifFont,
                    color: t.textPrimary
                  }}
                  className="whitespace-pre-line italic text-base sm:text-lg"
                >
                  "{typedMessage}"
                  {!typingComplete && (
                    <span
                      style={{ backgroundColor: t.accent }}
                      className="inline-block w-1.5 h-4 ml-1 animate-pulse align-middle"
                    />
                  )}
                </p>
              </div>

              {/* Sender sign-off */}
              <div
                style={{ borderColor: t.cardBorder }}
                className="pt-2 border-t space-y-3"
              >
                <p
                  style={{
                    fontFamily: t.serifFont,
                    color: t.textPrimary
                  }}
                  className="text-right italic text-base sm:text-lg"
                >
                  — {senderName}
                </p>

                <p
                  style={{ color: t.accent, fontFamily: t.serifFont }}
                  className="text-center text-xs sm:text-sm italic tracking-wide font-medium"
                >
                  So... I have one question.
                </p>
              </div>

              {/* Hear The Question CTA */}
              <div className="pt-2">
                <button
                  onClick={() => setCurrentStep(4)}
                  style={getButtonStyle()}
                  className="w-full h-14 min-h-[56px] rounded-full font-medium text-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Hear The Question</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ═════ STEP 4: THE QUESTION & CELEBRATION ═════ */}
          {currentStep === 4 && (
            <motion.div
              key="step-4"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="text-center space-y-6 sm:space-y-8"
            >
              {!isAccepted ? (
                /* Question View */
                <div className="space-y-8">
                  <motion.div
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                      backgroundColor: t.cardBg,
                      borderColor: t.cardBorder
                    }}
                    className="w-16 h-16 mx-auto rounded-full border flex items-center justify-center shadow-md"
                  >
                    <Heart
                      style={{ color: t.accent, fill: t.accent }}
                      className="w-8 h-8"
                    />
                  </motion.div>

                  <div className="space-y-3">
                    <span
                      style={{ color: t.accent }}
                      className="text-xs uppercase tracking-widest font-semibold block"
                    >
                      From {senderName}
                    </span>

                    <h1
                      style={{
                        fontFamily: t.serifFont,
                        color: t.textPrimary,
                        fontSize: 'clamp(2rem, 5vw + 1rem, 2.9rem)'
                      }}
                      className="font-normal leading-tight"
                    >
                      Will you be mine,{' '}
                      <span className="italic block sm:inline">{receiverName}?</span>
                    </h1>
                  </div>

                  {/* Yes / No buttons */}
                  <div className="relative flex flex-col items-center justify-center gap-4 pt-4 max-w-xs mx-auto">
                    {/* Primary YES Button */}
                    <button
                      onClick={handleYes}
                      style={getButtonStyle()}
                      className="w-full h-14 min-h-[56px] rounded-full font-serif text-lg font-semibold active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer z-10"
                    >
                      <span>Yes</span>
                      <span className="text-yellow-300">💛</span>
                    </button>

                    {/* Secondary Playful NO Button */}
                    <motion.button
                      animate={{
                        scale: noScale,
                        x: noOffset.x,
                        y: noOffset.y
                      }}
                      transition={{ type: 'spring', stiffness: 350, damping: 20 }}
                      onMouseEnter={handleNoInteraction}
                      onClick={handleNoInteraction}
                      style={{
                        borderColor: t.cardBorder,
                        color: t.textMuted
                      }}
                      className="px-6 py-2.5 rounded-full border text-xs font-medium cursor-pointer select-none"
                    >
                      {noClickCount === 0 && 'No'}
                      {noClickCount === 1 && 'Are you sure?'}
                      {noClickCount === 2 && 'Think again...'}
                      {noClickCount === 3 && 'Really? 🥺'}
                      {noClickCount >= 4 && 'Never! 💛'}
                    </motion.button>
                  </div>
                </div>
              ) : (
                /* Celebration & Reply View */
                <motion.div
                  initial={{ opacity: 0, scale: 0.93 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    backgroundColor: t.cardBg,
                    borderColor: t.cardBorder,
                    boxShadow: t.cardShadow
                  }}
                  className="backdrop-blur-md rounded-3xl p-6 sm:p-8 border space-y-5 text-center relative"
                >
                  {/* Top Rotating Emoji Badge */}
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ backgroundColor: t.accentSoft }}
                    className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full flex items-center justify-center text-3xl shadow-sm"
                  >
                    ✨
                  </motion.div>

                  {/* Heading & Subtext */}
                  <div className="space-y-1.5">
                    <h2
                      style={{
                        fontFamily: t.serifFont,
                        color: t.textPrimary,
                        fontSize: 'clamp(1.9rem, 5vw + 1rem, 2.7rem)'
                      }}
                      className="font-bold tracking-tight leading-tight"
                    >
                      You said Yes! 💛
                    </h2>
                    <p
                      style={{ color: t.textMuted }}
                      className="text-xs sm:text-sm font-light leading-relaxed"
                    >
                      This moment is yours to keep.
                    </p>
                  </div>

                  {/* Personal Reply Note Section */}
                  <div className="text-left space-y-1.5 pt-1">
                    <label
                      style={{ color: t.textMuted }}
                      className="block text-xs font-medium"
                    >
                      Say something back to {senderName}{' '}
                      <span className="opacity-75 font-normal">(optional)</span>
                    </label>

                    <div className="relative">
                      <textarea
                        rows={3}
                        maxLength={150}
                        value={customReply}
                        onChange={(e) => setCustomReply(e.target.value)}
                        placeholder="Something from your heart..."
                        style={{
                          backgroundColor: 'rgba(0, 0, 0, 0.12)',
                          borderColor: t.cardBorder,
                          color: t.textPrimary
                        }}
                        className="w-full rounded-xl p-3 pb-6 text-sm border focus:outline-none resize-none min-h-[88px] leading-relaxed transition-colors"
                      />
                      <span
                        style={{ color: t.textMuted }}
                        className="absolute bottom-2 right-3 text-[10px] select-none"
                      >
                        {customReply.length}/150
                      </span>
                    </div>
                  </div>

                  {/* Primary WhatsApp Action */}
                  <div className="pt-2 space-y-3">
                    <button
                      onClick={handleWhatsAppShare}
                      style={getButtonStyle()}
                      className="w-full h-14 min-h-[56px] rounded-full font-semibold text-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      <MessageCircle className="w-4 h-4 shrink-0" />
                      <span>Share your Yes with {senderName}</span>
                    </button>

                    {/* Secondary Share via Another App Link */}
                    <button
                      type="button"
                      onClick={handleAlternativeShare}
                      style={{ color: t.textMuted }}
                      className="text-xs underline hover:opacity-80 transition-opacity cursor-pointer block mx-auto py-1"
                    >
                      Share via another app
                    </button>
                  </div>

                  {/* Share Toast Notification Pill */}
                  <AnimatePresence>
                    {shareToast && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        style={{
                          backgroundColor: t.accentSoft,
                          color: t.accent,
                          borderColor: t.cardBorder
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold border shadow-md mx-auto"
                      >
                        <span>✓</span>
                        <span>{shareToast}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Viral Loop Divider & Link */}
                  <div
                    style={{ borderColor: t.cardBorder }}
                    className="pt-4 border-t mt-3"
                  >
                    <Link
                      to="/"
                      style={{ color: t.accent }}
                      className="inline-flex items-center gap-1.5 text-xs font-medium tracking-wide transition-opacity hover:opacity-80"
                    >
                      <span>Create your own AEVA</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ─── FOOTER ─────────────────────────────────────────── */}
      <footer
        style={{ color: t.textMuted }}
        className="w-full max-w-md mx-auto text-center text-[11px] font-light py-2 z-10"
      >
        AEVA &bull; Bespoke Romantic Proposals
      </footer>

      {/* ─── FLOATING AUDIO MUTE TOGGLE ─────────────────────── */}
      {musicUrl && (
        <button
          onClick={() => {
            const next = !isMuted;
            setIsMuted(next);
            try {
              localStorage.setItem('aeva_muted', String(next));
            } catch {}
            if (next === false && audioRef.current && !isPlaying) {
              audioRef.current
                .play()
                .then(() => setIsPlaying(true))
                .catch(() => setIsPlaying(false));
            }
          }}
          aria-label={isMuted ? 'Unmute music' : 'Mute music'}
          style={{
            backgroundColor: t.cardBg,
            borderColor: t.cardBorder,
            color: t.accent
          }}
          className="fixed bottom-5 right-5 z-50 w-12 h-12 rounded-full border shadow-lg flex items-center justify-center backdrop-blur-md hover:scale-105 active:scale-95 transition-transform cursor-pointer min-w-[48px] min-h-[48px]"
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5" />
          ) : (
            <Volume2 className="w-5 h-5" />
          )}
        </button>
      )}
    </div>
  );
}
