import React, { useState, useEffect } from 'react';
import { BrokerPost, WorkerPost, AppLanguage } from '../types';
import { translations } from '../translations';
import { 
  X, User, MapPin, Calendar, Clock, DollarSign, Phone, FileText, 
  Globe, Map, Navigation, Shield, Briefcase, Sparkles, ArrowLeft,
  CheckCircle2, CreditCard, Loader2, Coins, ArrowRight, ExternalLink, Copy, Check,
  Settings, Info
} from 'lucide-react';
import { addDoc, collection, getDocs } from 'firebase/firestore';
import { db, isFirebaseAvailable } from '../firebase';
import { regionsData, getRegionName } from '../data/regions';

const defaultJobRoles = [
  { id: 'role-delivery', bn: 'ডেলিভারি ম্যান / রাইডার', en: 'Delivery Rider / Partner', hi: 'डिलीवरी राइडर' },
  { id: 'role-factory', bn: 'কারখানার কর্মী / ফ্যাক্টরি হ্যান্ড', en: 'Factory Hand / Worker', hi: 'फैक्ट्री कर्मचारी' },
  { id: 'role-tailor', bn: 'দর্জি / গার্মেন্টস কর্মী', en: 'Tailor / Garment Worker', hi: 'दर्जी / गारमेंट कर्मचारी' },
  { id: 'role-mason', bn: 'রাজমিস্ত্রি', en: 'Mason / Bricklayer', hi: 'राजमिस्त्री' },
  { id: 'role-helper', bn: 'হেল্পার / জোগালদার', en: 'Mason Helper / Laborer', hi: 'हेल्पर' },
  { id: 'role-painter', bn: 'রঙের মিস্ত্রি / পেইন্টার', en: 'Painter', hi: 'पेंटर / रंगसाज' },
  { id: 'role-carpenter', bn: 'কাঠমিস্ত্রি', en: 'Carpenter', hi: 'बढ़ई' },
  { id: 'role-electrician', bn: 'ইলেকট্রিশিয়ান', en: 'Electrician', hi: 'बिजली मिस्त्री' },
  { id: 'role-plumber', bn: 'প্লাম্বার', en: 'Plumber', hi: 'नलसाज / प्लंबर' },
  { id: 'role-driver', bn: 'ড্রাইভার (কার/ট্রাক/অটো)', en: 'Driver (Car/Truck/Auto)', hi: 'ड्राइवर' },
  { id: 'role-security', bn: 'সিকিউরিটি গার্ড', en: 'Security Guard', hi: 'सुरक्षा गार्ड' },
  { id: 'role-cleaner', bn: 'ক্লিনার / ঝাড়ুদার', en: 'Cleaner / Janitor', hi: 'सफाई कर्मचारी' },
  { id: 'role-cook', bn: 'বাবুর্চি / শেফ', en: 'Cook / Chef', hi: 'रसोइया' },
  { id: 'role-maid', bn: 'গৃহকর্মী / কাজের লোক', en: 'Maid / Housekeeper', hi: 'घरेलू कामगार' }
];

interface BrokerPostFormProps {
  lang: AppLanguage;
  onClose: () => void;
  onSuccess: () => void;
}

// Custom original logo components with precise SVG pathing
const PhonePeLogo = () => (
  <div className="flex items-center gap-1">
    <svg className="w-5 h-5" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="22" fill="#5f259f" />
      {/* PhonePe Syllable Symbol */}
      <path d="M48.2 18H31v54h11.5V56.2H48c12.2 0 19.3-6.5 19.3-19.1C67.3 24.5 60.4 18 48.2 18zm-5.7 10.2h5.1c5.2 0 8 2.2 8 8.1 0 5.8-2.8 8.1-8 8.1h-5.1V28.2z" fill="white" />
      <path d="M68.5 48.5c-3.1 0-5.5 2.5-5.5 5.5s2.5 5.5 5.5 5.5 5.5-2.5 5.5-5.5-2.4-5.5-5.5-5.5z" fill="#00baf2" />
    </svg>
    <span className="text-xs font-black tracking-tight text-[#5f259f]">PhonePe</span>
  </div>
);

const GooglePayLogo = () => (
  <div className="flex items-center gap-1.5">
    <svg className="w-12 h-5" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Multi-colored interlocking shapes representing G Pay */}
      <path d="M12.5 20C12.5 13.5 17.5 8.5 24 8.5C27.2 8.5 30 9.8 32 11.8L38 5.8C34.2 2.2 29.4 0 24 0C10.8 0 0 10.8 0 24C0 37.2 10.8 48 24 48C34.5 48 43.5 40 43.5 24C43.5 22.5 43.3 21.2 43 20H12.5Z" fill="#4285F4" />
      <path d="M48 10h12v6H48z" fill="#EA4335" />
      <path d="M64 10h12v6H64z" fill="#FBBC05" />
      <path d="M80 10h12v6H80z" fill="#34A853" />
      <text x="96" y="24" fill="#5f6368" fontSize="20" fontWeight="900" fontFamily="sans-serif">Pay</text>
    </svg>
  </div>
);

const formatUPIForDisplay = (upi: string) => {
  if (!upi) return '';
  const parts = upi.split('@');
  if (parts.length === 2) {
    const handle = parts[0];
    const provider = parts[1];
    // Mask the middle part of a 10-digit number (mobile number)
    if (/^\d{10}$/.test(handle)) {
      return `${handle.slice(0, 3)}******${handle.slice(9)}@${provider}`;
    } else if (/^\d+$/.test(handle) && handle.length >= 8) {
      return `${handle.slice(0, 3)}******${handle.slice(-1)}@${provider}`;
    } else if (handle.length > 5) {
      return `${handle.slice(0, 2)}***${handle.slice(-2)}@${provider}`;
    }
  }
  return upi;
};

export default function BrokerPostForm({ lang, onClose, onSuccess }: BrokerPostFormProps) {
  const t = translations[lang] || translations['bn'];

  // Flatten all states/divisions from regionsData
  const allStates = regionsData.flatMap((c) =>
    c.states.map((s) => ({
      ...s,
      countryId: c.id,
      countryFlag: c.flag,
      countryNameBn: c.nameBn,
      countryNameEn: c.nameEn,
    }))
  );

  // Form states
  const [name, setName] = useState('');
  const [agency, setAgency] = useState('');
  const [phone, setPhone] = useState(() => {
    const saved = localStorage.getItem('app_user_phone');
    return (saved && saved !== 'guest_user') ? saved : '';
  });
  const [workerTypes, setWorkerTypes] = useState('');
  const [experience, setExperience] = useState('');
  const [description, setDescription] = useState('');
  const [maxJobsToBroker, setMaxJobsToBroker] = useState<number>(3);
  const [selectedJobTitles, setSelectedJobTitles] = useState<string[]>([]);
  const [liveJobs, setLiveJobs] = useState<string[]>([]);
  const [isOpenJobsSelector, setIsOpenJobsSelector] = useState(false);

  useEffect(() => {
    const fetchLiveJobs = async () => {
      const titles = new Set<string>();
      if (isFirebaseAvailable) {
        try {
          const querySnapshot = await getDocs(collection(db, 'job_posts'));
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data && data.title) {
              titles.add(data.title);
            }
          });
        } catch (err) {
          console.warn("Could not query live jobs for broker selection:", err);
        }
      }
      try {
        const local = localStorage.getItem('local_job_posts');
        if (local) {
          const parsed = JSON.parse(local);
          parsed.forEach((j: any) => {
            if (j && j.title) titles.add(j.title);
          });
        }
      } catch (err) {
        console.error("Could not load local jobs backup:", err);
      }
      setLiveJobs(Array.from(titles));
    };
    fetchLiveJobs();
  }, []);

  useEffect(() => {
    if (selectedJobTitles.length > 0) {
      setWorkerTypes(selectedJobTitles.join(', '));
      setMaxJobsToBroker(selectedJobTitles.length);
    } else {
      setWorkerTypes('');
      setMaxJobsToBroker(1);
    }
  }, [selectedJobTitles]);

  // Hierarchical Location states
  const [country, setCountry] = useState(() => {
    return localStorage.getItem('app_onboarding_country') || '';
  });
  const [customCountry, setCustomCountry] = useState(() => {
    const obCountry = localStorage.getItem('app_onboarding_country');
    if (obCountry && obCountry !== 'other') return '';
    return '';
  });
  const [state, setState] = useState(() => {
    return localStorage.getItem('app_onboarding_state') || '';
  });
  const [customState, setCustomState] = useState('');
  const [district, setDistrict] = useState(() => {
    return localStorage.getItem('app_onboarding_district') || '';
  });
  const [customDistrict, setCustomDistrict] = useState('');

  // Status & Step states
  const [step, setStep] = useState<'form' | 'payment'>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<'phonepe' | 'gpay'>('phonepe');
  const [utrNumber, setUtrNumber] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [copied, setCopied] = useState(false);
  const [paymentStatusText, setPaymentStatusText] = useState('');

  // Robust 5-minute countdown and server verification polling states
  const [isPendingVerification, setIsPendingVerification] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(300);
  const [pollingOrderId, setPollingOrderId] = useState('');
  const [lastCheckedUtr, setLastCheckedUtr] = useState('');

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Polling Effect for 5-minute Countdown and Live Verification
  useEffect(() => {
    let timerId: any = null;
    let pollId: any = null;

    if (isPendingVerification && lastCheckedUtr && pollingOrderId) {
      // Countdown timer decrement
      timerId = setInterval(() => {
        setCountdownSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerId);
            // Do NOT stop polling or verification. Instead, update the status message as requested by the user.
            setPaymentStatusText(
              lang === 'bn'
                ? 'দয়া করে অপেক্ষা করবেন, আমাদের সিস্টেম আপনার পেমেন্টটিকে চেক করতেছে...'
                : 'Please wait, our system is checking your payment...'
            );
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Background polling every 5 seconds to robustly check server state
      let pollCount = 0;
      pollId = setInterval(() => {
        pollCount += 1;
        pollVerifyUtr(lastCheckedUtr, pollingOrderId, pollCount);
      }, 5000);
    }

    return () => {
      if (timerId) clearInterval(timerId);
      if (pollId) clearInterval(pollId);
    };
  }, [isPendingVerification, pollingOrderId, lastCheckedUtr]);

  const pollVerifyUtr = async (utr: string, orderId: string, count: number) => {
    try {
      const response = await fetch('/api/verify-utr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          utr,
          amount: paymentAmount,
          phone: phone,
          brokerId: 'new_signup',
          brokerName: name,
          paymentMethod: paymentMethod,
          orderId
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Success! Immediately stop the pending countdown
        setIsPendingVerification(false);
        setIsPaying(false);
        setProfileName(name);
        setPaymentSuccess(true);
      } else if (!response.ok) {
        // If there's a permanent rejection like double-spend, stop immediately
        if (data.error && (data.error.includes('already been used') || data.error.includes('conflict'))) {
          setIsPendingVerification(false);
          setIsPaying(false);
          setErrorMessage(
            lang === 'bn'
              ? (data.errorBn || '❌ পেমেন্ট যাচাইকরণ ব্যর্থ হয়েছে। সঠিক ও নতুন UTR লিখুন।')
              : (data.error || '❌ Payment verification failed.')
          );
        }
      } else {
        // response is ok (200), but success is false. It means it is "pending" (waiting for Admin Approval)
        if (data.status === 'pending') {
          if (countdownSeconds > 0) {
            setPaymentStatusText(
              lang === 'bn'
                ? `⏳ এডমিন ভেরিফিকেশনের জন্য অপেক্ষমান... (চেক নং ${count})\nএডমিন আপনার পেমেন্টটি যাচাই করে একসেপ্ট করা মাত্রই আপনার প্রোফাইল অ্যাক্টিভ হয়ে যাবে। অনুগ্রহ করে অপেক্ষা করুন।`
                : `⏳ Waiting for admin manual verification... (Check #${count})\nYour profile will automatically unlock once the admin approves your payment. Please wait.`
            );
          } else {
            setPaymentStatusText(
              lang === 'bn'
                ? 'দয়া করে অপেক্ষা করবেন, আমাদের সিস্টেম আপনার পেমেন্টটিকে চেক করতেছে...'
                : 'Please wait, our system is checking your payment...'
            );
          }
        } else if (data.status === 'rejected') {
          setIsPendingVerification(false);
          setIsPaying(false);
          setErrorMessage(
            lang === 'bn'
              ? (data.errorBn || '❌ পেমেন্টটি এডমিন দ্বারা বাতিল করা হয়েছে। দয়া করে সঠিক UTR দিয়ে পুনরায় চেষ্টা করুন।')
              : (data.error || '❌ Payment rejected by Admin.')
          );
        }
      }
    } catch (err) {
      console.error("Polling verify-utr error:", err);
    }
  };

  const handleTimeout = async (orderId: string, utr: string) => {
    setIsPaying(false);
    setErrorMessage(
      lang === 'bn'
        ? '⏳ ৫ মিনিট সময় শেষ হয়েছে। এডমিন পেমেন্টটি এখনও ম্যানুয়ালি একসেপ্ট করেননি। দয়া করে সঠিক UTR দিয়েছেন কিনা তা নিশ্চিত করুন এবং পুনরায় ট্রাই করুন বা এডমিনের সাথে যোগাযোগ করুন।'
        : '⏳ 5-minute timeout reached. The admin has not verified/accepted your payment yet. Please ensure you provided the correct UTR and try again.'
    );
    if (orderId) {
      try {
        await fetch('/api/verify-utr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            utr,
            amount: paymentAmount,
            phone: phone,
            brokerId: 'new_signup',
            brokerName: name,
            paymentMethod: paymentMethod,
            orderId,
            isTimeout: true
          })
        });
      } catch (e) {
        console.error("Error logging timeout on server:", e);
      }
    }
  };

  const [targetUPI, setTargetUPI] = useState(() => {
    return localStorage.getItem('payment_upi_id') || '8167306361@ybl';
  });
  const [displayMerchantName, setDisplayMerchantName] = useState(() => {
    return localStorage.getItem('payment_merchant_name') || 'Bharat ka Kaam';
  });
  const [paymentAmount, setPaymentAmount] = useState(() => {
    return localStorage.getItem('payment_amount') || '49';
  });

  // Settings editing state
  const [showSettings, setShowSettings] = useState(false);
  const [tempUPI, setTempUPI] = useState(targetUPI);
  const [tempName, setTempName] = useState(displayMerchantName);
  const [tempAmount, setTempAmount] = useState(paymentAmount);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempUPI.trim() || !tempName.trim() || !tempAmount.trim()) {
      return;
    }
    setTargetUPI(tempUPI);
    setDisplayMerchantName(tempName);
    setPaymentAmount(tempAmount);
    localStorage.setItem('payment_upi_id', tempUPI);
    localStorage.setItem('payment_merchant_name', tempName);
    localStorage.setItem('payment_amount', tempAmount);
    setShowSettings(false);
  };

  const copyUPI = () => {
    try {
      navigator.clipboard.writeText(targetUPI);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy UPI: ", err);
    }
  };

  const triggerUPIPayment = () => {
    const upiLink = `upi://pay?pa=${targetUPI}&pn=${encodeURIComponent(displayMerchantName)}&am=${paymentAmount}&tn=BrokerActivation&cu=INR`;
    
    let intentLink = upiLink;
    if (paymentMethod === 'phonepe') {
      intentLink = `phonepe://pay?pa=${targetUPI}&pn=${encodeURIComponent(displayMerchantName)}&am=${paymentAmount}&tn=BrokerActivation&cu=INR`;
    } else if (paymentMethod === 'gpay') {
      intentLink = `gpay://upi/pay?pa=${targetUPI}&pn=${encodeURIComponent(displayMerchantName)}&am=${paymentAmount}&tn=BrokerActivation&cu=INR`;
    }

    try {
      window.location.href = intentLink;
    } catch (err) {
      console.error("Deep link trigger failed, falling back to window.open", err);
      try {
        window.open(intentLink, '_self');
      } catch (innerErr) {
        console.error("All payment trigger mechanisms failed:", innerErr);
      }
    }
  };

  // Submits the form data check, then opens the payment gateway
  const handleNextToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Simple validation
    if (!name || !phone || !experience || !description) {
      setErrorMessage(t.errorFillAll || 'Please fill in all fields.');
      return;
    }

    // Location validation
    if (!country) {
      setErrorMessage(
        lang === 'bn'
          ? 'অনুগ্রহ করে দেশ সিলেক্ট করুন।'
          : lang === 'hi'
            ? 'कृपया देश चुनें।'
            : 'Please select Country.'
      );
      return;
    }
    if (country === 'other' && !customCountry.trim()) {
      setErrorMessage(
        lang === 'bn'
          ? 'অনুগ্রহ করে আপনার দেশের নাম লিখুন।'
          : lang === 'hi'
            ? 'कृपया अपने देश का नाम दर्ज करें।'
            : 'Please enter your Country name.'
      );
      return;
    }

    if (!state) {
      setErrorMessage(
        lang === 'bn'
          ? 'অনুগ্রহ করে রাজ্য / বিভাগ সিলেক্ট করুন।'
          : lang === 'hi'
            ? 'कृपया राज्य चुनें।'
            : 'Please select State / Division.'
      );
      return;
    }
    if (state === 'other' && !customState.trim()) {
      setErrorMessage(
        lang === 'bn'
          ? 'অনুগ্রহ করে আপনার রাজ্য/বিভাগের নাম লিখুন।'
          : lang === 'hi'
            ? 'कृपया अपने राज्य का नाम दर्ज करें।'
            : 'Please enter your State/Division name.'
      );
      return;
    }

    if (!district) {
      setErrorMessage(
        lang === 'bn'
          ? 'অনুগ্রহ করে জেলা / শহর সিলেক্ট করুন।'
          : lang === 'hi'
            ? 'कृपया जिला चुनें।'
            : 'Please select District / City.'
      );
      return;
    }
    if (district === 'other' && !customDistrict.trim()) {
      setErrorMessage(
        lang === 'bn'
          ? 'অনুগ্রহ করে আপনার জেলা/শহরের নাম লিখুন।'
          : lang === 'hi'
            ? 'कृपया अपने जिले का नाम दर्ज करें।'
            : 'Please enter your District/City name.'
      );
      return;
    }

    setStep('payment');
  };

  const handleVerifyUTR = async () => {
    setErrorMessage('');
    const cleanUTR = utrNumber.replace(/\s+/g, '');
    if (!cleanUTR || cleanUTR.length !== 12 || !/^\d+$/.test(cleanUTR)) {
      setErrorMessage(
        lang === 'bn'
          ? 'অনুগ্রহ করে সঠিক ১২ ডিজিটের UTR নম্বরটি লিখুন।'
          : lang === 'hi'
            ? 'कृपया सही 12 अंकों का UTR नंबर दर्ज करें।'
            : 'Please enter a valid 12-digit UTR number.'
      );
      return;
    }

    setIsPaying(true);
    setPaymentStatusText(
      lang === 'bn' 
        ? 'ভারত কা কাজ পেমেন্ট লেজার অনুসন্ধান করা হচ্ছে...' 
        : lang === 'hi'
          ? 'भारत का काम भुगतान खाता बही खोजी जा रही है...'
          : 'Searching Bharat ka Kaam payment settlement logs...'
    );

    try {
      // Step 1: Query server-side verification endpoint
      await new Promise((resolve) => setTimeout(resolve, 600));
      setPaymentStatusText(
        lang === 'bn' 
          ? `UTR ${cleanUTR} এর বিপরীতে ন্যাশনাল পেমেন্ট গেটওয়ে (NPCI) যাচাই করা হচ্ছে...` 
          : lang === 'hi'
            ? `नेशनल पेमेंट्स गेटवे (NPCI) के साथ UTR ${cleanUTR} का सत्यापन किया जा रहा है...`
            : `Verifying UTR ${cleanUTR} with National Payments Gateway (NPCI)...`
      );

      const generatedOrderId = "BKK-" + Math.floor(100000 + Math.random() * 900000).toString();

      const response = await fetch('/api/verify-utr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          utr: cleanUTR,
          amount: paymentAmount,
          phone: phone,
          brokerId: 'new_signup',
          brokerName: name,
          paymentMethod: paymentMethod,
          orderId: generatedOrderId
        })
      });

      const data = await response.json();

      // Case A: Immediately success (SMS already synced)
      if (response.ok && data.success) {
        setPaymentStatusText(
          lang === 'bn' 
            ? `${targetUPI.split('@')[0]} অ্যাকাউন্টে ${paymentAmount} টাকা প্রাপ্তি সফলভাবে নিশ্চিত করা হয়েছে!` 
            : lang === 'hi'
              ? `${targetUPI.split('@')[0]} खाते पर ${paymentAmount} रुपये की प्राप्ति सफलतापूर्वक पुष्ट की गई!`
              : `Receipt of ${paymentAmount} INR successfully confirmed on ${targetUPI.split('@')[0]} account!`
        );

        await new Promise((resolve) => setTimeout(resolve, 400));
        setIsPaying(false);
        setProfileName(name);
        setPaymentSuccess(true);
        return;
      }

      // Case B: Pending Admin Approval (Start countdown and background polling)
      if (response.ok && data.status === 'pending') {
        setPollingOrderId(generatedOrderId);
        setLastCheckedUtr(cleanUTR);
        setCountdownSeconds(300); // 5 minutes
        setIsPendingVerification(true);
        setPaymentStatusText(
          lang === 'bn'
            ? '⏳ আপনার UTR নম্বরটি সফলভাবে জমা দেওয়া হয়েছে। এডমিন ম্যানুয়ালি এটি ভেরিফাই করে একসেপ্ট করা মাত্রই আপনার প্রোফাইলটি চালু হয়ে যাবে। অনুগ্রহ করে অপেক্ষা করুন...'
            : '⏳ Your UTR number has been submitted successfully. As soon as the admin manually verifies and accepts it, your profile will be activated. Please wait...'
        );
        return;
      }

      // Case C: Hard error
      setIsPaying(false);
      setErrorMessage(
        lang === 'bn'
          ? (data.errorBn || 'পেমেন্ট যাচাইকরণ ব্যর্থ হয়েছে। সঠিক ও নতুন UTR নম্বর লিখুন।')
          : lang === 'hi'
            ? (data.errorHi || 'भुगतान सत्यापन विफल रहा। कृपया सही और नया UTR दर्ज करें।')
            : (data.error || 'Payment verification failed. Please enter a valid and unused UTR number.')
      );
    } catch (err) {
      console.error("UTR validation api error:", err);
      setIsPaying(false);
      setErrorMessage(
        lang === 'bn'
          ? 'সার্ভার সংযোগে ত্রুটি। অনুগ্রহ করে আবার চেষ্টা করুন।'
          : lang === 'hi'
            ? 'सर्वर कनेक्शन त्रुटि। कृपया पुनः प्रयास करें।'
            : 'Server connection error. Please try again.'
      );
    }
  };

  const handleSaveProfile = async () => {
    if (!profileName.trim()) {
      setErrorMessage(
        lang === 'bn' 
          ? 'অনুগ্রহ করে প্রোফাইলের নাম লিখুন।' 
          : 'Please enter a profile name.'
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    const startTime = Date.now();

    const countryName = getRegionName('country', country, lang, customCountry);
    const stateName = getRegionName('state', state, lang, customState);
    const districtName = getRegionName('district', district, lang, customDistrict);
    const builtLocation = `${districtName}, ${stateName}, ${countryName}`;

    const newBroker: BrokerPost = {
      name: profileName,
      agency: agency.trim() || undefined,
      phone,
      location: builtLocation,
      country,
      customCountry: country === 'other' ? customCountry.trim() : undefined,
      state,
      customState: state === 'other' ? customState.trim() : undefined,
      district,
      customDistrict: district === 'other' ? customDistrict.trim() : undefined,
      workerTypes,
      experience,
      description,
      utrVerified: utrNumber.replace(/\s+/g, ''),
      maxJobsToBroker,
      selectedJobs: selectedJobTitles,
      subscribedUntil: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days premium subscription
      lastPaymentDate: Date.now(),
      createdAt: Date.now()
    };

    let brokerId = 'b-' + Date.now();

    // 1. Instantly save to LocalStorage to make it instantly active/public
    try {
      const local = localStorage.getItem('local_broker_posts');
      const parsed = local ? JSON.parse(local) : [];
      if (!parsed.some((b: any) => b.id === brokerId || b.phone === phone)) {
        parsed.push({ ...newBroker, id: brokerId });
        localStorage.setItem('local_broker_posts', JSON.stringify(parsed));
      }
    } catch (localErr) {
      console.error("Could not write to local storage backup:", localErr);
    }

    // 2. Instantly dispatch event to trigger UI refresh everywhere immediately
    window.dispatchEvent(new Event('local_storage_posts_updated'));

    // 3. Save to Cloud Firestore
    if (isFirebaseAvailable) {
      try {
        const firestoreBroker = JSON.parse(JSON.stringify(newBroker));
        await addDoc(collection(db, 'broker_posts'), firestoreBroker);
      } catch (dbErr) {
        console.error("Firestore database write failed:", dbErr);
      }
    }

    // 4. Run worker matching and system notifications
    try {
      let allWorkers: WorkerPost[] = [];

      // Fetch workers from firestore
      if (isFirebaseAvailable) {
        try {
          const querySnapshot = await getDocs(collection(db, 'worker_posts'));
          querySnapshot.forEach((doc) => {
            allWorkers.push({ id: doc.id, ...doc.data() } as WorkerPost);
          });
        } catch (err) {
          console.warn("Could not query workers from firestore, using local backup:", err);
        }
      }

      // Merge with local storage workers
      try {
        const local = localStorage.getItem('local_worker_posts');
        if (local) {
          const parsed = JSON.parse(local);
          allWorkers = [...parsed, ...allWorkers];
        }
      } catch (err) {
        console.error("Could not load local workers backup:", err);
      }

      // Deduplicate by id/phone
      const uniqueWorkers = allWorkers.reduce((acc, current) => {
        const exists = acc.find(item => item.phone === current.phone || item.id === current.id);
        if (!exists) acc.push(current);
        return acc;
      }, [] as WorkerPost[]);

      // Check keywords match
      const brokerSkillsWords = workerTypes.toLowerCase().split(/[,\s।/&-]+/).filter(w => w.trim().length > 1);
      
      const matchedWorkers = uniqueWorkers.filter(worker => {
        const workerText = (worker.skills + ' ' + worker.about).toLowerCase();
        return brokerSkillsWords.some(word => workerText.includes(word));
      });

      const hasMatches = matchedWorkers.length > 0;
      const matchedNames = matchedWorkers.slice(0, 3).map(w => w.name).join(', ') + (matchedWorkers.length > 3 ? '...' : '');

      // Create Custom System Notification
      const notifId = `notif-db-${Date.now()}`;
      const newNotif = {
        id: notifId,
        title: lang === 'bn' 
          ? `📢 নতুন প্রিমিয়াম দালাল অ্যাকাউন্ট অ্যাক্টিভ!` 
          : lang === 'hi'
            ? `📢 नया प्रीमियम ब्रोकर सक्रिय!`
            : `📢 New Premium Broker Active!`,
        text: lang === 'bn'
          ? `দালাল ${profileName} ${agency ? `(${agency})` : ''} ${paymentAmount} টাকা সাবস্ক্রিপশন সম্পন্ন করেছেন। তিনি "${workerTypes}" কর্মী সরবরাহ করতে প্রস্তুত। যোগাযোগ করুন: ${phone}।${hasMatches ? ` উপযুক্ত কর্মী (${matchedNames}) দের জন্য ম্যাচিং নোটিফিকেশন পাঠানো হয়েছে।` : ''}`
          : lang === 'hi'
            ? `ब्रोकर ${profileName} ${agency ? `(${agency})` : ''} ने ${paymentAmount} रुपये का सब्सक्रिप्शन पूरा कर लिया है। वे "${workerTypes}" कामगार प्रदान करने के लिए तैयार हैं। संपर्क करें: ${phone}।`
            : `Broker ${profileName} ${agency ? `(${agency})` : ''} activated account with ${paymentAmount} INR. Supplies "${workerTypes}". Phone: ${phone}.`,
        time: lang === 'bn' ? 'এইমাত্র' : lang === 'hi' ? 'अभी-अभी' : 'Just now',
        read: false,
        createdAt: Date.now()
      };

      // Save notification to Firestore
      if (isFirebaseAvailable) {
        try {
          await addDoc(collection(db, 'notifications'), newNotif);
        } catch (dbNotifErr) {
          console.error("Could not save matching notification to firestore:", dbNotifErr);
        }
      }
    } catch (notifErr) {
      console.error("Notification trigger step failed: ", notifErr);
    }

    // 5. Short precise delay to make total loading time exactly 2 seconds
    const elapsed = Date.now() - startTime;
    const remainingDelay = Math.max(0, 2000 - elapsed);
    if (remainingDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, remainingDelay));
    }

    setIsSubmitting(false);
    
    // Save registered broker credentials to log them in automatically in the app session
    localStorage.setItem('app_user_name', profileName);
    localStorage.setItem('app_user_phone', phone);
    localStorage.setItem('app_user_logged_in', 'true');
    localStorage.setItem('app_onboarding_completed', 'true');
    window.dispatchEvent(new Event('app_user_profile_updated'));

    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden my-8 max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-500 to-indigo-600 p-6 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {step === 'payment' && !paymentSuccess && !isPaying && (
              <button
                type="button"
                onClick={() => setStep('form')}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 mr-1 transition-colors cursor-pointer select-none"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <div className="p-2 bg-white/20 rounded-xl">
              <Shield size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">
                {step === 'form' 
                  ? (lang === 'bn' ? 'দালাল / এজেন্ট অ্যাকাউন্ট খুলুন' : 'Register Broker / Agent')
                  : (lang === 'bn' ? 'দালাল অ্যাকাউন্ট অ্যাক্টিভেশন' : 'Broker Profile Activation')}
              </h2>
              <p className="text-[10px] text-white/80 font-semibold uppercase tracking-wider mt-0.5">
                {step === 'form'
                  ? (lang === 'bn' ? 'কর্মী সরবরাহ করার জন্য রেজিস্ট্রেশন' : 'Register for supplying workers')
                  : (lang === 'bn' ? 'প্রিমিয়াম সাবস্ক্রিপশন ও নোটিফিকেশন' : 'Premium subscription & notification')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer select-none"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content - Scrollable area */}
        <div className="overflow-y-auto flex-1 flex flex-col">
          {step === 'form' ? (
            <form onSubmit={handleNextToPayment} className="p-6 space-y-4 text-left">
              {errorMessage && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-2">
                  ⚠️ {errorMessage}
                </div>
              )}

              {/* Broker Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  {lang === 'bn' ? 'দালালের / এজেন্টের নাম' : lang === 'hi' ? 'दलाल / एजेंट का नाम' : 'Broker / Agent Name'} *
                </label>
                <div className="relative">
                  <User size={14} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={lang === 'bn' ? 'যেমন: আব্দুর রহমান' : 'e.g. Abdur Rahman'}
                    className="w-full pl-9.5 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl text-xs font-bold text-slate-800 outline-none transition-all focus:bg-white"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-1">
                <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  {lang === 'bn' ? 'মোবাইল নম্বর' : lang === 'hi' ? 'मोबाइल नंबर' : 'Phone Number'} *
                </label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={lang === 'bn' ? 'যেমন: ০১৭১১XXXXXX' : 'e.g. 01711XXXXXX'}
                    readOnly={!!localStorage.getItem('app_user_phone') && localStorage.getItem('app_user_phone') !== 'guest_user'}
                    className="w-full pl-9.5 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl text-xs font-bold text-slate-800 outline-none transition-all focus:bg-white read-only:bg-slate-100/60 read-only:text-slate-500 read-only:cursor-not-allowed"
                  />
                </div>
                {localStorage.getItem('app_user_phone') && localStorage.getItem('app_user_phone') !== 'guest_user' && (
                  <p className="text-[9.5px] text-emerald-600 font-extrabold mt-1.5 flex items-center gap-1">
                    <span>✓</span>
                    <span>{lang === 'bn' ? 'আপনার ভেরিফাইড অ্যাকাউন্ট নম্বরটি স্থায়ীভাবে লিংক করা হয়েছে।' : 'Your verified account number is permanently linked.'}</span>
                  </p>
                )}
              </div>

              {/* Select Brokered Jobs Selector (1 to 3 jobs limit) */}
              <div className="space-y-2">
                <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider block leading-normal">
                  {lang === 'bn' 
                    ? 'দালালি করার জন্য এক থেকে তিনটি কাজ বেছে নিতে হবে এই তিনটি কাজের উপর আপনি দালালি করতে পারবেন *' 
                    : lang === 'hi' 
                      ? 'दलाली करने के लिए एक से तीन काम चुनने होंगे, आप इन तीन कामों पर दलाली कर सकेंगे *' 
                      : 'Choose 1 to 3 jobs for brokering (You can broker on these three jobs) *'}
                </label>
                
                {/* Selected Jobs Badges */}
                <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 bg-slate-50 border border-slate-200 rounded-xl items-center">
                  {selectedJobTitles.length === 0 ? (
                    <span className="text-[11px] font-bold text-slate-400 italic px-2">
                      {lang === 'bn' ? '• কোনো কাজ সিলেক্ট করা হয়নি (নিচের লিস্ট থেকে সিলেক্ট করুন)' : lang === 'hi' ? '• कोई कार्य नहीं चुना गया (नीचे से चुनें)' : '• No jobs selected yet (click from list below)'}
                    </span>
                  ) : (
                    selectedJobTitles.map((job) => (
                      <span 
                        key={job} 
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-50 border border-rose-100 text-rose-700 rounded-lg text-xs font-black shadow-xs animate-scale-up"
                      >
                        {job}
                        <button
                          type="button"
                          onClick={() => setSelectedJobTitles(prev => prev.filter(t => t !== job))}
                          className="w-4 h-4 rounded-full bg-rose-200/50 hover:bg-rose-200 text-rose-800 flex items-center justify-center text-[9px] cursor-pointer"
                        >
                          ✕
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {/* Available Jobs list wrapper */}
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  <button
                    type="button"
                    onClick={() => setIsOpenJobsSelector(!isOpenJobsSelector)}
                    className="w-full px-4 py-2 bg-slate-50 hover:bg-slate-100/70 border-b border-slate-200 text-left flex items-center justify-between text-xs font-black text-slate-700 cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5 text-teal-600">
                      <Briefcase size={14} />
                      {lang === 'bn' 
                        ? `কাজের লিস্ট দেখুন (${defaultJobRoles.length + liveJobs.length}টি কাজ উপলব্ধ)` 
                        : lang === 'hi' 
                          ? `कार्य सूची देखें` 
                          : `View Available Jobs (${defaultJobRoles.length + liveJobs.length} roles)`}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold bg-white px-2 py-0.5 border border-slate-200 rounded-md">
                      {isOpenJobsSelector ? (lang === 'bn' ? 'বন্ধ করুন' : 'Close') : (lang === 'bn' ? 'খুলুন' : 'Open')}
                    </span>
                  </button>

                  {isOpenJobsSelector && (
                    <div className="p-3 max-h-[180px] overflow-y-auto space-y-3 bg-slate-50/50 animate-fade-in text-xs">
                      {/* Live Jobs Section if any */}
                      {liveJobs.length > 0 && (
                        <div>
                          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                            <Sparkles size={10} className="text-amber-500" />
                            {lang === 'bn' ? 'পাবলিক পোস্ট করা কাজ (Live Jobs)' : 'Live Job Postings'}
                          </p>
                          <div className="grid grid-cols-2 gap-1.5">
                            {liveJobs.map((job) => {
                              const isSelected = selectedJobTitles.includes(job);
                              return (
                                <button
                                  key={job}
                                  type="button"
                                  onClick={() => {
                                    if (isSelected) {
                                      setSelectedJobTitles(prev => prev.filter(t => t !== job));
                                    } else {
                                      if (selectedJobTitles.length >= 3) {
                                        alert(lang === 'bn' ? 'দুঃখিত, আপনি একই সাথে সর্বোচ্চ ৩টি কাজ সিলেক্ট করতে পারবেন।' : 'Sorry, you can select up to 3 jobs maximum.');
                                        return;
                                      }
                                      setSelectedJobTitles(prev => [...prev, job]);
                                    }
                                  }}
                                  className={`px-2 py-2 text-left rounded-lg border font-bold text-[11px] transition-all cursor-pointer ${
                                    isSelected 
                                      ? 'bg-rose-600 border-rose-600 text-white shadow-xs' 
                                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                                  }`}
                                >
                                  {job}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Standard Jobs Section */}
                      <div>
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
                          {lang === 'bn' ? 'স্ট্যান্ডার্ড কাজের তালিকা' : 'Standard Job Categories'}
                        </p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {defaultJobRoles.map((role) => {
                            const titleStr = role[lang] || role['bn'];
                            const isSelected = selectedJobTitles.includes(titleStr);
                            return (
                              <button
                                key={role.id}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    setSelectedJobTitles(prev => prev.filter(t => t !== titleStr));
                                  } else {
                                    if (selectedJobTitles.length >= 3) {
                                      alert(lang === 'bn' ? 'দুঃখিত, আপনি একই সাথে সর্বোচ্চ ৩টি কাজ সিলেক্ট করতে পারবেন।' : 'Sorry, you can select up to 3 jobs maximum.');
                                      return;
                                    }
                                    setSelectedJobTitles(prev => [...prev, titleStr]);
                                  }
                                }}
                                className={`px-2 py-2 text-left rounded-lg border font-bold text-[11px] transition-all cursor-pointer ${
                                  isSelected 
                                    ? 'bg-rose-600 border-rose-600 text-white shadow-xs' 
                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                                }`}
                              >
                                {titleStr}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Work Description / Experience Details */}
              <div className="space-y-1">
                <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  {lang === 'bn' ? 'আপনার সার্ভিস বা কাজের বিবরণ' : lang === 'hi' ? 'आपके काम का विवरण' : 'Service Description / Work Details'} *
                </label>
                <div className="relative">
                  <FileText size={14} className="absolute left-3.5 top-3 text-slate-400" />
                  <textarea
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    placeholder={lang === 'bn' ? 'আপনার অভিজ্ঞতা ও কি ধরণের কাজ করতে পারেন তা সংক্ষেপে লিখুন...' : 'Write a short summary about your experience and the services you can provide...'}
                    className="w-full pl-9.5 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl text-xs font-bold text-slate-800 outline-none transition-all focus:bg-white resize-none"
                  />
                </div>
              </div>

              {/* Experience */}
              <div className="space-y-1">
                <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  {lang === 'bn' ? 'কত বছরের অভিজ্ঞতা আছে?' : lang === 'hi' ? 'कितने वर्षों का अनुभव है?' : 'Years of Experience'} *
                </label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder={lang === 'bn' ? 'যেমন: ৫ বছর, ১০ বছর...' : 'e.g. 5 Years, 10 Years...'}
                    className="w-full pl-9.5 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl text-xs font-bold text-slate-800 outline-none transition-all focus:bg-white"
                  />
                </div>
              </div>



              {/* Location Input Fields */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/50 space-y-4">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  📍 {lang === 'bn' ? 'কর্মক্ষেত্র এলাকা / ঠিকানা' : 'Sourcing Work Area / Location'} *
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Country Selection */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      🌐 {lang === 'bn' ? 'দেশ' : 'Country'} <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="broker-country-select"
                        value={country}
                        onChange={(e) => {
                          setCountry(e.target.value);
                          setState('');
                          setDistrict('');
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none text-slate-800 text-xs transition-all cursor-pointer"
                        required
                      >
                        <option value="">-- {lang === 'bn' ? 'দেশ সিলেক্ট করুন' : 'Select Country'} --</option>
                        {regionsData.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.flag} {lang === 'bn' ? c.nameBn : c.nameEn}
                          </option>
                        ))}
                        <option value="other">
                          {lang === 'bn' ? 'অন্যান্য দেশ' : 'Other Country'}
                        </option>
                      </select>
                    </div>
                  </div>

                  {/* State Selection */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      🗺️ {lang === 'bn' ? 'রাজ্য / বিভাগ' : 'State / Division'} <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="broker-state-select"
                        value={state}
                        disabled={!country}
                        onChange={(e) => {
                          setState(e.target.value);
                          setDistrict('');
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none text-slate-800 text-xs transition-all disabled:opacity-60 cursor-pointer"
                        required
                      >
                        <option value="">-- {lang === 'bn' ? 'রাজ্য সিলেক্ট করুন' : 'Select State'} --</option>
                        {country !== 'other' && regionsData.find((c) => c.id === country)?.states.map((s) => (
                          <option key={s.id} value={s.id}>
                            {lang === 'bn' ? s.nameBn : s.nameEn}
                          </option>
                        ))}
                        {country && (
                          <option value="other">
                            {lang === 'bn' ? 'অন্যান্য' : 'Other'}
                          </option>
                        )}
                      </select>
                    </div>
                  </div>

                  {/* District Selection */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      🎯 {lang === 'bn' ? 'জেলা / শহর' : 'District / City'} <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="broker-district-select"
                        value={district}
                        disabled={!state}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none text-slate-800 text-xs transition-all disabled:opacity-60 cursor-pointer"
                        required
                      >
                        <option value="">-- {lang === 'bn' ? 'জেলা সিলেক্ট করুন' : 'Select District'} --</option>
                        {country !== 'other' && state !== 'other' && regionsData.find((c) => c.id === country)?.states.find((s) => s.id === state)?.districts.map((d) => (
                          <option key={d.id} value={d.id}>
                            {lang === 'bn' ? d.nameBn : d.nameEn}
                          </option>
                        ))}
                        {state && (
                          <option value="other">
                            {lang === 'bn' ? 'অন্যান্য' : 'Other'}
                          </option>
                        )}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Custom inputs if "Other" is selected */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {country === 'other' && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">
                        {lang === 'bn' ? 'কাস্টম দেশের নাম' : 'Custom Country'}
                      </label>
                      <input
                        id="input-broker-custom-country"
                        type="text"
                        required
                        value={customCountry}
                        onChange={(e) => setCustomCountry(e.target.value)}
                        placeholder={lang === 'bn' ? 'যেমন: বাংলাদেশ' : 'e.g. Bangladesh'}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none text-slate-800 text-xs focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20 transition-all"
                      />
                    </div>
                  )}

                  {state === 'other' && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">
                        {lang === 'bn' ? 'কাস্টম রাজ্য/বিভাগ' : 'Custom State'}
                      </label>
                      <input
                        id="input-broker-custom-state"
                        type="text"
                        required
                        value={customState}
                        onChange={(e) => setCustomState(e.target.value)}
                        placeholder={lang === 'bn' ? 'যেমন: ঢাকা, পশ্চিমবঙ্গ' : 'e.g. Dhaka'}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none text-slate-800 text-xs focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20 transition-all"
                      />
                    </div>
                  )}

                  {district === 'other' && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">
                        {lang === 'bn' ? 'কাস্টম জেলা/শহর' : 'Custom District'}
                      </label>
                      <input
                        id="input-broker-custom-district"
                        type="text"
                        required
                        value={customDistrict}
                        onChange={(e) => setCustomDistrict(e.target.value)}
                        placeholder={lang === 'bn' ? 'যেমন: ঢাকা, কলকাতা' : 'e.g. Dhaka'}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none text-slate-800 text-xs focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20 transition-all"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-rose-500 to-indigo-600 text-white py-4 rounded-2xl text-xs font-black hover:opacity-90 transition-all cursor-pointer select-none text-center shadow-md shadow-indigo-100 uppercase"
              >
                {lang === 'bn' ? 'অ্যাক্টিভেশন ফিস পে করুন' : 'Pay Activation Fees'}
              </button>
            </form>
          ) : (
            /* Payment View Step with Real Google Pay / PhonePe deep link routing and NPCI Verified Settlement checks */
            <div className="p-6 space-y-5 text-left flex-1 flex flex-col justify-between">
              {errorMessage && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-2">
                  ⚠️ {errorMessage}
                </div>
              )}

              {!paymentSuccess ? (
                <>
                  {/* Subscription Info Card */}
                  <div className="bg-amber-50/50 border border-amber-200/60 rounded-3xl p-4.5 text-center space-y-3 relative overflow-hidden shadow-xs">
                    <div className="absolute -right-5 -top-5 w-20 h-20 bg-amber-200/20 rounded-full blur-xl" />
                    <div className="absolute -left-5 -bottom-5 w-20 h-20 bg-indigo-200/20 rounded-full blur-xl" />
                    
                    <div className="inline-flex p-2 bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-xl shadow-md shadow-amber-500/20">
                      <Coins size={20} />
                    </div>
                    
                    <div className="space-y-0.5">
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                        {lang === 'bn' ? 'দালাল অ্যাকাউন্ট অ্যাক্টিভেশন সাবস্ক্রিপশন' : 'Broker Profile Activation Subscription'}
                      </h3>
                      <div className="flex items-center justify-center gap-1.5 mt-1.5">
                        <span className="text-3xl font-black text-slate-900">₹{paymentAmount}</span>
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-md">
                          {lang === 'bn' ? 'একবার মাত্র' : 'One-Time Pay'}
                        </span>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-600 font-bold space-y-1.5 text-left pt-2 border-t border-amber-200/40">
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 text-amber-500 font-bold">🔔</div>
                        <p>{lang === 'bn' ? `আপনি অ্যাকাউন্ট খোলার সাথে সাথে "${workerTypes}" রিলেটেড সকল উপযুক্ত কর্মীদের কাছে অটোমেটিক নোটিফিকেশন চলে যাবে।` : `Instantly alerts all registered matching workers of your active sourcing details.`}</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 text-amber-500 font-bold">📞</div>
                        <p>{lang === 'bn' ? 'সকল রেজিস্টার্ড শ্রমিকদের সাথে সরাসরি যোগাযোগ ও ফোন নম্বর দেখার আনলিমিটেড এক্সেস।' : 'Direct lifetime access to view and dial matching worker contact numbers.'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Methods Tabs with original logos */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                      {lang === 'bn' ? 'পেমেন্ট মাধ্যম সিলেক্ট করুন' : 'Select Payment Method'}
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {/* PhonePe Tab */}
                      <button
                        type="button"
                        onClick={() => {
                          if (!isPaying && !paymentSuccess) setPaymentMethod('phonepe');
                        }}
                        className={`p-3 rounded-2xl border flex items-center justify-center transition-all cursor-pointer select-none ${
                          paymentMethod === 'phonepe'
                            ? 'bg-purple-50/70 border-[#5f259f] ring-2 ring-[#5f259f]/20 shadow-sm'
                            : 'bg-white border-slate-200 hover:border-purple-200'
                         }`}
                      >
                        <PhonePeLogo />
                      </button>

                      {/* Google Pay Tab */}
                      <button
                        type="button"
                        onClick={() => {
                          if (!isPaying && !paymentSuccess) setPaymentMethod('gpay');
                        }}
                        className={`p-3 rounded-2xl border flex items-center justify-center transition-all cursor-pointer select-none ${
                          paymentMethod === 'gpay'
                            ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
                            : 'bg-white border-slate-200 hover:border-blue-200'
                        }`}
                      >
                        <GooglePayLogo />
                      </button>
                    </div>
                  </div>

                  {/* Deep linking details */}
                  <div className="bg-slate-50 border border-slate-200/60 p-4.5 rounded-3xl space-y-4">
                    {showSettings ? (
                      /* Payment Settings Editing Form */
                      <form onSubmit={handleSaveSettings} className="space-y-4 text-left">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                          <div className="flex items-center gap-1.5">
                            <Settings className="text-indigo-600 animate-spin-slow" size={14} />
                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                              {lang === 'bn' ? 'পেমেন্ট গেটওয়ে সেটিংস' : 'Payment Gateway Settings'}
                            </h4>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowSettings(false)}
                            className="p-1 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 transition-colors cursor-pointer"
                          >
                            <X size={12} />
                          </button>
                        </div>

                        {/* Warning/Info Box about personal phone and name in UPI */}
                        <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-2xl flex items-start gap-2 text-indigo-950">
                          <Info className="text-indigo-600 shrink-0 mt-0.5" size={14} />
                          <div className="space-y-1 text-[10px] leading-normal font-semibold">
                            <p className="font-extrabold">
                              {lang === 'bn' 
                                ? '⚠️ নাম ও ফোন নম্বর সংক্রান্ত সতর্কতা:' 
                                : lang === 'hi' 
                                  ? '⚠️ नाम और फ़ोन नंबर संबंधित चेतावनी:' 
                                  : '⚠️ Name & Phone Number Note:'}
                            </p>
                            <p>
                              {lang === 'bn' 
                                ? 'আপনার UPI আইডি পার্সোনাল হওয়ার কারণে (যেমন: 9876543210@ybl) PhonePe/Google Pay ব্যাংক থেকে আপনার ভেরিফাইড নাম (যেমন: Alex Smith) এবং ফোন নম্বর স্বয়ংক্রিয়ভাবে দেখায়।'
                                : lang === 'hi'
                                  ? 'यदि आपकी UPI आईडी एक व्यक्तिगत खाता है (जैसे: 9876543210@ybl), तो PhonePe/Google Pay स्वचालित रूप से आपके पंजीकृत बैंक खाताधारक का नाम (जैसे: Alex Smith) और फ़ोन नंबर प्रदर्शित करता है।'
                                  : 'If your UPI ID is a personal account, PhonePe/Google Pay automatically fetches and displays your registered bank holder name and phone number.'}
                            </p>
                            <p className="mt-1 text-indigo-700 font-extrabold">
                              {lang === 'bn'
                                ? 'পেমেন্টে শুধুমাত্র "Bharat ka Kaam" দেখাতে এবং পার্সোনাল ফোন ও নাম লুকাতে আপনার ব্যাংকের নিজস্ব Merchant / Business UPI ID এখানে বসান।'
                                : lang === 'hi'
                                  ? 'भुगतान में केवल "Bharat ka Kaam" दिखाने और व्यक्तिगत जानकारी छिपाने के लिए, अपना मर्चेंट / बिजनेस UPI आईडी यहां सेट करें।'
                                  : 'To show only "Bharat ka Kaam" and hide personal info, configure your Merchant / Business UPI ID here.'}
                            </p>
                          </div>
                        </div>

                        {/* UPI Name */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                            {lang === 'bn' ? 'পেয়ি (Payee) নাম' : 'Payee Display Name'}
                          </label>
                          <input
                            type="text"
                            required
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            placeholder="e.g. Bharat ka Kaam"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 transition-all"
                          />
                        </div>

                        {/* UPI ID */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                            {lang === 'bn' ? 'UPI আইডি (VPA)' : 'UPI ID (VPA)'}
                          </label>
                          <input
                            type="text"
                            required
                            value={tempUPI}
                            onChange={(e) => setTempUPI(e.target.value)}
                            placeholder="e.g. bharatkakaam@ybl"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 outline-none focus:border-indigo-500 transition-all"
                          />
                        </div>

                        {/* Payment Amount */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                            {lang === 'bn' ? 'পেমেন্ট পরিমাণ (টাকা)' : 'Payment Amount (INR)'}
                          </label>
                          <input
                            type="number"
                            required
                            value={tempAmount}
                            onChange={(e) => setTempAmount(e.target.value)}
                            placeholder="e.g. 49"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 transition-all"
                          />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setShowSettings(false)}
                            className="flex-1 bg-white border border-slate-200 text-slate-600 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer select-none text-center"
                          >
                            {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                          </button>
                          <button
                            type="submit"
                            className="flex-1 bg-gradient-to-r from-rose-500 to-indigo-600 text-white py-2 rounded-xl text-xs font-bold hover:opacity-90 transition-all cursor-pointer select-none text-center"
                          >
                            {lang === 'bn' ? 'সেভ সেটিংস' : 'Save Settings'}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center space-y-2 relative">
                        {/* Settings Gear Toggle Icon */}
                        <button
                          type="button"
                          onClick={() => {
                            setTempUPI(targetUPI);
                            setTempName(displayMerchantName);
                            setTempAmount(paymentAmount);
                            setShowSettings(true);
                          }}
                          className="absolute right-0 top-0 p-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-500 transition-all cursor-pointer select-none"
                          title="Payment Gateway Settings"
                        >
                          <Settings size={14} />
                        </button>

                        <span className="text-[9px] font-extrabold uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-md">
                          {lang === 'bn' ? 'রিয়েল ইউপিআই (UPI) পেমেন্ট গেটওয়ে' : 'Real UPI Payment Gateway'}
                        </span>
                        
                        <p className="text-xs font-black text-slate-800 max-w-[90%] leading-relaxed">
                          {lang === 'bn' 
                            ? `নিচের বাটনে ক্লিক করলে আপনার রিয়েল পেমেন্ট অ্যাপ ওপেন হবে এবং স্বয়ংক্রিয়ভাবে ${paymentAmount} টাকা সিলেক্ট হয়ে যাবে।` 
                            : `Click the button below to route directly to your payment app to complete the ₹${paymentAmount} subscription.`}
                        </p>

                        {/* Dynamic Action Trigger Button */}
                        <button
                          type="button"
                          onClick={triggerUPIPayment}
                          disabled={isPaying}
                          className={`w-full py-3 px-4 rounded-2xl font-black text-xs text-white transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2 shadow-md ${
                            paymentMethod === 'phonepe'
                              ? 'bg-gradient-to-r from-[#5f259f] to-[#8031d6] hover:from-[#4b1c7e] hover:to-[#5f259f] shadow-purple-100'
                              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-100'
                          }`}
                        >
                          <ExternalLink size={14} />
                          {paymentMethod === 'phonepe' 
                            ? (lang === 'bn' ? `PhonePe অ্যাপের মাধ্যমে পেমেন্ট করুন (₹${paymentAmount})` : `Pay via PhonePe App (₹${paymentAmount})`)
                            : (lang === 'bn' ? `Google Pay অ্যাপের মাধ্যমে পেমেন্ট করুন (₹${paymentAmount})` : `Pay via Google Pay App (₹${paymentAmount})`)}
                        </button>
                      </div>
                    )}

                    {!showSettings && (
                      <>
                        {/* Secure Merchant Info */}
                        <div className="p-3 bg-white border border-slate-200/60 rounded-2xl flex items-center justify-between text-xs font-bold text-slate-700">
                          <div className="space-y-0.5">
                            <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Payee Name</p>
                            <p className="text-slate-800 text-xs font-black">{displayMerchantName}</p>
                          </div>
                          <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1.5 rounded-xl border">
                            <span className="font-mono text-[10px] text-slate-600 font-extrabold">{formatUPIForDisplay(targetUPI)}</span>
                            <button
                              type="button"
                              onClick={copyUPI}
                              className="text-slate-400 hover:text-indigo-600 p-0.5 transition-colors cursor-pointer"
                              title="Copy UPI ID"
                            >
                              {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                            </button>
                          </div>
                        </div>

                        {/* UTR Input Block */}
                        <div className="border-t border-slate-200/80 pt-3.5 space-y-2 text-left">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                            {lang === 'bn' ? '১২ সংখ্যার UTR নম্বরটি এখানে লিখুন' : 'Enter 12-Digit Transaction UTR Number'} *
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              maxLength={12}
                              value={utrNumber}
                              onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, ''))}
                              disabled={isPaying}
                              placeholder={lang === 'bn' ? 'যেমন: ৪১৮২৯৩৮৪৭২৮১' : 'e.g. 418293847281'}
                              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-mono font-black text-slate-800 outline-none transition-all"
                            />
                          </div>
                          <p className="text-[9px] text-slate-400 font-bold leading-normal">
                            {lang === 'bn' 
                              ? 'পেমেন্ট সফল হওয়ার পর অ্যাপে প্রাপ্ত ১২ ডিজিটের ট্রানজেকশন (UTR) আইডি কপি করে এখানে বসান। এডমিন আপনার পেমেন্ট চেক করে একসেপ্ট করলেই আপনার প্রোফাইল এক্টিভ হয়ে যাবে।' 
                              : 'Copy the 12-digit transaction ID (UTR) from your payment app receipt and paste it above. Once the admin manually verifies and approves it, your profile will activate.'}
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Loader overlay during paying verification */}
                  {isPaying && (
                    <div className="py-5 px-4 flex flex-col items-center justify-center gap-4 text-center bg-indigo-50/40 rounded-3xl border border-indigo-100 shadow-inner">
                      {isPendingVerification ? (
                        <div className="flex flex-col items-center gap-4 w-full">
                          {/* Beautiful Animated Clock Circle (Non-text spinning) */}
                          <div className="relative w-24 h-24 flex items-center justify-center bg-white rounded-full shadow-md">
                            <div className="absolute inset-0 rounded-full border-4 border-indigo-600/10"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-t-indigo-600 animate-spin"></div>
                            <div className="flex flex-col items-center justify-center z-10 select-none">
                              {countdownSeconds === 0 ? (
                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-tight text-center leading-none">
                                  {lang === 'bn' ? 'প্লিজ ওয়েট' : 'Please Wait'}
                                </span>
                              ) : (
                                <span className="text-xl font-mono font-black text-slate-800 leading-none">
                                  {formatTime(countdownSeconds)}
                                </span>
                              )}
                              <span className="text-[8px] font-black uppercase text-indigo-500 tracking-wider mt-1 leading-none">
                                {lang === 'bn' ? 'টাইমার' : 'Timer'}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <p className="text-xs font-black text-indigo-950">
                              {countdownSeconds === 0 
                                ? (lang === 'bn' ? '⏳ পেমেন্ট চেক করা হচ্ছে...' : '⏳ Checking Payment Status...')
                                : (lang === 'bn' ? '⏳ পেমেন্ট ভেরিফিকেশন টাইমার চালু হয়েছে' : '⏳ Payment verification timer active')}
                            </p>
                            <p className="text-[10px] text-indigo-700 font-bold leading-relaxed max-w-[90%] mx-auto whitespace-pre-line">
                              {paymentStatusText}
                            </p>
                          </div>

                          {/* Dynamic Live Status Log card */}
                          <div className="w-full bg-white p-3.5 rounded-2xl border border-indigo-100/60 text-[10.5px] text-left space-y-1.5 font-bold shadow-xs">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Order ID:</span>
                              <span className="text-indigo-950 font-mono font-black">{pollingOrderId}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">UTR:</span>
                              <span className="text-slate-700 font-mono font-black">{lastCheckedUtr}</span>
                            </div>
                            <div className="flex justify-between items-center border-t border-indigo-50/50 pt-1.5 mt-1">
                              <span className="text-slate-400">{lang === 'bn' ? 'স্ট্যাটাস:' : 'Status:'}</span>
                              <span className="text-indigo-600 animate-pulse text-[9.5px] uppercase font-black bg-indigo-50 px-2 py-0.5 rounded-md flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping"></span>
                                {lang === 'bn' ? 'এডমিন অনুমোদনের অপেক্ষায়' : 'Awaiting Admin Approval'}
                              </span>
                            </div>
                          </div>

                          <p className="text-[9.5px] text-slate-400 font-bold">
                            {lang === 'bn' 
                              ? '💡 এডমিন আপনার UTR চেক করে একসেপ্ট করার সাথে সাথেই আপনার অ্যাকাউন্ট সক্রিয় হয়ে যাবে।' 
                              : '💡 As soon as the admin checks your UTR and accepts, your account will instantly activate.'}
                          </p>
                        </div>
                      ) : (
                        <>
                          <Loader2 className="animate-spin text-indigo-600" size={28} />
                          <p className="text-xs font-black text-indigo-950">{paymentStatusText}</p>
                        </>
                      )}
                    </div>
                  )}

                  {/* Bottom Payment Button actions */}
                  {!isPaying && (
                    <div className="flex gap-3 pt-3">
                      <button
                        type="button"
                        onClick={() => setStep('form')}
                        className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 py-3.5 rounded-2xl text-xs font-black transition-all cursor-pointer select-none text-center"
                      >
                        {lang === 'bn' ? 'তথ্য পরিবর্তন' : 'Edit Profile'}
                      </button>
                      <button
                        type="button"
                        onClick={handleVerifyUTR}
                        className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white py-3.5 rounded-2xl text-xs font-black transition-all cursor-pointer select-none text-center flex items-center justify-center gap-2 shadow-md shadow-emerald-100"
                      >
                        <CheckCircle2 size={14} />
                        {lang === 'bn' ? 'UTR ভেরিফাই ও অ্যাক্টিভ করুন' : 'Verify UTR & Activate'}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                /* Congratulations Screen with Profile Name Confirmation Input & Custom Save Button */
                <div className="space-y-4">
                  <div className="py-6 flex flex-col items-center justify-center gap-3.5 text-center bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-3xl shadow-xl shadow-emerald-500/20 transform scale-100 transition-all">
                    <div className="p-3 bg-white text-emerald-600 rounded-full shadow-lg animate-bounce">
                      <CheckCircle2 size={36} />
                    </div>
                    <div className="space-y-1 px-4">
                      <h3 className="text-lg font-black tracking-tight text-white uppercase animate-pulse">
                        {lang === 'bn' ? '🎉 অভিনন্দন!' : '🎉 Congratulations!'}
                      </h3>
                      <p className="text-xs font-bold text-emerald-50">
                        {lang === 'bn' 
                          ? `আপনার ${paymentAmount} টাকা পেমেন্ট ব্যাংক সেটেলমেন্টের মাধ্যমে সফলভাবে যাচাই করা হয়েছে।` 
                          : `Your payment of ${paymentAmount} INR has been verified successfully via Bank Settlement.`}
                      </p>
                    </div>
                  </div>

                  {/* Profile Name Set Input Card */}
                  <div className="bg-slate-50 border border-slate-200/80 p-5 rounded-3xl space-y-3.5 text-left animate-fade-in">
                    <div>
                      <label className="text-[11px] font-extrabold text-indigo-600 uppercase tracking-wider block mb-1">
                        {lang === 'bn' ? 'প্রোফাইল নাম সেট করুন (এই নামে প্রোফাইল সেভ হবে)' : 'Set Profile Name (Your profile will be saved under this name)'} *
                      </label>
                      <input
                        type="text"
                        required
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        placeholder={lang === 'bn' ? 'যেমন: আব্দুর রহমান' : 'e.g. Abdur Rahman'}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-bold text-slate-800 outline-none transition-all shadow-sm"
                      />
                      <p className="text-[9px] text-slate-400 font-bold leading-normal mt-1">
                        {lang === 'bn'
                          ? 'কোম্পানি যখন কর্মী নিয়োগ করার সময় দালাল নির্বাচন করবে, তখন আপনার এই নামটি দেখতে পাবে।'
                          : 'This name will be displayed in the Broker dropdown list when companies recruit workers.'}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={isSubmitting || !profileName.trim()}
                      onClick={handleSaveProfile}
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white py-3.5 rounded-2xl text-xs font-black transition-all cursor-pointer select-none text-center flex items-center justify-center gap-2 shadow-md shadow-emerald-200/50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="animate-spin" size={14} />
                          {lang === 'bn' ? 'প্রোফাইল সেভ হচ্ছে...' : 'Saving Profile...'}
                        </>
                      ) : (
                        <>
                          <Check size={14} />
                          {lang === 'bn' ? 'প্রোফাইল সেভ ও একাউন্ট তৈরি করুন' : 'Save Profile & Create Account'}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
