import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, MapPin, Globe, User, Phone, Play, Volume2, ShieldCheck, CheckCircle2, Navigation, Compass, ArrowRight, X, AlertCircle } from 'lucide-react';
import { regionsData } from '../data/regions';
import { AppLanguage } from '../types';
import { db, isFirebaseAvailable } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import appLogo from '../assets/images/app_logo_1782990663986.jpg';
import { FastInput } from './FastInput';

// Simple client-side storage for custom video file so it persists across reloads
const openVideoDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("AppVideoDB", 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("videos")) {
        db.createObjectStore("videos");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const savePersistedVideo = async (blob: Blob): Promise<void> => {
  try {
    const db = await openVideoDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("videos", "readwrite");
      const store = transaction.objectStore("videos");
      const request = store.put(blob, "onboarding_video");
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error("IndexedDB save failed:", err);
  }
};

const getPersistedVideo = async (): Promise<Blob | null> => {
  try {
    const db = await openVideoDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("videos", "readonly");
      const store = transaction.objectStore("videos");
      const request = store.get("onboarding_video");
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error("IndexedDB read failed:", err);
    return null;
  }
};

interface OnboardingScreenProps {
  onComplete: (preferences: {
    lang: AppLanguage;
    country: string;
    state: string;
    district: string;
    username: string;
    phone: string;
    role: 'broker' | 'job_seeker' | 'employer' | 'daily_worker';
  }) => void;
  onTriggerLogin?: () => void;
}

const onboardingTranslations: Record<AppLanguage, {
  welcomeDesc: string;
  prefTitle: string;
  prefSub: string;
  chooseLang: string;
  chooseCountry: string;
  stateLabel: string;
  districtLabel: string;
  selectState: string;
  selectDistrict: string;
  btnNext: string;
  footerSecure: string;
  videoTitle: string;
  videoSub: string;
  videoInstruction: string;
  videoSuccess: string;
  profileTitle: string;
  profileSub: string;
  inputNameLabel: string;
  inputNamePlaceholder: string;
  inputPhoneLabel: string;
  inputPhonePlaceholder: string;
  roleSelectLabel: string;
  roleBroker: string;
  roleBrokerDesc: string;
  roleJobSeeker: string;
  roleJobSeekerDesc: string;
  roleEmployer: string;
  roleEmployerDesc: string;
  roleDailyWorker: string;
  roleDailyWorkerDesc: string;
  btnFinish: string;
  alertFillAll: string;
  alertPhoneLength: string;
}> = {
  bn: {
    welcomeDesc: "ভারত এবং বাংলাদেশের সবথেকে বিশ্বস্ত কর্মী ও কোম্পানি সোর্সিং ডিরেক্টরি প্ল্যাটফর্ম।",
    prefTitle: "অ্যাপের ভাষা ও লোকেশন",
    prefSub: "অ্যাপের ভাষা ও আপনার লোকেশন সেট করুন",
    chooseLang: "Choose App Language / ভাষা নির্বাচন করুন",
    chooseCountry: "Choose Country / দেশ নির্বাচন",
    stateLabel: "State / রাজ্য",
    districtLabel: "District / জেলা",
    selectState: "-- Select State / রাজ্য নির্বাচন করুন --",
    selectDistrict: "-- Select District / জেলা নির্বাচন করুন --",
    btnNext: "পরবর্তী ধাপ (Next Step)",
    footerSecure: "🛡️ BHARAT KA KAAM SECURE DIGITAL GATEWAY",
    videoTitle: "ভিডিও নির্দেশনা",
    videoSub: "অ্যাপের কার্যকারিতা ও নির্দেশিকা ভিডিওটি দেখুন",
    videoInstruction: "ভিডিওটি সম্পূর্ণ দেখার পর পরবর্তী বাটনটি স্ক্রিনে প্রদর্শিত হবে।",
    videoSuccess: "✓ ভিডিওটি দেখা সম্পন্ন হয়েছে!",
    profileTitle: "প্রোফাইল তৈরি করুন",
    profileSub: "আপনার আইডি তৈরি করতে নিচের তথ্যগুলো দিন",
    inputNameLabel: "আপনার পূর্ণ নাম",
    inputNamePlaceholder: "যেমন: মোঃ রহিম আলী",
    inputPhoneLabel: "মোবাইল নম্বর (এটি আপনার আইডি)",
    inputPhonePlaceholder: "আপনার ১১ ডিজিটের মোবাইল নম্বর দিন",
    roleSelectLabel: "আপনি এই অ্যাপে কি কাজ করতে চান?",
    roleBroker: "দালালি বা এজেন্ট একাউন্ট (কমিশন এজেন্ট)",
    roleBrokerDesc: "কোম্পানি ও কর্মীদের মাঝে যোগসূত্র তৈরি করে কমিশন আয় করুন।",
    roleJobSeeker: "নতুন কাজ খুঁজতে চাই (চাকরি প্রার্থী)",
    roleJobSeekerDesc: "আপনার স্কিল অনুযায়ী নতুন চাকরি বা কাজ খুঁজে নিন।",
    roleEmployer: "কাজের লোক লাগবে (কোম্পানি/নিয়োগকর্তা)",
    roleEmployerDesc: "আপনার ব্যবসার জন্য দক্ষ কর্মী বা শ্রমিক সরাসরি নিয়োগ দিন।",
    roleDailyWorker: "দৈনিক মজুরি বা ডেলিভারি কাজ",
    roleDailyWorkerDesc: "দৈনিক দিনমজুর বা ডেলিভারি রাইডার হিসেবে কাজের সুযোগ পান।",
    btnFinish: "নিবন্ধন সম্পন্ন করুন ও প্রবেশ করুন",
    alertFillAll: "অনুগ্রহ করে সব তথ্য সঠিক উপায়ে পূরণ করুন।",
    alertPhoneLength: "অনুগ্রহ করে একটি সচল মোবাইল নম্বর প্রদান করুন।"
  },
  en: {
    welcomeDesc: "The most trusted worker and company sourcing directory platform in India.",
    prefTitle: "Language & Location Settings",
    prefSub: "Configure Language & Location Settings",
    chooseLang: "Choose App Language",
    chooseCountry: "Choose Country",
    stateLabel: "State / Division",
    districtLabel: "District",
    selectState: "-- Select State --",
    selectDistrict: "-- Select District --",
    btnNext: "Next Step",
    footerSecure: "🛡️ BHARAT KA KAAM SECURE DIGITAL GATEWAY",
    videoTitle: "App Guideline Video",
    videoSub: "Watch the video instructions carefully to understand how to use this app",
    videoInstruction: "The 'Next' button will appear automatically after you finish watching the video completely.",
    videoSuccess: "✓ Video completed! You can now proceed.",
    profileTitle: "Build Your Profile",
    profileSub: "Enter your information below to create your unique ID",
    inputNameLabel: "Your Full Name",
    inputNamePlaceholder: "e.g., Rahim Ali",
    inputPhoneLabel: "Mobile Number (This is your unique ID)",
    inputPhonePlaceholder: "Enter your 10-11 digit mobile number",
    roleSelectLabel: "What is your primary goal in this app?",
    roleBroker: "Broker / Agent Account (Commission Agent)",
    roleBrokerDesc: "Connect companies with workers and earn commissions securely.",
    roleJobSeeker: "I want to find new jobs (Job Seeker)",
    roleJobSeekerDesc: "Find and apply to the best matches based on your skills.",
    roleEmployer: "I need to hire workers (Employer)",
    roleEmployerDesc: "Hire skilled workers and laborers directly for your business.",
    roleDailyWorker: "Daily Wage or Delivery Jobs",
    roleDailyWorkerDesc: "Get matched with flexible daily wage or delivery roles nearby.",
    btnFinish: "Complete Registration & Enter App",
    alertFillAll: "Please fill all details correctly.",
    alertPhoneLength: "Please enter a valid active phone number."
  },
  hi: {
    welcomeDesc: "भारत और बांग्लादेश में सबसे भरोसेमंद कामगार और कंपनी सोर्सिंग डायरेक्टरी प्लेटफॉर्म।",
    prefTitle: "भाषा और स्थान सेटिंग्स",
    prefSub: "भाषा और अपना स्थान सेट करें",
    chooseLang: "ऐप की भाषा चुनें / Choose App Language",
    chooseCountry: "देश चुनें / Choose Country",
    stateLabel: "राज्य / State",
    districtLabel: "जिला / District",
    selectState: "-- राज्य चुनें / Select State --",
    selectDistrict: "-- जिला चुनें / District --",
    btnNext: "अगला चरण (Next Step)",
    footerSecure: "🛡️ BHARAT KA KAAM SECURE DIGITAL GATEWAY",
    videoTitle: "ऐप मार्गदर्शिका वीडियो",
    videoSub: "यह समझने के लिए वीडियो निर्देशों को ध्यान से देखें कि इस ऐप का उपयोग कैसे करें",
    videoInstruction: "पूरा वीडियो देखने के बाद अगला बटन अपने आप दिखाई देगा।",
    videoSuccess: "✓ वीडियो पूरा हुआ! अब आगे बढ़ें।",
    profileTitle: "अपना प्रोफ़ाइल बनाएं",
    profileSub: "अपनी विशिष्ट आईडी बनाने के लिए नीचे अपनी जानकारी दर्ज करें",
    inputNameLabel: "आपका पूरा नाम",
    inputNamePlaceholder: "उदा: रहीम अली",
    inputPhoneLabel: "मोबाइल नंबर (यह आपकी आईडी है)",
    inputPhonePlaceholder: "अपना मोबाइल नंबर दर्ज करें",
    roleSelectLabel: "इस ऐप में आपका प्राथमिक लक्ष्य क्या है?",
    roleBroker: "दलाली या एजेंट खाता (कमीशन एजेंट)",
    roleBrokerDesc: "कंपनियों को कामगारों से जोड़ें और सुरक्षित रूप से कमीशन कमाएं।",
    roleJobSeeker: "मुझे नया काम ढूंढना है (नौकरी तलाशने वाला)",
    roleJobSeekerDesc: "अपने कौशल के आधार पर सर्वोत्तम मिलान खोजें और आवेदन करें।",
    roleEmployer: "मुझे काम के लिए लोग चाहिए (नियोक्ता)",
    roleEmployerDesc: "अपने व्यवसाय के लिए सीधे कुशल कामगारों और श्रमिकों को नियुक्त करें।",
    roleDailyWorker: "दैनिक मजदूरी या डिलीवरी कार्य",
    roleDailyWorkerDesc: "आस-पास लचीले दैनिक वेतन या डिलीवरी भूमिकाओं से जुड़ें।",
    btnFinish: "पंजीकरण पूरा करें और ऐप में प्रवेश करें",
    alertFillAll: "कृपया सभी विवरण सही ढंग से भरें।",
    alertPhoneLength: "कृपया एक वैध सक्रिय मोबाइल नंबर दर्ज करें।"
  }
};

export default function OnboardingScreen({ onComplete, onTriggerLogin }: OnboardingScreenProps) {
  // Steps:
  // 1: Splash / Welcome Screen
  // 2: Preferences Selection (Language, Country, State, District) - Click yellow Next button
  // 3: Profile Builder Screen (Username, Phone) - Saves profile securely, finishes onboarding
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedLang, setSelectedLang] = useState<AppLanguage>('bn');
  
  // Location States
  const [country, setCountry] = useState('india');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');

  // Profile States
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'broker' | 'job_seeker' | 'employer' | 'daily_worker'>('job_seeker');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(true);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Video Player States
  const [videoFinished, setVideoFinished] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Default to muted for seamless autoplay
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [localVideoUrl, setLocalVideoUrl] = useState<string | null>(null);
  const [customVideoUrl, setCustomVideoUrl] = useState<string>(() => {
    return localStorage.getItem('app_onboarding_video_url') || '';
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showUpload, setShowUpload] = useState(true); // Always allow configuration for direct preview/onboarding
  const [showVideoSettings, setShowVideoSettings] = useState(false);

  const [isSavingConfig, setIsSavingConfig] = useState(false);

  useEffect(() => {
    // Load persisted video from Firestore OR IndexedDB on startup
    const loadSavedVideo = async () => {
      let loadedFromFirestore = false;

      if (isFirebaseAvailable) {
        try {
          const { doc, getDoc } = await import('firebase/firestore');
          const docRef = doc(db, 'app_config', 'onboarding');
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.videoBase64) {
              try {
                const response = await fetch(data.videoBase64);
                const blob = await response.blob();
                const objectUrl = URL.createObjectURL(blob);
                setLocalVideoUrl(objectUrl);
                loadedFromFirestore = true;
                console.log("Successfully loaded custom onboarding video from Firestore database (Base64).");
              } catch (err) {
                console.error("Failed to parse Base64 video from Firestore:", err);
              }
            } else if (data.videoUrl) {
              setCustomVideoUrl(data.videoUrl);
              localStorage.setItem('app_onboarding_video_url', data.videoUrl);
              loadedFromFirestore = true;
              console.log("Successfully loaded custom onboarding video URL from Firestore database:", data.videoUrl);
            }
          }
        } catch (err) {
          console.error("Failed to load onboarding video config from Firestore:", err);
        }
      }

      if (!loadedFromFirestore) {
        const savedBlob = await getPersistedVideo();
        if (savedBlob) {
          const objectUrl = URL.createObjectURL(savedBlob);
          setLocalVideoUrl(objectUrl);
          console.log("Successfully loaded custom onboarding video from local database storage.");
        }
      }
    };
    loadSavedVideo();

    // Clean up object URL on unmount
    return () => {
      if (localVideoUrl) {
        URL.revokeObjectURL(localVideoUrl);
      }
    };
  }, []);

  const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("video/")) {
        alert(selectedLang === 'bn' ? '⚠️ অনুগ্রহ করে একটি ভিডিও ফাইল সিলেক্ট করুন।' : '⚠️ Please select a valid video file.');
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      
      if (localVideoUrl) {
        URL.revokeObjectURL(localVideoUrl);
      }

      setLocalVideoUrl(objectUrl);
      setVideoError(false);
      setVideoFinished(false);

      await savePersistedVideo(file);
      console.log("Custom video saved to local database storage successfully!");
    }
  };

  const handleSaveForEveryone = async () => {
    if (!isFirebaseAvailable) {
      alert(selectedLang === 'bn' 
        ? '⚠️ ডাটাবেস (Firebase) সক্রিয় নেই!\n\nকারণ:\n১. একটু আগে স্ক্রিনে আসা Firebase Setup অনুমতিটি "Decline" করা হয়েছিল, তাই ডাটাবেস তৈরি হয়নি।\n\nকিভাবে ভিডিওটি স্থায়ী করবেন:\n• সহজতম উপায়: আপনার ভিডিও ফাইলটি বাম পাশের ফাইল এক্সপ্লোরার (File Explorer) এর "public/" ফোল্ডারে মাউস দিয়ে টেনে এনে ছেড়ে দিন (drag & drop) এবং সেটির নাম পরিবর্তন করে "video.mp4" দিন। তাহলে কোনো ডাটাবেস ছাড়াই সবার জন্য ভিডিওটি স্থায়ী হয়ে যাবে!\n\nঅথবা আপনি আমাকে চ্যাটে বলতে পারেন "Firebase Setup করুন", আমি আবার সেটআপ করার প্রক্রিয়া চালু করে দেব।' 
        : '⚠️ Database (Firebase) is not active!\n\nReason:\n1. The Firebase Setup prompt was declined earlier, so the database is not configured.\n\nHow to save your video permanently:\n• Easiest way: Simply drag & drop your video file into the "public/" folder in the left side File Explorer and rename it to "video.mp4". This will make it the default video for everyone without needing a database!\n\nOr you can type "Firebase Setup" in the chat and I will start the database setup again.');
      return;
    }

    setIsSavingConfig(true);
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      const docRef = doc(db, 'app_config', 'onboarding');

      if (customVideoUrl) {
        await setDoc(docRef, {
          videoUrl: customVideoUrl,
          videoBase64: '',
          updatedAt: new Date()
        }, { merge: true });
        
        alert(selectedLang === 'bn' 
          ? '✓ ভিডিও লিঙ্কটি সফলভাবে সবার জন্য সেভ করা হয়েছে!' 
          : selectedLang === 'hi'
            ? '✓ वीडियो लिंक सभी के लिए सफलतापूर्वक सहेज लिया गया है!'
            : '✓ Video link saved for everyone successfully!');
      } else {
        const savedBlob = await getPersistedVideo();
        if (!savedBlob) {
          alert(selectedLang === 'bn' ? '⚠️ কোনো কাস্টম ভিডিও ফাইল খুঁজে পাওয়া যায়নি।' : '⚠️ No custom video file found.');
          setIsSavingConfig(false);
          return;
        }

        if (savedBlob.size > 1000000) {
          alert(selectedLang === 'bn'
            ? '⚠️ ফাইলের সাইজ ১ মেগাবাইটের বেশি! সবার জন্য সেভ করতে অনুগ্রহ করে ১ মেগাবাইটের নিচের ফাইল আপলোড করুন অথবা সরাসরি লিঙ্ক ব্যবহার করুন।'
            : selectedLang === 'hi'
              ? '⚠️ फ़ाइल का आकार 1 एमबी से अधिक है! कृपया 1 एमबी से कम की फ़ाइल अपलोड करें या सीधे लिंक का उपयोग करें।'
              : '⚠️ File size is over 1MB! Please upload a file under 1MB or use a direct link to save for all users.');
          setIsSavingConfig(false);
          return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(savedBlob);
        reader.onloadend = async () => {
          const base64data = reader.result as string;
          try {
            await setDoc(docRef, {
              videoBase64: base64data,
              videoUrl: '',
              updatedAt: new Date()
            }, { merge: true });

            alert(selectedLang === 'bn' 
              ? '✓ ভিডিওটি সফলভাবে ডাটাবেসে সেভ করা হয়েছে! এখন সকল ইউজার এটি দেখতে পাবে।' 
              : selectedLang === 'hi'
                ? '✓ वीडियो डेटाबेस में सफलतापूर्वक सहेजा गया! अब सभी उपयोगकर्ता इसे देख सकते हैं।'
                : '✓ Video saved to database successfully! All users will see it now.');
          } catch (writeErr) {
            console.error("Firestore write failed:", writeErr);
            alert(selectedLang === 'bn' ? '⚠️ ডাটাবেসে সেভ করতে সমস্যা হয়েছে।' : '⚠️ Firestore save failed.');
          }
          setIsSavingConfig(false);
        };
        return;
      }
    } catch (err) {
      console.error("Save config failed:", err);
      alert(selectedLang === 'bn' ? '⚠️ সেভ করতে ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।' : '⚠️ Failed to save. Please try again.');
    }
    setIsSavingConfig(false);
  };

  // Auto-mute and source reloading workarounds for autoplay policies
  useEffect(() => {
    if (step === 3 && videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        // Fallback: mute and play
        setIsMuted(true);
        if (videoRef.current) {
          videoRef.current.muted = true;
          videoRef.current.play()
            .then(() => setIsPlaying(true))
            .catch(err => {
              console.log("Video play failed:", err);
              setIsPlaying(false);
            });
        }
      });
    }
  }, [step, videoError, localVideoUrl]);

  const handleGetStartedClick = () => {
    setStep(2);
  };

  const handleBrowseAsGuest = () => {
    localStorage.setItem('app_user_name', selectedLang === 'bn' ? 'গেস্ট ইউজার' : 'Guest User');
    localStorage.setItem('app_user_phone', 'guest_user');
    localStorage.setItem('app_user_logged_in', 'false');
    localStorage.setItem('app_onboarding_completed', 'true');
    onComplete({
      lang: selectedLang,
      country: 'india',
      state: 'west_bengal',
      district: 'kolkata',
      username: selectedLang === 'bn' ? 'গেস্ট ইউজার' : 'Guest User',
      phone: 'guest_user',
      role: 'job_seeker'
    });
  };

  const handlePreferencesNext = () => {
    if (!state || !district) {
      alert(selectedLang === 'bn' ? '⚠️ অনুগ্রহ করে আপনার রাজ্য ও জেলা নির্বাচন করুন।' : selectedLang === 'hi' ? '⚠️ कृपया अपना राज्य और जिला चुनें।' : '⚠️ Please select both State and District.');
      return;
    }
    setStep(3);
  };

  const handleProfileFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !phone.trim()) {
      alert(ot.alertFillAll);
      return;
    }
    if (!agreePrivacy) {
      alert(selectedLang === 'bn' ? '⚠️ অনুগ্রহ করে আমাদের প্রাইভেসি ও লাইফটাইম একাউন্ট পলিসি মেনে নিন।' : selectedLang === 'hi' ? '⚠️ कृपया हमारी गोपनीयता और लाइफटाइम खाता नीति से सहमत हों।' : '⚠️ Please agree to our Privacy & Lifetime Account Policy.');
      return;
    }
    const cleanPhone = phone.replace(/\s+/g, '');
    if (cleanPhone.length < 8) {
      alert(ot.alertPhoneLength);
      return;
    }

    setIsSubmitting(true);
    
    // Save to localStorage immediately for instant UI login
    localStorage.setItem('app_user_name', username.trim());
    localStorage.setItem('app_user_phone', cleanPhone);
    localStorage.setItem('app_user_logged_in', 'true');
    localStorage.setItem('app_user_role', selectedRole);
    if (password.trim()) localStorage.setItem('app_user_password', password.trim());

    // Trigger Onboarding Completion Callback instantly so UI responds immediately
    onComplete({
      lang: selectedLang,
      country,
      state,
      district,
      username: username.trim(),
      phone: cleanPhone,
      role: selectedRole
    });

    // Write user profile to Firestore in the background (asynchronous and non-blocking)
    if (isFirebaseAvailable) {
      setTimeout(() => {
        setDoc(doc(db, 'user_profiles', cleanPhone), {
          name: username.trim(),
          phone: cleanPhone,
          role: selectedRole,
          country,
          state,
          district,
          lang: selectedLang,
          createdAt: new Date().toISOString()
        }, { merge: true })
          .then(() => {
            console.log("Background profile submission completed.");
          })
          .catch((err) => {
            console.error("Background profile submission failed:", err);
          })
          .finally(() => {
            setIsSubmitting(false);
          });
      }, 50);
    } else {
      setIsSubmitting(false);
    }
  };

  // Safe list of states and districts based on country choice
  const selectedCountryObj = regionsData.find(c => c.id === country);
  const statesList = selectedCountryObj ? selectedCountryObj.states : [];
  const selectedStateObj = statesList.find(s => s.id === state);
  const districtsList = selectedStateObj ? selectedStateObj.districts : [];

  const ot = onboardingTranslations[selectedLang] || onboardingTranslations['bn'];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950 font-sans flex items-center justify-center select-none">
      
      {/* Decorative background glow */}
      <div className="absolute inset-0 bg-radial-[circle_at_center] from-teal-950/40 via-slate-950 to-slate-950 opacity-100" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full filter blur-[100px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-80 h-80 bg-rose-500/5 rounded-full filter blur-[120px] pointer-events-none" />

      {/* Main Mobile App Frame Mockup */}
      <div className="relative w-full max-w-md h-full sm:h-[85vh] sm:max-h-[850px] bg-slate-900 sm:rounded-[40px] shadow-2xl border-0 sm:border-8 border-slate-800 flex flex-col justify-between overflow-hidden animate-fade-in">
        
        {/* Status bar mockup removed to keep background clean */}

        {/* Dynamic step transitions */}
        <div className="flex-1 flex flex-col justify-center overflow-y-auto scrollbar-none z-10 px-6 py-6">
          <AnimatePresence mode="wait">
            
            {/* Step 1: Splash / Welcome */}
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex-1 flex flex-col items-center justify-center text-center space-y-8 py-4"
              >
                {/* Language Switcher bar on Splash Screen */}
                <div className="flex gap-2 justify-center bg-slate-950/40 p-1.5 rounded-full border border-slate-800/60 w-fit">
                  {[
                    { code: 'bn', label: 'বাংলা' },
                    { code: 'hi', label: 'हिन्दी' },
                    { code: 'en', label: 'English' }
                  ].map((item) => {
                    const isSel = selectedLang === item.code;
                    return (
                      <button
                        key={item.code}
                        type="button"
                        onClick={() => setSelectedLang(item.code as AppLanguage)}
                        className={`px-3 py-1 text-xs rounded-full transition-all cursor-pointer font-bold ${
                          isSel 
                            ? 'bg-amber-500 text-slate-950 shadow-sm font-black' 
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>

                {/* 3D Golden Gear and Worker Hands Logo */}
                <div className="relative w-40 h-40 flex items-center justify-center bg-gradient-to-b from-teal-500/10 to-transparent p-4 rounded-full border border-teal-500/10 shadow-lg">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-0 border border-dashed border-teal-500/20 rounded-full"
                  />
                  <div className="relative flex flex-col items-center justify-center">
                    <div className="w-28 h-28 bg-slate-950 rounded-3xl overflow-hidden border-2 border-amber-400 shadow-2xl flex items-center justify-center hover:scale-105 transition-transform duration-300">
                      <img src={appLogo} alt="Bharat ka Kaam Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h1 className="text-4xl font-extrabold tracking-tight text-white leading-none font-sans drop-shadow-md">
                    Bharat ka Kaam
                  </h1>
                  <p className="text-sm font-bold text-teal-400 tracking-wide uppercase">
                    Connecting India's Workforce
                  </p>
                  <p className="text-xs text-slate-300 font-semibold max-w-[280px] mx-auto leading-relaxed">
                    {ot.welcomeDesc}
                  </p>
                </div>

                {/* Opening Process dots */}
                <div className="space-y-4 w-full pt-4">
                  <div className="flex justify-center items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse shadow-md shadow-amber-500/50" />
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-700/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-700/80" />
                  </div>

                  <button
                    onClick={handleGetStartedClick}
                    className="w-full py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:via-orange-600 hover:to-amber-700 active:scale-[0.98] text-white text-sm font-black tracking-widest uppercase rounded-2xl transition-all shadow-xl shadow-orange-500/20 cursor-pointer text-center font-sans"
                  >
                    {selectedLang === 'bn' ? 'নিবন্ধন শুরু করুন' : 'Start Registration'}
                  </button>

                  <button
                    onClick={handleBrowseAsGuest}
                    className="w-full py-3.5 bg-[#051c33]/90 hover:bg-[#0a2e50]/90 border border-teal-500/30 hover:border-teal-400 text-teal-300 text-xs font-black tracking-widest uppercase rounded-2xl transition-all cursor-pointer text-center font-sans shadow-md"
                  >
                    🌐 {selectedLang === 'bn' ? 'সরাসরি ওয়েবসাইট ভিজিট করুন' : 'Visit Website Directly'}
                  </button>

                  {onTriggerLogin && (
                    <button
                      type="button"
                      onClick={onTriggerLogin}
                      className="text-xs font-black text-amber-400 hover:text-amber-300 transition-colors uppercase tracking-widest mt-1 cursor-pointer block mx-auto text-center py-2"
                    >
                      already registered? log in / ইতিমধ্যে নিবন্ধিত? লগইন করুন
                    </button>
                  )}

                  <div className="flex justify-center items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-800" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/40" />
                    <span className="w-2 h-2 rounded-full bg-slate-800" />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Preferences Select (Language, Country, State, District) */}
            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="flex-1 flex flex-col justify-between py-2 space-y-6"
              >
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-xl font-black text-white flex items-center gap-1.5 justify-center sm:justify-start">
                      <Sparkles size={18} className="text-amber-500 animate-pulse" />
                      {ot.prefTitle}
                    </h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-teal-400">
                      {ot.prefSub}
                    </p>
                  </div>

                  {/* A. Language Grid */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                      {ot.chooseLang}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { code: 'bn', label: 'বাংলা', sub: 'Bengali' },
                        { code: 'hi', label: 'हिन्दी', sub: 'Hindi' },
                        { code: 'en', label: 'English', sub: 'International' }
                      ].map((item) => {
                        const isSel = selectedLang === item.code;
                        return (
                          <button
                            key={item.code}
                            type="button"
                            onClick={() => setSelectedLang(item.code as AppLanguage)}
                            className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                              isSel 
                                ? 'bg-amber-500 border-amber-500 text-slate-950 shadow-md shadow-amber-500/15 font-black' 
                                : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            <span className="block text-sm font-black leading-none">{item.label}</span>
                            <span className={`block text-[8.5px] mt-0.5 uppercase tracking-wide font-extrabold ${isSel ? 'text-slate-800' : 'text-slate-500'}`}>{item.sub}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* B. Country Selection */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                      {ot.chooseCountry}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { code: 'india', label: 'India / भारत', icon: '🇮🇳' },

                      ].map((c) => {
                        const isSel = country === c.code;
                        return (
                          <button
                            key={c.code}
                            type="button"
                            onClick={() => {
                              setCountry(c.code);
                              setState('');
                              setDistrict('');
                            }}
                            className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer text-xs font-black w-full col-span-2 ${
                              isSel
                                ? 'bg-teal-500 border-teal-500 text-slate-950 shadow-md shadow-teal-500/15'
                                : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            <span>{c.icon}</span>
                            <span>{c.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* C. State & District Selectors */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                        {ot.stateLabel}
                      </label>
                      <select
                        value={state}
                        onChange={(e) => {
                          setState(e.target.value);
                          setDistrict('');
                        }}
                        className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl font-bold text-xs text-slate-200 outline-none focus:border-teal-500 transition-all cursor-pointer"
                      >
                        <option value="">{ot.selectState}</option>
                        {statesList.map((s) => (
                          <option key={s.id} value={s.id}>
                            {selectedLang === 'bn' ? s.nameBn : s.nameEn}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                        {ot.districtLabel}
                      </label>
                      <select
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl font-bold text-xs text-slate-200 outline-none focus:border-teal-500 transition-all cursor-pointer"
                        disabled={!state}
                      >
                        <option value="">{ot.selectDistrict}</option>
                        {districtsList.map((d) => (
                          <option key={d.id} value={d.id}>
                            {selectedLang === 'bn' ? d.nameBn : d.nameEn}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  {/* Step dots (step 2 of 3) */}
                  <div className="flex justify-center items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-700/80" />
                    <span className="w-3 h-3 rounded-full bg-amber-500 shadow-md shadow-amber-500/40" />
                    <span className="w-2 h-2 rounded-full bg-slate-700/80" />
                  </div>

                  {/* YELLOW NEXT BUTTON */}
                  <button
                    onClick={handlePreferencesNext}
                    className="w-full py-4 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-slate-950 text-xs font-black tracking-widest uppercase rounded-2xl transition-all shadow-md shadow-amber-500/10 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    {ot.btnNext} <ArrowRight size={14} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Video Screen (Clean display, status indicators fully removed) */}
            {false && (step as any) === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 w-full h-full flex flex-col justify-between bg-black relative"
              >
                {/* Embedded Video Player Container - fills the entire space */}
                <div className="absolute inset-0 w-full h-full flex flex-col justify-between">
                  
                  {/* Video Elements with Custom Fallback and Volume Controls */}
                  <div className="relative flex-1 w-full bg-slate-950 flex items-center justify-center overflow-hidden">
                    <video
                      ref={videoRef}
                      src={localVideoUrl || customVideoUrl || (videoError ? "https://vjs.zencdn.net/v/oceans.mp4" : "/video.mp4")}
                      controls
                      autoPlay
                      playsInline
                      muted={isMuted}
                      preload="auto"
                      onEnded={() => setVideoFinished(true)}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onError={() => {
                        if (!videoError && !localVideoUrl && !customVideoUrl) {
                          console.log("Primary video /video.mp4 failed, switching to backup stream.");
                          setVideoError(true);
                          setShowVideoSettings(true); // Auto-expand settings on error to show upload/instructions
                        }
                      }}
                      className="w-full h-full object-contain"
                    />

                    {/* Centered Play Button Overlay for quick user interaction if paused/blocked */}
                    {!isPlaying && (
                      <button
                        type="button"
                        onClick={() => {
                          if (videoRef.current) {
                            videoRef.current.play().then(() => {
                              setIsPlaying(true);
                            }).catch(err => {
                              console.log("Play failed, unmuting and playing:", err);
                              setIsMuted(true);
                              if (videoRef.current) {
                                videoRef.current.muted = true;
                                videoRef.current.play().then(() => setIsPlaying(true));
                              }
                            });
                          }
                        }}
                        className="absolute w-16 h-16 bg-amber-500/90 hover:bg-amber-500 hover:scale-110 text-slate-950 rounded-full flex items-center justify-center shadow-2xl transition-all z-20 cursor-pointer animate-pulse"
                      >
                        <Play size={28} className="fill-slate-950 ml-1" />
                      </button>
                    )}

                    {/* Volume Overlay Workaround Helper */}
                    <button
                      onClick={() => {
                        if (videoRef.current) {
                          const newMute = !isMuted;
                          videoRef.current.muted = newMute;
                          setIsMuted(newMute);
                        }
                      }}
                      className="absolute bottom-16 right-4 p-2.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-all z-20 cursor-pointer shadow-lg"
                    >
                      <Volume2 size={16} className={isMuted ? 'opacity-40 line-through' : 'opacity-100'} />
                    </button>

                    {/* Subtitles & Custom Instruction Overlays */}
                    <div className="absolute top-4 left-4 right-4 bg-slate-950/85 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 text-left space-y-2.5 z-20 max-h-[85%] overflow-y-auto">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4 className="text-[11px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1">
                            🎬 {ot.videoTitle}
                          </h4>
                          <p className="text-[9.5px] text-slate-300 font-bold leading-normal">
                            {ot.videoSub}
                          </p>
                        </div>
                        
                        {/* Settings Button to Expand Video Configuration */}
                        <button
                          type="button"
                          onClick={() => setShowVideoSettings(!showVideoSettings)}
                          className="shrink-0 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-amber-300 text-[9px] font-black rounded-lg transition-all active:scale-95 cursor-pointer flex items-center gap-1 select-none"
                        >
                          ⚙️ {selectedLang === 'bn' ? 'ভিডিও সেটিংস' : 'Video Settings'}
                        </button>
                      </div>

                      {/* Custom Video Selector for Sandbox Preview */}
                      {showUpload && showVideoSettings && (
                        <div className="pt-2 border-t border-white/10 flex flex-col gap-2.5">
                          <label className="flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[9.5px] font-black rounded-lg cursor-pointer transition-all active:scale-[0.98]">
                            <Sparkles size={11} className="text-amber-400 animate-pulse" />
                            <span>
                              {selectedLang === 'bn' 
                                ? 'ভিডিও ফাইল আপলোড করুন (Upload MP4)' 
                                : selectedLang === 'hi' 
                                  ? 'वीडियो अपलोड करें' 
                                  : 'Upload MP4 Video'}
                            </span>
                            <input
                              type="file"
                              accept="video/*"
                              ref={fileInputRef}
                              onChange={handleVideoFileChange}
                              className="hidden"
                            />
                          </label>

                          {/* Direct Video URL Paste */}
                          <div className="flex flex-col gap-1">
                            <span className="text-[8px] font-bold text-slate-400">
                              {selectedLang === 'bn' ? 'অথবা ভিডিওর সরাসরি লিঙ্ক (URL) দিন:' : 'Or paste direct video URL (MP4):'}
                            </span>
                            <div className="flex gap-1.5">
                              <input
                                type="text"
                                placeholder="https://example.com/onboarding_video.mp4"
                                value={customVideoUrl}
                                onChange={(e) => {
                                  const url = e.target.value;
                                  setCustomVideoUrl(url);
                                  localStorage.setItem('app_onboarding_video_url', url);
                                  setVideoError(false);
                                  setVideoFinished(false);
                                }}
                                className="flex-1 px-2.5 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-[9px] text-white focus:outline-none focus:border-amber-500 font-mono"
                              />
                              {customVideoUrl && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCustomVideoUrl('');
                                    localStorage.removeItem('app_onboarding_video_url');
                                    setVideoError(false);
                                    setVideoFinished(false);
                                  }}
                                  className="px-2.5 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/20 text-rose-400 text-[9px] font-bold rounded-lg cursor-pointer transition-all active:scale-95"
                                >
                                  {selectedLang === 'bn' ? 'মুছুন' : 'Clear'}
                                </button>
                              )}
                            </div>
                          </div>
                          
                          {(localVideoUrl || customVideoUrl) && (
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center justify-between px-2 text-[8.5px] font-bold text-emerald-400 bg-emerald-500/10 py-1 rounded border border-emerald-500/20">
                                <span>✓ {selectedLang === 'bn' ? 'কাস্টম ভিডিও সোর্স সেট করা আছে' : 'Custom video loaded'}</span>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (localVideoUrl) {
                                      URL.revokeObjectURL(localVideoUrl);
                                    }
                                    setLocalVideoUrl(null);
                                    setCustomVideoUrl('');
                                    localStorage.removeItem('app_onboarding_video_url');
                                    setVideoError(false);
                                    setVideoFinished(false);
                                    try {
                                      const db = await openVideoDB();
                                      const transaction = db.transaction("videos", "readwrite");
                                      transaction.objectStore("videos").delete("onboarding_video");
                                    } catch (err) {
                                      console.error(err);
                                    }
                                  }}
                                  className="text-rose-400 hover:text-rose-300 uppercase tracking-wider font-extrabold cursor-pointer select-none ml-1 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/15"
                                >
                                  {selectedLang === 'bn' ? 'রিসেট' : 'Reset'}
                                </button>
                              </div>
                              
                              <button
                                type="button"
                                disabled={isSavingConfig}
                                onClick={handleSaveForEveryone}
                                className={`w-full py-2 px-3 text-[9.5px] font-black rounded-lg border flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-[0.98] ${
                                  isSavingConfig
                                    ? 'bg-slate-800 border-slate-700 text-slate-500 animate-pulse'
                                    : 'bg-emerald-500 text-slate-950 border-emerald-400 hover:bg-emerald-400 shadow-md shadow-emerald-500/10'
                                }`}
                              >
                                <Sparkles size={11} className={isSavingConfig ? 'animate-spin' : ''} />
                                <span>
                                  {isSavingConfig
                                    ? (selectedLang === 'bn' ? 'সেভ হচ্ছে...' : 'Saving...')
                                    : (selectedLang === 'bn' 
                                        ? 'সবার জন্য ডাটাবেসে সেভ করুন (Save to Cloud)' 
                                        : selectedLang === 'hi'
                                          ? 'सभी के लिए क्लाउड में सहेजें'
                                          : 'Save to Cloud for Everyone')}
                                </span>
                              </button>
                            </div>
                          )}

                          <div className="text-[8px] text-slate-400 leading-normal border-t border-white/5 pt-1.5 space-y-1">
                            <p>
                              💡 <strong className="text-amber-400">কিভাবে ভিডিও সেভ করবেন:</strong>
                            </p>
                            <p className="pl-2">
                              ১. এখানে সরাসরি একটি <strong className="text-white">MP4 ফাইল</strong> আপলোড করতে পারেন (এটি ব্রাউজারে সেভ থাকবে)।
                            </p>
                            <p className="pl-2">
                              ২. অথবা কোনো ড্রপবক্স/সার্ভার বা ক্লাউড ড্রাইভের <strong className="text-white">সরাসরি MP4 লিংক</strong> পেস্ট করতে পারেন।
                            </p>
                            <p className="pl-2">
                              ৩. সবার জন্য ভিডিওটি স্থায়ী করতে <strong className="text-emerald-400">"সবার জন্য ডাটাবেসে সেভ করুন"</strong> বাটনে ক্লিক করুন (১ মেগাবাইটের কম সাইজ হতে হবে)।
                            </p>
                            <p className="pl-2 text-slate-500">
                              ৪. অথবা বাম পাশের ফাইল এক্সপ্লোরারে <strong className="text-slate-400">public/</strong> ফোল্ডারে আপনার ভিডিওটি ড্র্যাগ করে <strong className="text-slate-400">video.mp4</strong> নামে সেভ করুন।
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {!videoFinished && (
                      <div className="absolute bottom-16 left-4 right-14 bg-black/70 backdrop-blur-xs py-2 px-3.5 rounded-xl border border-white/5 text-[9px] text-slate-400 font-bold leading-relaxed z-10 animate-pulse">
                        ⚠️ {ot.videoInstruction}
                      </div>
                    )}
                  </div>

                </div>
              </motion.div>
            )}

            {/* Step 3: Profile Builder (Securely Controlled Registration) */}
            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="flex-1 flex flex-col justify-between py-2 space-y-4"
              >
                <form onSubmit={handleProfileFinish} className="space-y-4 flex-1 flex flex-col justify-between">
                  
                  <div className="space-y-4">
                    {/* 1. Curved Deep Navy Header Block (matches Rajesh Kumar mockup) */}
                    <div className="bg-gradient-to-b from-[#0a2e50] to-[#041a31] -mx-6 -mt-6 pt-6 pb-12 px-6 rounded-b-[36px] flex items-center justify-between relative shadow-inner select-none shrink-0">
                      <div className="flex items-center gap-2.5">
                        {/* Golden handshake badge */}
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/25 border border-amber-300/30">
                          🤝
                        </div>
                        <div className="text-left">
                          <h1 className="text-base font-black text-white leading-none">ভারত কা কাজ</h1>
                          <p className="text-[10px] font-bold text-amber-300 tracking-wider uppercase mt-1 leading-none">ka kaam</p>
                        </div>
                      </div>
                      
                      {/* User profile circular badge */}
                      <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center border border-white/20 relative">
                        <span className="text-xs">👤</span>
                        <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-rose-500 rounded-full border border-slate-900 animate-pulse" />
                      </div>
                    </div>

                    {/* 2. Overlapping Card Form with 3D design */}
                    <div className="bg-slate-800/90 backdrop-blur-sm border border-slate-700/80 rounded-3xl p-5 -mt-6 relative z-10 shadow-2xl space-y-4 text-left">
                      
                      <div className="space-y-1 pb-1">
                        <h2 className="text-sm font-extrabold text-white flex items-center gap-1.5 uppercase tracking-wider">
                          <User size={14} className="text-amber-400" />
                          {ot.profileTitle}
                        </h2>
                        <p className="text-[9px] text-teal-400 font-extrabold uppercase tracking-wide">
                          {ot.profileSub}
                        </p>
                      </div>

                      {/* Input A: Full Name */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                          {ot.inputNameLabel}
                        </label>
                        <FastInput
                          type="text"
                          required
                          value={username}
                          onChange={setUsername}
                          icon={<span className="text-slate-500 text-sm">👤</span>}
                          placeholder={ot.inputNamePlaceholder}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl font-bold text-xs text-slate-200 outline-none focus:border-amber-500 focus:bg-slate-900/80 transition-all"
                        />
                      </div>

                      {/* Input B: Phone Number (Secure Unique ID) */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                          {ot.inputPhoneLabel}
                        </label>
                        <FastInput
                          type="tel"
                          required
                          value={phone}
                          onChange={setPhone}
                          icon={<span className="text-slate-500 text-sm">📞</span>}
                          placeholder={ot.inputPhonePlaceholder}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl font-bold text-xs text-slate-200 outline-none focus:border-amber-500 focus:bg-slate-900/80 transition-all"
                        />
                      </div>

                      {/* Optional Input: Password */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                          {selectedLang === 'bn' ? 'লগইন পাসওয়ার্ড (ঐচ্ছিক)' : selectedLang === 'hi' ? 'लॉगिन पासवर्ड (वैकल्पिक)' : 'Login Password (Optional)'}
                        </label>
                        <FastInput
                          type="password"
                          value={password}
                          onChange={setPassword}
                          icon={<span className="text-slate-500 text-sm">🔒</span>}
                          placeholder={selectedLang === 'bn' ? 'পাসওয়ার্ড লিখুন' : 'Enter login password'}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl font-bold text-xs text-slate-200 outline-none focus:border-amber-500 focus:bg-slate-900/80 transition-all"
                        />
                      </div>

                      {/* Input C: Role Selector (4 choices for what they want to do) */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                          {ot.roleSelectLabel}
                        </label>
                        
                        <div className="space-y-2 max-h-[170px] overflow-y-auto pr-1 scrollbar-none">
                          {[
                            { id: 'broker', label: ot.roleBroker, desc: ot.roleBrokerDesc, icon: '💼' },
                            { id: 'job_seeker', label: ot.roleJobSeeker, desc: ot.roleJobSeekerDesc, icon: '🔍' },
                            { id: 'employer', label: ot.roleEmployer, desc: ot.roleEmployerDesc, icon: '🏭' },
                            { id: 'daily_worker', label: ot.roleDailyWorker, desc: ot.roleDailyWorkerDesc, icon: '👷' }
                          ].map((roleOption) => {
                            const isSel = selectedRole === roleOption.id;
                            return (
                              <button
                                key={roleOption.id}
                                type="button"
                                onClick={() => setSelectedRole(roleOption.id as any)}
                                className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                                  isSel
                                    ? 'bg-amber-500/10 border-amber-500 text-white shadow-xs'
                                    : 'bg-slate-900/40 border-slate-800 text-slate-300 hover:bg-slate-900/80'
                                }`}
                              >
                                <span className="text-base mt-0.5 shrink-0">{roleOption.icon}</span>
                                <div className="space-y-0.5">
                                  <h4 className={`text-[11px] font-black ${isSel ? 'text-amber-400' : 'text-slate-200'}`}>
                                    {roleOption.label}
                                  </h4>
                                  <p className="text-[9px] text-slate-400 font-bold leading-normal">
                                    {roleOption.desc}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Submission and navigation */}
                  <div className="space-y-4 pt-4 shrink-0">
                    {/* Step dots (step 4 of 4) */}
                    <div className="flex justify-center items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-slate-800" />
                      <span className="w-2 h-2 rounded-full bg-slate-800" />
                      <span className="w-2 h-2 rounded-full bg-slate-800" />
                      <span className="w-3 h-3 rounded-full bg-amber-500 shadow-md shadow-amber-500/40" />
                    </div>

                    {/* Secure Lock Notice for user comfort & Lifetime Privacy Agreement Checkbox */}
                    <div className="flex flex-col gap-2.5 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 text-left">
                      <div className="flex items-start gap-2.5">
                        <input
                          type="checkbox"
                          id="agree-privacy-onboarding"
                          checked={agreePrivacy}
                          onChange={(e) => setAgreePrivacy(e.target.checked)}
                          className="mt-0.5 w-4 h-4 text-amber-500 accent-amber-500 bg-slate-950 border-slate-800 rounded focus:ring-amber-500 cursor-pointer"
                        />
                        <label htmlFor="agree-privacy-onboarding" className="text-[10px] text-slate-300 font-semibold leading-relaxed cursor-pointer select-none">
                          {selectedLang === 'bn' ? (
                            <>
                              আমি এই অ্যাপের <button type="button" onClick={() => setShowPrivacyModal(true)} className="text-amber-400 font-extrabold hover:underline inline-block focus:outline-none">প্রাইভেসি ও লাইফটাইম একাউন্ট পলিসি</button> মেনে নিচ্ছি। আমার মোবাইল নম্বরটিই হবে আমার চিরস্থায়ী আইডি।
                            </>
                          ) : selectedLang === 'hi' ? (
                            <>
                              मैं इस ऐप की <button type="button" onClick={() => setShowPrivacyModal(true)} className="text-amber-400 font-extrabold hover:underline inline-block focus:outline-none">गोपनीयता और लाइफटाइम खाता नीति</button> से सहमत हूँ। मेरा मोबाइल नंबर ही मेरी स्थायी आईडी होगी।
                            </>
                          ) : (
                            <>
                              I agree to the <button type="button" onClick={() => setShowPrivacyModal(true)} className="text-amber-400 font-extrabold hover:underline inline-block focus:outline-none">Privacy & Lifetime Account Policy</button>. My mobile number will be my permanent unique lifetime ID.
                            </>
                          )}
                        </label>
                      </div>
                      
                      <div className="flex items-center gap-1.5 justify-center text-[8.5px] text-slate-400 font-bold border-t border-slate-800/40 pt-2">
                        <ShieldCheck size={11} className="text-emerald-500" />
                        <span>{selectedLang === 'bn' ? 'ডাটা সুরক্ষিত • কোনো তথ্য ফালতুভাবে লিক করা হবে না' : 'Data Secure • 100% Zero Information Leak'}</span>
                      </div>
                    </div>

                    {/* YELLOW FINISH BUTTON */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 text-xs font-black tracking-widest uppercase rounded-2xl transition-all shadow-md shadow-amber-500/10 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      {isSubmitting ? (selectedLang === 'bn' ? 'সংরক্ষণ করা হচ্ছে...' : 'Saving Profile...') : ot.btnFinish}
                    </button>
                  </div>

                </form>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer info text */}
        <div className="bg-slate-950/40 px-6 py-4 border-t border-slate-800/40 text-center select-none shrink-0">
          <p className="text-[8.5px] font-bold text-slate-500 tracking-widest uppercase">
            {ot.footerSecure}
          </p>
        </div>

      </div>

      {/* 🛡️ Beautiful Full-Screen/Modal for Privacy Policy */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-5 text-slate-200 relative shadow-2xl max-h-[85vh] flex flex-col justify-between"
          >
            <button
              onClick={() => setShowPrivacyModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors p-1 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="text-center space-y-1 shrink-0">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto text-xl border border-emerald-500/25">
                🛡️
              </div>
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mt-2">
                {selectedLang === 'bn' ? 'প্রাইভেসি ও লাইফটাইম একাউন্ট পলিসি' : selectedLang === 'hi' ? 'गोपनीयता और लाइफटाइम खाता नीति' : 'Privacy & Lifetime Account Policy'}
              </h3>
              <p className="text-[10px] text-teal-400 font-extrabold uppercase tracking-wide">
                {selectedLang === 'bn' ? 'আপনার মোবাইল নম্বর ভিত্তিক চিরস্থায়ী প্রোফাইল' : 'Your Permanent Phone-Based Personal Account'}
              </p>
            </div>

            <div className="space-y-4 text-xs overflow-y-auto pr-1 text-slate-300 leading-relaxed max-h-[45vh] text-left">
              {selectedLang === 'bn' ? (
                <>
                  <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 space-y-1.5">
                    <h4 className="font-extrabold text-amber-400">🔑 ১. চিরস্থায়ী লাইফটাইম অ্যাকাউন্ট (Lifetime Account)</h4>
                    <p className="text-[11px] text-slate-400">
                      আপনি যে মোবাইল নম্বরটি ব্যবহার করে এই অ্যাকাউন্টটি খুলবেন, সেটি সম্পূর্ণভাবে আপনার জন্য সংরক্ষিত থাকবে। এই ফোন নম্বরটি আপনার লাইফটাইম বা চিরস্থায়ী ব্যক্তিগত আইডি হিসেবে সচল থাকবে।
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 space-y-1.5">
                    <h4 className="font-extrabold text-amber-400">📱 ২. মোবাইল নম্বরভিত্তিক নিরাপদ লগইন</h4>
                    <p className="text-[11px] text-slate-400">
                      পরবর্তীতে যেকোনো সময় আপনি আপনার মোবাইল নম্বর ব্যবহার করে সরাসরি লগইন করতে পারবেন। আপনার প্রোফাইলের সাথে যুক্ত সমস্ত তথ্য, কাজ এবং যোগাযোগ স্থায়ীভাবে এই মোবাইল নম্বরের অধীনেই সংরক্ষিত থাকবে।
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 space-y-1.5">
                    <h4 className="font-extrabold text-amber-400">🛡️ ৩. ডাটা প্রাইভেসী এবং জিরো-স্প্যাম গ্যারান্টি</h4>
                    <p className="text-[11px] text-slate-400">
                      আমরা আপনার ব্যক্তিগত তথ্যের গোপনীয়তা রক্ষা করতে প্রতিশ্রুতিবদ্ধ। আপনার মোবাইল নম্বর কোনো প্রকার থার্ড-পার্টি ডাটা ব্রোকার বা বিজ্ঞাপনী সংস্থার কাছে বিক্রি বা প্রকাশ করা হবে না।
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 space-y-1.5">
                    <h4 className="font-extrabold text-amber-400">⚙️ ৪. তথ্য পরিবর্তন ও ডিলিট করার অধিকার</h4>
                    <p className="text-[11px] text-slate-400">
                      আপনি যখনই ইচ্ছা আপনার প্রোফাইলের নাম, ছবি, দক্ষতা বা কাজের বিবরণ পরিবর্তন করতে পারবেন। তবে মোবাইল নম্বরটি আপনার স্থায়ী অ্যাকাউন্টের পরিচয় বহন করবে।
                    </p>
                  </div>
                </>
              ) : selectedLang === 'hi' ? (
                <>
                  <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 space-y-1.5">
                    <h4 className="font-extrabold text-amber-400">🔑 1. लाइफटाइम व्यक्तिगत खाता (Lifetime Account)</h4>
                    <p className="text-[11px] text-slate-400">
                      आप जिस मोबाइल नंबर से खाता खोलेंगे, वह स्थायी रूप से आपके लिए आरक्षित रहेगा। यह आपका स्थायी लाइफटाइम व्यक्तिगत प्रोफ़ाइल होगा।
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 space-y-1.5">
                    <h4 className="font-extrabold text-amber-400">📱 2. मोबाइल नंबर आधारित लॉगिन</h4>
                    <p className="text-[11px] text-slate-400">
                      भविष्य में कभी भी आप अपने मोबाइल नंबर के माध्यम से अपने खाते में सुरक्षित रूप से लॉगिन कर सकते हैं। आपकी सभी जानकारी इस नंबर से जुड़ी रहेगी।
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 space-y-1.5">
                    <h4 className="font-extrabold text-amber-400">🛡️ 3. डेटा गोपनीयता गारंटी</h4>
                    <p className="text-[11px] text-slate-400">
                      हम आपकी गोपनीयता की सुरक्षा के लिए प्रतिबद्ध हैं। आपका मोबाइल नंबर किसी भी विज्ञापनदाता या तीसरे पक्ष को साझा नहीं किया जाएगा।
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 space-y-1.5">
                    <h4 className="font-extrabold text-amber-400">🔑 1. Lifetime Personal Account</h4>
                    <p className="text-[11px] text-slate-400">
                      The personal account you register with your mobile phone number is strictly yours and remains active permanently for a lifetime.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 space-y-1.5">
                    <h4 className="font-extrabold text-amber-400">📱 2. Phone-Based Access Secure</h4>
                    <p className="text-[11px] text-slate-400">
                      You can securely log in and access your personal profile anytime using your mobile number. Your ratings, connections, and posts stay permanently linked to your number.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 space-y-1.5">
                    <h4 className="font-extrabold text-amber-400">🛡️ 3. Data Privacy and Zero-Spam Promise</h4>
                    <p className="text-[11px] text-slate-400">
                      We strictly safeguard your identity. Your mobile number and details will never be leaked or sold to any third-party advertisers or databases.
                    </p>
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowPrivacyModal(false)}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer text-center shrink-0"
            >
              {selectedLang === 'bn' ? 'আমি বুঝতে পেরেছি • বন্ধ করুন' : selectedLang === 'hi' ? 'मुझे समझ आ गया • बंद करें' : 'I Understand & Agree'}
            </button>
          </motion.div>
        </div>
      )}

    </div>
  );
}
