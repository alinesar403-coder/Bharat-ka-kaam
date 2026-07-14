import React, { useState, useEffect } from 'react';
import { BrokerPost, JobPost, AppLanguage, isJobExpired } from '../types';
import { translations } from '../translations';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, isFirebaseAvailable } from '../firebase';
import { X, Shield, Phone, Briefcase, Eye, ArrowRight, User, Building, Coins, Sparkles, Plus, Check, MapPin, Send, Trash2, Bell, Clock, Calendar } from 'lucide-react';

interface BrokerPortalProps {
  lang: AppLanguage;
  allBrokers: BrokerPost[];
  notifications: any[];
  onClose: () => void;
  onSuccess: (message: string) => void;
  onOpenHelpCenterWithText?: (text: string) => void;
}

export default function BrokerPortal({ lang, allBrokers, notifications, onClose, onSuccess, onOpenHelpCenterWithText }: BrokerPortalProps) {
  const t = translations[lang] || translations['bn'];

  const [phoneNumber, setPhoneNumber] = useState('');
  const [loggedInBroker, setLoggedInBroker] = useState<BrokerPost | null>(null);
  const [loginError, setLoginError] = useState('');

  // Payment History states
  const [paymentsHistory, setPaymentsHistory] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  const fetchPaymentsHistory = async (brokerPhone: string) => {
    if (!brokerPhone) return;
    setLoadingPayments(true);
    try {
      if (isFirebaseAvailable) {
        const querySnapshot = await getDocs(collection(db, 'broker_payments'));
        const list: any[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data && data.brokerPhone === brokerPhone) {
            list.push({ id: docSnap.id, ...data });
          }
        });
        list.sort((a, b) => b.timestamp - a.timestamp);
        setPaymentsHistory(list);
      }
    } catch (err) {
      console.error("Error fetching payment history:", err);
    } finally {
      setLoadingPayments(false);
    }
  };
  
  // Custom quick post state
  const [isPostingCustom, setIsPostingCustom] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customCompany, setCustomCompany] = useState('');
  const [customWage, setCustomWage] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [customHours, setCustomHours] = useState('8');

  // Subscription Renewal states
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewUtrNumber, setRenewUtrNumber] = useState('');
  const [renewStatusText, setRenewStatusText] = useState('');
  const [renewPaymentMethod, setRenewPaymentMethod] = useState<'phonepe' | 'gpay'>('phonepe');
  const [isRenewing, setIsRenewing] = useState(false);

  // Robust 5-minute countdown and server verification polling states
  const [isPendingVerification, setIsPendingVerification] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(300);
  const [pollingOrderId, setPollingOrderId] = useState('');
  const [lastCheckedUtr, setLastCheckedUtr] = useState('');

  // Active view tab state
  const [activeTab, setActiveTab] = useState<'recruitment_offers' | 'publish_jobs' | 'broker_history'>('recruitment_offers');
  const [triggerRefreshCount, setTriggerRefreshCount] = useState(0);

  useEffect(() => {
    const handleUpdate = () => {
      setTriggerRefreshCount(prev => prev + 1);
    };
    window.addEventListener('local_storage_posts_updated', handleUpdate);
    return () => {
      window.removeEventListener('local_storage_posts_updated', handleUpdate);
    };
  }, []);

  useEffect(() => {
    if (loggedInBroker) {
      fetchPaymentsHistory(loggedInBroker.phone);
    }
  }, [loggedInBroker, triggerRefreshCount]);

  // New Polling Effect for 5-minute Countdown and Live Verification
  useEffect(() => {
    let timerId: any = null;
    let pollId: any = null;

    if (isPendingVerification && lastCheckedUtr && pollingOrderId) {
      // Countdown timer decrement
      timerId = setInterval(() => {
        setCountdownSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerId);
            // Do NOT stop polling or stop verification. Just let the timer hit 0
            // and keep polling background as requested by the user.
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
    if (!loggedInBroker) return;
    try {
      const response = await fetch('/api/verify-utr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          utr,
          amount: 49,
          phone: loggedInBroker.phone,
          brokerId: loggedInBroker.id,
          brokerName: loggedInBroker.name,
          paymentMethod: renewPaymentMethod,
          orderId
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Success! Immediately stop the pending countdown
        setIsPendingVerification(false);
        setIsRenewing(false);

        // Calculate and update the local/remote state
        const baseTime = isExpired ? Date.now() : subscribedUntil;
        const newExpiry = baseTime + 30 * 24 * 60 * 60 * 1000;

        if (isFirebaseAvailable) {
          await updateDoc(doc(db, 'broker_posts', loggedInBroker.id), {
            subscribedUntil: newExpiry,
            lastPaymentDate: Date.now(),
            utrVerified: utr
          });
        }

        setLoggedInBroker(prev => prev ? {
          ...prev,
          subscribedUntil: newExpiry,
          lastPaymentDate: Date.now(),
          utrVerified: utr
        } : null);

        setRenewUtrNumber('');
        setShowRenewModal(false);
        setRenewStatusText('');
        fetchPaymentsHistory(loggedInBroker.phone);

        if (onSuccess) {
          onSuccess(
            lang === 'bn' 
              ? '✓ অভিনন্দন! সার্ভার পেমেন্ট সিঙ্ক সম্পন্ন করেছে। আপনার প্রিমিয়াম সাবস্ক্রিপশন সফলভাবে নবায়ন হয়েছে!' 
              : '✓ Congratulations! The server synced the payment. Your premium subscription has been successfully renewed!'
          );
        }
      } else if (!response.ok) {
        // If there's a permanent rejection like double-spend, stop immediately
        if (data.error && (data.error.includes('already been used') || data.error.includes('conflict'))) {
          setIsPendingVerification(false);
          setIsRenewing(false);
          setRenewStatusText(
            lang === 'bn'
              ? (data.errorBn || '❌ পেমেন্ট যাচাইকরণ ব্যর্থ হয়েছে। সঠিক ও নতুন UTR লিখুন।')
              : (data.error || '❌ Payment verification failed.')
          );
          fetchPaymentsHistory(loggedInBroker.phone);
        }
      } else {
        // response is ok (200), but success is false. It means it is "pending" (waiting for SMS)
        if (data.status === 'pending') {
          if (countdownSeconds > 0) {
            setRenewStatusText(
              lang === 'bn'
                ? `⏳ এডমিন ভেরিফিকেশনের জন্য অপেক্ষমান... (চেক নং ${count})\nএডমিন আপনার পেমেন্টটি যাচাই করে একসেপ্ট করা মাত্রই আপনার প্রোফাইল অ্যাক্টিভ হয়ে যাবে। অনুগ্রহ করে অপেক্ষা করুন।`
                : `⏳ Waiting for admin manual verification... (Check #${count})\nYour profile will automatically unlock once the admin approves your payment. Please wait.`
            );
          } else {
            setRenewStatusText(
              lang === 'bn'
                ? 'দয়া করে অপেক্ষা করবেন, আমাদের সিস্টেম আপনার পেমেন্টটিকে চেক করতেছে...'
                : 'Please wait, our system is checking your payment...'
            );
          }
          fetchPaymentsHistory(loggedInBroker.phone);
        } else if (data.status === 'rejected') {
          setIsPendingVerification(false);
          setIsRenewing(false);
          setRenewStatusText(
            lang === 'bn'
              ? (data.errorBn || '❌ পেমেন্টটি এডমিন দ্বারা বাতিল করা হয়েছে। দয়া করে সঠিক UTR দিয়ে পুনরায় চেষ্টা করুন।')
              : (data.error || '❌ Payment rejected by Admin.')
          );
          fetchPaymentsHistory(loggedInBroker.phone);
        }
      }
    } catch (err) {
      console.error("Polling verify-utr error:", err);
    }
  };

  const handleTimeout = async (orderId: string, utr: string) => {
    setIsRenewing(false);
    setRenewStatusText(
      lang === 'bn'
        ? '⏳ ৫ মিনিট সময় শেষ হয়েছে। আমাদের ব্যাংক মেসেজ সিস্টেমে পেমেন্ট রেকর্ডটি এখনও আসেনি। দয়া করে আপনার পেমেন্ট সাকসেস হয়েছে কিনা এবং সঠিক UTR দিয়েছেন কিনা তা নিশ্চিত করুন এবং পুনরায় চেষ্টা করুন।'
        : '⏳ 5-minute timeout reached. The payment has not synced with our bank records yet. Please ensure you provided the correct UTR and try again.'
    );
    if (isFirebaseAvailable && loggedInBroker && orderId) {
      try {
        await fetch('/api/verify-utr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            utr,
            amount: 49,
            phone: loggedInBroker.phone,
            brokerId: loggedInBroker.id,
            brokerName: loggedInBroker.name,
            paymentMethod: renewPaymentMethod,
            orderId,
            isTimeout: true
          })
        });
        fetchPaymentsHistory(loggedInBroker.phone);
      } catch (e) {
        console.error("Error logging timeout on server:", e);
      }
    }
  };

  // Accept Confirmation & Phone modal states
  const [showAcceptConfirmModal, setShowAcceptConfirmModal] = useState(false);
  const [selectedOfferToAccept, setSelectedOfferToAccept] = useState<any>(null);
  const [brokerLocalPhone, setBrokerLocalPhone] = useState('');
  const [isSubmittingAcceptance, setIsSubmittingAcceptance] = useState(false);

  // Sourcing requests directed to this broker
  const [myOffers, setMyOffers] = useState<any[]>([]);
  const pendingOffers = myOffers.filter(offer => !offer.status || offer.status === 'pending');
  const acceptedOffers = myOffers.filter(offer => offer.status === 'accepted');
  const rejectedOffers = myOffers.filter(offer => offer.status === 'rejected');

  const [publishedOffers, setPublishedOffers] = useState<string[]>([]); // tracked in state/localStorage

  // Active jobs published by this broker
  const [myPublishedJobs, setMyPublishedJobs] = useState<any[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);

  useEffect(() => {
    // Read already published offers to prevent duplicate postings
    try {
      const stored = localStorage.getItem('published_recruitment_ids');
      if (stored) {
        setPublishedOffers(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    // Auto-login or update login if matching broker phone is found in localStorage
    const savedPhone = localStorage.getItem('app_user_phone');
    if (savedPhone) {
      const cleanSaved = savedPhone.replace(/[^0-9]/g, '');
      if (cleanSaved) {
        const currentPhoneClean = loggedInBroker ? loggedInBroker.phone.replace(/[^0-9]/g, '') : '';
        const needsUpdate = !loggedInBroker || (currentPhoneClean !== cleanSaved && !cleanSaved.endsWith(currentPhoneClean) && !currentPhoneClean.endsWith(cleanSaved));
        
        if (needsUpdate) {
          const found = allBrokers.find(b => {
            const bPhoneClean = b.phone.replace(/[^0-9]/g, '');
            return bPhoneClean.endsWith(cleanSaved) || cleanSaved.endsWith(bPhoneClean);
          });
          if (found) {
            setLoggedInBroker(found);
          }
        }
      }
    } else if (loggedInBroker) {
      setLoggedInBroker(null);
    }
  }, [allBrokers, loggedInBroker]);

  // Helper to fetch views for a job post from localStorage
  const getJobViewCount = (job: any): number => {
    try {
      const key = job.id || `local-${job.createdAt}`;
      const viewsStr = localStorage.getItem('job_views_count');
      const views = viewsStr ? JSON.parse(viewsStr) : {};
      const localCount = views[key] || 0;
      const dbCount = job.viewCount || 0;
      return Math.max(localCount, dbCount);
    } catch (err) {
      return job?.viewCount || 0;
    }
  };

  // Helper to fetch calls for a job post from localStorage
  const getJobCallCount = (job: any): number => {
    try {
      const key = job.id || `local-${job.createdAt}`;
      const callsStr = localStorage.getItem('job_calls_count');
      const calls = callsStr ? JSON.parse(callsStr) : {};
      const localCount = calls[key] || 0;
      const dbCount = job.callCount || 0;
      return Math.max(localCount, dbCount);
    } catch (err) {
      return job?.callCount || 0;
    }
  };

  // Filter notifications/offers for logged in broker
  useEffect(() => {
    if (loggedInBroker) {
      // Find notifications targeting this broker ID
      const filtered = notifications.filter(n => 
        n.targetBrokerId === loggedInBroker.id || 
        n.targetBrokerName?.toLowerCase() === loggedInBroker.name?.toLowerCase() ||
        (n.text && n.text.includes(loggedInBroker.name))
      );
      setMyOffers(filtered);
    } else {
      setMyOffers([]);
    }
  }, [loggedInBroker, notifications]);

  // Fetch jobs published by this logged-in broker
  useEffect(() => {
    async function fetchMyPublishedJobs() {
      if (!loggedInBroker) return;
      setLoadingJobs(true);
      
      // Load local jobs first
      let localBrokerJobs: any[] = [];
      try {
        const localJobsStr = localStorage.getItem('local_job_posts');
        if (localJobsStr) {
          const localList = JSON.parse(localJobsStr);
          localBrokerJobs = localList.filter((j: any) => j.brokerId === loggedInBroker.id);
        }
      } catch (err) {
        console.error("Error loading local job posts in BrokerPortal:", err);
      }

      if (!isFirebaseAvailable) {
        localBrokerJobs.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
        setMyPublishedJobs(localBrokerJobs);
        setLoadingJobs(false);
        return;
      }

      try {
        const q = collection(db, 'job_posts');
        const snap = await getDocs(q);
        const list = snap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter((j: any) => j.brokerId === loggedInBroker.id);

        // Merge local and firestore jobs
        const merged = [...list, ...localBrokerJobs];
        const unique = merged.filter((item, index, self) => 
          self.findIndex((t: any) => (t.id && t.id === item.id) || (t.createdAt === item.createdAt)) === index
        );

        // Sort by createdAt descending
        unique.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
        setMyPublishedJobs(unique);
      } catch (err) {
        console.error("Error fetching published jobs from Firestore:", err);
        // Fallback to local jobs
        localBrokerJobs.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
        setMyPublishedJobs(localBrokerJobs);
      } finally {
        setLoadingJobs(false);
      }
    }
    fetchMyPublishedJobs();
  }, [loggedInBroker, publishedOffers, triggerRefreshCount]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    
    // Find broker matching phone
    const found = allBrokers.find(b => {
      const bPhoneClean = b.phone.replace(/[^0-9]/g, '');
      return bPhoneClean.endsWith(cleanPhone) || cleanPhone.endsWith(bPhoneClean);
    });

    if (found) {
      setLoggedInBroker(found);
      setPhoneNumber('');
      // Synchronize to the whole app session
      localStorage.setItem('app_user_name', found.name);
      localStorage.setItem('app_user_phone', found.phone);
      localStorage.setItem('app_user_logged_in', 'true');
      localStorage.setItem('app_onboarding_completed', 'true');
      window.dispatchEvent(new Event('app_user_profile_updated'));
    } else {
      setLoginError(
        lang === 'bn' 
          ? '❌ এই নম্বর দিয়ে কোনো দালাল প্রোফাইল পাওয়া যায়নি। অনুগ্রহ করে আগে প্রোফাইল তৈরি করুন।' 
          : '❌ No broker found with this phone number. Please register first.'
      );
    }
  };

  // Subscription Calculations
  const subscribedUntil = loggedInBroker?.subscribedUntil || (loggedInBroker ? loggedInBroker.createdAt + 30 * 24 * 60 * 60 * 1000 : 0);
  const isExpired = loggedInBroker ? (subscribedUntil < Date.now()) : false;
  const daysRemaining = Math.max(0, Math.ceil((subscribedUntil - Date.now()) / (1000 * 60 * 60 * 24)));

  const handleRenewSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUTR = renewUtrNumber.replace(/\s+/g, '');
    if (!cleanUTR || cleanUTR.length !== 12 || !/^\d+$/.test(cleanUTR)) {
      setRenewStatusText(lang === 'bn' ? '⚠️ অনুগ্রহ করে সঠিক ১২-ডিজিটের UTR নম্বরটি লিখুন।' : '⚠️ Please enter a valid 12-digit UTR number.');
      return;
    }

    setIsRenewing(true);
    setRenewStatusText(lang === 'bn' ? 'ন্যাশনাল পেমেন্ট গেটওয়ে (NPCI) দিয়ে যাচাই করা হচ্ছে...' : 'Verifying with National Payments Gateway (NPCI)...');
    
    try {
      if (loggedInBroker && loggedInBroker.id) {
        // Generate an Order ID for this verification attempt
        const generatedOrderId = "BKK-" + Math.floor(100000 + Math.random() * 900000).toString();

        // Step 1: Query the secure /api/verify-utr endpoint
        const response = await fetch('/api/verify-utr', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            utr: cleanUTR,
            amount: 49,
            phone: loggedInBroker.phone,
            brokerId: loggedInBroker.id,
            brokerName: loggedInBroker.name,
            paymentMethod: renewPaymentMethod,
            orderId: generatedOrderId
          })
        });

        const data = await response.json();

        // Scenario A: UTR is immediately verified successfully (SMS already synced)
        if (response.ok && data.success) {
          const baseTime = isExpired ? Date.now() : subscribedUntil;
          const newExpiry = baseTime + 30 * 24 * 60 * 60 * 1000;
          
          if (isFirebaseAvailable) {
            await updateDoc(doc(db, 'broker_posts', loggedInBroker.id), {
              subscribedUntil: newExpiry,
              lastPaymentDate: Date.now(),
              utrVerified: cleanUTR
            });
          }

          setLoggedInBroker(prev => prev ? {
            ...prev,
            subscribedUntil: newExpiry,
            lastPaymentDate: Date.now(),
            utrVerified: cleanUTR
          } : null);

          setRenewUtrNumber('');
          setShowRenewModal(false);
          setRenewStatusText('');
          fetchPaymentsHistory(loggedInBroker.phone);
          if (onSuccess) {
            onSuccess(
              lang === 'bn' 
                ? '✓ অভিনন্দন! আপনার প্রিমিয়াম সাবস্ক্রিপশন সফলভাবে নবায়ন হয়েছে।' 
                : '✓ Congratulations! Your premium subscription has been successfully renewed.'
            );
          }
          setIsRenewing(false);
          return;
        }

        // Scenario B: Payment is pending receipt of Bank SMS (Start 5-minute countdown and poll in background)
        if (response.ok && data.status === 'pending') {
          setPollingOrderId(generatedOrderId);
          setLastCheckedUtr(cleanUTR);
          setCountdownSeconds(300); // 5 minutes
          setIsPendingVerification(true);
          setRenewStatusText(
            lang === 'bn'
              ? '⏳ আমাদের ব্যাংক মেসেজ সিস্টেমে আপনার এই পেমেন্ট রেকর্ডটি এখনও আসেনি। পেমেন্টটি প্রসেস হতে সাধারণত ১-৫ মিনিট সময় লাগতে পারে। অনুগ্রহ করে কাউন্টডাউন শেষ হওয়া পর্যন্ত অপেক্ষা করুন...'
              : '⏳ Your payment record has not been received in our bank message system yet. It usually takes 1-5 minutes to process. Please wait for the countdown...'
          );
          fetchPaymentsHistory(loggedInBroker.phone);
          return;
        }

        // Scenario C: Immediate hard error (e.g. UTR already used)
        setIsRenewing(false);
        setRenewStatusText(
          lang === 'bn'
            ? (data.errorBn || '❌ পেমেন্ট যাচাইকরণ ব্যর্থ হয়েছে। সঠিক ও নতুন UTR লিখুন।')
            : (data.error || '❌ Payment verification failed. Please enter a valid and unused UTR.')
        );
        fetchPaymentsHistory(loggedInBroker.phone);
      } else {
        throw new Error("Broker details or database unavailable.");
      }
    } catch (err) {
      console.error("Renewal error:", err);
      setIsRenewing(false);
      setRenewStatusText(lang === 'bn' ? '❌ নবায়ন করতে ব্যর্থ হয়েছে। আবার চেষ্টা করুন।' : '❌ Renewal failed. Please try again.');
    }
  };

  const handlePublishToPublicBoard = async (offer: any, customPhone?: string) => {
    if (!loggedInBroker) return;

    setIsSubmittingAcceptance(true);
    try {
      const cleanCustomPhone = (customPhone || brokerLocalPhone || loggedInBroker.phone || '').trim();
      if (!cleanCustomPhone) {
        alert(lang === 'bn' ? 'দয়া করে একটি সঠিক ফোন নাম্বার দিন।' : 'Please provide a valid phone number.');
        setIsSubmittingAcceptance(false);
        return;
      }

      const wageValue = offer.workerWage || 500;
      const wageString = lang === 'bn' 
        ? `${wageValue} টাকা / দিন`
        : `${wageValue} BDT / day`;

      // Extract job title or use field
      let finalJobTitle = offer.jobTitle;
      if (!finalJobTitle && offer.text) {
        const matches = offer.text.match(/"([^"]+)"/g);
        if (matches && matches.length > 1) {
          finalJobTitle = matches[1].replace(/"/g, '');
        } else if (matches && matches.length > 0) {
          finalJobTitle = matches[0].replace(/"/g, '');
        }
      }
      if (!finalJobTitle) {
        finalJobTitle = lang === 'bn' ? 'সাধারণ কর্মী' : 'General Worker';
      }

      // Build JobPost object
      const publicPost: JobPost = {
        title: `${finalJobTitle} (${lang === 'bn' ? 'জরুরী কর্মী' : 'Urgent Worker'})`,
        company: `${loggedInBroker.agency || loggedInBroker.name} (${lang === 'bn' ? 'দালাল দ্বারা পরিচালিত' : 'Broker Sourced'})`,
        date: offer.requiredDate || `${lang === 'bn' ? 'আজই' : 'Today'}`,
        time: offer.totalWorkHours ? `${offer.totalWorkHours} ${lang === 'bn' ? 'ঘণ্টা ডিউটি' : 'hrs shift'}` : 'Normal shift',
        location: offer.workLocation || offer.location || loggedInBroker.location,
        country: offer.country || loggedInBroker.country,
        state: offer.state || loggedInBroker.state,
        district: offer.district || loggedInBroker.district,
        phone: cleanCustomPhone, // Workers call the broker directly! (NO COMPANY PHONE NUMBER AT ALL!)
        salary: wageString,
        description: lang === 'bn'
          ? `🛡️ এই কাজটি সরাসরি আমাদের দালাল সোর্সিং এজেন্সি দ্বারা পরিচালিত হচ্ছে। কোনো কোম্পানির সাথে সরাসরি যোগাযোগের প্রয়োজন নেই।\n\n• কাজের বিবরণ: ${finalJobTitle}\n• প্রয়োজনীয় কর্মী সংখ্যা: ${offer.workerCount || 1} জন\n• জেন্ডার: ${offer.requiredGender === 'male' ? 'পুরুষ' : offer.requiredGender === 'female' ? 'মহিলা' : 'যেকোনো'}\n• কাজের তারিখ: ${offer.requiredDate || 'আজই'}\n• সময়/ডিউটি: ${offer.shiftStartTime || ''} - ${offer.shiftEndTime || ''} (${offer.totalWorkHours || 8} ঘণ্টা)\n• দৈনিক মজুরি: ${offer.workerWage || 0} টাকা\n• কাজের স্থান: ${offer.workLocation || offer.location || loggedInBroker.location}\n\n📞 যেকোনো তথ্যের জন্য সরাসরি আমাদের দালালের সাথে যোগাযোগ করুন।`
          : `🛡️ This job is directly managed and sourced by our broker agency. Do not contact any corporate entity directly.\n\n• Job Role: ${finalJobTitle}\n• Number of Workers: ${offer.workerCount || 1}\n• Gender Required: ${offer.requiredGender === 'male' ? 'Male' : offer.requiredGender === 'female' ? 'Female' : 'Any'}\n• Work Date: ${offer.requiredDate || 'Urgent'}\n• Duty Hours: ${offer.shiftStartTime || ''} - ${offer.shiftEndTime || ''} (${offer.totalWorkHours || 8} hrs)\n• Wage: ${offer.workerWage || 0} BDT/day\n• Location: ${offer.workLocation || offer.location || loggedInBroker.location}\n\n📞 For details or applying, contact our broker directly.`,
        isBrokerManaged: true,
        brokerId: loggedInBroker.id,
        brokerName: loggedInBroker.name,
        brokerPhone: cleanCustomPhone,
        brokerFee: offer.brokerCharge || 0,
        recruitmentId: offer.id,
        uploadedPhotos: offer.uploadedPhotos || [],
        workplaceMapLink: offer.workplaceMapLink || "",
        createdAt: Date.now()
      };

      // 1. Save to Local Storage local_job_posts IMMEDIATELY so it is extremely fast & offline-ready
      try {
        const localJobsStr = localStorage.getItem('local_job_posts');
        const localJobs = localJobsStr ? JSON.parse(localJobsStr) : [];
        localJobs.unshift(publicPost);
        localStorage.setItem('local_job_posts', JSON.stringify(localJobs));
      } catch (localErr) {
        console.error("Could not save job post locally:", localErr);
      }

      // 2. Update notification status locally
      try {
        const localNotifsStr = localStorage.getItem('local_notifications');
        const localNotifs = localNotifsStr ? JSON.parse(localNotifsStr) : [];
        
        const existsIndex = localNotifs.findIndex((n: any) => n.id === offer.id);
        if (existsIndex > -1) {
          localNotifs[existsIndex] = { ...localNotifs[existsIndex], status: 'accepted', actedAt: Date.now() };
        } else {
          localNotifs.unshift({ ...offer, status: 'accepted', actedAt: Date.now() });
        }
        localStorage.setItem('local_notifications', JSON.stringify(localNotifs));
      } catch (localNotifErr) {
        console.error("Could not update local notification status:", localNotifErr);
      }

      // 3. Track published list
      const updatedPublished = [...publishedOffers, offer.id];
      setPublishedOffers(updatedPublished);
      localStorage.setItem('published_recruitment_ids', JSON.stringify(updatedPublished));

      // Trigger standard local storage updated event to make it load instantly in UI
      window.dispatchEvent(new Event('local_storage_posts_updated'));

      // 4. Save to Firebase in Background (non-blocking async)
      if (isFirebaseAvailable) {
        addDoc(collection(db, 'job_posts'), publicPost)
          .then(async () => {
            console.log("Job post sync to Firestore successful.");
            // Update offer status in Firestore
            try {
              await updateDoc(doc(db, 'notifications', offer.id), {
                status: 'accepted',
                actedAt: Date.now()
              });
              console.log("Notification status sync to Firestore successful.");
            } catch (err) {
              console.warn("Firestore notification status update skipped (might be a local-only notification):", err);
            }
          })
          .catch((dbErr) => {
            console.error("Delayed background sync of job post to Firestore failed:", dbErr);
          });
      }

      // 5. Update broker phone in profile locally & remotely if changed
      if (cleanCustomPhone && cleanCustomPhone !== loggedInBroker.phone) {
        const updatedBroker = { ...loggedInBroker, phone: cleanCustomPhone };
        setLoggedInBroker(updatedBroker);

        // Update in local_broker_posts
        try {
          const localBrokersStr = localStorage.getItem('local_broker_posts');
          if (localBrokersStr) {
            const localBrokers = JSON.parse(localBrokersStr);
            const updatedList = localBrokers.map((b: any) => b.id === loggedInBroker.id ? { ...b, phone: cleanCustomPhone } : b);
            localStorage.setItem('local_broker_posts', JSON.stringify(updatedList));
          }
        } catch (err) {
          console.error(err);
        }

        // Update in Firestore in background
        if (isFirebaseAvailable && loggedInBroker.id) {
          updateDoc(doc(db, 'broker_posts', loggedInBroker.id), {
            phone: cleanCustomPhone
          }).catch(err => console.error("Could not update broker phone in Firestore background:", err));
        }
      }

      // Close modal
      setShowAcceptConfirmModal(false);
      setSelectedOfferToAccept(null);

      // Success toast
      onSuccess(
        lang === 'bn'
          ? '📢 অভিনন্দন! কাজের অফারটি একসেপ্ট করা হয়েছে এবং আপনার ফোন নাম্বার সহ পাবলিক বোর্ডে পোস্ট করা হয়েছে।'
          : '📢 Success! The job offer is accepted and now live on the public board with your broker contact.'
      );
    } catch (err) {
      console.error("Error publishing broker job:", err);
    } finally {
      setIsSubmittingAcceptance(false);
    }
  };

  const handleAcceptClick = (offer: any) => {
    setSelectedOfferToAccept(offer);
    setBrokerLocalPhone(loggedInBroker?.phone || '');
    setShowAcceptConfirmModal(true);
  };

  const handleRejectOffer = async (offerId: string) => {
    if (!window.confirm(lang === 'bn' ? 'আপনি কি নিশ্চিতভাবে এই কাজের অফারটি রিজেক্ট করতে চান? এটি ড্যাশবোর্ড থেকে মুছে যাবে।' : 'Are you sure you want to reject this offer? It will be removed from your dashboard.')) {
      return;
    }
    try {
      // 1. Update status locally in localStorage
      try {
        const localNotifsStr = localStorage.getItem('local_notifications');
        const localNotifs = localNotifsStr ? JSON.parse(localNotifsStr) : [];
        
        const existsIndex = localNotifs.findIndex((n: any) => n.id === offerId);
        if (existsIndex > -1) {
          localNotifs[existsIndex] = { ...localNotifs[existsIndex], status: 'rejected', actedAt: Date.now() };
        } else {
          // If not in local storage yet, try to find it in myOffers and insert it as rejected
          const foundOffer = myOffers.find((n: any) => n.id === offerId);
          if (foundOffer) {
            localNotifs.unshift({ ...foundOffer, status: 'rejected', actedAt: Date.now() });
          }
        }
        localStorage.setItem('local_notifications', JSON.stringify(localNotifs));
      } catch (localNotifErr) {
        console.error("Could not update local notification status on reject:", localNotifErr);
      }

      // Dispatch event to update App.tsx notifications list
      window.dispatchEvent(new Event('local_storage_posts_updated'));

      // 2. Sync to Firebase in background
      if (isFirebaseAvailable) {
        updateDoc(doc(db, 'notifications', offerId), {
          status: 'rejected',
          actedAt: Date.now()
        }).catch(err => {
          console.warn("Could not sync reject status to Firestore (might be local-only):", err);
        });
      }

      onSuccess(lang === 'bn' ? '✓ কাজের অফারটি রিজেক্ট করা হয়েছে।' : '✓ Offer successfully rejected.');
    } catch (err) {
      console.error("Error rejecting offer:", err);
    }
  };

  const handlePostCustomJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedInBroker) return;

    if (!customTitle || !customWage || !customLocation) {
      alert(lang === 'bn' ? 'দয়া করে সব ঘর পূরণ করুন' : 'Please fill all required fields');
      return;
    }

    try {
      const publicPost: JobPost = {
        title: customTitle,
        company: customCompany || `${loggedInBroker.agency || loggedInBroker.name}`,
        date: lang === 'bn' ? 'জরুরী / যেকোনো দিন' : 'Urgent / Any day',
        time: `${customHours} ${lang === 'bn' ? 'ঘণ্টা ডিউটি' : 'hrs duty'}`,
        location: customLocation,
        country: loggedInBroker.country,
        state: loggedInBroker.state,
        district: loggedInBroker.district,
        phone: loggedInBroker.phone, // Workers call broker
        salary: `${customWage} ${lang === 'bn' ? 'টাকা / দৈনিক' : 'BDT/INR'}`,
        description: customDesc || (lang === 'bn' ? `দালাল দ্বারা সরাসরি পরিচালিত কাজ।` : `Directly managed broker job.`),
        isBrokerManaged: true,
        brokerId: loggedInBroker.id,
        brokerName: loggedInBroker.name,
        brokerPhone: loggedInBroker.phone,
        createdAt: Date.now()
      };

      if (!isFirebaseAvailable) {
        throw new Error(lang === 'bn' ? 'সিস্টেমটি বর্তমানে অফলাইনে কাজ করবে না। অনুগ্রহ করে ইন্টারнеটের সাথে যুক্ত হন।' : 'The system is currently online-only and offline work is disabled. Please connect to the internet.');
      }
      await addDoc(collection(db, 'job_posts'), publicPost);

      // Reset fields
      setCustomTitle('');
      setCustomCompany('');
      setCustomWage('');
      setCustomLocation('');
      setCustomDesc('');
      setIsPostingCustom(false);

      window.dispatchEvent(new Event('local_storage_posts_updated'));

      onSuccess(
        lang === 'bn'
          ? '📢 আপনার কাস্টম কাজের অফারটি সফলভাবে পাবলিক বোর্ডে লাইভ করা হয়েছে!'
          : '📢 Custom broker job successfully published to the live board!'
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!window.confirm(lang === 'bn' ? 'আপনি কি নিশ্চিতভাবে এই কাজটি মুছে ফেলতে চান?' : 'Are you sure you want to delete this job?')) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'job_posts', jobId));
      setMyPublishedJobs(prev => prev.filter(j => j.id !== jobId));
      window.dispatchEvent(new Event('local_storage_posts_updated'));
      onSuccess(lang === 'bn' ? '✓ কাজটি সফলভাবে মুছে ফেলা হয়েছে।' : '✓ Job successfully removed.');
    } catch (err) {
      console.error("Error deleting job:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-50 z-50 flex flex-col h-screen w-screen overflow-hidden animate-fade-in">
      
      {/* 🌟 Full Screen Elegant Top Header */}
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-6 py-4 flex items-center justify-between shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white border border-white/20 animate-pulse">
            <Shield size={22} className="text-emerald-300" />
          </div>
          <div className="text-left">
            <h2 className="text-base sm:text-lg font-black tracking-tight leading-none">
              {lang === 'bn' ? '🛡️ দালাল ড্যাশবোর্ড ও পোর্টাল' : '🛡️ Broker Dashboard & Portal'}
            </h2>
            <p className="text-[10px] text-emerald-100 font-bold uppercase tracking-wider mt-1">
              {lang === 'bn' ? 'কোম্পানি সোর্সিং ও পাবলিক কাজের পোস্টার' : 'Company Sourcing & Public Job Publisher'}
            </p>
          </div>
        </div>
        
        <button 
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer text-white"
        >
          <X size={20} />
        </button>
      </div>

      {/* 🚀 Scrollable Core Body */}
      <div className="flex-1 overflow-y-auto bg-slate-50">
        
        {/* Dynamic Inner views */}
        <div className="p-4 sm:p-6 max-w-4xl mx-auto w-full space-y-6">
          
          {/* A. If not logged in: Full Screen login card */}
          {!loggedInBroker ? (
            <div className="flex items-center justify-center py-10">
              <div className="bg-white w-full max-w-md rounded-3xl shadow-xl border border-slate-100 overflow-hidden p-6 sm:p-8 space-y-6 animate-scale-up">
                
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto border border-teal-100 shadow-inner">
                    <Shield size={32} />
                  </div>
                  <h3 className="text-lg font-black text-slate-800">
                    {lang === 'bn' ? 'দালাল ড্যাশবোর্ডে লগইন' : 'Broker Dashboard Login'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {lang === 'bn' ? 'আপনার রেজিস্টার্ড মোবাইল নম্বর দিয়ে ড্যাশবোর্ড অ্যাক্সেস করুন' : 'Access your dashboard with your registered mobile number'}
                  </p>
                </div>

                <div className="bg-teal-50/50 p-4 rounded-2xl border border-teal-100/50 space-y-2.5 text-left">
                  <h4 className="text-[10px] font-black text-teal-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={14} className="text-teal-600" />
                    {lang === 'bn' ? 'পোর্টাল সুবিধা সমূহ:' : 'Portal Advantages:'}
                  </h4>
                  <ul className="text-[11px] text-teal-700 space-y-1.5 font-bold">
                    <li className="flex items-start gap-1.5">
                      <span className="text-teal-600 mt-0.5">•</span>
                      <span>{lang === 'bn' ? 'কোম্পানিগুলোর পাঠানো রিক্রুটমেন্ট অফার সরাসরি দেখা' : 'View direct recruitment offers sent by companies'}</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-teal-600 mt-0.5">•</span>
                      <span>{lang === 'bn' ? 'মাত্র ১-ক্লিকে কোম্পানির কাজগুলো পাবলিক বোর্ডে পোস্ট করা' : 'Publish company jobs to the public board with 1-click'}</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-teal-600 mt-0.5">•</span>
                      <span>{lang === 'bn' ? 'নতুন প্রিমিয়াম সুবিধা এবং পেমেন্ট রিনিউয়াল ম্যানেজমেন্ট' : 'New premium benefits & secure billing tools'}</span>
                    </li>
                  </ul>
                </div>

                {/* Login Form */}
                <form onSubmit={handleLogin} className="space-y-4 text-left">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                      {lang === 'bn' ? 'আপনার রেজিস্টার্ড মোবাইল নম্বর দিন:' : 'Enter registered mobile number:'}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3.5 text-slate-400 text-sm">📞</span>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="e.g. 017XXXXXXXX / 9876543210"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-teal-500 rounded-xl text-xs font-bold text-slate-800 outline-none transition-all focus:bg-white"
                        required
                      />
                    </div>
                  </div>

                  {loginError && (
                    <p className="text-[11px] font-bold text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-100 flex items-center gap-1.5">
                      <span>⚠️</span>
                      <span>{loginError}</span>
                    </p>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>{lang === 'bn' ? 'লগইন করুন' : 'Log In'}</span>
                    <ArrowRight size={15} />
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="space-y-6 text-left">
              
              {/* 🛡️ 1. Elegant Profile Bar */}
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 font-bold border border-teal-100 shrink-0">
                      <User size={16} />
                    </div>
                    <span className="text-base font-black text-slate-800">{loggedInBroker.name}</span>
                    {loggedInBroker.agency && (
                      <span className="text-[10px] font-black bg-teal-100 text-teal-800 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                        {loggedInBroker.agency}
                      </span>
                    )}
                    {isExpired ? (
                      <span className="text-[10px] font-black bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-md uppercase flex items-center gap-1">
                        ⚠️ {lang === 'bn' ? 'মেয়াদ উত্তীর্ণ (পেমেন্ট বকেয়া)' : 'Expired (Payment Due)'}
                      </span>
                    ) : (
                      <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-md uppercase flex items-center gap-1">
                        ✓ {lang === 'bn' ? `প্রিমিয়াম সক্রিয় (${daysRemaining} দিন বাকি)` : `Premium Active (${daysRemaining}d left)`}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">
                    <span className="flex items-center gap-1">📞 {loggedInBroker.phone}</span>
                    <span className="text-slate-300">•</span>
                    <span className="flex items-center gap-1">📍 {loggedInBroker.location}</span>
                    <span className="text-slate-300">•</span>
                    <span className="flex items-center gap-1 text-slate-400 font-bold">
                      🕒 {lang === 'bn' ? 'মেয়াদ শেষ হবে:' : 'Expires:'} {new Date(subscribedUntil).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US')}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap w-full md:w-auto border-t md:border-t-0 pt-3.5 md:pt-0">
                  {isExpired ? (
                    <button
                      onClick={() => setShowRenewModal(true)}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm animate-bounce"
                    >
                      💸 {lang === 'bn' ? 'নবায়ন করুন (৪৯ টাকা)' : 'Renew Now (49 BDT)'}
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowRenewModal(true)}
                      className="px-3.5 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-xl text-xs font-black cursor-pointer transition-colors"
                    >
                      🔄 {lang === 'bn' ? 'মেয়াদ বাড়ান' : 'Extend Expiry'}
                    </button>
                  )}
                  <button
                    onClick={() => setLoggedInBroker(null)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-black cursor-pointer transition-colors"
                  >
                    {lang === 'bn' ? 'লগআউট' : 'Logout'}
                  </button>
                </div>
              </div>

              {/* 💼 2. Brokered Jobs Category list */}
              <div className="bg-white px-5 py-3.5 rounded-2xl border border-slate-100 shadow-xs text-[11px] text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="font-extrabold flex items-center gap-1.5">
                  <Briefcase size={14} className="text-teal-600" />
                  <span>{lang === 'bn' ? 'আপনার নির্বাচিত দালালি করার কাজের ক্ষেত্র:' : 'Your Selected Brokered Roles:'}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {loggedInBroker.selectedJobs && loggedInBroker.selectedJobs.length > 0 ? (
                    loggedInBroker.selectedJobs.map((job, idx) => (
                      <span key={idx} className="bg-teal-50 text-teal-800 border border-teal-100 font-black px-2.5 py-0.5 rounded-lg text-[10px]">
                        {job}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] font-black bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-lg">
                      {loggedInBroker.workerTypes || (lang === 'bn' ? 'সব ধরণের কাজ' : 'All roles')}
                    </span>
                  )}
                </div>
              </div>

              {/* 🎛️ 3. Premium Three-Option Segment Selector */}
              <div className="grid grid-cols-3 bg-slate-200/60 p-1 rounded-2xl border border-slate-200/80 w-full shadow-inner shrink-0 gap-1 select-none">
                <button
                  type="button"
                  onClick={() => setActiveTab('recruitment_offers')}
                  className={`py-2 px-1 text-center rounded-xl text-[10.5px] font-black uppercase tracking-wider transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'recruitment_offers'
                      ? 'bg-white text-teal-800 shadow-md border border-slate-200/20 font-black'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Bell size={13} className={activeTab === 'recruitment_offers' ? 'text-teal-600 animate-swing' : 'text-slate-400'} />
                  <span className="truncate">{lang === 'bn' ? `নতুন অফার (${pendingOffers.length})` : `New Offers (${pendingOffers.length})`}</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setActiveTab('publish_jobs')}
                  className={`py-2 px-1 text-center rounded-xl text-[10.5px] font-black uppercase tracking-wider transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'publish_jobs'
                      ? 'bg-white text-teal-800 shadow-md border border-slate-200/20 font-black'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Briefcase size={13} className={activeTab === 'publish_jobs' ? 'text-emerald-600' : 'text-slate-400'} />
                  <span className="truncate">{lang === 'bn' ? 'পাবলিশড কাজ' : 'Published'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('broker_history')}
                  className={`py-2 px-1 text-center rounded-xl text-[10.5px] font-black uppercase tracking-wider transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'broker_history'
                      ? 'bg-white text-teal-800 shadow-md border border-slate-200/20 font-black'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Clock size={13} className={activeTab === 'broker_history' ? 'text-indigo-600 font-bold' : 'text-slate-400'} />
                  <span className="truncate">{lang === 'bn' ? `হিস্ট্রি (${myOffers.length})` : `History (${myOffers.length})`}</span>
                </button>
              </div>

              {/* Check if subscription is expired - Enforce Renewal/Paywall */}
              {isExpired ? (
                <div className="bg-amber-50 border border-amber-200 p-5 rounded-3xl space-y-4 shadow-xs animate-scale-up">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-amber-100 rounded-xl text-amber-600 shrink-0">
                      <Shield size={22} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-amber-900 leading-tight">
                        {lang === 'bn' ? '⚠️ আপনার ৩০ দিনের প্রিমিয়াম সাবস্ক্রিপশন শেষ হয়েছে!' : '⚠️ Your 30-Day Premium Subscription Expired!'}
                      </h4>
                      <p className="text-[11px] font-bold text-amber-800/80 leading-relaxed">
                        {lang === 'bn' 
                          ? 'দালাল পোর্টাল সক্রিয় রাখতে, নতুন কাজ পোস্ট করতে এবং কোম্পানিগুলোর রিক্রুটমেন্ট অফারগুলো দেখতে অনুগ্রহ করে ৩০ দিনের জন্য মাত্র ৪৯ টাকা পেমেন্ট সম্পন্ন করুন। আপনার পূর্বের সকল তথ্য আজীবনের জন্য সুরক্ষিত থাকবে।' 
                          : 'To keep your broker portal active, publish new jobs, and view recruitment offers, please pay 49 BDT to renew for 30 days. All your data remains safely stored for lifetime.'}
                      </p>
                    </div>
                  </div>

                  {/* UPI Gateway */}
                  <div className="bg-white p-4 rounded-xl border border-amber-200/60 space-y-3.5">
                    <h5 className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                      <Coins size={14} className="text-amber-500" />
                      {lang === 'bn' ? 'পেমেন্ট করুন (৪৯ টাকা / ৩০ দিন):' : 'Make Payment (49 BDT / 30 Days):'}
                    </h5>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRenewPaymentMethod('phonepe')}
                        className={`p-2 rounded-xl border font-black text-[10px] flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          renewPaymentMethod === 'phonepe'
                            ? 'border-purple-600 bg-purple-50 text-purple-700'
                            : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        PhonePe
                      </button>
                      <button
                        type="button"
                        onClick={() => setRenewPaymentMethod('gpay')}
                        className={`p-2 rounded-xl border font-black text-[10px] flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          renewPaymentMethod === 'gpay'
                            ? 'border-teal-600 bg-teal-50 text-teal-700'
                            : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        Google Pay
                      </button>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl text-center space-y-2">
                      <p className="text-[10px] font-bold text-slate-500">
                        {lang === 'bn' ? 'নিচের লিংকে ক্লিক করে পেমেন্ট করুন অথবা UPI ID-তে ৪৯ টাকা পাঠান:' : 'Click below to pay or send 49 BDT to the UPI ID:'}
                      </p>
                      <p className="text-xs font-black text-slate-800 bg-white border border-slate-100 py-1.5 px-2 rounded-md inline-block select-all">
                        paytm.sreexpress@paytm
                      </p>
                      <div>
                        <a
                          href="upi://pay?pa=paytm.sreexpress@paytm&pn=SRExpress&am=49&cu=INR"
                          className="inline-flex items-center gap-1 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-[10px] font-black tracking-wide shadow-xs"
                        >
                          {lang === 'bn' ? '📲 সরাসরি পেমেন্ট অ্যাপ খুলুন' : '📲 Open Payment App'}
                        </a>
                      </div>
                    </div>

                    <form onSubmit={handleRenewSubscription} className="space-y-3 pt-1">
                      <div>
                        <label className="block text-[9.5px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                          {lang === 'bn' ? 'পেমেন্ট সম্পন্ন করার পর ১২-ডিজিটের UTR / Transaction ID দিন:' : 'After payment, enter the 12-digit UTR / Transaction ID:'}
                        </label>
                        <input
                          type="text"
                          maxLength={12}
                          value={renewUtrNumber}
                          onChange={(e) => setRenewUtrNumber(e.target.value.replace(/[^0-9]/g, ''))}
                          placeholder="e.g. 340981234567"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-amber-500"
                          required
                        />
                      </div>

                      {renewStatusText && (
                        <p className="text-[10px] font-black text-rose-600 bg-rose-50 p-2.5 rounded-lg">
                          {renewStatusText}
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={isRenewing}
                        className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-black rounded-lg transition-all shadow-md shadow-amber-100 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        {isRenewing ? (
                          <span>{lang === 'bn' ? 'যাচাই করা হচ্ছে...' : 'Verifying...'}</span>
                        ) : (
                          <>
                            <Check size={14} />
                            <span>{lang === 'bn' ? 'পেমেন্ট নিশ্চিত করুন এবং পোর্টাল সচল করুন' : 'Confirm Payment & Active Portal'}</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                <>
                  {/* 📂 Option 1 content: Company Direct Recruitment offers */}
                  {activeTab === 'recruitment_offers' && (
                    <div className="space-y-4 animate-scale-up">
                      <div className="flex items-center justify-between border-b border-slate-200/50 pb-2">
                        <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <Bell size={14} className="text-teal-600 animate-swing" />
                          {lang === 'bn' ? 'কোম্পানি থেকে সরাসরি আসা কাজের অফার সমূহ' : 'Corporate Recruitment requests directed to you'}
                        </h3>
                        <span className="text-[10px] font-black bg-teal-100 text-teal-800 px-2.5 py-0.5 rounded-full">
                          {pendingOffers.length} {lang === 'bn' ? 'টি অফার' : 'Offers'}
                        </span>
                      </div>

                      {pendingOffers.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                          <p className="text-xs text-slate-400 font-extrabold">
                            {lang === 'bn' ? '📭 এখন পর্যন্ত কোনো কোম্পানি থেকে সরাসরি নতুন কাজের রিকোয়েস্ট আসেনি।' : '📭 No direct corporate offers received yet.'}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-2">
                            {lang === 'bn' ? 'নিয়োগকারী কোনো কোম্পানি যখন আপনার স্পেশাল কাজের অফার সিলেক্ট করবে, তখন এখানে আসবে।' : 'Corporate leads targeting your selected roles will be listed here.'}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {pendingOffers.map((offer) => {
                            const isPublished = publishedOffers.includes(offer.id);
                            
                            // Extract values for a comprehensive detail panel
                            const companyName = offer.companyName || offer.text.split('"')?.[1] || (lang === 'bn' ? 'নিয়োগকারী কোম্পানি' : 'Sourcing Company');
                            
                            let extractedJobTitle = offer.jobTitle;
                            if (!extractedJobTitle && offer.text) {
                              const matches = offer.text.match(/"([^"]+)"/g);
                              if (matches && matches.length > 1) {
                                extractedJobTitle = matches[1].replace(/"/g, '');
                              } else if (matches && matches.length > 0) {
                                extractedJobTitle = matches[0].replace(/"/g, '');
                              }
                            }
                            const finalJobTitle = extractedJobTitle || (lang === 'bn' ? 'সাধারণ কর্মী' : 'General Worker');
                            const genderLabel = offer.requiredGender === 'male'
                              ? (lang === 'bn' ? 'পুরুষ' : 'Male')
                              : offer.requiredGender === 'female'
                                ? (lang === 'bn' ? 'মহিলা' : 'Female')
                                : (lang === 'bn' ? 'যেকোনো' : 'Any');

                            return (
                              <div 
                                key={offer.id}
                                className={`bg-white p-5 rounded-3xl border shadow-sm transition-all overflow-hidden ${
                                  isPublished 
                                    ? 'border-slate-200/80 bg-slate-50/70 opacity-75' 
                                    : 'border-teal-100 hover:border-teal-200 bg-gradient-to-br from-white to-teal-50/10'
                                }`}
                              >
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                                  <span className="text-[10px] font-black uppercase text-teal-700 bg-teal-100 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                                    💼 {lang === 'bn' ? 'কোম্পানি সোর্সিং অফার' : 'Sourcing Lead'}
                                  </span>
                                  <span className="text-[9px] text-slate-400 font-bold">{offer.time || 'Recent'}</span>
                                </div>

                                <div className="space-y-4">
                                  {/* Title & Company Name */}
                                  <div className="space-y-1 text-left">
                                    <h4 className="text-sm font-black text-slate-800 flex items-center gap-1.5 leading-tight">
                                      ✨ {finalJobTitle}
                                    </h4>
                                    <p className="text-xs font-extrabold text-slate-500 flex items-center gap-1">
                                      🏢 {companyName}
                                    </p>
                                  </div>

                                  {/* Full Sourcing Parameters Grid */}
                                  <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left">
                                    <div className="space-y-1">
                                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
                                        👥 {lang === 'bn' ? 'প্রয়োজনীয় কর্মী সংখ্যা' : 'Workers Needed'}
                                      </span>
                                      <span className="text-xs font-bold text-slate-700 block">
                                        {offer.workerCount || 1} {lang === 'bn' ? 'জন' : 'workers'}
                                      </span>
                                    </div>

                                    <div className="space-y-1">
                                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
                                        ⚧️ {lang === 'bn' ? 'প্রয়োজনীয় জেন্ডার' : 'Required Gender'}
                                      </span>
                                      <span className="text-xs font-bold text-slate-700 block">
                                        {genderLabel}
                                      </span>
                                    </div>

                                    <div className="space-y-1">
                                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
                                        📅 {lang === 'bn' ? 'নিয়োগের তারিখ' : 'Reporting Date'}
                                      </span>
                                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                                        <Calendar size={12} className="text-teal-600 shrink-0" />
                                        {offer.requiredDate || (lang === 'bn' ? 'আজই' : 'Today')}
                                      </span>
                                    </div>

                                    <div className="space-y-1">
                                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
                                        🕒 {lang === 'bn' ? 'ডিউটি ও সময়' : 'Shift Timing'}
                                      </span>
                                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                                        <Clock size={12} className="text-teal-600 shrink-0" />
                                        {offer.shiftStartTime ? `${offer.shiftStartTime} - ${offer.shiftEndTime}` : (lang === 'bn' ? 'স্বাভাবিক শিফট' : 'Normal shift')}
                                        {offer.totalWorkHours ? ` (${offer.totalWorkHours}h)` : ''}
                                      </span>
                                    </div>

                                    <div className="space-y-1">
                                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
                                        💵 {lang === 'bn' ? 'কর্মী দৈনিক মজুরি' : 'Worker Wage'}
                                      </span>
                                      <span className="text-xs font-extrabold text-teal-700 block">
                                        {offer.workerWage || 0} BDT / {lang === 'bn' ? 'দিন' : 'day'}
                                      </span>
                                    </div>

                                    <div className="space-y-1">
                                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
                                        🪙 {lang === 'bn' ? 'দালালি কমিশন/ফি' : 'Your Broker Charge'}
                                      </span>
                                      <span className="text-xs font-extrabold text-indigo-700 block">
                                        {offer.brokerCharge || 0} BDT
                                      </span>
                                    </div>

                                    {offer.workLocation && (
                                      <div className="col-span-2 space-y-1 border-t border-slate-100 pt-2.5 mt-1 text-left">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
                                          📍 {lang === 'bn' ? 'কাজের স্থান' : 'Work Location'}
                                        </span>
                                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1 leading-tight">
                                          <MapPin size={12} className="text-teal-600 shrink-0" />
                                          {offer.workLocation}
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Photos uploaded by company (if any) */}
                                  {offer.uploadedPhotos && offer.uploadedPhotos.length > 0 && (
                                    <div className="space-y-1.5 text-left">
                                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
                                        📸 {lang === 'bn' ? 'সাইটের ছবি সমূহ' : 'Worksite Photos'}
                                      </span>
                                      <div className="flex gap-2 overflow-x-auto pb-1">
                                        {offer.uploadedPhotos.map((photo: string, idx: number) => (
                                          <img
                                            key={idx}
                                            src={photo}
                                            alt={`worksite-${idx}`}
                                            referrerPolicy="no-referrer"
                                            className="w-16 h-16 object-cover rounded-xl border border-slate-200 bg-slate-50 shrink-0 shadow-xs"
                                          />
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Full Request Text Description fallback */}
                                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-[11px] font-bold text-slate-600 leading-relaxed text-left">
                                    ℹ️ {offer.text}
                                  </div>
                                </div>

                                {/* Three-Way Action Panel */}
                                <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 pt-4 text-left">
                                  <div className="text-xs font-black text-slate-700">
                                    💵 {lang === 'bn' ? `মোট সোর্সিং ফি: ${offer.brokerCharge || 0} BDT` : `Sourcing Fee: ${offer.brokerCharge || 0} BDT`}
                                  </div>
                                  
                                  <div className="flex flex-wrap gap-2.5 justify-end">
                                    {/* Call Button (Direct to employer) */}
                                    <a
                                      href={`tel:${offer.companyPhone}`}
                                      className="px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-colors"
                                      title={lang === 'bn' ? 'কোম্পানিকে সরাসরি কল করুন' : 'Call Employer Sourcing Desk'}
                                    >
                                      📞 {lang === 'bn' ? 'কোম্পানি কল' : 'Call Employer'}
                                    </a>

                                    {/* Reject Button */}
                                    {!isPublished && (
                                      <button
                                        onClick={() => handleRejectOffer(offer.id)}
                                        className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-colors"
                                      >
                                        ❌ {lang === 'bn' ? 'রিজেক্ট করুন' : 'Reject'}
                                      </button>
                                    )}

                                    {/* Accept & Publish Button */}
                                    {isPublished ? (
                                      <button
                                        disabled
                                        className="px-4 py-2.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-xs font-black flex items-center gap-1.5"
                                      >
                                        <Check size={14} />
                                        {lang === 'bn' ? 'অলরেডি পাবলিশড' : 'Already Published'}
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleAcceptClick(offer)}
                                        className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-colors shadow-md hover:shadow-teal-100"
                                      >
                                        📢 {lang === 'bn' ? 'একসেপ্ট ও পোস্ট' : 'Accept & Publish'}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 📂 Option 2 content: Accept, Publish, Custom jobs and recruiting */}
                  {activeTab === 'publish_jobs' && (
                    <div className="space-y-6 animate-scale-up">
                      
                      {/* Header bar */}
                      <div className="flex items-center justify-between border-b border-slate-200/50 pb-2">
                        <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <Briefcase size={14} className="text-emerald-600" />
                          {lang === 'bn' ? 'কাজ পাবলিশ ও কর্মী রিক্রুটমেন্ট' : 'Publish jobs & recruit workers'}
                        </h3>
                        {!isPostingCustom && (
                          <button
                            onClick={() => setIsPostingCustom(true)}
                            className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                          >
                            <Plus size={14} />
                            <span>{lang === 'bn' ? 'কাস্টম কাজ পোস্ট করুন' : 'Post Custom Job'}</span>
                          </button>
                        )}
                      </div>

                      {/* Custom Job Post Form */}
                      {isPostingCustom && (
                        <form onSubmit={handlePostCustomJob} className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-md space-y-4 animate-scale-up text-left">
                          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                            <h4 className="text-sm font-black text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
                              <Plus size={16} className="text-teal-600" />
                              {lang === 'bn' ? 'নতুন কাস্টম কাজ পোস্ট করুন' : 'Create Custom Job Posting'}
                            </h4>
                            <button type="button" onClick={() => setIsPostingCustom(false)} className="text-slate-400 hover:text-slate-600 w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center">
                              <X size={16} />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                                {lang === 'bn' ? 'কাজের নাম / পদবী *' : 'Job Title *'}
                              </label>
                              <input
                                type="text"
                                value={customTitle}
                                onChange={(e) => setCustomTitle(e.target.value)}
                                placeholder="e.g. Delivery boy / Factory Loader"
                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-teal-500"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                                {lang === 'bn' ? 'নিয়োগকারী কোম্পানি (ঐচ্ছিক)' : 'Company (Optional)'}
                              </label>
                              <input
                                type="text"
                                value={customCompany}
                                onChange={(e) => setCustomCompany(e.target.value)}
                                placeholder="e.g. SR Express / Sourcing agency"
                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-teal-500"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                                {lang === 'bn' ? 'দৈনিক/মাসিক মজুরি (BDT) *' : 'Wage/Salary (BDT) *'}
                              </label>
                              <input
                                type="text"
                                value={customWage}
                                onChange={(e) => setCustomWage(e.target.value)}
                                placeholder="e.g. 800 BDT / day"
                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-teal-500"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                                {lang === 'bn' ? 'কাজ সম্পূর্ণ করার ঠিকানা *' : 'Work Landmark Address *'}
                              </label>
                              <input
                                type="text"
                                value={customLocation}
                                onChange={(e) => setCustomLocation(e.target.value)}
                                placeholder="e.g. Mirpur 11, Dhaka"
                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-teal-500"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                                {lang === 'bn' ? 'ডিউটি ঘন্টা' : 'Duty Hours'}
                              </label>
                              <select
                                value={customHours}
                                onChange={(e) => setCustomHours(e.target.value)}
                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-teal-500"
                              >
                                <option value="8">8 hrs</option>
                                <option value="9">9 hrs</option>
                                <option value="10">10 hrs</option>
                                <option value="12">12 hrs</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                              {lang === 'bn' ? 'কাজের বিবরণ ও যোগ্যতা' : 'Job Details & Skills required'}
                            </label>
                            <textarea
                              value={customDesc}
                              onChange={(e) => setCustomDesc(e.target.value)}
                              placeholder="e.g. Need experience loader..."
                              rows={3}
                              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-teal-500"
                            />
                          </div>

                          <button
                            type="submit"
                            className="w-full py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-colors"
                          >
                            📢 {lang === 'bn' ? 'পাবলিক বোর্ডে পোস্ট নিশ্চিত করুন' : 'Publish to Live Job Board'}
                          </button>
                        </form>
                      )}

                      {/* Your Published Jobs Grid */}
                      <div className="space-y-4">
                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">
                          📋 {lang === 'bn' ? 'আপনার লাইভ পাবলিশ করা কাজ সমূহ:' : 'Your Live Published Jobs on the Board:'}
                        </h4>

                        {loadingJobs ? (
                          <div className="text-center py-6">
                            <p className="text-xs text-slate-400 font-bold">{lang === 'bn' ? 'লোড হচ্ছে...' : 'Loading...'}</p>
                          </div>
                        ) : myPublishedJobs.length === 0 ? (
                          <div className="text-center py-10 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                            <p className="text-xs text-slate-400 font-extrabold">
                              {lang === 'bn' ? '📦 আপনার পোস্ট করা কোনো কাজ সচল নেই।' : '📦 No active jobs posted by you.'}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1">
                              {lang === 'bn' ? 'কোম্পানি রিক্রুটমেন্ট একসেপ্ট করে অথবা নতুন কাস্টম কাজ পোস্ট করে এখানে দেখতে পারবেন।' : 'Accept company recruitment leads or post custom jobs to show them here.'}
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {myPublishedJobs.map((job) => (
                              <div key={job.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
                                <div className="space-y-2">
                                  <div className="flex justify-between items-start gap-2">
                                    <h5 className="text-xs font-black text-slate-800 leading-tight">
                                      {job.title}
                                    </h5>
                                    <button
                                      onClick={() => handleDeleteJob(job.id)}
                                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                      title={lang === 'bn' ? 'কাজটি মুছুন' : 'Delete Job'}
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                  
                                  <p className="text-[10.5px] font-semibold text-slate-500 flex items-center gap-1">
                                    🏢 {job.company}
                                  </p>
                                  <p className="text-[10.5px] font-semibold text-slate-500 flex items-center gap-1">
                                    💵 {job.salary}
                                  </p>
                                  <p className="text-[10.5px] font-semibold text-slate-500 flex items-center gap-1">
                                    📍 {job.location}
                                  </p>
                                  {job.time && (
                                    <p className="text-[10px] font-medium text-slate-400">
                                      🕒 {job.time}
                                    </p>
                                  )}

                                  <div className="mt-2.5 space-y-1.5">
                                    <div className="flex items-center justify-between text-[10px] font-black text-indigo-700 bg-indigo-50/50 border border-indigo-100 rounded-xl px-2.5 py-1.5">
                                      <span>👀 {lang === 'bn' ? 'দালাল ভিউ (কতজন দেখল):' : 'Broker Views (Total Views):'}</span>
                                      <span className="bg-emerald-100 text-emerald-850 font-bold px-2 py-0.5 rounded-lg flex items-center gap-1">
                                        👁️ {getJobViewCount(job)}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] font-black text-indigo-700 bg-indigo-50/50 border border-indigo-100 rounded-xl px-2.5 py-1.5">
                                      <span>📞 {lang === 'bn' ? 'কল অপশন (কতজন কল করল):' : 'Calls Made (Total Calls):'}</span>
                                      <span className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-lg flex items-center gap-1">
                                        📞 {getJobCallCount(job)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                
                                {isJobExpired(job) ? (
                                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-black text-rose-600 bg-rose-50/50 border border-rose-100 px-2.5 py-1.5 rounded-lg">
                                    <span>🛑 {lang === 'bn' ? 'টাইম আউট (অটোমেটিক প্রাইভেট)' : 'TIMEOUT (Auto Private)'}</span>
                                    <span className="text-[9px] text-slate-400 font-bold">
                                      {new Date(job.createdAt || Date.now()).toLocaleDateString()}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-extrabold text-teal-600 bg-teal-50/30 px-2.5 py-1.5 rounded-lg">
                                    <span>✓ {lang === 'bn' ? 'পাবলিক বোর্ডে লাইভ আছে' : 'Live on Public Board'}</span>
                                    <span className="text-[9px] text-slate-400 font-bold">
                                      {new Date(job.createdAt || Date.now()).toLocaleDateString()}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Option helper text */}
                      {myOffers.length > 0 && (
                        <div className="bg-emerald-50/30 border border-emerald-100 p-5 rounded-2xl space-y-3 text-left">
                          <h4 className="text-xs font-black text-emerald-800 flex items-center gap-1.5 uppercase tracking-wider">
                            <Sparkles size={14} className="text-emerald-600" />
                            {lang === 'bn' ? 'সহজে কাজ নিয়ে পোস্ট করুন' : 'Accept Corporate Sourcing Leads'}
                          </h4>
                          <p className="text-[11px] font-bold text-emerald-700/80 leading-relaxed">
                            {lang === 'bn' 
                              ? 'আপনার ড্যাশবোর্ডে আসা যেকোনো রিক্রুটমেন্ট অফারকে একসেপ্ট করে আপনার অধীনে পাবলিক বোর্ডে কাজ পোস্ট করতে "কোম্পানি কাজের অফার" ট্যাবে গিয়ে "পাবলিক বোর্ডে পাবলিশ করুন" বাটনে চাপুন।' 
                              : 'To accept corporate sourcing requests and instantly publish them to search for active workers under your brand name, go to the Company Offers tab and click "Publish to Board".'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 📂 Option 3 content: Broker History / হিস্ট্রি */}
                  {activeTab === 'broker_history' && (
                    <div className="space-y-4 animate-scale-up">
                      <div className="flex flex-col gap-1 border-b border-slate-200/50 pb-3 text-left">
                        <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <Clock size={14} className="text-indigo-600" />
                          {lang === 'bn' ? 'দালালের সোর্সিং ও কাজের হিস্ট্রি রেকর্ড' : 'Broker Sourcing & Job History Record'}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold leading-normal">
                          {lang === 'bn' 
                            ? 'কোম্পানিগুলো থেকে আসা নিয়োগ অনুরোধ, একসেপ্ট/রিজেক্ট রেকর্ড এবং কাস্টম কাজের লাইভ পারফরম্যান্স ও কল ট্র্যাক হিস্ট্রি এখানে সংরক্ষিত থাকে।' 
                            : 'All incoming recruitment requests, acceptances/rejections, and custom job performance and call tracking history are stored here.'}
                        </p>
                      </div>

                      {(() => {
                        const historyItems: any[] = [];

                        // 1. Add processed corporate recruitment offers (accepted or rejected)
                        myOffers.forEach(offer => {
                          if (offer.status === 'accepted' || offer.status === 'rejected') {
                            const correspondingJob = myPublishedJobs.find((j: any) => j.recruitmentId === offer.id);
                            const dateToUse = offer.actedAt || offer.createdAt || Date.now();
                            const views = correspondingJob ? getJobViewCount(correspondingJob) : 0;
                            const calls = correspondingJob ? getJobCallCount(correspondingJob) : 0;
                            
                            historyItems.push({
                              type: 'recruitment_offer',
                              id: offer.id,
                              title: offer.jobTitle || (lang === 'bn' ? 'সাধারণ কর্মী' : 'General Worker'),
                              companyName: offer.companyName || (lang === 'bn' ? 'নিয়োগকারী কোম্পানি' : 'Sourcing Company'),
                              companyPhone: offer.companyPhone,
                              location: offer.workLocation || offer.location || 'N/A',
                              workerCount: offer.workerCount || 1,
                              gender: offer.requiredGender,
                              wage: offer.workerWage || 0,
                              commission: offer.brokerCharge || 0,
                              status: offer.status,
                              timestamp: dateToUse,
                              views,
                              calls,
                              text: offer.text,
                              correspondingJob
                            });
                          }
                        });

                        // 2. Add directly published custom jobs
                        myPublishedJobs.forEach(job => {
                          // Only if not linked to an offer (to avoid duplication)
                          if (!job.recruitmentId) {
                            const dateToUse = job.createdAt || Date.now();
                            const views = getJobViewCount(job);
                            const calls = getJobCallCount(job);
                            
                            historyItems.push({
                              type: 'custom_job',
                              id: job.id,
                              title: job.title,
                              companyName: job.company,
                              companyPhone: job.phone || job.brokerPhone,
                              location: job.location,
                              salary: job.salary,
                              time: job.time,
                              description: job.description,
                              status: 'published',
                              timestamp: dateToUse,
                              views,
                              calls
                            });
                          }
                        });

                        // Sort by timestamp descending
                        historyItems.sort((a, b) => b.timestamp - a.timestamp);

                        // Calculate total aggregate views & calls
                        const totalViews = historyItems.reduce((sum, item) => sum + (item.views || 0), 0);
                        const totalCalls = historyItems.reduce((sum, item) => sum + (item.calls || 0), 0);

                        // Group by Localized Date String
                        const groups: { [dateStr: string]: any[] } = {};
                        historyItems.forEach(item => {
                          const dateStr = new Date(item.timestamp).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
                            year: 'numeric', month: 'long', day: 'numeric'
                          });
                          if (!groups[dateStr]) {
                            groups[dateStr] = [];
                          }
                          groups[dateStr].push(item);
                        });

                        return (
                          <div className="space-y-6 text-left">
                            {/* 💳 Payment Transaction History / পেমেন্ট ট্রানজেকশন হিস্ট্রি */}
                            <div className="bg-slate-50 border border-slate-150 p-4 rounded-3xl space-y-3 text-left">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                                  <Coins size={14} className="text-amber-500" />
                                  {lang === 'bn' ? 'মেম্বারশিপ পেমেন্ট হিস্ট্রি ও রেকর্ড' : 'Membership Payment History'}
                                </h4>
                                <span className="text-[9px] font-black bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                                  {paymentsHistory.length} {lang === 'bn' ? 'টি পেমেন্ট' : 'payments'}
                                </span>
                              </div>

                              {loadingPayments ? (
                                <div className="text-center py-4 text-xs font-bold text-slate-400">
                                  {lang === 'bn' ? 'পেমেন্ট রেকর্ড লোড করা হচ্ছে...' : 'Loading payment records...'}
                                </div>
                              ) : paymentsHistory.length === 0 ? (
                                <div className="text-center py-4 text-[10px] text-slate-400 font-extrabold bg-white rounded-2xl border border-slate-100 p-3">
                                  {lang === 'bn' ? '💳 এখনো কোনো পেমেন্ট রেকর্ড নেই।' : '💳 No payment records found yet.'}
                                </div>
                              ) : (
                                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-none">
                                  {paymentsHistory.map((pay: any) => {
                                    const dateStr = new Date(pay.timestamp).toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US', {
                                      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                    });
                                    const isSuccess = pay.status === 'success';
                                    const isPending = pay.status === 'pending';

                                    return (
                                      <div key={pay.id} className="bg-white p-3 rounded-2xl border border-slate-150 shadow-3xs space-y-2 relative">
                                        <div className="flex items-center justify-between border-b border-slate-100/60 pb-1.5">
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-[10px] font-black text-indigo-900 select-all font-mono">
                                              #{pay.orderId || 'BKK-PAY'}
                                            </span>
                                          </div>
                                          <div>
                                            {isSuccess ? (
                                              <span className="text-[9px] font-black bg-emerald-50 text-emerald-700 border border-emerald-150 px-2 py-0.5 rounded-md">
                                                {lang === 'bn' ? 'সফল (সক্রিয়)' : 'SUCCESS'}
                                              </span>
                                            ) : isPending ? (
                                              <span className="text-[9px] font-black bg-amber-50 text-amber-700 border border-amber-150 px-2 py-0.5 rounded-md animate-pulse">
                                                {lang === 'bn' ? 'পেন্ডিং' : 'PENDING'}
                                              </span>
                                            ) : (
                                              <span className="text-[9px] font-black bg-rose-50 text-rose-700 border border-rose-150 px-2 py-0.5 rounded-md">
                                                {lang === 'bn' ? 'রিজেক্টেড' : 'REJECTED'}
                                              </span>
                                            )}
                                          </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] font-bold text-slate-500">
                                          <div>
                                            <span className="text-slate-400">{lang === 'bn' ? 'তারিখ ও সময়:' : 'Date & Time:'}</span> <span className="text-slate-700">{dateStr}</span>
                                          </div>
                                          <div>
                                            <span className="text-slate-400">{lang === 'bn' ? 'পদ্ধতি:' : 'Method:'}</span> <span className="text-slate-700 uppercase">{pay.paymentMethod || 'phonepe'}</span>
                                          </div>
                                          <div className="col-span-2">
                                            <span className="text-slate-400">UTR:</span> <span className="text-indigo-800 font-mono select-all font-black">{pay.utr}</span>
                                          </div>
                                          <div className="col-span-2">
                                            <span className="text-slate-400">{lang === 'bn' ? 'পরিমাণ:' : 'Amount:'}</span> <span className="text-emerald-600 font-extrabold">{pay.amount || 49} BDT</span>
                                          </div>
                                        </div>

                                        {!isSuccess && (pay.errorMessageBn || pay.errorMessage) && (
                                          <p className="text-[10px] font-extrabold text-rose-700 bg-rose-50/70 border border-rose-100 p-2 rounded-xl leading-relaxed">
                                            ❌ {lang === 'bn' ? pay.errorMessageBn : pay.errorMessage}
                                          </p>
                                        )}

                                        {onOpenHelpCenterWithText && (
                                          <div className="flex justify-end pt-0.5 border-t border-slate-50 mt-1">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const queryText = lang === 'bn' 
                                                  ? `আমার পেমেন্ট UTR নম্বর ${pay.utr} এবং অর্ডার আইডি ${pay.orderId} কেন রিজেক্ট বা ব্যর্থ হলো দয়া করে বিস্তারিত জানাও এবং আমি কিভাবে এটি সমাধান করব?`
                                                  : `My payment with UTR ${pay.utr} and Order ID ${pay.orderId} was rejected. Why did it fail and how can I resolve this issue?`;
                                                onOpenHelpCenterWithText(queryText);
                                              }}
                                              className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-md text-[9px] font-black flex items-center gap-0.5 cursor-pointer transition-all active:scale-95"
                                            >
                                              🤖 {lang === 'bn' ? 'এআই হেল্প সেন্টার' : 'Ask AI Support'}
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            {/* Job History Section Header */}
                            <div className="border-t border-slate-100 pt-4 mt-2">
                              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                                <Briefcase size={14} className="text-indigo-600" />
                                {lang === 'bn' ? 'কাজের সোর্সিং ও পাবলিশ হিস্ট্রি রেকর্ড' : 'Sourcing & Publishing History'}
                              </h4>
                            </div>

                            {historyItems.length === 0 ? (
                              <div className="text-center py-8 bg-white rounded-3xl border border-slate-100 p-6 shadow-3xs">
                                <p className="text-xs text-slate-400 font-extrabold">
                                  {lang === 'bn' ? '📭 এখন পর্যন্ত কোনো কাজের হিস্ট্রি রেকর্ড পাওয়া যায়নি।' : '📭 No work history records found yet.'}
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                {/* Combined Performance Analytics Dashboard */}
                                <div className="grid grid-cols-3 gap-2 bg-slate-50 border border-slate-150 p-3 rounded-2xl">
                                  <div className="bg-white border border-slate-100 p-2.5 rounded-xl text-center shadow-xs">
                                    <span className="text-[8px] font-black text-slate-400 block uppercase tracking-wider">{lang === 'bn' ? 'মোট কাজ/অফার' : 'Total Works'}</span>
                                    <span className="text-xs font-black text-slate-700 block mt-0.5">📂 {historyItems.length}</span>
                                  </div>
                                  <div className="bg-white border border-slate-100 p-2.5 rounded-xl text-center shadow-xs">
                                    <span className="text-[8px] font-black text-emerald-500 block uppercase tracking-wider">{lang === 'bn' ? 'মোট ভিউজ' : 'Total Views'}</span>
                                    <span className="text-xs font-black text-emerald-600 block mt-0.5">👁️ {totalViews}</span>
                                  </div>
                                  <div className="bg-white border border-slate-100 p-2.5 rounded-xl text-center shadow-xs">
                                    <span className="text-[8px] font-black text-blue-500 block uppercase tracking-wider">{lang === 'bn' ? 'মোট কল' : 'Total Calls'}</span>
                                    <span className="text-xs font-black text-blue-600 block mt-0.5">📞 {totalCalls}</span>
                                  </div>
                                </div>

                            {/* Grouped Lists */}
                            {Object.entries(groups).map(([dateStr, items]) => (
                              <div key={dateStr} className="space-y-3 text-left">
                                <div className="flex items-center gap-2 border-b border-slate-100 pb-1 mt-4">
                                  <span className="text-[11px] font-black text-indigo-900 bg-indigo-50 border border-indigo-100/60 px-3 py-1 rounded-full flex items-center gap-1 shadow-2xs">
                                    📅 {dateStr}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-extrabold">
                                    ({items.length} {lang === 'bn' ? 'টি কাজ/অফার' : 'items'})
                                  </span>
                                </div>

                                <div className="space-y-3.5">
                                  {items.map((item) => {
                                    const formattedTimeStr = new Date(item.timestamp).toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US', {
                                      hour: '2-digit', minute: '2-digit'
                                    });

                                    return (
                                      <div 
                                        key={item.id}
                                        className={`bg-white p-4 rounded-2xl border shadow-xs transition-all text-left space-y-3 relative overflow-hidden ${
                                          item.status === 'accepted' 
                                            ? 'border-emerald-200 bg-gradient-to-br from-white to-emerald-50/5' 
                                            : item.status === 'rejected'
                                              ? 'border-rose-150 bg-gradient-to-br from-white to-rose-50/5 opacity-80'
                                              : 'border-blue-200 bg-gradient-to-br from-white to-blue-50/5'
                                        }`}
                                      >
                                        <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                                          <div className="flex items-center gap-1.5">
                                            {item.status === 'accepted' ? (
                                              <span className="text-[9px] font-black uppercase text-emerald-700 bg-emerald-50 border border-emerald-150 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                                                <Check size={11} /> {lang === 'bn' ? 'একসেপ্টেড' : 'Accepted'}
                                              </span>
                                            ) : item.status === 'rejected' ? (
                                              <span className="text-[9px] font-black uppercase text-rose-700 bg-rose-50 border border-rose-150 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                                                <X size={11} /> {lang === 'bn' ? 'রিজেক্টেড' : 'Rejected'}
                                              </span>
                                            ) : (
                                              <span className="text-[9px] font-black uppercase text-blue-700 bg-blue-50 border border-blue-150 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                                                📢 {lang === 'bn' ? 'সরাসরি পাবলিশ' : 'Direct Publish'}
                                              </span>
                                            )}
                                          </div>
                                          <span className="text-[9px] text-slate-400 font-extrabold flex items-center gap-0.5">
                                            🕒 {formattedTimeStr}
                                          </span>
                                        </div>

                                        <div className="space-y-2">
                                          <div className="space-y-0.5">
                                            <h4 className="text-xs font-black text-slate-800 flex items-center gap-1">
                                              ✨ {item.title}
                                            </h4>
                                            <p className="text-[11px] font-black text-slate-500">
                                              🏢 {item.companyName} • 📞 {item.companyPhone}
                                            </p>
                                          </div>

                                          {/* Details / Parameters */}
                                          {item.type === 'recruitment_offer' ? (
                                            <div className="grid grid-cols-2 gap-1.5 bg-slate-50/60 p-2.5 rounded-xl border border-slate-100 text-[11px] font-bold text-slate-600">
                                              <div>👥 {lang === 'bn' ? 'কর্মী:' : 'Workers:'} {item.workerCount} {lang === 'bn' ? 'জন' : 'workers'}</div>
                                              <div>⚧️ {lang === 'bn' ? 'জেন্ডার:' : 'Gender:'} {item.gender === 'male' ? (lang === 'bn' ? 'পুরুষ' : 'Male') : item.gender === 'female' ? (lang === 'bn' ? 'মহিলা' : 'Female') : (lang === 'bn' ? 'যেকোনো' : 'Any')}</div>
                                              <div>💵 {lang === 'bn' ? 'মজুরি:' : 'Wage:'} {item.wage} BDT</div>
                                              <div>🪙 {lang === 'bn' ? 'কমিশন:' : 'Commission:'} {item.commission} BDT</div>
                                              <div className="col-span-2 border-t border-slate-100/50 pt-1 mt-0.5">
                                                📍 {lang === 'bn' ? 'স্থান:' : 'Location:'} {item.location}
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="grid grid-cols-2 gap-1.5 bg-slate-50/60 p-2.5 rounded-xl border border-slate-100 text-[11px] font-bold text-slate-600">
                                              <div>💵 {lang === 'bn' ? 'বেতন:' : 'Salary:'} {item.salary}</div>
                                              <div>🕒 {lang === 'bn' ? 'ডিউটি:' : 'Duty:'} {item.time}</div>
                                              <div className="col-span-2 border-t border-slate-100/50 pt-1 mt-0.5">
                                                📍 {lang === 'bn' ? 'স্থান:' : 'Location:'} {item.location}
                                              </div>
                                            </div>
                                          )}

                                          {item.text && (
                                            <p className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100">
                                              ℹ️ {item.text}
                                            </p>
                                          )}

                                          {/* Performance metrics on the card */}
                                          {(item.status === 'accepted' || item.status === 'published') && (
                                            <div className="mt-2.5 bg-indigo-50/70 border border-indigo-150 rounded-xl p-3.5 space-y-2 text-left shadow-2xs">
                                              <div className="flex items-center justify-between text-[10.5px] font-black text-indigo-900">
                                                <span className="flex items-center gap-1">
                                                  📢 {lang === 'bn' ? 'পাবলিক জব আইডি:' : 'Public Job ID:'}
                                                </span>
                                                <span className="bg-indigo-100 text-indigo-700 font-mono px-2 py-0.5 rounded-md select-all">
                                                  {item.id || `local-${item.timestamp}`.substring(0, 10)}
                                                </span>
                                              </div>
                                              
                                              <div className="grid grid-cols-2 gap-2 border-t border-indigo-100/50 pt-2 mt-1">
                                                <div className="flex flex-col items-center justify-center bg-white border border-emerald-100 rounded-lg py-1.5 px-2 text-center shadow-3xs">
                                                  <span className="text-[9px] font-black text-slate-400 block uppercase">{lang === 'bn' ? 'পোস্ট ভিউ' : 'Views'}</span>
                                                  <span className="text-xs font-black text-emerald-700 block mt-0.5">👁️ {item.views}</span>
                                                </div>
                                                <div className="flex flex-col items-center justify-center bg-white border border-blue-100 rounded-lg py-1.5 px-2 text-center shadow-3xs">
                                                  <span className="text-[9px] font-black text-slate-400 block uppercase">{lang === 'bn' ? 'কল অপশন ক্লিক' : 'Calls'}</span>
                                                  <span className="text-xs font-black text-blue-700 block mt-0.5">📞 {item.calls}</span>
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2 justify-end border-t border-slate-50 pt-2">
                                          <a
                                            href={`tel:${item.companyPhone}`}
                                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 rounded-lg text-[10.5px] font-black flex items-center gap-1 cursor-pointer transition-colors"
                                          >
                                            📞 {lang === 'bn' ? 'কল করুন' : 'Call Contact'}
                                          </a>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </>
              )}

              {/* Early/Extend Renewal Modal Popup */}
              {showRenewModal && (
                <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-[60] p-4 animate-fade-in">
                  <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden p-6 space-y-4 animate-scale-up text-left">
                    
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <h4 className="text-sm font-black text-slate-800 flex items-center gap-1.5 uppercase">
                        <Coins size={16} className="text-amber-500" />
                        {lang === 'bn' ? 'সাবস্ক্রিপশন নবায়ন / মেয়াদ বৃদ্ধি' : 'Renew / Extend Subscription'}
                      </h4>
                      <button 
                        type="button" 
                        onClick={() => {
                          setShowRenewModal(false);
                          setRenewStatusText('');
                        }} 
                        className="text-slate-400 hover:text-slate-600 cursor-pointer w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100 text-[11px] font-semibold text-amber-800">
                      {lang === 'bn' 
                        ? 'আপনার বর্তমান মেয়াদ বাড়াতে বা নবায়ন করতে ৪৯ টাকা পেমেন্ট করে ইউজার ট্রানজেকশন (UTR) আইডি দিয়ে সাবমিট করুন।' 
                        : 'To extend your current expiry or renew, pay 49 BDT and submit your Transaction UTR ID.'}
                    </div>

                    {/* UPI Payment Options */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setRenewPaymentMethod('phonepe')}
                          className={`p-2 rounded-xl border font-black text-[10px] flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            renewPaymentMethod === 'phonepe'
                              ? 'border-purple-600 bg-purple-50 text-purple-700'
                              : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          PhonePe
                        </button>
                        <button
                          type="button"
                          onClick={() => setRenewPaymentMethod('gpay')}
                          className={`p-2 rounded-xl border font-black text-[10px] flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            renewPaymentMethod === 'gpay'
                              ? 'border-teal-600 bg-teal-50 text-teal-700'
                              : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          Google Pay
                        </button>
                      </div>

                      <div className="bg-slate-50 p-3.5 rounded-xl text-center space-y-1.5">
                        <p className="text-[10px] font-bold text-slate-500">
                          {lang === 'bn' ? 'নিচের লিংকে ক্লিক করে পেমেন্ট করুন অথবা UPI ID-তে ৪৯ টাকা পাঠান:' : 'Click below to pay or send 49 BDT to the UPI ID:'}
                        </p>
                        <p className="text-xs font-black text-slate-800 bg-white border border-slate-100 py-1.5 px-2 rounded-md inline-block select-all">
                          paytm.sreexpress@paytm
                        </p>
                        <div>
                          <a
                            href="upi://pay?pa=paytm.sreexpress@paytm&pn=SRExpress&am=49&cu=INR"
                            className="inline-flex items-center gap-1 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-[10px] font-black tracking-wide shadow-xs"
                          >
                            {lang === 'bn' ? '📲 সরাসরি পেমেন্ট অ্যাপ খুলুন' : '📲 Open Payment App'}
                          </a>
                        </div>
                      </div>

                      {isPendingVerification ? (
                        <div className="bg-slate-50 border border-amber-200/60 p-5 rounded-2xl text-center space-y-4">
                          {/* Animated Clock Circle */}
                          <div className="relative w-24 h-24 mx-auto flex items-center justify-center bg-white rounded-full shadow-inner border border-slate-100">
                            <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-t-amber-500 animate-spin"></div>
                            <div className="z-10 text-center select-none">
                              {countdownSeconds === 0 ? (
                                <span className="text-[10px] font-black text-amber-600 uppercase tracking-tight leading-none block">
                                  {lang === 'bn' ? 'প্লিজ ওয়েট' : 'Please Wait'}
                                </span>
                              ) : (
                                <span className="text-xl font-mono font-black text-slate-800 leading-none">
                                  {Math.floor(countdownSeconds / 60).toString().padStart(2, '0')}:
                                  {(countdownSeconds % 60).toString().padStart(2, '0')}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <h5 className="text-xs font-black text-amber-800 uppercase tracking-wider">
                              {countdownSeconds === 0 
                                ? (lang === 'bn' ? '⏳ পেমেন্ট চেক করা হচ্ছে...' : '⏳ Checking Payment Status...')
                                : (lang === 'bn' ? '⏳ পেমেন্ট ভেরিফিকেশন পেন্ডিং...' : '⏳ Payment Verification Pending...')}
                            </h5>
                            <p className="text-[10.5px] font-bold text-slate-500 leading-relaxed px-2">
                              {countdownSeconds === 0
                                ? (lang === 'bn' 
                                  ? 'প্লিজ ওয়েট, পেমেন্ট চেক করা হচ্ছে! ৫ মিনিট সময় শেষ হয়েছে, এডমিন দ্বারা পেমেন্ট কনফার্মেশনের জন্য অনুগ্রহ করে অপেক্ষা করুন। কোনো অবস্থাতেই এই স্ক্রিনটি বন্ধ করবেন না।'
                                  : 'Please wait, checking your payment status! The 5-minute time limit has ended. Please hold on while the admin approves. Do not close this screen.')
                                : (lang === 'bn' 
                                  ? 'আমাদের ব্যাংক মেসেজ সিস্টেমে আপনার এই পেমেন্ট রেকর্ডটি এখনও আসেনি। পেমেন্টটি প্রসেস হতে সাধারণত ১-৫ মিনিট সময় লাগতে পারে। অনুগ্রহ করে কাউন্টডাউন শেষ হওয়া পর্যন্ত অপেক্ষা করুন।'
                                  : 'Your payment has not matched yet. It usually takes 1-5 minutes for the bank SMS to sync. Please do not close this screen.')}
                            </p>
                          </div>

                          {/* Dynamic Live Status Log */}
                          <div className="bg-white p-3 rounded-xl border border-slate-100/80 text-[10.5px] text-left space-y-1.5 font-bold shadow-3xs">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Order ID:</span>
                              <span className="text-indigo-900 font-mono font-black">{pollingOrderId}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">UTR:</span>
                              <span className="text-slate-700 font-mono font-black">{lastCheckedUtr}</span>
                            </div>
                            <div className="flex justify-between items-center border-t border-slate-100/50 pt-1.5 mt-1">
                              <span className="text-slate-400">{lang === 'bn' ? 'স্ট্যাটাস:' : 'Status:'}</span>
                              <span className="text-amber-600 animate-pulse text-[9.5px] uppercase font-black bg-amber-50 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                {lang === 'bn' ? 'সার্ভার সিঙ্ক করছে' : 'Server Syncing'}
                              </span>
                            </div>
                          </div>

                          <p className="text-[9.5px] text-slate-400 font-medium">
                            {lang === 'bn' 
                              ? '💡 ব্যাংক মেসেজ পাওয়ার সাথে সাথেই আপনার অ্যাকাউন্ট স্বয়ংক্রিয়ভাবে সক্রিয় হয়ে যাবে।' 
                              : '💡 As soon as the bank SMS is received, your account will instantly activate.'}
                          </p>
                        </div>
                      ) : (
                        <form onSubmit={handleRenewSubscription} className="space-y-3.5">
                          <div>
                            <label className="block text-[9.5px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                              {lang === 'bn' ? 'পেমেন্ট সম্পন্ন করার পর ১২-ডিজিটের UTR / Transaction ID দিন:' : 'After payment, enter the 12-digit UTR / Transaction ID:'}
                            </label>
                            <input
                              type="text"
                              maxLength={12}
                              value={renewUtrNumber}
                              onChange={(e) => setRenewUtrNumber(e.target.value.replace(/[^0-9]/g, ''))}
                              placeholder="e.g. 340981234567"
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-amber-500"
                              required
                            />
                          </div>

                          {renewStatusText && (
                            <p className="text-[10px] font-black text-amber-800 bg-amber-100/50 p-2 rounded-lg leading-relaxed">
                              {renewStatusText}
                            </p>
                          )}

                          <button
                            type="submit"
                            disabled={isRenewing}
                            className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-black rounded-lg transition-all shadow-md shadow-amber-100 flex items-center justify-center gap-1 cursor-pointer animate-pulse-subtle"
                          >
                            {isRenewing ? (
                              <span>{lang === 'bn' ? 'যাচাই করা হচ্ছে...' : 'Verifying...'}</span>
                            ) : (
                              <>
                                <Check size={14} />
                                <span>{lang === 'bn' ? 'মেয়াদ নবায়ন নিশ্চিত করুন' : 'Confirm Subscription Extension'}</span>
                              </>
                            )}
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Accept & Publish Confirmation Modal with Local Phone Addition/Edit */}
              {showAcceptConfirmModal && selectedOfferToAccept && (
                <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-[60] p-4 animate-fade-in">
                  <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden p-6 space-y-4 animate-scale-up text-left">
                    
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <h4 className="text-sm font-black text-slate-800 flex items-center gap-1.5 uppercase">
                        <Briefcase size={16} className="text-teal-600" />
                        {lang === 'bn' ? 'একসেপ্ট ও পাবলিক পোস্ট কনফার্মেশন' : 'Accept & Publish Confirmation'}
                      </h4>
                      <button 
                        type="button" 
                        onClick={() => {
                          setShowAcceptConfirmModal(false);
                          setSelectedOfferToAccept(null);
                        }} 
                        className="text-slate-400 hover:text-slate-600 cursor-pointer w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="bg-teal-50/50 p-3.5 rounded-2xl border border-teal-100 space-y-1.5">
                      <p className="text-[10px] font-black text-teal-800 uppercase tracking-wide">
                        {lang === 'bn' ? 'কাজের অফার বিবরণ:' : 'Sourcing Offer Details:'}
                      </p>
                      <div className="text-xs font-extrabold text-slate-700 space-y-1">
                        <div>✨ {selectedOfferToAccept.jobTitle || (lang === 'bn' ? 'সাধারণ কর্মী' : 'General Worker')}</div>
                        <div>🏢 {selectedOfferToAccept.companyName || selectedOfferToAccept.company || (lang === 'bn' ? 'কোম্পানি সোর্স' : 'Employer Sourced')}</div>
                        <div>👥 {lang === 'bn' ? 'কর্মী সংখ্যা:' : 'Required Workers:'} {selectedOfferToAccept.workerCount || 1} {lang === 'bn' ? 'জন' : 'workers'}</div>
                        <div>💵 {lang === 'bn' ? 'দৈনিক মজুরি:' : 'Worker Wage:'} {selectedOfferToAccept.workerWage || 0} BDT</div>
                        <div>📍 {lang === 'bn' ? 'স্থান:' : 'Location:'} {selectedOfferToAccept.workLocation || selectedOfferToAccept.location || 'N/A'}</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">
                          {lang === 'bn' ? '📞 আপনার লোকাল ফোন নাম্বারটি দিন (যেটি পাবলিক বোর্ডে দেখানো হবে):' : '📞 Enter your local phone number (to display on the public board):'}
                        </label>
                        <p className="text-[9.5px] text-slate-400 font-medium leading-relaxed mb-2">
                          {lang === 'bn' 
                            ? 'কর্মী সোর্সিং এর জন্য একটি সচল ফোন নাম্বার দিন। পোর্টালে কাজের পোস্টটি এই নাম্বারের অধীনেই পোস্ট হবে এবং কর্মীরা সরাসরি আপনাকে কল করবে।' 
                            : 'Provide an active number. Workers will call this number directly to apply for the job.'}
                        </p>
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-3 text-slate-400" size={14} />
                          <input
                            type="tel"
                            value={brokerLocalPhone}
                            onChange={(e) => setBrokerLocalPhone(e.target.value.replace(/[^0-9]/g, ''))}
                            placeholder="e.g. 01712345678"
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-teal-500"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex gap-2.5 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAcceptConfirmModal(false);
                            setSelectedOfferToAccept(null);
                          }}
                          className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl transition-all cursor-pointer text-center"
                        >
                          {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                        </button>
                        <button
                          type="button"
                          disabled={isSubmittingAcceptance}
                          onClick={() => handlePublishToPublicBoard(selectedOfferToAccept, brokerLocalPhone)}
                          className="flex-2 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-teal-100 flex items-center justify-center gap-1 cursor-pointer"
                        >
                          {isSubmittingAcceptance ? (
                            <span>{lang === 'bn' ? 'পোস্ট করা হচ্ছে...' : 'Posting...'}</span>
                          ) : (
                            <>
                              <Check size={14} />
                              <span>{lang === 'bn' ? 'সেভ ও পোস্ট করুন' : 'Save & Publish Post'}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      </div>

      {/* 🔒 Bottom Persistent Footer */}
      <div className="bg-white border-t border-slate-200 px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
        <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide text-center sm:text-left">
          🛡️ BHARAT KA KAAM BROKER ASSURANCE GATEWAY
        </p>
        <span className="text-[10px] font-black text-teal-600 select-none">
          {lang === 'bn' ? 'নিরাপদ দالاলি ও কাজের নিশ্চয়তা' : 'Secure broker matches'}
        </span>
      </div>

    </div>
  );
}
