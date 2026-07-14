import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { JobPost, WorkerPost, BrokerPost } from '../types';
import { getRegionName } from '../data/regions';
import {
  Phone,
  MapPin,
  Calendar,
  Clock,
  User,
  Briefcase,
  ShieldCheck,
  Copy,
  Check,
  Globe,
  Share2,
  ArrowLeft,
  Building,
  Award,
  FileText,
  CheckCircle,
  MessageCircle,
  QrCode,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Map
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PersonalProfileWebsiteProps {
  profileId: string;
  profileType: 'worker' | 'job' | 'broker';
  initialLang: string;
  onBackToApp: () => void;
}

// Localized strings for the Personal Portfolio Website to ensure standalone translation works flawlessly
const localTranslations: Record<string, Record<string, string>> = {
  bn: {
    backToApp: "প্রধান অ্যাপে ফিরে যান",
    loadingProfile: "ব্যক্তিগত ওয়েবসাইট লোড হচ্ছে...",
    profileNotFound: "দুঃখিত, এই প্রোফাইলটি খুঁজে পাওয়া যায়নি!",
    errorLoading: "প্রোফাইল লোড করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।",
    verifiedTitle: "ভেরিফায়েড প্রোফাইল",
    verifiedAgency: "অনুমোদিত এজেন্সি",
    activeStatus: "কাজের জন্য উপলব্ধ (Active)",
    brokerStatus: "সক্রিয় ব্রোকার (Active Broker)",
    companyStatus: "সক্রিয় নিয়োগকারী (Active Recruiter)",
    aboutMe: "নিজের সম্পর্কে ও অভিজ্ঞতা",
    aboutCompany: "কোম্পানি সম্পর্কে বিবরণ",
    aboutBroker: "সার্ভিস ও এজেন্সির বিবরণ",
    skills: "দক্ষতা ও কাজের ধরন",
    expectedWage: "আশা করা মজুরি",
    salary: "বেতন / মজুরি",
    location: "কাজের এলাকা / ঠিকানা",
    availability: "কবে থেকে উপলব্ধ",
    shiftTiming: "কাজের সময় / শিফট",
    experience: "কাজের অভিজ্ঞতা",
    workerTypes: "যে ধরণের কর্মী সরবরাহ করেন",
    brokerFee: "দালালি চার্জ বা ফি",
    contactTitle: "সরাসরি যোগাযোগ করুন",
    callNow: "সরাসরি কল দিন",
    whatsappMessage: "হোয়াটসঅ্যাপে মেসেজ পাঠান",
    shareTitle: "শেয়ার করুন বা লিংক কপি করুন",
    copyLink: "ওয়েবসাইট লিংক কপি করুন",
    linkCopied: "লিংক কপি হয়েছে!",
    qrTitle: "আমার ভিজিটিং কার্ড QR কোড",
    qrDesc: "এই কোডটি স্ক্যান করে যেকোনো সময় এই ওয়েবসাইটটি ফোনে খোলা যাবে।",
    powerFooter: "পাওয়ার্ড বাই ভারত কা কাম • আপনার সম্পূর্ণ ফ্রি পার্সোনাল ওয়েবসাইট",
    gender: "প্রয়োজনীয় জেন্ডার",
    jobDate: "কাজের নির্দিষ্ট তারিখ",
    workplacePhotos: "কাজের জায়গার ছবি সমূহ",
    maleOnly: "👨 শুধু পুরুষ কর্মী",
    femaleOnly: "👩 শুধু মহিলা কর্মী",
    anyGender: "👥 যেকোনো (পুরুষ/মহিলা)",
    directEmployer: "সরাসরি কোম্পানি",
    hours: "ঘণ্টা",
    qrScanNow: "স্ক্যান করুন",
    viewOnMap: "ম্যাপে লোকেশন দেখুন",
    rating: "গ্রাহক সন্তুষ্টি রেটিং",
    established: "প্রতিষ্ঠিত সাল",
    servicesCount: "মোট সার্ভিস সম্পন্ন"
  },
  en: {
    backToApp: "Back to Main App",
    loadingProfile: "Loading Personal Website...",
    profileNotFound: "Sorry, this profile could not be found!",
    errorLoading: "Failed to load profile. Please try again.",
    verifiedTitle: "Verified Profile",
    verifiedAgency: "Authorized Agency",
    activeStatus: "Available for Work (Active)",
    brokerStatus: "Active Broker Partner",
    companyStatus: "Active Hiring Recruiter",
    aboutMe: "About Me & Experience",
    aboutCompany: "About Company & Work",
    aboutBroker: "Service & Agency Bio",
    skills: "Skills & Specialization",
    expectedWage: "Expected Wage",
    salary: "Offered Salary / Wage",
    location: "Work Location / Address",
    availability: "Availability Status",
    shiftTiming: "Working Hours / Shift",
    experience: "Experience Level",
    workerTypes: "Worker Types Supplied",
    brokerFee: "Broker Fee / Charge",
    contactTitle: "Contact Directly",
    callNow: "Call Directly Now",
    whatsappMessage: "Send WhatsApp Message",
    shareTitle: "Share Profile Website",
    copyLink: "Copy Website Link",
    linkCopied: "Link copied to clipboard!",
    qrTitle: "My Digital Visiting QR Code",
    qrDesc: "Scan this code to instantly open this personal portfolio website.",
    powerFooter: "Powered by Bharat ka Kaam • Your Free Business Website",
    gender: "Required Gender",
    jobDate: "Job Specific Date",
    workplacePhotos: "Workplace Photos Gallery",
    maleOnly: "👨 Male Workers Only",
    femaleOnly: "👩 Female Workers Only",
    anyGender: "👥 Any Gender Welcome",
    directEmployer: "Direct Employer",
    hours: "hrs",
    qrScanNow: "Scan QR",
    viewOnMap: "View on Google Map",
    rating: "Customer Satisfaction",
    established: "Established Year",
    servicesCount: "Total Services Delivered"
  },
  hi: {
    backToApp: "मुख्य ऐप पर वापस जाएं",
    loadingProfile: "व्यक्तिगत वेबसाइट लोड हो रही है...",
    profileNotFound: "क्षमा करें, यह प्रोफ़ाइल नहीं मिली!",
    errorLoading: "प्रोफ़ाइल लोड करने में विफल। फिर से प्रयास करें।",
    verifiedTitle: "सत्यापित प्रोफ़ाइल",
    verifiedAgency: "अधिकृत एजेंसी",
    activeStatus: "काम के लिए उपलब्ध (Active)",
    brokerStatus: "सक्रिय ब्रोकर (Active Broker)",
    companyStatus: "सक्रिय भर्तीकर्ता (Active Recruiter)",
    aboutMe: "मेरे बारे में और अनुभव",
    aboutCompany: "कंपनी का विवरण",
    aboutBroker: "सेवा और एजेंसी बायो",
    skills: "कौशल और विशेषज्ञता",
    expectedWage: "अपेक्षित मजदूरी",
    salary: "प्रस्तावित वेतन / मजदूरी",
    location: "कार्य स्थान / पता",
    availability: "उपलब्धता स्थिति",
    shiftTiming: "कार्य के घंटे / शिफ्ट",
    experience: "अनुभव स्तर",
    workerTypes: "आपूर्ति किए जाने वाले कार्यकर्ता",
    brokerFee: "दलाली शुल्क / कमीशन",
    contactTitle: "सीधे संपर्क करें",
    callNow: "अभी सीधे कॉल करें",
    whatsappMessage: "व्हाट्सएप पर संदेश भेजें",
    shareTitle: "वेबसाइट साझा करें",
    copyLink: "वेबसाइट लिंक कॉपी करें",
    linkCopied: "लिंक कॉपी हो गया!",
    qrTitle: "मेरा डिजिटल विजिटिंग क्यूआर कोड",
    qrDesc: "इस पर्सनल पोर्टफोलियो वेबसाइट को तुरंत खोलने के लिए इस कोड को स्कैन करें।",
    powerFooter: "Bharat ka Kaam द्वारा संचालित • आपकी पूरी तरह से मुफ्त व्यावसायिक वेबसाइट",
    gender: "आवश्यक लिंग",
    jobDate: "कार्य की विशिष्ट तिथि",
    workplacePhotos: "कार्यस्थल की तस्वीरें",
    maleOnly: "👨 केवल पुरुष कार्यकर्ता",
    femaleOnly: "👩 केवल महिला कार्यकर्ता",
    anyGender: "👥 कोई भी लिंग",
    directEmployer: "सीधे नियोक्ता",
    hours: "घंटे",
    qrScanNow: "स्कैन करें",
    viewOnMap: "नक्शे पर स्थान देखें",
    rating: "ग्राहक संतुष्टि रेटिंग",
    established: "स्थापना वर्ष",
    servicesCount: "कुल सेवाएं वितरित"
  }
};

export default function PersonalProfileWebsite({ profileId, profileType, initialLang, onBackToApp }: PersonalProfileWebsiteProps) {
  const [lang, setLang] = useState<string>(initialLang || 'bn');
  const [profile, setProfile] = useState<JobPost | WorkerPost | BrokerPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const t = localTranslations[lang] || localTranslations['bn'];

  // Load the profile directly from Firebase Firestore on load
  useEffect(() => {
    async function loadDirectProfile() {
      setLoading(true);
      setError(null);
      try {
        let collectionName = '';
        if (profileType === 'worker') {
          collectionName = 'worker_posts';
        } else if (profileType === 'job') {
          collectionName = 'job_posts';
        } else if (profileType === 'broker') {
          collectionName = 'broker_posts';
        }

        if (!collectionName) {
          throw new Error("Invalid profile type");
        }

        const docRef = doc(db, collectionName, profileId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setProfile({ id: docSnap.id, ...docSnap.data() } as any);
        } else {
          setError(t.profileNotFound);
        }
      } catch (err) {
        console.error("Error loading direct profile website:", err);
        setError(t.errorLoading);
      } finally {
        setLoading(false);
      }
    }

    loadDirectProfile();
  }, [profileId, profileType]);

  const handleCopyLink = () => {
    try {
      const shareUrl = `${window.location.origin}/?profileType=${profileType}&id=${profileId}`;
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed: ", err);
    }
  };

  const handleShareWhatsApp = () => {
    const shareUrl = `${window.location.origin}/?profileType=${profileType}&id=${profileId}`;
    const name = profileType === 'worker' ? (profile as WorkerPost).name : profileType === 'broker' ? (profile as BrokerPost).name : (profile as JobPost).title;
    const text = lang === 'bn' 
      ? `আসসালামু আলাইকুম। আমার পার্সোনাল প্রোফাইল ওয়েবসাইটটি ভিজিট করুন: ${shareUrl}`
      : `Hello! Check out my personal professional portfolio website here: ${shareUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-800">
        <div className="space-y-4 text-center">
          <div className="relative w-16 h-16 mx-auto">
            <div className="w-16 h-16 rounded-full border-4 border-slate-200 border-t-amber-500 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center text-xl">🌐</div>
          </div>
          <p className="text-sm font-bold text-slate-600 animate-pulse">{t.loadingProfile}</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-800">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl max-w-sm text-center space-y-4">
          <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center text-3xl mx-auto text-rose-500">
            ⚠️
          </div>
          <h3 className="text-base font-black text-slate-900">{error || t.profileNotFound}</h3>
          <button
            onClick={onBackToApp}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer"
          >
            {t.backToApp}
          </button>
        </div>
      </div>
    );
  }

  // Set up values for display
  const isWorker = profileType === 'worker';
  const isBroker = profileType === 'broker';
  const isJob = profileType === 'job';

  const worker = profile as WorkerPost;
  const broker = profile as BrokerPost;
  const job = profile as JobPost;

  // Formatting Location
  const getDisplayLocation = () => {
    if (!profile.country) return profile.location;

    const countryName = profile.country === 'other' 
      ? (profile.customCountry || 'Other Country')
      : getRegionName('country', profile.country, lang);

    const stateName = profile.state === 'other'
      ? (profile.customState || 'Other State')
      : getRegionName('state', profile.state, lang);

    const districtName = profile.district === 'other'
      ? (profile.customDistrict || 'Other District')
      : getRegionName('district', profile.district, lang);

    const cleanCountryName = countryName.replace(/[\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF]\s*/g, '');

    return `${districtName}, ${stateName}, ${cleanCountryName}`;
  };

  // Profile Specific Fields
  const displayName = isWorker ? worker.name : isBroker ? broker.name : job.title;
  const displaySub = isWorker ? worker.skills : isBroker ? (broker.agency || t.brokerStatus) : job.company;
  const photoUrl = isWorker ? worker.photoUrl : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16 flex flex-col justify-between selection:bg-amber-100 selection:text-amber-900">
      
      {/* Premium Header Nav */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-xs">
        <button
          onClick={onBackToApp}
          className="flex items-center gap-1.5 text-xs font-black text-slate-600 hover:text-slate-900 transition-colors uppercase tracking-wider bg-slate-100/80 hover:bg-slate-200/80 px-3 py-2 rounded-xl cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span className="hidden sm:inline">{t.backToApp}</span>
        </button>

        {/* Language selector in Header */}
        <div className="flex items-center gap-1.5">
          <Globe size={14} className="text-slate-400 shrink-0" />
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-[10px] sm:text-xs px-2.5 py-1.5 rounded-xl border-none outline-none cursor-pointer transition-all"
          >
            <option value="bn">🇧🇩 বাংলা</option>
            <option value="en">🇺🇸 English</option>
            <option value="hi">🇮🇳 हिन्दी</option>
          </select>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        
        {/* Hero Card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-6 sm:p-8 flex flex-col items-center text-center relative overflow-hidden">
          
          {/* Subtle elegant design accents */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500"></div>
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-100/30 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-blue-100/20 rounded-full blur-2xl"></div>

          {/* Profile photo or initial */}
          {isWorker && photoUrl ? (
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-slate-100 border-4 border-white shadow-lg overflow-hidden shrink-0 relative mb-4">
              <img src={photoUrl} alt={displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
          ) : (
            <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center text-white text-3xl sm:text-4xl shadow-md mb-4 shrink-0 font-bold ${
              isWorker ? 'bg-gradient-to-tr from-orange-400 to-amber-500' : isBroker ? 'bg-gradient-to-tr from-[#0a2e50] to-[#0f4d85]' : 'bg-gradient-to-tr from-teal-500 to-emerald-600'
            }`}>
              {isWorker ? <User size={40} /> : isBroker ? <Briefcase size={40} /> : <Building size={40} />}
            </div>
          )}

          {/* Verification Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-wider rounded-full mb-3.5 shadow-2xs">
            <ShieldCheck size={12} className="text-emerald-600" />
            <span>{isBroker ? t.verifiedAgency : t.verifiedTitle}</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">{displayName}</h1>
          <p className="text-slate-500 font-bold text-xs sm:text-sm mt-1">{displaySub}</p>

          {/* Small customized active status message */}
          <div className="mt-4 flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-lg text-[10.5px] font-bold text-slate-600 border border-slate-200/50">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{isWorker ? t.activeStatus : isBroker ? t.brokerStatus : t.companyStatus}</span>
          </div>
        </div>

        {/* Quick Highlights Grid */}
        <div className="grid grid-cols-2 gap-3.5">
          {/* Location card */}
          <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm flex items-start gap-3">
            <div className="p-2 bg-blue-50 text-blue-500 rounded-xl shrink-0">
              <MapPin size={18} />
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{t.location}</p>
              <p className="text-xs sm:text-sm font-bold text-slate-700 mt-0.5">{getDisplayLocation()}</p>
            </div>
          </div>

          {/* Wage / Salary card */}
          <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm flex items-start gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-500 rounded-xl shrink-0 text-center font-bold text-sm w-9 h-9 flex items-center justify-center">
              {profile.country === 'india' ? '₹' : '৳'}
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{isJob ? t.salary : t.expectedWage}</p>
              <p className="text-xs sm:text-sm font-bold text-slate-700 mt-0.5">
                {isJob ? job.salary : isWorker ? worker.expectedWage : ((broker as any).brokerFee ? `${(broker as any).brokerFee}%` : '5%')}
              </p>
            </div>
          </div>

          {/* Date / Availability card */}
          <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm flex items-start gap-3">
            <div className="p-2 bg-amber-50 text-amber-500 rounded-xl shrink-0">
              <Calendar size={18} />
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{isJob ? t.jobDate : t.availability}</p>
              <p className="text-xs sm:text-sm font-bold text-slate-700 mt-0.5">{profile.date}</p>
            </div>
          </div>

          {/* Timing / Shift Timing card */}
          <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm flex items-start gap-3">
            <div className="p-2 bg-purple-50 text-purple-500 rounded-xl shrink-0">
              <Clock size={18} />
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{t.shiftTiming}</p>
              <p className="text-xs sm:text-sm font-bold text-slate-700 mt-0.5">
                {isJob ? `${job.shiftStartTime || '08:00'} - ${job.shiftEndTime || '17:00'} (${job.totalWorkHours || 9} ${t.hours})` : profile.time}
              </p>
            </div>
          </div>
        </div>

        {/* Worker, Job or Broker specific technical sections */}
        {isWorker && (worker.qualification || worker.skills) && (
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3.5">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Award size={15} className="text-amber-500" />
              {t.skills}
            </h3>
            <div className="flex flex-wrap gap-2">
              {worker.skills.split(',').map((skill, index) => (
                <span key={index} className="px-3 py-1.5 bg-amber-50 text-amber-800 text-xs font-bold rounded-xl border border-amber-100">
                  ⚡ {skill.trim()}
                </span>
              ))}
            </div>
            {worker.qualification && (
              <div className="pt-2 text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <span>🎓</span>
                <span>{t.experience}: <strong className="text-slate-800">{worker.qualification}</strong></span>
              </div>
            )}
            {worker.age && (
              <div className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <span>🎂</span>
                <span>{lang === 'bn' ? 'বয়স:' : lang === 'hi' ? 'आयु:' : 'Age:'} <strong className="text-slate-800">{worker.age} {lang === 'bn' ? 'বছর' : lang === 'hi' ? 'वर्ष' : 'years'}</strong></span>
              </div>
            )}
          </div>
        )}

        {isBroker && (broker.workerTypes || broker.experience) && (
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3.5">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Award size={15} className="text-indigo-500" />
              {t.workerTypes}
            </h3>
            <div className="flex flex-wrap gap-2">
              {broker.workerTypes.split(',').map((type, index) => (
                <span key={index} className="px-3 py-1.5 bg-indigo-50 text-indigo-800 text-xs font-bold rounded-xl border border-indigo-100">
                  👥 {type.trim()}
                </span>
              ))}
            </div>
            {broker.experience && (
              <div className="pt-2 text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <span>⭐</span>
                <span>{t.experience}: <strong className="text-slate-800">{broker.experience}</strong></span>
              </div>
            )}
          </div>
        )}

        {isJob && (job.requiredGender || job.uploadedPhotos) && (
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3.5">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Award size={15} className="text-teal-500" />
              {t.gender}
            </h3>
            <div className="text-xs font-bold text-slate-700">
              {job.requiredGender === 'male' ? t.maleOnly : job.requiredGender === 'female' ? t.femaleOnly : t.anyGender}
            </div>

            {/* Workplace photos inside personal webpage view */}
            {job.uploadedPhotos && job.uploadedPhotos.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">{t.workplacePhotos}</p>
                <div className="grid grid-cols-3 gap-2">
                  {job.uploadedPhotos.map((photo, idx) => (
                    <div key={idx} className="h-16 rounded-xl overflow-hidden border border-slate-100 shadow-2xs">
                      <img src={photo} alt="Workplace preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bio / About / Details description section */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <FileText size={15} />
            {isWorker ? t.aboutMe : isBroker ? t.aboutBroker : t.aboutCompany}
          </h3>
          <div className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
            {isWorker ? worker.about : isBroker ? broker.description : job.description}
          </div>
        </div>

        {/* Interactive QR Code Visiting Card section */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-center gap-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-xl"></div>
          
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-500/20 text-amber-300 text-[9px] font-extrabold uppercase tracking-widest rounded-md">
              <Sparkles size={10} />
              <span>{t.qrScanNow}</span>
            </div>
            <h4 className="text-base font-black uppercase tracking-wider">{t.qrTitle}</h4>
            <p className="text-xs text-slate-400 leading-normal font-semibold">
              {t.qrDesc}
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-white/10 shadow-md shrink-0 flex flex-col items-center gap-2 select-none">
            {/* Simple neat stylized Mock CSS/SVG QR Code */}
            <div className="w-24 h-24 bg-slate-950 p-1.5 rounded-xl flex flex-wrap gap-1 relative overflow-hidden">
              <div className="w-6 h-6 border-4 border-white rounded-md m-0.5"></div>
              <div className="w-6 h-6 m-0.5 flex flex-wrap gap-0.5">
                <div className="w-2 h-2 bg-white rounded-xs"></div>
                <div className="w-2 h-2 bg-white rounded-xs"></div>
              </div>
              <div className="w-6 h-6 border-4 border-white rounded-md m-0.5"></div>
              <div className="w-24 h-6 m-0.5 flex flex-wrap gap-1">
                <div className="w-2 h-2 bg-white rounded-xs"></div>
                <div className="w-3 h-2 bg-amber-500 rounded-xs animate-pulse"></div>
                <div className="w-2 h-2 bg-white rounded-xs"></div>
                <div className="w-4 h-2 bg-white rounded-xs"></div>
              </div>
            </div>
            <span className="text-[9px] text-slate-800 font-black tracking-widest uppercase flex items-center gap-1">
              <QrCode size={11} className="text-amber-500" />
              <span>BHARAT-KA-KAAM</span>
            </span>
          </div>
        </div>

        {/* Contact and Share Area (Always Prominent) */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 text-center">{t.contactTitle}</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <a
              href={`tel:${profile.phone}`}
              className="py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-md active:scale-98 text-center flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <Phone size={16} />
              <span>{t.callNow}</span>
            </a>

            <a
              href={`https://wa.me/${profile.phone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-4 bg-slate-800 hover:bg-slate-850 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-md active:scale-98 text-center flex items-center justify-center gap-2.5 cursor-pointer border border-slate-700/50"
            >
              <MessageCircle size={16} className="text-emerald-400" />
              <span>{t.whatsappMessage}</span>
            </a>
          </div>

          {/* Share Block */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-center">{t.shareTitle}</p>
            <div className="flex gap-2">
              <button
                onClick={handleCopyLink}
                className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all border border-slate-200/50 cursor-pointer flex items-center justify-center gap-2"
              >
                {copied ? <Check size={14} className="text-emerald-500 animate-bounce" /> : <Copy size={14} />}
                <span>{copied ? t.linkCopied : t.copyLink}</span>
              </button>

              <button
                onClick={handleShareWhatsApp}
                className="px-4 py-3 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-xl transition-all cursor-pointer flex items-center justify-center"
                title="Share on WhatsApp"
              >
                <Share2 size={16} />
              </button>
            </div>
          </div>
        </div>

      </main>

      {/* Neat clean footer credit */}
      <footer className="w-full text-center px-4 pt-8 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
        <p className="notranslate">{t.powerFooter}</p>
      </footer>

    </div>
  );
}
