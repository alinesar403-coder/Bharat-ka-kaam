import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Briefcase, 
  UserCheck, 
  Coins, 
  Settings, 
  ShieldAlert, 
  Trash2, 
  Search, 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  Globe, 
  ArrowLeft, 
  Copy, 
  Check, 
  Database, 
  Smartphone, 
  BellRing, 
  Clock, 
  HelpCircle,
  FileSpreadsheet,
  MapPin,
  Map,
  User,
  Navigation,
  Eye
} from 'lucide-react';
import { JobPost, WorkerPost, BrokerPost, AppLanguage } from '../types';

interface AdminDashboardProps {
  jobs: JobPost[];
  workers: WorkerPost[];
  brokers: BrokerPost[];
  paymentAttempts: any[];
  rawSmsLogs: any[];
  lang: AppLanguage;
  setLang: (lang: AppLanguage) => void;
  onDeletePost: (collectionName: 'jobs' | 'workers' | 'brokers', id: string) => Promise<void>;
  onApprovePayment: (orderId: string, status: 'success' | 'rejected', reasonInput?: string) => Promise<void>;
  onBackToApp: () => void;
  // System config props
  remoteConfig: {
    appVersion: string;
    minRequiredVersion: string;
    forceUpdateUrl: string;
    forceUpdateMessageBn: string;
    forceUpdateMessageEn: string;
    globalAlertBn: string;
    globalAlertEn: string;
    systemStatus: 'active' | 'maintenance';
  };
  onSaveConfig: (config: any) => Promise<void>;
  loadingAttempts: boolean;
  loadingSms: boolean;
}

export default function AdminDashboard({
  jobs,
  workers,
  brokers,
  paymentAttempts,
  rawSmsLogs,
  lang,
  setLang,
  onDeletePost,
  onApprovePayment,
  onBackToApp,
  remoteConfig,
  onSaveConfig,
  loadingAttempts,
  loadingSms
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'payments' | 'directory' | 'users' | 'settings' | 'sms'>('payments');
  const [userSubTab, setUserSubTab] = useState<'jobs' | 'workers' | 'brokers'>('brokers');
  const [userSearch, setUserSearch] = useState('');
  const [directorySearch, setDirectorySearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Stats calculations for last 30 days
  const last30DaysStats = useMemo(() => {
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    
    const successfulAttempts = paymentAttempts.filter(attempt => {
      if (attempt.status !== 'success') return false;
      const time = attempt.timestamp || (attempt.createdAt ? new Date(attempt.createdAt).getTime() : 0);
      return time >= thirtyDaysAgo;
    });

    const count = successfulAttempts.length;
    const totalAmount = successfulAttempts.reduce((sum, attempt) => {
      const amt = typeof attempt.amount === 'number' ? attempt.amount : parseFloat(attempt.amount || '0');
      return sum + (isNaN(amt) ? 0 : amt);
    }, 0);

    return { count, totalAmount };
  }, [paymentAttempts]);

  // Merged directory of all users
  const allUsers = useMemo(() => {
    const list: Array<{
      id: string;
      name: string;
      phone: string;
      type: 'broker' | 'worker';
      district?: string;
      state?: string;
      agency?: string;
      skills?: string;
      dailyWage?: string;
      createdAt?: number;
      raw: any;
    }> = [];

    brokers.forEach(b => {
      list.push({
        id: b.id || `broker-${b.phone}`,
        name: b.name || 'Unnamed Broker',
        phone: b.phone || '',
        type: 'broker',
        district: b.district || b.customDistrict || '',
        state: b.state || b.customState || '',
        agency: b.agency || '',
        skills: b.workerTypes || '',
        createdAt: b.createdAt,
        raw: b
      });
    });

    workers.forEach(w => {
      list.push({
        id: w.id || `worker-${w.phone}`,
        name: w.name || 'Unnamed Worker',
        phone: w.phone || '',
        type: 'worker',
        district: w.district || w.customDistrict || '',
        state: w.state || w.customState || '',
        skills: w.skills || '',
        dailyWage: w.expectedWage || '',
        createdAt: w.createdAt,
        raw: w
      });
    });

    // Sort by registration/creation date newest first
    return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [brokers, workers]);

  // Search filtered user directory
  const filteredDirectoryUsers = useMemo(() => {
    if (!directorySearch) return allUsers;
    const s = directorySearch.toLowerCase();
    return allUsers.filter(u => 
      u.name.toLowerCase().includes(s) || 
      u.phone.toLowerCase().includes(s) || 
      (u.district && u.district.toLowerCase().includes(s)) ||
      (u.agency && u.agency.toLowerCase().includes(s)) ||
      (u.skills && u.skills.toLowerCase().includes(s))
    );
  }, [allUsers, directorySearch]);

  // Local state for system settings form
  const [appVersion, setAppVersion] = useState(remoteConfig.appVersion || '1.0.0');
  const [minRequiredVersion, setMinRequiredVersion] = useState(remoteConfig.minRequiredVersion || '1.0.0');
  const [forceUpdateUrl, setForceUpdateUrl] = useState(remoteConfig.forceUpdateUrl || '');
  const [forceUpdateMessageBn, setForceUpdateMessageBn] = useState(remoteConfig.forceUpdateMessageBn || '');
  const [forceUpdateMessageEn, setForceUpdateMessageEn] = useState(remoteConfig.forceUpdateMessageEn || '');
  const [globalAlertBn, setGlobalAlertBn] = useState(remoteConfig.globalAlertBn || '');
  const [globalAlertEn, setGlobalAlertEn] = useState(remoteConfig.globalAlertEn || '');
  const [systemStatus, setSystemStatus] = useState<'active' | 'maintenance'>(remoteConfig.systemStatus || 'active');
  const [savingSettings, setSavingSettings] = useState(false);

  const [rejectionReasons, setRejectionReasons] = useState<{ [orderId: string]: string }>({});

  const handleCopyAdminLink = () => {
    const adminLink = `${window.location.origin}${window.location.pathname}?admin=true`;
    navigator.clipboard.writeText(adminLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await onSaveConfig({
        appVersion: appVersion.trim(),
        minRequiredVersion: minRequiredVersion.trim(),
        forceUpdateUrl: forceUpdateUrl.trim(),
        forceUpdateMessageBn: forceUpdateMessageBn.trim(),
        forceUpdateMessageEn: forceUpdateMessageEn.trim(),
        globalAlertBn: globalAlertBn.trim(),
        globalAlertEn: globalAlertEn.trim(),
        systemStatus,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSettings(false);
    }
  };

  // Filtered lists for User Control Panel
  const filteredJobs = useMemo(() => {
    if (!userSearch) return jobs;
    const s = userSearch.toLowerCase();
    return jobs.filter(j => 
      j.title?.toLowerCase().includes(s) || 
      j.company?.toLowerCase().includes(s) || 
      j.phone?.toLowerCase().includes(s) || 
      j.district?.toLowerCase().includes(s)
    );
  }, [jobs, userSearch]);

  const filteredWorkers = useMemo(() => {
    if (!userSearch) return workers;
    const s = userSearch.toLowerCase();
    return workers.filter(w => 
      w.name?.toLowerCase().includes(s) || 
      w.phone?.toLowerCase().includes(s) || 
      w.skills?.toLowerCase().includes(s) ||
      w.district?.toLowerCase().includes(s)
    );
  }, [workers, userSearch]);

  const filteredBrokers = useMemo(() => {
    if (!userSearch) return brokers;
    const s = userSearch.toLowerCase();
    return brokers.filter(b => 
      b.name?.toLowerCase().includes(s) || 
      b.phone?.toLowerCase().includes(s) || 
      b.agency?.toLowerCase().includes(s) || 
      b.district?.toLowerCase().includes(s)
    );
  }, [brokers, userSearch]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-teal-500/30 selection:text-teal-200">
      
      {/* Top Bar Navigation */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 via-orange-500 to-rose-600 flex items-center justify-center shadow-md shadow-orange-500/10 border border-white/10 shrink-0">
              <span className="text-xl">👑</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                  Admin Portal
                </span>
                <span className="text-[10px] text-slate-400 font-mono">v1.2 Live</span>
              </div>
              <h1 className="text-sm sm:text-base font-black text-white tracking-tight uppercase">
                {lang === 'bn' ? 'ভারত কা কাম - অল-ইন-ওয়ান কন্ট্রোল প্যানেল' : 'Bharat ka Kaam - Ultimate System Control'}
              </h1>
            </div>
          </div>

          {/* Action Links & Utility */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            
            {/* Copy Admin URL box */}
            <div className="hidden md:flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
              <span className="text-[9.5px] font-mono text-slate-400 select-all truncate max-w-[150px]">
                {window.location.origin}/admin
              </span>
              <button 
                onClick={handleCopyAdminLink}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Copy Admin Link"
              >
                {copiedLink ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              </button>
            </div>

            {/* Language Toggle */}
            <button
              onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-bold transition-all border border-slate-750 cursor-pointer"
            >
              🌐 {lang === 'bn' ? 'English' : 'বাংলা'}
            </button>

            {/* Back to Client App */}
            <button
              onClick={onBackToApp}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>{lang === 'bn' ? 'ইউজার অ্যাপ' : 'Go to App'}</span>
            </button>
          </div>

        </div>
      </header>

      {/* Hero Banner with Stat Cards */}
      <div className="bg-slate-900/60 border-b border-slate-900 py-6 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl flex items-center gap-3 shadow-md relative overflow-hidden group">
            <div className="absolute inset-y-0 right-0 w-24 bg-indigo-500/5 rounded-full blur-2xl -mr-5 pointer-events-none"></div>
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Users size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                {lang === 'bn' ? 'টোটাল অ্যাপ ইউজার' : 'Total App Users'}
              </p>
              <h4 className="text-xl font-black text-white font-mono mt-0.5">
                {brokers.length + workers.length}
              </h4>
              <p className="text-[9px] text-indigo-400 font-bold mt-0.5">
                {lang === 'bn' ? `দালাল: ${brokers.length} | কর্মী: ${workers.length}` : `Brokers: ${brokers.length} | Workers: ${workers.length}`}
              </p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl flex items-center gap-3 shadow-md relative overflow-hidden group">
            <div className="absolute inset-y-0 right-0 w-24 bg-amber-500/5 rounded-full blur-2xl -mr-5 pointer-events-none"></div>
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
              <UserCheck size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                {lang === 'bn' ? 'মোট দালাল' : 'Total Brokers'}
              </p>
              <h4 className="text-xl font-black text-white font-mono mt-0.5">
                {brokers.length}
              </h4>
              <p className="text-[9px] text-amber-500 font-bold mt-0.5">
                {lang === 'bn' ? 'নিবন্ধিত কাজের দালাল' : 'Registered Brokers'}
              </p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl flex items-center gap-3 shadow-md relative overflow-hidden group">
            <div className="absolute inset-y-0 right-0 w-24 bg-rose-500/5 rounded-full blur-2xl -mr-5 pointer-events-none"></div>
            <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400">
              <Coins size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                {lang === 'bn' ? '১ মাসে পেইড দালাল' : 'Paid Brokers (30d)'}
              </p>
              <h4 className="text-xl font-black text-rose-400 font-mono mt-0.5">
                {last30DaysStats.count}
              </h4>
              <p className="text-[9px] text-rose-400/80 font-bold mt-0.5">
                {lang === 'bn' ? 'সফল পেমেন্ট রিসিভ' : 'Monthly VIP Upgrades'}
              </p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl flex items-center gap-3 shadow-md relative overflow-hidden group">
            <div className="absolute inset-y-0 right-0 w-24 bg-emerald-500/5 rounded-full blur-2xl -mr-5 pointer-events-none"></div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Coins size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                {lang === 'bn' ? '১ মাসে মোট টাকা' : 'Total Income (30d)'}
              </p>
              <h4 className="text-xl font-black text-emerald-400 font-mono mt-0.5">
                ₹{last30DaysStats.totalAmount}
              </h4>
              <p className="text-[9px] text-emerald-400/80 font-bold mt-0.5">
                {lang === 'bn' ? 'মোট সংগৃহীত টাকা' : 'Total collected rupee'}
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Main Page Layout: Navigation Tabs & Content Panels */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-6">
        
        {/* Navigation Tabs List (Sidebar in Desktop, Row in Mobile) */}
        <aside className="w-full lg:w-64 shrink-0 flex flex-col gap-2">
          
          <button
            onClick={() => setActiveTab('payments')}
            className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
              activeTab === 'payments'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 border-amber-500 shadow-md shadow-orange-500/10'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700'
            } cursor-pointer`}
          >
            <div className="flex items-center gap-2">
              <Coins size={15} />
              <span>{lang === 'bn' ? 'পেমেন্ট কন্ট্রোল' : 'Payment Control'}</span>
            </div>
            {paymentAttempts.some(a => a.status === 'pending') && (
              <span className={`w-2 h-2 rounded-full ${activeTab === 'payments' ? 'bg-slate-950' : 'bg-rose-500 animate-ping'}`}></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('directory')}
            className={`w-full flex items-center gap-2 px-4 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
              activeTab === 'directory'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 border-amber-500 shadow-md shadow-orange-500/10'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700'
            } cursor-pointer`}
          >
            <UserCheck size={15} />
            <span>{lang === 'bn' ? 'অল ইউজার আইডি 👥' : 'All User IDs 👥'}</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-2 px-4 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
              activeTab === 'users'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 border-amber-500 shadow-md shadow-orange-500/10'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700'
            } cursor-pointer`}
          >
            <Users size={15} />
            <span>{lang === 'bn' ? 'ইউজার ডিলিট কন্ট্রোল ⚙️' : 'Delete Manager ⚙️'}</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-2 px-4 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
              activeTab === 'settings'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 border-amber-500 shadow-md shadow-orange-500/10'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700'
            } cursor-pointer`}
          >
            <Settings size={15} />
            <span>{lang === 'bn' ? 'সিস্টেম কনফিগ' : 'System Configuration'}</span>
          </button>

          <button
            onClick={() => setActiveTab('sms')}
            className={`w-full flex items-center gap-2 px-4 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
              activeTab === 'sms'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 border-amber-500 shadow-md shadow-orange-500/10'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700'
            } cursor-pointer`}
          >
            <Database size={15} />
            <span>{lang === 'bn' ? 'এসএমএস সিঙ্ক লগ' : 'SMS Webhook Logs'}</span>
          </button>

          {/* Quick Info Box in sidebar */}
          <div className="mt-4 p-4 bg-slate-900/60 border border-slate-800 rounded-2xl text-[10.5px] text-slate-400 space-y-2 leading-relaxed">
            <div className="flex items-center gap-1.5 text-slate-200 font-bold uppercase tracking-wider text-[9px]">
              <ShieldAlert size={12} className="text-amber-400" />
              <span>সুপার-এডমিন গাইডলাইন</span>
            </div>
            <p>
              {lang === 'bn'
                ? '১. দালাল যখন UTR নাম্বার দিয়ে পেমেন্ট রিকোয়েস্ট সাবমিট করবে, তা অবিলম্বে এখানে ভেসে উঠবে।'
                : '1. As soon as a broker submits a payment request with a UTR, it instantly appears here.'}
            </p>
            <p>
              {lang === 'bn'
                ? '২. "একসেপ্ট" বাটনে চাপ দিলে দালালের স্ক্রিন স্বয়ংক্রিয়ভাবে রিফ্রেশ হয়ে কংগ্রাচুলেশন দেখাবে।'
                : '2. Pressing "Accept" unlocks their account. They will instantly see a success message.'}
            </p>
            <p>
              {lang === 'bn'
                ? '৩. পেমেন্ট রিসিভ না হলে "পেমেন্ট নো রিসিভ" বাটনে ক্লিক করুন, দালালের পেমেন্ট রিজেক্ট হয়ে যাবে।'
                : '3. If no payment is received, click "Payment No Receive" to reject.'}
            </p>
          </div>

        </aside>

        {/* Content Panel Box */}
        <section className="flex-1 bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-xl relative min-h-[500px]">
          
          {/* TAB 1: Payment Control & Verification */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-base font-black uppercase text-white tracking-wider flex items-center gap-2">
                    <Coins className="text-amber-400" size={18} />
                    <span>{lang === 'bn' ? 'পেমেন্ট ভেরিফিকেশন কন্ট্রোল' : 'Payment Approvals Panel'}</span>
                  </h2>
                  <p className="text-[10px] text-slate-400 font-bold">
                    {lang === 'bn' ? 'দালালদের লাইভ পেমেন্ট ও UTR নম্বর যাচাই করার ড্যাশবোর্ড' : 'Live list of submitted UTRs waiting for manual review'}
                  </p>
                </div>
                
                {/* Refresh state button */}
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-[10px] font-bold uppercase tracking-wider text-slate-300 transition-all border border-slate-750 cursor-pointer"
                >
                  🔄 {lang === 'bn' ? 'রিলোড করুন' : 'Reload Log'}
                </button>
              </div>

              {/* List of attempts */}
              {loadingAttempts ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-slate-800 border-t-amber-400 animate-spin"></div>
                  <span className="text-[10.5px] text-slate-500 font-bold uppercase tracking-wider">পেমেন্ট লগ লোড হচ্ছে...</span>
                </div>
              ) : paymentAttempts.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-slate-800 rounded-2xl">
                  <Coins className="mx-auto text-slate-700 mb-2" size={32} />
                  <p className="text-xs text-slate-400 font-bold">
                    {lang === 'bn' ? 'কোনো পেমেন্ট ভেরিফিকেশন রিকোয়েস্ট পাওয়া যায়নি।' : 'No payment verifications requested yet.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {paymentAttempts.map((attempt: any) => {
                    const isSuccess = attempt.status === 'success';
                    const isPending = attempt.status === 'pending';
                    const isRejected = attempt.status === 'rejected';

                    let borderClass = 'border-slate-800 bg-slate-950/20';
                    if (isSuccess) borderClass = 'border-emerald-500/20 bg-emerald-500/5';
                    if (isPending) borderClass = 'border-amber-500/40 bg-amber-500/5 animate-pulse-subtle';
                    if (isRejected) borderClass = 'border-rose-500/20 bg-rose-500/5';

                    // Use the correct 'timestamp' field stored in Firestore
                    const attemptTime = attempt.timestamp;
                    const dateStrEn = attemptTime ? new Date(attemptTime).toLocaleString('en-US', { hour12: true }) : 'Just now';
                    const dateStrBn = attemptTime ? new Date(attemptTime).toLocaleString('bn-BD', { hour12: true }) : '';

                    let elapsedText = '';
                    if (attemptTime) {
                      const diffMs = Date.now() - attemptTime;
                      const diffMins = Math.floor(diffMs / 60000);
                      const diffSecs = Math.floor((diffMs % 60000) / 1000);
                      if (diffMins === 0) {
                        elapsedText = lang === 'bn' ? `${diffSecs} সেকেন্ড আগে` : `${diffSecs} seconds ago`;
                      } else {
                        elapsedText = lang === 'bn' 
                          ? `${diffMins} মিনিট ${diffSecs} সেকেন্ড আগে` 
                          : `${diffMins} mins ${diffSecs} secs ago`;
                      }
                    }

                    return (
                      <div 
                        key={attempt.orderId}
                        className={`border rounded-2xl p-4.5 transition-all text-left space-y-3.5 ${borderClass}`}
                      >
                        {/* Attempt Top Meta bar */}
                        <div className="flex flex-wrap justify-between items-center gap-2 text-[10.5px] border-b border-slate-800/60 pb-2.5">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400">Order ID:</span>
                              <strong className="text-white font-mono select-all text-xs">{attempt.orderId}</strong>
                            </div>
                            <div className="space-y-0.5 text-[10px] text-slate-400 font-medium">
                              <p className="flex flex-wrap items-center gap-1">
                                <span className="text-amber-500">⏰</span>
                                <strong>{lang === 'bn' ? 'পেমেন্ট এর তারিখ ও সময়:' : 'Payment Time:'}</strong>
                                <span className="text-white font-mono">{dateStrEn}</span>
                                {dateStrBn && <span className="text-slate-500 font-mono">({dateStrBn})</span>}
                              </p>
                              {elapsedText && (
                                <p className="flex items-center gap-1 text-emerald-400 font-bold">
                                  <span>⏱️</span>
                                  <span>{lang === 'bn' ? 'অতিক্রান্ত সময়:' : 'Elapsed:'}</span>
                                  <span className="font-mono">{elapsedText}</span>
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <span className={`text-[9.5px] font-black uppercase px-2 py-0.5 rounded border shrink-0 ${
                            isSuccess 
                              ? "bg-green-500/10 text-green-400 border-green-500/30" 
                              : isPending
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse"
                                : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                          }`}>
                            {isSuccess 
                              ? (lang === 'bn' ? 'সফল ✓' : 'Verified ✓') 
                              : isPending
                                ? (lang === 'bn' ? 'অপেক্ষমান ⌛' : 'Pending ⌛')
                                : (lang === 'bn' ? 'বাতিল ✗' : 'Rejected ✗')}
                          </span>
                        </div>

                        {/* Middle: Grid details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold leading-relaxed">
                          
                          <div className="space-y-1 bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
                            <span className="text-[10px] uppercase text-slate-500 font-black tracking-wider block">👤 দালালের তথ্য</span>
                            <div className="text-slate-200">
                              <p className="font-extrabold">{attempt.brokerName || 'নতুন দালাল'}</p>
                              <p className="font-mono text-[10.5px] text-slate-400 mt-0.5 select-all">📞 {attempt.phone || 'N/A'}</p>
                            </div>
                          </div>

                          <div className="space-y-1 bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
                            <span className="text-[10px] uppercase text-slate-500 font-black tracking-wider block">🔑 ট্রানজেকশন UTR আইডি</span>
                            <div className="text-slate-200">
                              <p className="font-mono font-black text-amber-400 tracking-wider text-sm select-all bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 inline-block">
                                {attempt.utr || 'NO UTR'}
                              </p>
                              <p className="text-[9.5px] text-slate-400 mt-1 uppercase">Method: {attempt.paymentMethod || 'UPI'}</p>
                            </div>
                          </div>

                          <div className="space-y-1 bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
                            <span className="text-[10px] uppercase text-slate-500 font-black tracking-wider block">💰 পেমেন্টের পরিমাণ</span>
                            <div className="text-slate-200">
                              <p className="font-mono font-black text-white text-base">₹{attempt.amount || '399'}</p>
                              <p className="text-[9.5px] text-slate-400 mt-1 uppercase">{lang === 'bn' ? 'স্ট্যাটাস আপগ্রেড ফি' : 'Status Upgrade Fee'}</p>
                            </div>
                          </div>

                        </div>

                        {/* Bottom: Action Block (if pending) */}
                        {isPending && (
                          <div className="pt-2 border-t border-slate-800/60 bg-slate-950/30 p-3.5 rounded-2xl border border-slate-800/50 space-y-3">
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                              
                              {/* Rejection input box */}
                              <div className="flex-1">
                                <label className="text-[9.5px] font-black uppercase text-slate-400 block mb-1">
                                  {lang === 'bn' ? '❌ বাতিল করার কারণ (রিজেক্ট করতে চাইলে ঐচ্ছিক কারণটি লিখুন)' : 'Rejection Reason (Optional/English)'}
                                </label>
                                <input 
                                  type="text"
                                  placeholder={lang === 'bn' ? 'যেমন: ভুল UTR নম্বর / টাকা পাওয়া যায়নি।' : 'e.g., Incorrect UTR'}
                                  value={rejectionReasons[attempt.orderId] || ''}
                                  onChange={(e) => {
                                    setRejectionReasons(prev => ({
                                      ...prev,
                                      [attempt.orderId]: e.target.value
                                    }));
                                  }}
                                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20"
                                />
                              </div>

                              {/* Actions Buttons Container */}
                              <div className="flex gap-2 shrink-0 pt-4 sm:pt-0">
                                
                                {/* Accept Button */}
                                <button
                                  type="button"
                                  onClick={() => onApprovePayment(attempt.orderId, 'success', rejectionReasons[attempt.orderId] || '')}
                                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 transition-all text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer flex items-center gap-1 shadow-md shadow-emerald-500/10"
                                >
                                  <CheckCircle2 size={14} />
                                  <span>{lang === 'bn' ? 'একসেপ্ট করুন' : 'Accept Payment'}</span>
                                </button>

                                {/* Reject Button */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const reason = rejectionReasons[attempt.orderId]?.trim() || "Incorrect UTR / Payment not received";
                                    onApprovePayment(attempt.orderId, 'rejected', reason);
                                  }}
                                  className="px-4 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 active:scale-95 transition-all text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer flex items-center gap-1 shadow-md shadow-rose-500/10"
                                >
                                  <XCircle size={14} />
                                  <span>{lang === 'bn' ? 'পেমেন্ট নো রিসিভ' : 'No Receive Payment'}</span>
                                </button>

                              </div>

                            </div>
                          </div>
                        )}

                        {/* Error message or reason display if rejected */}
                        {isRejected && (attempt.errorMessage || attempt.errorMessageBn) && (
                          <div className="p-3 bg-rose-950/10 border border-rose-950/30 rounded-xl text-xs text-rose-300 flex items-start gap-2">
                            <span className="mt-0.5">⚠️</span>
                            <div>
                              <strong>{lang === 'bn' ? 'বাতিলের কারণ:' : 'Rejection Reason:'}</strong>{' '}
                              {lang === 'bn' ? (attempt.errorMessageBn || attempt.errorMessage) : attempt.errorMessage}
                            </div>
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}

          {/* TAB: All User IDs Directory */}
          {activeTab === 'directory' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-base font-black uppercase text-white tracking-wider flex items-center gap-2">
                    <Users className="text-amber-400" size={18} />
                    <span>{lang === 'bn' ? 'অল ইউজার আইডি ভেরিফিকেশন ও বিবরণ' : 'All Registered User Directory'}</span>
                  </h2>
                  <p className="text-[10px] text-slate-400 font-bold">
                    {lang === 'bn' ? 'সিস্টেমের সকল নিবন্ধিত কর্মী ও দালালদের বিবরণ, পোস্টসমূহ এবং লাইভ জিপিএস লোকেশন ট্র্যাকিং' : 'View registered worker & broker profiles, post activities, and GPS tracking link'}
                  </p>
                </div>
              </div>

              {/* Directory search */}
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500">
                  <Search size={14} />
                </div>
                <input
                  type="text"
                  placeholder={lang === 'bn' ? 'নাম, মোবাইল নম্বর, এজেন্সির নাম বা জেলা দিয়ে খুঁজুন...' : 'Search directory by name, phone, agency, skill...'}
                  value={directorySearch}
                  onChange={(e) => setDirectorySearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              {/* Total Users count label */}
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1">
                <span>
                  {lang === 'bn' ? `মোট পাওয়া গেছে: ${filteredDirectoryUsers.length} জন ইউজার` : `Found ${filteredDirectoryUsers.length} users`}
                </span>
                <span>
                  {lang === 'bn' ? 'নামে বা অ্যাকশনে ক্লিক করে জিপিএস ও পোস্ট চেক করুন' : 'Click View to inspect live GPS & posts'}
                </span>
              </div>

              {/* Directory List Grid */}
              <div className="space-y-3">
                {filteredDirectoryUsers.length === 0 ? (
                  <div className="py-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/20">
                    <Users className="mx-auto text-slate-700 mb-2" size={28} />
                    <p className="text-xs text-slate-500 font-bold">
                      {lang === 'bn' ? 'কোনো ইউজার ম্যাচ করেনি।' : 'No users found in directory.'}
                    </p>
                  </div>
                ) : (
                  filteredDirectoryUsers.map(u => (
                    <div 
                      key={u.id} 
                      className="p-4 bg-slate-950/30 border border-slate-800/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition-all cursor-pointer"
                      onClick={() => setSelectedUser(u)}
                    >
                      <div className="flex items-center gap-3 text-left">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                          u.type === 'broker' 
                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {u.type === 'broker' ? '💼' : '✂️'}
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center flex-wrap gap-2">
                            <span className="font-extrabold text-sm text-white">{u.name}</span>
                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                              u.type === 'broker' 
                                ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30' 
                                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            }`}>
                              {u.type === 'broker' ? (lang === 'bn' ? 'দালাল' : 'Broker') : (lang === 'bn' ? 'কর্মী' : 'Worker')}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 font-semibold">
                            {u.type === 'broker' && u.agency ? `🏢 ${u.agency} • ` : ''}📍 {u.district || 'N/A'}, {u.state || 'N/A'}
                          </p>
                          <p className="text-[10.5px] font-mono font-bold text-slate-400">📞 {u.phone}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUser(u);
                          }}
                          className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer shadow-sm"
                        >
                          <Eye size={13} className="text-amber-400" />
                          <span>{lang === 'bn' ? 'প্রোফাইল ও জিপিএস ট্র্যাক 🗺️' : 'View GPS & Posts 🗺️'}</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: User Control & Management (Delete Users) */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-base font-black uppercase text-white tracking-wider flex items-center gap-2">
                    <Users className="text-amber-400" size={18} />
                    <span>{lang === 'bn' ? 'ইউজার ডাটাবেস ও কন্ট্রোল' : 'User Database & Control'}</span>
                  </h2>
                  <p className="text-[10px] text-slate-400 font-bold">
                    {lang === 'bn' ? 'সিস্টেমের সকল কাজের চাহিদা, দর্জি ও দালাল ডিলিট করার ক্ষমতা' : 'Remove fake, spam, or abusive posts instantly from the platform'}
                  </p>
                </div>
              </div>

              {/* Sub tabs: Jobs, Workers, Brokers */}
              <div className="flex gap-2 border-b border-slate-800/80 pb-1.5 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setUserSubTab('brokers')}
                  className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer shrink-0 ${
                    userSubTab === 'brokers' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  💼 {lang === 'bn' ? `দালাল (${brokers.length})` : `Brokers (${brokers.length})`}
                </button>
                <button
                  type="button"
                  onClick={() => setUserSubTab('workers')}
                  className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer shrink-0 ${
                    userSubTab === 'workers' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  ✂️ {lang === 'bn' ? `কর্মী (${workers.length})` : `Workers (${workers.length})`}
                </button>
                <button
                  type="button"
                  onClick={() => setUserSubTab('jobs')}
                  className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer shrink-0 ${
                    userSubTab === 'jobs' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  👔 {lang === 'bn' ? `কাজের পোস্ট (${jobs.length})` : `Job Posts (${jobs.length})`}
                </button>
              </div>

              {/* Search input bar */}
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500">
                  <Search size={14} />
                </div>
                <input
                  type="text"
                  placeholder={lang === 'bn' ? 'নাম, মোবাইল নম্বর বা জেলা দিয়ে খুঁজুন...' : 'Search by name, phone, description...'}
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              {/* Grid lists based on subtab */}
              {userSubTab === 'brokers' && (
                <div className="space-y-3.5">
                  {filteredBrokers.length === 0 ? (
                    <p className="text-xs text-slate-500 font-bold text-center py-10">কোনো দালাল পাওয়া যায়নি।</p>
                  ) : (
                    filteredBrokers.map(b => (
                      <div key={b.id} className="p-4 bg-slate-950/30 border border-slate-800 rounded-2xl flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-white">{b.name}</span>
                            <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded font-bold font-mono">
                              {b.workerTypes || 'General'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 font-semibold leading-normal">
                            🏢 {b.agency || 'Personal'} • 📍 {b.district}, {b.state}
                          </p>
                          <p className="text-[10.5px] font-mono text-slate-400 font-bold select-all">📞 {b.phone}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onDeletePost('brokers', b.id)}
                          className="p-2.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-xl transition-all border border-rose-500/20 cursor-pointer shadow-sm hover:scale-105 active:scale-95"
                          title="Delete Broker Account"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {userSubTab === 'workers' && (
                <div className="space-y-3.5">
                  {filteredWorkers.length === 0 ? (
                    <p className="text-xs text-slate-500 font-bold text-center py-10">কোনো কর্মী পাওয়া যায়নি।</p>
                  ) : (
                    filteredWorkers.map(w => (
                      <div key={w.id} className="p-4 bg-slate-950/30 border border-slate-800 rounded-2xl flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-white">{w.name}</span>
                            <span className="text-[9.5px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-bold font-mono">
                              Wage: ₹{w.dailyWage}/day
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 font-semibold leading-normal">
                            ✂️ {w.skills ? w.skills.join(', ') : 'Helper'} • 📍 {w.district}, {w.state}
                          </p>
                          <p className="text-[10.5px] font-mono text-slate-400 font-bold select-all">📞 {w.phone}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onDeletePost('workers', w.id)}
                          className="p-2.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-xl transition-all border border-rose-500/20 cursor-pointer shadow-sm hover:scale-105 active:scale-95"
                          title="Delete Worker Post"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {userSubTab === 'jobs' && (
                <div className="space-y-3.5">
                  {filteredJobs.length === 0 ? (
                    <p className="text-xs text-slate-500 font-bold text-center py-10">কোনো কাজের পোস্ট পাওয়া যায়নি।</p>
                  ) : (
                    filteredJobs.map(j => (
                      <div key={j.id} className="p-4 bg-slate-950/30 border border-slate-800 rounded-2xl flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-white">{j.title}</span>
                            <span className="text-[9.5px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded font-bold">
                              {j.company}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 font-semibold leading-normal">
                            💰 ₹{j.salary} • 📍 {j.district}, {j.state}
                          </p>
                          <p className="text-[10.5px] font-mono text-slate-400 font-bold select-all">📞 {j.phone}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onDeletePost('jobs', j.id)}
                          className="p-2.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-xl transition-all border border-rose-500/20 cursor-pointer shadow-sm hover:scale-105 active:scale-95"
                          title="Delete Job Post"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

            </div>
          )}

          {/* TAB 3: System Config Settings */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-base font-black uppercase text-white tracking-wider flex items-center gap-2">
                    <Settings className="text-amber-400" size={18} />
                    <span>{lang === 'bn' ? 'সিস্টেম সেটিংস ও অটো-আপডেট' : 'System Config & Upgrade Engines'}</span>
                  </h2>
                  <p className="text-[10px] text-slate-400 font-bold">
                    {lang === 'bn' ? 'গ্লোবাল নোটিশ বোর্ড ও জোরপূর্বক এপিকে আপডেট প্যারামিটার' : 'Configure APK forced update alerts and global marquee notices'}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-5 text-left">
                
                {/* forced updates */}
                <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-2xl space-y-4">
                  <h3 className="text-xs font-black text-amber-400 uppercase tracking-widest border-b border-slate-800/60 pb-1.5">
                    ⚙️ {lang === 'bn' ? 'ভার্সন কন্ট্রোল (APK অটো-আপডেট)' : 'Forced Version Upgrades'}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9.5px] font-extrabold uppercase text-slate-400 block">
                        {lang === 'bn' ? 'লেটেস্ট এপিকে ভার্সন' : 'Latest APK Version'}
                      </label>
                      <input 
                        type="text"
                        value={appVersion}
                        onChange={(e) => setAppVersion(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-amber-500 font-bold font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9.5px] font-extrabold uppercase text-rose-400 block">
                        {lang === 'bn' ? 'বাধ্যতামূলক ভার্সন (Min Version)' : 'Min Compulsory Version'}
                      </label>
                      <input 
                        type="text"
                        value={minRequiredVersion}
                        onChange={(e) => setMinRequiredVersion(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-amber-500 font-bold font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9.5px] font-extrabold uppercase text-slate-400 block">
                      {lang === 'bn' ? 'সরাসরি এপিকে ডাউনলোড লিংক (Direct APK Link)' : 'APK Direct Download Link'}
                    </label>
                    <input 
                      type="url"
                      value={forceUpdateUrl}
                      onChange={(e) => setForceUpdateUrl(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-amber-500 font-semibold"
                      placeholder="e.g., https://domain.com/app.apk"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9.5px] font-extrabold uppercase text-slate-400 block">
                      {lang === 'bn' ? 'আপডেট মেসেজ (বাংলা)' : 'Upgrade Alert Message (Bengali)'}
                    </label>
                    <textarea 
                      value={forceUpdateMessageBn}
                      onChange={(e) => setForceUpdateMessageBn(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-amber-500 font-bold leading-relaxed"
                    />
                  </div>
                </div>

                {/* announcements banner marquee */}
                <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-2xl space-y-4">
                  <h3 className="text-xs font-black text-amber-400 uppercase tracking-widest border-b border-slate-800/60 pb-1.5">
                    📢 {lang === 'bn' ? 'গ্লোবাল স্ক্রলিং নোটিশ বোর্ড (Scrolling Marquee Notice)' : 'Marquee Alert notice banner'}
                  </h3>

                  <div className="space-y-1">
                    <label className="text-[9.5px] font-extrabold uppercase text-slate-400 block">
                      {lang === 'bn' ? 'হেডারে দেখানোর জন্য নোটিশ (বাংলা)' : 'Scrolling Marquee text (Bengali)'}
                    </label>
                    <textarea 
                      value={globalAlertBn}
                      onChange={(e) => setGlobalAlertBn(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-amber-500 font-bold leading-relaxed"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="px-6 py-3 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md shadow-amber-500/15 hover:scale-102 active:scale-95 cursor-pointer disabled:opacity-55 flex items-center gap-1.5"
                  >
                    {savingSettings ? (
                      <>
                        <div className="w-3.5 h-3.5 rounded-full border border-slate-950 border-t-transparent animate-spin"></div>
                        <span>সেভিং...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={14} />
                        <span>{lang === 'bn' ? 'কনফিগ ক্লাউডে সেভ করুন' : 'Save Config to Cloud'}</span>
                      </>
                    )}
                  </button>
                </div>

              </form>

            </div>
          )}

          {/* TAB 4: SMS Sync webhook logs */}
          {activeTab === 'sms' && (
            <div className="space-y-6">
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-base font-black uppercase text-white tracking-wider flex items-center gap-2">
                    <Database className="text-amber-400" size={18} />
                    <span>{lang === 'bn' ? 'এসএমএস গেটওয়ে রিসিভার লগ' : 'SMS Webhook Sync Logs'}</span>
                  </h2>
                  <p className="text-[10px] text-slate-400 font-bold">
                    {lang === 'bn' ? 'ব্যাংকের মেসেজ অটো-ফরোয়ার্ডার অ্যাপ থেকে প্রাপ্ত লাইভ রিসিভার হিস্ট্রি' : 'Live list of real incoming bank notifications received via the gateway'}
                  </p>
                </div>
              </div>

              {loadingSms ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-slate-800 border-t-amber-400 animate-spin"></div>
                  <span className="text-[10.5px] text-slate-500 font-bold uppercase tracking-wider">এসএমএস সিঙ্ক লগ লোড হচ্ছে...</span>
                </div>
              ) : rawSmsLogs.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-slate-800 rounded-2xl bg-slate-950/20">
                  <Database className="mx-auto text-slate-700 mb-2" size={32} />
                  <p className="text-xs text-slate-400 font-bold">
                    {lang === 'bn' ? 'কোনো এসএমএস গেটওয়ে লগ পাওয়া যায়নি।' : 'No gateway logs received yet.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 font-mono text-[10.5px]">
                  {rawSmsLogs.map((log: any, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-xl leading-relaxed text-slate-300">
                      <div className="flex justify-between text-[9px] text-slate-500 font-bold mb-1.5 border-b border-slate-800/50 pb-1">
                        <span>SENDER: {log.sender || 'UNKNOWN'}</span>
                        <span>{log.createdAt ? new Date(log.createdAt).toLocaleString() : 'N/A'}</span>
                      </div>
                      <p className="whitespace-pre-wrap select-all font-sans text-xs bg-slate-900/40 p-2 rounded border border-slate-800/40">
                        {log.body || log.text || 'Empty Body'}
                      </p>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

        </section>

      </main>

      {/* Selected User Details & GPS Activities Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-2xl relative space-y-6 text-slate-100 max-h-[90vh] overflow-y-auto text-left">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 ${
                  selectedUser.type === 'broker' 
                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-inner' 
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-inner'
                }`}>
                  {selectedUser.type === 'broker' ? '💼' : '✂️'}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base md:text-lg font-black text-white">{selectedUser.name}</h3>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                      selectedUser.type === 'broker' 
                        ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' 
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    }`}>
                      {selectedUser.type === 'broker' ? (lang === 'bn' ? 'দালাল / এজেন্ট' : 'Broker / Agent') : (lang === 'bn' ? 'দক্ষ কর্মী' : 'Skilled Worker')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-bold mt-0.5 select-all">
                    📞 {selectedUser.phone}
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer text-xs font-bold uppercase tracking-wider px-3 border border-slate-700 active:scale-95 shadow-sm shrink-0"
              >
                {lang === 'bn' ? 'বন্ধ করুন ✕' : 'Close ✕'}
              </button>
            </div>

            {/* Profile Info Details Grid */}
            <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-850 space-y-4">
              <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
                <span>👤</span>
                <span>{lang === 'bn' ? 'ইউজার প্রোফাইল ডাটাবেস রেকর্ড' : 'User Registration Profile Details'}</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold leading-relaxed">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block mb-0.5">{lang === 'bn' ? 'যোগাযোগের মোবাইল নম্বর' : 'Primary Phone'}</span>
                  <p className="text-slate-200 font-mono text-xs select-all bg-slate-950/50 px-2 py-1 rounded border border-slate-800/40 inline-block font-bold">
                    {selectedUser.phone}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block mb-0.5">{lang === 'bn' ? 'প্রধান কাজের জেলা ও রাজ্য' : 'District & State'}</span>
                  <p className="text-slate-200">{selectedUser.district || 'N/A'}, {selectedUser.state || 'N/A'}</p>
                </div>

                {selectedUser.type === 'broker' && (
                  <>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block mb-0.5">{lang === 'bn' ? 'দালালি এজেন্সির নাম' : 'Agency Name'}</span>
                      <p className="text-slate-200 font-extrabold">{selectedUser.agency || (lang === 'bn' ? 'ব্যক্তিগত' : 'Personal')}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block mb-0.5">{lang === 'bn' ? 'সরবরাহকৃত কর্মীর ধরন' : 'Worker Categories'}</span>
                      <p className="text-amber-400 font-bold">{selectedUser.skills || 'General Helper'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block mb-0.5">{lang === 'bn' ? 'অভিজ্ঞতার পরিমাণ' : 'Experience Years'}</span>
                      <p className="text-slate-200">{selectedUser.raw.experience || 'N/A'} Years</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block mb-0.5">{lang === 'bn' ? 'সাবস্ক্রিপশন মেয়াদ' : 'Subscription Status'}</span>
                      <p className="font-mono text-emerald-400 font-black">
                        {selectedUser.raw.subscribedUntil 
                          ? `🟢 Active until ${new Date(selectedUser.raw.subscribedUntil).toLocaleDateString()}` 
                          : '🔴 Not Subscribed / Pending Payment'}
                      </p>
                    </div>
                  </>
                )}

                {selectedUser.type === 'worker' && (
                  <>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block mb-0.5">{lang === 'bn' ? 'দক্ষতা ও কাজ' : 'Skills & Expertises'}</span>
                      <p className="text-emerald-400 font-extrabold">{selectedUser.skills || 'Helper'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block mb-0.5">{lang === 'bn' ? 'আশাতীত দৈনিক মজুরি' : 'Expected Daily Wage'}</span>
                      <p className="text-amber-400 font-black">₹{selectedUser.dailyWage || 'N/A'}/day</p>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block mb-0.5">{lang === 'bn' ? 'নিজের কাজের অভিজ্ঞতা' : 'Bio Description'}</span>
                      <p className="text-slate-300 text-xs italic bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/40 whitespace-pre-wrap font-medium">
                        "{selectedUser.raw.about || selectedUser.raw.description || 'No detailed bio written.'}"
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Uploaded Activities (কে কি ধরনের পোস্ট আপলোড করেছে ও কোথাকার কাজ) */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                <span>📌</span>
                <span>
                  {selectedUser.type === 'broker' 
                    ? (lang === 'bn' ? 'আপলোড করা কাজের বিবরণ ও জিপিএস কো-অর্ডিনেট' : 'Uploaded Job Posts & Workplace GPS Tracking') 
                    : (lang === 'bn' ? 'কর্মীর কাজের জন্য চাহিদাকৃত আবেদন' : 'Active Seeker Application Details')}
                </span>
              </h4>

              {/* Broker Jobs mapping */}
              {selectedUser.type === 'broker' && (() => {
                const bJobs = jobs.filter(j => j.brokerPhone === selectedUser.phone || j.phone === selectedUser.phone);
                if (bJobs.length === 0) {
                  return (
                    <div className="py-8 text-center border-2 border-dashed border-slate-800 rounded-2xl bg-slate-950/20 text-slate-500 text-xs font-bold">
                      {lang === 'bn' ? 'দালাল এখনও কোনো কাজের পোস্ট আপলোড করেনি।' : 'This broker has not uploaded any job posts yet.'}
                    </div>
                  );
                }
                return (
                  <div className="space-y-4">
                    <p className="text-[11px] font-bold text-slate-400 px-1">
                      {lang === 'bn' ? `মোট কাজের পোস্ট পাওয়া গেছে: ${bJobs.length} টি` : `Found ${bJobs.length} uploaded job posts`}
                    </p>
                    {bJobs.map((job, idx) => (
                      <div key={job.id || idx} className="p-4 bg-slate-950/50 border border-slate-850 rounded-2xl text-xs space-y-3">
                        <div className="flex justify-between items-start flex-wrap gap-2 border-b border-slate-800 pb-2">
                          <div>
                            <h5 className="font-extrabold text-sm text-white">{job.title}</h5>
                            <p className="text-[10.5px] text-slate-400 font-bold mt-0.5">🏢 {job.company || 'Private Employer'}</p>
                          </div>
                          <span className="px-2 py-0.5 font-mono font-black text-[10.5px] bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">
                            ₹{job.salary}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-medium text-slate-300">
                          <p>📍 <strong>{lang === 'bn' ? 'কাজের ঠিকানা:' : 'Workplace Address:'}</strong> {job.location}</p>
                          <p>📅 <strong>{lang === 'bn' ? 'শুরুর তারিখ ও সময়:' : 'Availability & Hours:'}</strong> {job.date || 'N/A'} • {job.time || 'N/A'}</p>
                        </div>

                        {/* Workplace Maps verification and coordinates tracking block */}
                        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs">🗺️</span>
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                              {lang === 'bn' ? 'কাজের লাইভ জিপিএস কো-অর্ডিনেট' : 'Workplace Live GPS Coordinates'}
                            </span>
                          </div>

                          {job.workplaceMapLink ? (
                            <div className="space-y-2">
                              <div className="p-2 bg-emerald-500/5 border border-emerald-500/20 rounded-lg flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">
                                    {lang === 'bn' ? 'লাইভ জিপিএস লোকেশন সংরক্ষিত ✓' : 'Live GPS Location Locked ✓'}
                                  </span>
                                </div>
                                <span className="text-[9px] font-mono text-slate-500 select-all font-medium">
                                  {job.workplaceMapLink.split('?q=')[1] || 'Captured Coordinates'}
                                </span>
                              </div>

                              <div className="flex gap-2">
                                <a
                                  href={job.workplaceMapLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full px-3 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-[10.5px] font-black uppercase rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/10"
                                >
                                  <MapPin size={13} />
                                  <span>{lang === 'bn' ? 'গুগল ম্যাপে লাইভ স্থান ট্র্যাকিং দেখুন 🌍' : 'Track Live Location in Maps 🌍'}</span>
                                </a>
                              </div>
                            </div>
                          ) : (
                            <div className="p-2.5 bg-rose-500/5 border border-rose-500/20 rounded-lg text-[10px] font-extrabold text-rose-400 flex items-center gap-1.5">
                              <span>⚠️</span>
                              <span>
                                {lang === 'bn' 
                                  ? 'এই কাজের জন্য কোনো লাইভ জিপিএস বা ম্যাপের লিংক কনফার্ম করা হয়নি।' 
                                  : 'No verified GPS tracker or Map link was uploaded for this job post.'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Worker Seeker Posts Mapping */}
              {selectedUser.type === 'worker' && (() => {
                const wPosts = workers.filter(w => w.phone === selectedUser.phone);
                if (wPosts.length === 0) {
                  return (
                    <div className="py-8 text-center border-2 border-dashed border-slate-800 rounded-2xl bg-slate-950/20 text-slate-500 text-xs font-bold">
                      {lang === 'bn' ? 'কর্মী এখনও কোনো কাজের জন্য চাহিদাপত্র তৈরি করেনি।' : 'This worker has not created any job seeker post yet.'}
                    </div>
                  );
                }
                return (
                  <div className="space-y-4">
                    {wPosts.map((post, idx) => (
                      <div key={post.id || idx} className="p-4 bg-slate-950/50 border border-slate-850 rounded-2xl text-xs space-y-3">
                        <div className="flex justify-between items-start flex-wrap gap-2 border-b border-slate-800 pb-2">
                          <div>
                            <h5 className="font-extrabold text-sm text-white">{post.name} ({lang === 'bn' ? 'কর্মী প্রোফাইল' : 'Worker profile'})</h5>
                            <p className="text-[10.5px] text-emerald-400 font-bold mt-0.5">✂️ Skills: {post.skills || 'Helper'}</p>
                          </div>
                          <span className="px-2 py-0.5 font-mono font-black text-[10.5px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
                            ₹{post.expectedWage}/day
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-medium text-slate-300">
                          <p>📍 <strong>{lang === 'bn' ? 'পছন্দের এলাকা:' : 'Preferred Location:'}</strong> {post.location || 'N/A'}</p>
                          <p>📅 <strong>{lang === 'bn' ? 'কখন থেকে কাজ করতে পারবে:' : 'Available From:'}</strong> {post.date || 'N/A'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

