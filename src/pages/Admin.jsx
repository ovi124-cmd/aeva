import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import JSZip from 'jszip';
import {
  Lock,
  LogOut,
  Upload,
  FileArchive,
  AlertCircle,
  Trash2,
  Power,
  RefreshCw,
  Sparkles,
  Layers,
  Clock,
  Coins,
  CreditCard,
  CheckCircle2,
  XCircle,
  Copy,
  User,
  Phone,
  Check,
  BarChart3,
  Users,
  Heart
} from 'lucide-react';
import { supabase, isSupabaseConfigured, handleJwtExpiration } from '../lib/supabase.js';

const CATEGORIES = [
  'Marriage Proposal',
  'Anniversary',
  'Birthday',
  'Apology',
  'Just Because',
  'Graduation',
  'Other'
];

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'aeva_admin_2026';

export default function Admin() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return localStorage.getItem('aeva_admin_auth') === 'true';
    } catch {
      return false;
    }
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [loginShake, setLoginShake] = useState(false);

  // Tab State: 'dashboard' | 'templates' | 'requests'
  const [activeTab, setActiveTab] = useState('dashboard');

  // Analytics Dashboard State
  const [stats, setStats] = useState({
    userCount: 0,
    templateCount: 0,
    proposalCount: 0,
    totalRevenue: 0
  });
  const [userActivities, setUserActivities] = useState([]);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Form State (Templates)
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [creditCost, setCreditCost] = useState(1);
  const [description, setDescription] = useState('');
  const [zipFile, setZipFile] = useState(null);

  // Submission & Feedback State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Templates List State
  const [templates, setTemplates] = useState([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [actionInProgressId, setActionInProgressId] = useState(null);

  // Credit Requests State (Pending Only)
  const [creditRequests, setCreditRequests] = useState([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [requestActionId, setRequestActionId] = useState(null);

  const fileInputRef = useRef(null);

  // Fetch data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardStats();
      fetchTemplates();
      fetchCreditRequests();
    }
  }, [isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      try {
        localStorage.setItem('aeva_admin_auth', 'true');
      } catch {}
      setIsAuthenticated(true);
      setLoginError(false);
    } else {
      setLoginError(true);
      setLoginShake(true);
      setTimeout(() => setLoginShake(false), 500);
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('aeva_admin_auth');
    } catch {}
    setIsAuthenticated(false);
    setPasswordInput('');
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3500);
  };

  // ═══════════════════════════════════════════════════════════════
  // ANALYTICS & DASHBOARD STATS
  // ═══════════════════════════════════════════════════════════════
  const fetchDashboardStats = async () => {
    setIsLoadingStats(true);
    try {
      // 1. Total counts using exact head query
      let { count: userCount, error: userCountError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (userCountError && (await handleJwtExpiration(userCountError))) {
        const retry = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        userCount = retry.count;
      }

      let { count: templateCount, error: tmplCountError } = await supabase
        .from('templates')
        .select('*', { count: 'exact', head: true });

      if (tmplCountError && (await handleJwtExpiration(tmplCountError))) {
        const retry = await supabase
          .from('templates')
          .select('*', { count: 'exact', head: true });
        templateCount = retry.count;
      }

      let { count: proposalCount, error: propCountError } = await supabase
        .from('user_proposals')
        .select('*', { count: 'exact', head: true });

      if (propCountError && (await handleJwtExpiration(propCountError))) {
        const retry = await supabase
          .from('user_proposals')
          .select('*', { count: 'exact', head: true });
        proposalCount = retry.count;
      }

      // 2. Total revenue from approved credit requests
      let { data: approvedRequests, error: revError } = await supabase
        .from('credit_requests')
        .select('amount')
        .eq('status', 'approved');

      if (revError && (await handleJwtExpiration(revError))) {
        const retry = await supabase
          .from('credit_requests')
          .select('amount')
          .eq('status', 'approved');
        approvedRequests = retry.data;
      }

      const totalRevenue =
        approvedRequests?.reduce((sum, r) => sum + (Number(r.amount) || 0), 0) || 0;

      setStats({
        userCount: userCount || 0,
        templateCount: templateCount || 0,
        proposalCount: proposalCount || 0,
        totalRevenue
      });

      // 3. User Activity: fetch profiles and all user_proposals, count per user
      const [{ data: proposalsData }, { data: profilesData }] = await Promise.all([
        supabase.from('user_proposals').select('id, user_id'),
        supabase.from('profiles').select('id, email, credits')
      ]);

      const proposalCountMap = {};
      (proposalsData || []).forEach((prop) => {
        if (prop.user_id) {
          proposalCountMap[prop.user_id] = (proposalCountMap[prop.user_id] || 0) + 1;
        }
      });

      const activities = (profilesData || []).map((prof) => ({
        id: prof.id,
        email: prof.email || 'Anonymous User',
        credits: prof.credits ?? 0,
        proposalCount: proposalCountMap[prof.id] || 0
      })).sort((a, b) => b.proposalCount - a.proposalCount);

      setUserActivities(activities);
    } catch (err) {
      console.warn('Error fetching dashboard stats:', err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // TEMPLATES MANAGEMENT
  // ═══════════════════════════════════════════════════════════════
  const fetchTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      let { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error && (await handleJwtExpiration(error))) {
        const retry = await supabase
          .from('templates')
          .select('*')
          .order('created_at', { ascending: false });
        data = retry.data;
        error = retry.error;
      }

      if (error) {
        console.warn('Error fetching templates:', error.message);
      } else if (data) {
        setTemplates(data);
      }
    } catch (err) {
      console.warn('Supabase fetch error:', err);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // CREDIT REQUESTS (PENDING ONLY)
  // ═══════════════════════════════════════════════════════════════
  const fetchCreditRequests = async () => {
    setIsLoadingRequests(true);
    try {
      let { data, error } = await supabase
        .from('credit_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error && (await handleJwtExpiration(error))) {
        const retry = await supabase
          .from('credit_requests')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: false });
        data = retry.data;
        error = retry.error;
      }

      if (error) {
        console.warn('Error fetching credit requests:', error.message);
      } else if (data) {
        setCreditRequests(data);
      }
    } catch (err) {
      console.warn('Supabase fetch error:', err);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.zip')) {
        setErrorMessage('Selected file must be a .zip archive');
        setZipFile(null);
        return;
      }
      setErrorMessage('');
      setZipFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Template name is required');
      return;
    }
    if (!category) {
      setErrorMessage('Please select a category');
      return;
    }
    if (!zipFile) {
      setErrorMessage('Please select a ZIP template file');
      return;
    }

    setIsUploading(true);
    setUploadStatusText('Reading and inspecting ZIP archive...');

    try {
      // 1. Read ZIP with JSZip
      const zip = await JSZip.loadAsync(zipFile);

      // 2. Validate index.html exists at root
      const indexFile = zip.file('index.html');
      if (!indexFile) {
        throw new Error(
          'ZIP validation failed: "index.html" must be present at the root of the archive.'
        );
      }

      // 3. Generate unique template UUID
      const templateId =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : 'tmpl-' + Math.random().toString(36).substring(2, 15);

      setUploadStatusText('Uploading assets to Supabase Storage...');

      // 4. Upload all files (skip directories)
      const fileEntries = Object.values(zip.files).filter((entry) => !entry.dir);

      for (let i = 0; i < fileEntries.length; i++) {
        const entry = fileEntries[i];
        setUploadStatusText(
          `Uploading file ${i + 1} of ${fileEntries.length}: ${entry.name}`
        );

        const blob = await entry.async('blob');
        const storagePath = `${templateId}/${entry.name}`;

        const { error: uploadError } = await supabase.storage
          .from('templates')
          .upload(storagePath, blob, {
            upsert: true,
            contentType: entry.name.endsWith('.html')
              ? 'text/html'
              : entry.name.endsWith('.css')
              ? 'text/css'
              : entry.name.endsWith('.js')
              ? 'application/javascript'
              : blob.type || 'application/octet-stream'
          });

        if (uploadError) {
          throw new Error(`Storage upload failed for ${entry.name}: ${uploadError.message}`);
        }
      }

      setUploadStatusText('Registering template in database...');

      // 5. Insert row into `templates` table
      const { error: insertError } = await supabase.from('templates').insert({
        id: templateId,
        name: name.trim(),
        category,
        credit_cost: Number(creditCost) || 1,
        description: description.trim() || null,
        entry_path: `${templateId}/index.html`,
        is_active: true
      });

      if (insertError) {
        throw new Error(`Database insert failed: ${insertError.message}`);
      }

      // 6. Reset form & notify
      setName('');
      setCategory(CATEGORIES[0]);
      setCreditCost(1);
      setDescription('');
      setZipFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      showToast('Template published successfully!');
      fetchTemplates();
      fetchDashboardStats();
    } catch (err) {
      setErrorMessage(err.message || 'An unexpected error occurred while publishing the template.');
    } finally {
      setIsUploading(false);
      setUploadStatusText('');
    }
  };

  const handleToggleActive = async (tmpl) => {
    setActionInProgressId(tmpl.id);
    try {
      const nextActiveState = !tmpl.is_active;
      const { error } = await supabase
        .from('templates')
        .update({ is_active: nextActiveState })
        .eq('id', tmpl.id);

      if (error) {
        throw error;
      }

      setTemplates((prev) =>
        prev.map((item) =>
          item.id === tmpl.id ? { ...item, is_active: nextActiveState } : item
        )
      );
      showToast(nextActiveState ? 'Template activated' : 'Template deactivated');
    } catch (err) {
      setErrorMessage(`Failed to update template status: ${err.message}`);
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleDelete = async (tmpl) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete "${tmpl.name}" and all its uploaded files?`
      )
    ) {
      return;
    }

    setActionInProgressId(tmpl.id);
    try {
      // 1. List files in folder to delete from storage
      const { data: fileList } = await supabase.storage
        .from('templates')
        .list(tmpl.id, { limit: 100 });

      if (fileList && fileList.length > 0) {
        const filePaths = fileList.map((f) => `${tmpl.id}/${f.name}`);
        await supabase.storage.from('templates').remove(filePaths);
      }

      // 2. Delete row from database
      const { error: deleteError } = await supabase
        .from('templates')
        .delete()
        .eq('id', tmpl.id);

      if (deleteError) {
        throw deleteError;
      }

      setTemplates((prev) => prev.filter((item) => item.id !== tmpl.id));
      showToast('Template deleted');
      fetchDashboardStats();
    } catch (err) {
      setErrorMessage(`Failed to delete template: ${err.message}`);
    } finally {
      setActionInProgressId(null);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // CREDIT REQUEST APPROVAL / REJECTION
  // ═══════════════════════════════════════════════════════════════
  const handleApproveRequest = async (req) => {
    setRequestActionId(req.id);
    try {
      // 1. Update status to approved in credit_requests table
      const { error: requestUpdateError } = await supabase
        .from('credit_requests')
        .update({ status: 'approved' })
        .eq('id', req.id);

      if (requestUpdateError) {
        throw requestUpdateError;
      }

      // 2. Fetch current credits of target user
      const { data: profileData, error: profileFetchError } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', req.user_id)
        .single();

      if (profileFetchError) {
        console.warn('Could not read existing credits, defaulting to 0:', profileFetchError.message);
      }

      const currentCredits = profileData?.credits ?? 0;
      const creditsToAdd = req.credits_requested || req.credits || 7;
      const updatedCredits = currentCredits + creditsToAdd;

      // 3. Update target user profile with increased credits
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ credits: updatedCredits })
        .eq('id', req.user_id);

      if (profileUpdateError) {
        throw profileUpdateError;
      }

      // 4. Immediately filter the local state to remove processed request
      setCreditRequests((prev) => prev.filter((item) => item.id !== req.id));

      showToast(`Approved! Added ${creditsToAdd} credits to ${req.user_email || 'user'}`);
      fetchDashboardStats();
    } catch (err) {
      console.error('Approval failed:', err);
      setErrorMessage(`Failed to approve request: ${err.message}`);
    } finally {
      setRequestActionId(null);
    }
  };

  const handleRejectRequest = async (req) => {
    if (!window.confirm(`Reject payment request from ${req.user_email}?`)) {
      return;
    }

    setRequestActionId(req.id);
    try {
      // 1. Update status to rejected in credit_requests table
      const { error } = await supabase
        .from('credit_requests')
        .update({ status: 'rejected' })
        .eq('id', req.id);

      if (error) {
        throw error;
      }

      // 2. Immediately filter the local state to remove processed request
      setCreditRequests((prev) => prev.filter((item) => item.id !== req.id));

      showToast('Payment request rejected');
    } catch (err) {
      console.error('Rejection failed:', err);
      setErrorMessage(`Failed to reject request: ${err.message}`);
    } finally {
      setRequestActionId(null);
    }
  };

  const copyText = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`${label} copied!`);
    } catch {
      showToast(`${label}: ${text}`);
    }
  };

  const pendingRequestsCount = creditRequests.length;

  // ═══════════════════════════════════════════════════════════════
  // LOGIN SCREEN
  // ═══════════════════════════════════════════════════════════════
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-cream text-espresso font-sans antialiased flex flex-col items-center justify-center px-4 sm:px-6 py-12 relative overflow-hidden selection:bg-rose">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[500px] h-[340px] sm:h-[500px] bg-gradient-to-tr from-rose to-gold/20 rounded-full blur-3xl pointer-events-none -z-10" />

        <motion.div
          animate={
            loginShake
              ? { x: [0, -12, 12, -10, 10, -5, 5, 0] }
              : { x: 0 }
          }
          transition={{ duration: 0.4 }}
          className="w-full max-w-md bg-cream-light rounded-3xl p-8 sm:p-10 border border-espresso/10 shadow-xl space-y-6 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-rose border border-gold/30 flex items-center justify-center mx-auto text-gold">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <span className="text-xs uppercase tracking-widest text-gold font-semibold">
              Admin Portal
            </span>
            <h1 className="font-serif text-3xl font-normal text-espresso">
              AEVA Management
            </h1>
            <p className="text-xs text-espresso-muted font-light">
              Enter administrative password to manage templates, stats, and approve credits.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 pt-2">
            <div>
              <input
                type="password"
                placeholder="Enter password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  if (loginError) setLoginError(false);
                }}
                className={`w-full px-4 py-3.5 rounded-xl border bg-cream text-espresso text-sm focus:outline-none focus:ring-2 focus:ring-gold min-h-[48px] text-center ${
                  loginError ? 'border-red-400' : 'border-espresso/20'
                }`}
                autoFocus
              />
              {loginError && (
                <p className="text-red-500 text-xs mt-2 font-medium">
                  Wrong password. Please try again.
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full h-12 min-h-[48px] rounded-full bg-espresso text-cream font-medium text-sm shadow-md hover:bg-espresso-pure active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-gold" />
              <span>Enter Admin</span>
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // ADMIN DASHBOARD
  // ═══════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-cream text-espresso font-sans antialiased selection:bg-rose selection:text-espresso pb-24">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-cream/95 backdrop-blur-md border-b border-espresso/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xl sm:text-2xl font-serif tracking-widest text-espresso">
            <span className="font-semibold">AEVA</span>
            <span className="w-1.5 h-1.5 rounded-full bg-gold" />
            <span className="text-xs font-sans font-semibold text-espresso-muted ml-2 px-2.5 py-0.5 rounded-full bg-espresso/5 uppercase tracking-wider">
              Admin
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-espresso/20 text-xs text-espresso hover:bg-rose transition-colors min-h-[44px] cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center p-1.5 rounded-2xl bg-cream-warm border border-espresso/10 shadow-sm max-w-xl mx-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 py-2.5 px-3 sm:px-4 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer min-h-[44px] ${
              activeTab === 'dashboard'
                ? 'bg-espresso text-cream shadow-sm'
                : 'text-espresso-muted hover:text-espresso hover:bg-cream'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-gold" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('templates')}
            className={`flex-1 py-2.5 px-3 sm:px-4 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer min-h-[44px] ${
              activeTab === 'templates'
                ? 'bg-espresso text-cream shadow-sm'
                : 'text-espresso-muted hover:text-espresso hover:bg-cream'
            }`}
          >
            <Layers className="w-4 h-4 text-gold" />
            <span>Templates</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full ${
                activeTab === 'templates'
                  ? 'bg-white/20 text-white'
                  : 'bg-espresso/5 text-espresso'
              }`}
            >
              {templates.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-2.5 px-3 sm:px-4 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer min-h-[44px] ${
              activeTab === 'requests'
                ? 'bg-espresso text-cream shadow-sm'
                : 'text-espresso-muted hover:text-espresso hover:bg-cream'
            }`}
          >
            <CreditCard className="w-4 h-4 text-gold" />
            <span>Requests</span>
            {pendingRequestsCount > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-white font-bold animate-pulse">
                {pendingRequestsCount}
              </span>
            )}
          </button>
        </div>

        {/* Supabase warning if not configured */}
        {!isSupabaseConfigured() && (
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Supabase credentials pending setup:</span>
              Please check <code className="bg-amber-100 px-1 py-0.5 rounded text-[11px]">src/lib/supabase.js</code> to ensure storage and database access are enabled.
            </div>
          </div>
        )}

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="flex items-center justify-between p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage('')}
              className="text-red-500 hover:text-red-700 font-bold ml-2 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* TAB 1: ANALYTICS DASHBOARD                                  */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Header & Refresh */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-widest text-gold block">
                  Metrics &amp; Overview
                </span>
                <h2 className="font-serif text-2xl font-bold text-espresso">
                  Platform Analytics
                </h2>
              </div>
              <button
                onClick={fetchDashboardStats}
                disabled={isLoadingStats}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-espresso/15 text-xs text-espresso hover:bg-rose transition-colors min-h-[44px] cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-gold ${isLoadingStats ? 'animate-spin' : ''}`}
                />
                <span>Refresh Stats</span>
              </button>
            </div>

            {/* 4 Stats Grid (2x2) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Card 1: Total Users */}
              <div className="bg-white rounded-2xl p-6 border border-espresso/10 shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs uppercase tracking-wider text-espresso-muted font-medium block">
                    Total Users
                  </span>
                  <div className="font-serif text-3xl sm:text-4xl font-bold text-espresso">
                    {stats.userCount}
                  </div>
                  <p className="text-[11px] text-espresso-muted font-light">
                    Registered member profiles
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-rose text-gold flex items-center justify-center shrink-0">
                  <Users className="w-6 h-6" />
                </div>
              </div>

              {/* Card 2: Total Templates */}
              <div className="bg-white rounded-2xl p-6 border border-espresso/10 shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs uppercase tracking-wider text-espresso-muted font-medium block">
                    Total Templates
                  </span>
                  <div className="font-serif text-3xl sm:text-4xl font-bold text-espresso">
                    {stats.templateCount}
                  </div>
                  <p className="text-[11px] text-espresso-muted font-light">
                    Published romantic canvases
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-rose text-gold flex items-center justify-center shrink-0">
                  <Layers className="w-6 h-6" />
                </div>
              </div>

              {/* Card 3: Total Proposals */}
              <div className="bg-white rounded-2xl p-6 border border-espresso/10 shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs uppercase tracking-wider text-espresso-muted font-medium block">
                    Proposals Created
                  </span>
                  <div className="font-serif text-3xl sm:text-4xl font-bold text-espresso">
                    {stats.proposalCount}
                  </div>
                  <p className="text-[11px] text-espresso-muted font-light">
                    Generated personalized links
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-rose text-gold flex items-center justify-center shrink-0">
                  <Heart className="w-6 h-6 fill-gold" />
                </div>
              </div>

              {/* Card 4: Total Revenue */}
              <div className="bg-white rounded-2xl p-6 border border-espresso/10 shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs uppercase tracking-wider text-espresso-muted font-medium block">
                    Total Revenue
                  </span>
                  <div className="font-serif text-3xl sm:text-4xl font-bold text-espresso">
                    ৳{stats.totalRevenue.toLocaleString()}
                  </div>
                  <p className="text-[11px] text-espresso-muted font-light">
                    Approved bKash payments
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-rose text-gold flex items-center justify-center shrink-0">
                  <Coins className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* User Activity List */}
            <section className="bg-white rounded-3xl p-6 sm:p-8 border border-espresso/10 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-espresso/10 pb-4">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-gold block">
                    Member Engagement
                  </span>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-espresso">
                    User Activity &amp; Proposal Stats
                  </h3>
                </div>
                <span className="text-xs font-medium px-3 py-1 rounded-full bg-cream-warm border border-espresso/10 text-espresso">
                  {userActivities.length} Accounts
                </span>
              </div>

              {isLoadingStats && userActivities.length === 0 ? (
                <div className="py-12 text-center text-xs text-espresso-muted flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-5 h-5 text-gold animate-spin" />
                  <span>Loading user activity list...</span>
                </div>
              ) : userActivities.length === 0 ? (
                <div className="py-12 text-center text-xs text-espresso-muted space-y-2">
                  <Users className="w-8 h-8 text-gold/60 mx-auto" />
                  <p className="font-medium text-sm text-espresso">No users registered yet</p>
                  <p className="max-w-xs mx-auto">
                    When users sign up and create proposals, their activity will be listed here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userActivities.map((u) => (
                    <div
                      key={u.id}
                      className="p-4 rounded-2xl border border-espresso/10 bg-cream flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-gold/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-rose text-gold flex items-center justify-center shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-xs sm:text-sm text-espresso">
                            {u.email}
                          </div>
                          <span className="text-[11px] text-espresso-muted">
                            User ID: <code className="font-mono text-[10px]">{u.id.substring(0, 8)}...</code>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-rose text-espresso border border-gold/30">
                          <Heart className="w-3.5 h-3.5 text-gold fill-gold" />
                          <span>{u.proposalCount} Proposal{u.proposalCount === 1 ? '' : 's'}</span>
                        </span>

                        <span className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full bg-cream-warm border border-espresso/15 text-espresso">
                          <Coins className="w-3.5 h-3.5 text-gold" />
                          <span>{u.credits} Credit{u.credits === 1 ? '' : 's'}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* TAB 2: TEMPLATES MANAGEMENT                                 */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'templates' && (
          <div className="space-y-8">
            {/* ─── UPLOAD FORM CARD ─────────────────────────────────── */}
            <section className="bg-cream-light rounded-3xl p-6 sm:p-8 border border-espresso/10 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-espresso/10 pb-4">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-gold block">
                    Publisher
                  </span>
                  <h2 className="font-serif text-2xl font-bold text-espresso">
                    Publish New Template
                  </h2>
                </div>
                <div className="w-10 h-10 rounded-full bg-rose text-gold flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Template Name */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-espresso/80 mb-2">
                    Template Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Midnight in Paris"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isUploading}
                    className="w-full px-4 py-3 rounded-xl border border-espresso/20 bg-cream text-espresso text-sm focus:outline-none focus:ring-2 focus:ring-gold min-h-[48px]"
                  />
                </div>

                {/* Category & Credit Cost Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-espresso/80 mb-2">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      disabled={isUploading}
                      className="w-full px-4 py-3 rounded-xl border border-espresso/20 bg-cream text-espresso text-sm focus:outline-none focus:ring-2 focus:ring-gold min-h-[48px] cursor-pointer"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-espresso/80 mb-2">
                      Credit Cost (0–100) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      required
                      value={creditCost}
                      onChange={(e) =>
                        setCreditCost(Math.max(0, Math.min(100, Number(e.target.value))))
                      }
                      disabled={isUploading}
                      className="w-full px-4 py-3 rounded-xl border border-espresso/20 bg-cream text-espresso text-sm focus:outline-none focus:ring-2 focus:ring-gold min-h-[48px]"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-espresso/80">
                      Description <span className="text-espresso/50 font-normal normal-case">(optional)</span>
                    </label>
                    <span className="text-[11px] text-espresso-muted">
                      {description.length} / 200
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={200}
                    placeholder="Cinematic vintage borders, jazz notes, and rain-kissed Parisian cobblestones..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isUploading}
                    className="w-full p-4 rounded-xl border border-espresso/20 bg-cream text-espresso text-sm focus:outline-none focus:ring-2 focus:ring-gold resize-none leading-relaxed"
                  />
                </div>

                {/* ZIP File Upload */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-espresso/80 mb-2">
                    Template ZIP Archive <span className="text-red-500">*</span>
                  </label>

                  <div className="border-2 border-dashed border-espresso/20 hover:border-gold rounded-2xl p-6 text-center transition-colors bg-cream">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".zip"
                      onChange={handleFileChange}
                      disabled={isUploading}
                      id="zip-upload"
                      className="hidden"
                    />
                    <label
                      htmlFor="zip-upload"
                      className="flex flex-col items-center justify-center cursor-pointer min-h-[44px]"
                    >
                      <FileArchive className="w-10 h-10 text-gold mb-2" />
                      <span className="text-sm font-medium text-espresso">
                        {zipFile ? zipFile.name : 'Choose a .zip template file'}
                      </span>
                      {zipFile ? (
                        <span className="text-xs text-espresso-muted mt-1">
                          {(zipFile.size / 1024).toFixed(1)} KB &bull; Tap to replace
                        </span>
                      ) : (
                        <span className="text-xs text-espresso-muted mt-1">
                          Click to browse or drag &amp; drop
                        </span>
                      )}
                    </label>
                  </div>

                  <p className="text-[11px] text-espresso-muted mt-2 leading-relaxed">
                    Helper: ZIP must contain <code className="bg-espresso/5 px-1 py-0.5 rounded font-mono">index.html</code> at root. Assets (CSS, JS, images) can be in subfolders.
                  </p>
                </div>

                {/* Progress Text */}
                {isUploading && (
                  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-rose border border-gold/40 text-xs text-espresso">
                    <RefreshCw className="w-4 h-4 text-gold animate-spin shrink-0" />
                    <span className="font-medium">{uploadStatusText}</span>
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isUploading}
                    className={`w-full h-14 min-h-[56px] rounded-full font-medium text-sm transition-all shadow-md flex items-center justify-center gap-2 ${
                      isUploading
                        ? 'bg-espresso/50 text-cream cursor-not-allowed'
                        : 'bg-espresso text-cream hover:bg-espresso-pure active:scale-[0.98] cursor-pointer'
                    }`}
                  >
                    {isUploading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-gold" />
                        <span>Processing &amp; Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 text-gold" />
                        <span>Publish Template</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </section>

            {/* ─── TEMPLATES LIST SECTION ───────────────────────────── */}
            <section className="bg-cream-light rounded-3xl p-6 sm:p-8 border border-espresso/10 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-espresso/10 pb-4">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-gold block">
                    Database
                  </span>
                  <h2 className="font-serif text-2xl font-bold text-espresso">
                    Existing Templates
                  </h2>
                </div>
                <button
                  onClick={fetchTemplates}
                  disabled={isLoadingTemplates}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-espresso/15 text-xs text-espresso hover:bg-rose transition-colors min-h-[44px] cursor-pointer"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 text-gold ${isLoadingTemplates ? 'animate-spin' : ''}`}
                  />
                  <span>Refresh</span>
                </button>
              </div>

              {isLoadingTemplates && templates.length === 0 ? (
                <div className="py-12 text-center text-xs text-espresso-muted flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-5 h-5 text-gold animate-spin" />
                  <span>Loading registered templates...</span>
                </div>
              ) : templates.length === 0 ? (
                <div className="py-12 text-center text-xs text-espresso-muted space-y-2">
                  <Layers className="w-8 h-8 text-gold/60 mx-auto" />
                  <p className="font-medium text-sm text-espresso">No uploaded templates yet</p>
                  <p className="max-w-xs mx-auto">
                    Upload your first template ZIP above to make it available in the database.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {templates.map((tmpl) => {
                    const isOperating = actionInProgressId === tmpl.id;
                    return (
                      <div
                        key={tmpl.id}
                        className="p-4 rounded-2xl border border-espresso/10 bg-cream flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-gold/40"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-serif text-base font-bold text-espresso">
                              {tmpl.name}
                            </h3>
                            <span
                              className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                tmpl.is_active
                                    ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-stone-200 text-stone-600'
                              }`}
                            >
                              {tmpl.is_active ? 'Active' : 'Inactive'}
                            </span>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-rose text-espresso">
                              {tmpl.category}
                            </span>
                          </div>

                          {tmpl.description && (
                            <p className="text-xs text-espresso-muted font-light line-clamp-1">
                              {tmpl.description}
                            </p>
                          )}

                          <div className="flex items-center gap-4 text-[11px] text-espresso-muted flex-wrap">
                            <span className="inline-flex items-center gap-1">
                              <Coins className="w-3 h-3 text-gold" />
                              <span>
                                {tmpl.credit_cost} credit
                                {tmpl.credit_cost === 1 ? '' : 's'}
                              </span>
                            </span>
                            <span className="inline-flex items-center gap-1 font-mono text-[10px]">
                              <Clock className="w-3 h-3 text-gold" />
                              <span>
                                {tmpl.created_at
                                  ? new Date(tmpl.created_at).toLocaleDateString()
                                  : 'Recent'}
                              </span>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            onClick={() => handleToggleActive(tmpl)}
                            disabled={isOperating}
                            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors min-h-[44px] cursor-pointer ${
                              tmpl.is_active
                                ? 'border-amber-300 text-amber-700 hover:bg-amber-50'
                                : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                            }`}
                            title={tmpl.is_active ? 'Deactivate template' : 'Activate template'}
                          >
                            <Power className="w-3.5 h-3.5" />
                            <span>{tmpl.is_active ? 'Deactivate' : 'Activate'}</span>
                          </button>

                          <button
                            onClick={() => handleDelete(tmpl)}
                            disabled={isOperating}
                            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-colors min-h-[44px] cursor-pointer"
                            title="Delete template and storage files"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* TAB 3: CREDIT REQUESTS (bKash) REVIEW                       */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'requests' && (
          <section className="bg-cream-light rounded-3xl p-6 sm:p-8 border border-espresso/10 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-espresso/10 pb-4">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-widest text-gold block">
                  Manual bKash Checkout
                </span>
                <h2 className="font-serif text-2xl font-bold text-espresso">
                  Pending Credit Requests
                </h2>
              </div>
              <button
                onClick={fetchCreditRequests}
                disabled={isLoadingRequests}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-espresso/15 text-xs text-espresso hover:bg-rose transition-colors min-h-[44px] cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-gold ${isLoadingRequests ? 'animate-spin' : ''}`}
                />
                <span>Refresh</span>
              </button>
            </div>

            {isLoadingRequests && creditRequests.length === 0 ? (
              <div className="py-12 text-center text-xs text-espresso-muted flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 text-gold animate-spin" />
                <span>Loading pending payment requests...</span>
              </div>
            ) : creditRequests.length === 0 ? (
              <div className="py-12 text-center text-xs text-espresso-muted space-y-2">
                <CreditCard className="w-8 h-8 text-gold/60 mx-auto" />
                <p className="font-medium text-sm text-espresso">
                  No pending credit requests
                </p>
                <p className="max-w-xs mx-auto">
                  When users submit bKash payments from their dashboard, they will appear here for one-click approval.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {creditRequests.map((req) => {
                  const isOperating = requestActionId === req.id;

                  return (
                    <div
                      key={req.id}
                      className="p-5 rounded-2xl border border-amber-300 bg-amber-50/30 transition-all"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Request Details */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                              pending
                            </span>
                            <span className="font-semibold text-xs text-espresso flex items-center gap-1">
                              <Coins className="w-3.5 h-3.5 text-gold" />
                              <span>
                                {req.credits_requested || req.credits || 7} Credits for ৳{req.amount || 100}
                              </span>
                            </span>
                          </div>

                          <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-1.5 text-espresso">
                              <User className="w-3.5 h-3.5 text-gold" />
                              <span className="font-medium">{req.user_email || 'User'}</span>
                            </div>

                            <div className="flex items-center gap-1.5 text-espresso/80">
                              <Phone className="w-3.5 h-3.5 text-gold" />
                              <span>bKash:</span>
                              <span className="font-mono font-bold text-espresso">
                                {req.bkash_number}
                              </span>
                              <button
                                onClick={() => copyText(req.bkash_number, 'bKash Number')}
                                className="p-1 hover:text-gold cursor-pointer"
                                title="Copy number"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>

                            <div className="flex items-center gap-1.5 text-espresso/80">
                              <CreditCard className="w-3.5 h-3.5 text-gold" />
                              <span>TrxID:</span>
                              <span className="font-mono font-bold uppercase px-2 py-0.5 bg-cream rounded border border-espresso/15 text-espresso">
                                {req.transaction_id}
                              </span>
                              <button
                                onClick={() => copyText(req.transaction_id, 'TrxID')}
                                className="p-1 hover:text-gold cursor-pointer"
                                title="Copy TrxID"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          <div className="text-[10px] text-espresso-muted font-mono">
                            Submitted:{' '}
                            {req.created_at
                              ? new Date(req.created_at).toLocaleString()
                              : 'Recent'}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 self-end md:self-center">
                          <button
                            onClick={() => handleApproveRequest(req)}
                            disabled={isOperating}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all min-h-[44px] cursor-pointer"
                          >
                            {isOperating ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            <span>Approve (+{req.credits_requested || req.credits || 7})</span>
                          </button>
                          <button
                            onClick={() => handleRejectRequest(req)}
                            disabled={isOperating}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-colors min-h-[44px] cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>

      {/* Floating Toast Notification */}
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
