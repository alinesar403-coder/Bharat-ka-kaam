import React, { useState, useEffect } from 'react';
import { Download, X, ArrowUpFromLine, PlusSquare, Smartphone, CheckCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface InstallPromptProps {
  lang: 'bn' | 'hi' | 'en';
}

const promptTranslations = {
  bn: {
    title: "মোবাইলে সরাসরি অ্যাপ হিসেবে চালান!",
    desc: "কোনো ব্রাউজার ফ্রেম বা এআই স্টুডিও ছাড়াই সরাসরি এই অ্যাপটি যেকোনো ফোনে ইনস্টল করতে পারবেন।",
    btnInstall: "অ্যাপ ইনস্টল করুন",
    dismiss: "পরে করব",
    iosTitle: "আইফোনে (iOS) সরাসরি ইনস্টল করুন",
    iosStep1: "১. নিচে সাফারির শেয়ার আইকনে ক্লিক করুন",
    iosStep2: "২. স্ক্রল করে 'Add to Home Screen' চাপুন",
    iosStep3: "৩. উপরে ডানদিকে 'Add' ক্লিক করে স্ক্রিনে আনুন",
    successTitle: "ইনস্টলেশন সফল!",
    successDesc: "আপনার ফোনে অ্যাপটি যোগ করা হয়েছে। এখন থেকে এটি সরাসরি কাজ করবে!"
  },
  en: {
    title: "Install as a Mobile App!",
    desc: "Run this app directly on any phone without browser bars or AI Studio developer frames.",
    btnInstall: "Install App Now",
    dismiss: "Maybe Later",
    iosTitle: "Install Directly on iPhone (iOS)",
    iosStep1: "1. Tap the Share button in Safari menu below",
    iosStep2: "2. Scroll down and select 'Add to Home Screen'",
    iosStep3: "3. Tap 'Add' in the top right corner",
    successTitle: "Installation Successful!",
    successDesc: "The app has been added to your screen. Launch it anytime!"
  },
  hi: {
    title: "मोबाइल पर सीधे ऐप की तरह चलाएं!",
    desc: "बिना किसी ब्राउज़र फ़्रेम या एआई स्टूडियो के सीधे इस ऐप को अपने फोन पर इंस्टॉल करें।",
    btnInstall: "ऐप इंस्टॉल करें",
    dismiss: "बाद में",
    iosTitle: "आईफोन (iOS) पर सीधे इंस्टॉल करें",
    iosStep1: "1. नीचे सफारी के शेयर बटन पर टैप करें",
    iosStep2: "2. नीचे स्क्रॉल करें और 'Add to Home Screen' चुनें",
    iosStep3: "3. ऊपर दाएं कोने में 'Add' पर टैप करें",
    successTitle: "इंस्टॉलेशन सफल!",
    successDesc: "ऐप आपकी स्क्रीन पर जोड़ दिया गया है। इसे कभी भी सीधे चलाएं!"
  }
};

export default function InstallPrompt({ lang }: InstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  const t = promptTranslations[lang] || promptTranslations['bn'];

  useEffect(() => {
    // Check if already running in standalone/installed mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone === true;
    
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Capture standard install prompt on Android/Chrome
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Only show after 3 seconds of loading to avoid being intrusive
      const timer = setTimeout(() => {
        const isDismissed = localStorage.getItem('pwa_install_prompt_dismissed');
        if (!isDismissed) {
          setShowPrompt(true);
        }
      }, 3000);

      return () => clearTimeout(timer);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // For iOS users, we show manually since safari doesn't support beforeinstallprompt
    if (isIosDevice) {
      const timer = setTimeout(() => {
        const isDismissed = localStorage.getItem('pwa_install_prompt_dismissed');
        if (!isDismissed) {
          setShowPrompt(true);
        }
      }, 4000);
      return () => clearTimeout(timer);
    }

    // Detect successful install
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIosGuide(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa_install_prompt_dismissed', 'true');
    setShowPrompt(false);
    setShowIosGuide(false);
  };

  if (isInstalled) return null;

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-50 bg-slate-900 border border-slate-800 text-white rounded-3xl p-5 shadow-2xl flex flex-col gap-4 overflow-hidden"
        >
          {/* Decorative neon effect */}
          <div className="absolute -top-10 -left-10 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none"></div>
          <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-teal-500/10 rounded-full blur-xl pointer-events-none"></div>

          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 rounded-2xl shadow-md">
                <Smartphone size={22} className="animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-amber-400 flex items-center gap-1">
                  <Sparkles size={12} />
                  <span>BHARAT KA KAAM</span>
                </h4>
                <p className="text-sm font-extrabold text-white mt-1 leading-tight">{t.title}</p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1.5 hover:bg-slate-800 rounded-full transition-colors cursor-pointer text-slate-400 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          <p className="text-xs text-slate-400 leading-normal font-semibold relative z-10">
            {t.desc}
          </p>

          {/* iOS Direct Steps */}
          {showIosGuide && isIOS && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2 text-[11px] font-bold text-slate-300 relative z-10"
            >
              <h5 className="text-[10px] text-amber-400 uppercase tracking-wider font-extrabold flex items-center gap-1">
                <ArrowUpFromLine size={12} />
                <span>{t.iosTitle}</span>
              </h5>
              <p className="flex items-center gap-2">
                <span className="shrink-0 w-5 h-5 bg-slate-800 rounded-full flex items-center justify-center text-[10px]">1</span>
                <span>{t.iosStep1}</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="shrink-0 w-5 h-5 bg-slate-800 rounded-full flex items-center justify-center text-[10px]">2</span>
                <span>{t.iosStep2}</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="shrink-0 w-5 h-5 bg-slate-800 rounded-full flex items-center justify-center text-[10px]">3</span>
                <span>{t.iosStep3}</span>
              </p>
            </motion.div>
          )}

          <div className="flex gap-2 relative z-10">
            <button
              onClick={handleDismiss}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-850 text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer text-center"
            >
              {t.dismiss}
            </button>
            <button
              onClick={handleInstallClick}
              className="flex-2 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download size={14} />
              <span>{t.btnInstall}</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
