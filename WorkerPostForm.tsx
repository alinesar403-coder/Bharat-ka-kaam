import React, { useState } from 'react';
import { WorkerPost, AppLanguage } from '../types';
import { translations } from '../translations';
import { X, User, MapPin, Calendar, Clock, DollarSign, Phone, FileText, Globe, Map, Navigation } from 'lucide-react';
import { addDoc, collection } from 'firebase/firestore';
import { db, isFirebaseAvailable } from '../firebase';
import { regionsData, otherOption, getRegionName } from '../data/regions';

const JOB_OPTIONS = [
  { value: 'Electrician', bn: '⚡ ইলেকট্রিশিয়ান (Electrician)', hi: '⚡ इलेक्ट्रीशियन', en: '⚡ Electrician' },
  { value: 'Plumber', bn: '🛠️ প্লাম্বার (Plumber)', hi: '🛠️ प्लंबर', en: '🛠️ Plumber' },
  { value: 'Cleaner', bn: '🧹 ক্লিনার / সাফাই কর্মী (Cleaner)', hi: '🧹 क्लीनर / सफाई कर्मचारी', en: '🧹 Cleaner' },
  { value: 'Cook', bn: '🍳 বাবুর্চি / রাঁধুনি (Cook)', hi: '🍳 बावर्ची / रसोइया', en: '🍳 Cook' },
  { value: 'Driver', bn: '🚗 ড্রাইভার / চালক (Driver)', hi: '🚗 ड्राइवर / चालक', en: '🚗 Driver' },
  { value: 'Delivery Rider', bn: '🛵 ডেলিভারি রাইডার (Delivery Rider)', hi: '🛵 डिलीवरी बॉय', en: '🛵 Delivery Rider' },
  { value: 'Tailor', bn: '🧵 দর্জি / সেলাই কর্মী (Tailor)', hi: '🧵 दर्जी / सिलाई', en: '🧵 Tailor' },
  { value: 'Mason', bn: '🧱 রাজমিস্ত্রি (Mason)', hi: '🧱 राजमिस्त्री', en: '🧱 Mason' },
  { value: 'Painter', bn: '🎨 পেইন্টার / রং মিস্ত্রি (Painter)', hi: '🎨 पेंटर / रंगसाज', en: '🎨 Painter' },
  { value: 'Carpenter', bn: '🪵 কাঠমিস্ত্রি (Carpenter)', hi: '🪵 बढ़ई', en: '🪵 Carpenter' },
  { value: 'Daily Laborer', bn: '🌾 দিনমজুর / কৃষি শ্রমিক (Daily Laborer)', hi: '🌾 दैनिक मजदूर', en: '🌾 Daily Laborer' },
  { value: 'Garments Worker', bn: '👜 গার্মেন্টস কর্মী (Garments Worker)', hi: '👜 गारमेंट्स वर्कर', en: '👜 Garments Worker' },
  { value: 'Security Guard', bn: '💂 সিকিউরিটি গার্ড (Security Guard)', hi: '💂 सुरक्षा गार्ड', en: '💂 Security Guard' },
  { value: 'Office Assistant', bn: '💼 অফিস সহকারী / পিয়ন (Office Assistant)', hi: '💼 ऑफिस सहायक / चपरासी', en: '💼 Office Assistant / Peon' },
  { value: 'Computer Operator', bn: '💻 কম্পিউটার অপারেটর (Computer Operator)', hi: '💻 कंप्यूटर ऑपरेटर', en: '💻 Computer Operator' },
  { value: 'Video Editor', bn: '🎬 ভিডিও এডিটর (Video Editor)', hi: '🎬 वीडियो एडिटर', en: '🎬 Video Editor' },
  { value: 'Graphics Designer', bn: '🎨 গ্রাফিক্স ডিজাইনার (Graphics Designer)', hi: '🎨 ग्राफिक्स डिजाइनर', en: '🎨 Graphics Designer' },
  { value: 'Shop Assistant', bn: '🏪 দোকান সহকারী (Shop Assistant)', hi: '🏪 दुकान सहायक', en: '🏪 Shop Assistant' },
  { value: 'Hairdresser', bn: '💇 সেলুন / পার্লার কর্মী (Hairdresser)', hi: '💇 सैलून / पार्लर', en: '💇 Salon / Beautician' },
  { value: 'Other', bn: '🙋 অন্যান্য কাজ (Other Work)', hi: '🙋 अन्य काम', en: '🙋 Other Work' },
];

const EXPERIENCE_OPTIONS = [
  { value: 'No Experience', bn: 'অভিজ্ঞতা নেই (No Experience)', hi: 'कोई अनुभव नहीं', en: 'No Experience' },
  { value: '1 Year', bn: '১ বছর (1 Year)', hi: '1 वर्ष', en: '1 Year' },
  { value: '2 Years', bn: '২ বছর (2 Years)', hi: '2 वर्ष', en: '2 Years' },
  { value: '3 Years', bn: '৩ বছর (3 Years)', hi: '3 वर्ष', en: '3 Years' },
  { value: '4 Years', bn: '৪ বছর (4 Years)', hi: '4 वर्ष', en: '4 Years' },
  { value: '5+ Years', bn: '৫ বছর+ (5+ Years)', hi: '5+ वर्ष', en: '5+ Years' },
  { value: '10+ Years', bn: '১০ বছর+ (10+ Years)', hi: '10+ वर्ष', en: '10+ Years' },
];

interface WorkerPostFormProps {
  lang: AppLanguage;
  onClose: () => void;
  onSuccess: () => void;
}

export default function WorkerPostForm({ lang, onClose, onSuccess }: WorkerPostFormProps) {
  const t = translations[lang];

  // Form states
  const [name, setName] = useState('');
  const [gender, setGender] = useState('Male');
  const [selectedJob, setSelectedJob] = useState('');
  const [customJob, setCustomJob] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [phone, setPhone] = useState(() => {
    const saved = localStorage.getItem('app_user_phone');
    return (saved && saved !== 'guest_user') ? saved : '';
  });
  const [expectedWage, setExpectedWage] = useState('');
  const [about, setAbout] = useState('');
  const [age, setAge] = useState('');
  const [selectedExp, setSelectedExp] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

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

  // Status states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // Limit to 2MB to fit in local storage/firestore comfortably
        setErrorMessage(
          lang === 'bn'
            ? 'ফাইল সাইজ ২MB এর নিচে হতে হবে!'
            : lang === 'hi'
              ? 'फाइल का आकार 2MB से कम होना चाहिए!'
              : 'File size must be under 2MB!'
        );
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Simple validation
    if (!name || !gender || !selectedJob || !selectedExp || !date || !time || !phone || !expectedWage || !about) {
      setErrorMessage(t.errorFillAll);
      return;
    }

    if (selectedJob === 'Other' && !customJob.trim()) {
      setErrorMessage(
        lang === 'bn'
          ? 'অনুগ্রহ করে আপনার কাজের নাম লিখুন।'
          : lang === 'hi'
            ? 'कृपया अपने काम का नाम दर्ज करें।'
            : 'Please enter your work name.'
      );
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

    // Phone validation
    const cleanPhone = phone.replace(/\s+/g, '');
    if (cleanPhone.length < 10) {
      setErrorMessage(t.errorPhone);
      return;
    }

    setIsSubmitting(true);

    const countryName = getRegionName('country', country, lang, customCountry);
    const stateName = getRegionName('state', state, lang, customState);
    const districtName = getRegionName('district', district, lang, customDistrict);
    const builtLocation = `${districtName}, ${stateName}, ${countryName}`;

    let resolvedSkills = '';
    if (selectedJob === 'Other') {
      resolvedSkills = customJob.trim();
    } else {
      const matchedOpt = JOB_OPTIONS.find(opt => opt.value === selectedJob);
      resolvedSkills = matchedOpt
        ? (lang === 'bn' ? matchedOpt.bn : lang === 'hi' ? matchedOpt.hi : matchedOpt.en)
        : selectedJob;
    }

    const matchedExp = EXPERIENCE_OPTIONS.find(opt => opt.value === selectedExp);
    const resolvedQualification = matchedExp
      ? (lang === 'bn' ? matchedExp.bn : lang === 'hi' ? matchedExp.hi : matchedExp.en)
      : selectedExp;

    try {
      const workerData: Omit<WorkerPost, 'id'> = {
        name,
        gender,
        skills: resolvedSkills,
        date,
        time,
        location: builtLocation,
        country,
        state,
        district,
        customCountry: country === 'other' ? customCountry : undefined,
        customState: state === 'other' ? customState : undefined,
        customDistrict: district === 'other' ? customDistrict : undefined,
        phone: cleanPhone,
        expectedWage,
        about,
        age: age.trim() || undefined,
        qualification: resolvedQualification || undefined,
        photoUrl: photoUrl || undefined,
        createdAt: Date.now()
      };

      if (!isFirebaseAvailable) {
        throw new Error(lang === 'bn' ? 'সিস্টেমটি বর্তমানে অফলাইনে কাজ করবে না। অনুগ্রহ করে ইন্টারনেটের সাথে যুক্ত হন।' : 'The system is currently online-only and offline work is disabled. Please connect to the internet.');
      }

      try {
        await addDoc(collection(db, 'worker_posts'), workerData);
      } catch (fbErr) {
        console.error("Firebase addDoc failed for worker post:", fbErr);
        throw fbErr;
      }
      const savedP = localStorage.getItem('app_user_phone');
      if (!savedP || savedP === 'guest_user') {
        localStorage.setItem('app_user_phone', cleanPhone);
        localStorage.setItem('app_user_name', name);
        localStorage.setItem('app_user_logged_in', 'true');
        window.dispatchEvent(new Event('app_user_profile_updated'));
      }
      onSuccess();
    } catch (err) {
      console.error("Error publishing worker post: ", err);
      setErrorMessage(
        lang === 'bn' 
          ? 'পোস্ট করতে সমস্যা হয়েছে, অনুগ্রহ করে আবার চেষ্টা করুন।' 
          : lang === 'hi'
            ? 'पोस्ट प्रकाशित करने में विफल। कृपया पुन: प्रयास करें।'
            : 'Failed to publish post. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div 
        id="worker-form-container"
        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-scale-up"
      >
        {/* Header */}
        <div className="bg-brand-secondary px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <User size={22} />
            <div>
              <h2 className="font-bold text-lg leading-tight" id="worker-form-heading">
                {t.btnPostWorker}
              </h2>
              <p className="text-xs text-emerald-100 mt-0.5">
                {lang === 'bn' 
                  ? 'আপনার দক্ষতা ও যোগাযোগের নম্বর দিয়ে পোস্ট করুন' 
                  : lang === 'hi'
                    ? 'जल्दी से काम पाने के लिए अपना कौशल और संपर्क नंबर पोस्ट करें'
                    : 'Post your availability to find work quickly'}
              </p>
            </div>
          </div>
          <button
            id="close-worker-form-btn"
            onClick={onClose}
            className="p-1.5 hover:bg-black/10 rounded-lg transition-colors cursor-pointer text-amber-100 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 max-h-[75vh]">
          {errorMessage && (
            <div id="worker-form-error" className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-sm font-medium">
              ⚠️ {errorMessage}
            </div>
          )}

          {/* Worker Name & Gender & Age */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {t.labelWorkerName} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  id="input-worker-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.placeholderWorkerName}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-secondary focus:ring-2 focus:ring-emerald-100/60 outline-none text-slate-800 text-sm transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {t.labelGender} <span className="text-rose-500">*</span>
              </label>
              <select
                id="select-worker-gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-secondary focus:ring-2 focus:ring-emerald-100/60 outline-none text-slate-800 text-sm transition-all cursor-pointer"
                required
              >
                <option value="Male">{t.genderMale}</option>
                <option value="Female">{t.genderFemale}</option>
                <option value="Other">{t.genderOther}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {t.labelAge}
              </label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  id="input-worker-age"
                  type="text"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder={t.placeholderAge}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-secondary focus:ring-2 focus:ring-emerald-100/60 outline-none text-slate-800 text-sm transition-all"
                />
              </div>
            </div>
          </div>

          {/* Skills / Job Type & Qualification */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {t.labelSkills} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-3.5 text-slate-400 z-10" />
                <select
                  id="select-worker-job"
                  value={selectedJob}
                  onChange={(e) => setSelectedJob(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-secondary focus:ring-2 focus:ring-emerald-100/60 outline-none text-slate-800 text-sm transition-all cursor-pointer"
                  required
                >
                  <option value="">{t.placeholderSkills}</option>
                  {JOB_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {lang === 'bn' ? opt.bn : lang === 'hi' ? opt.hi : opt.en}
                    </option>
                  ))}
                </select>
              </div>

              {selectedJob === 'Other' && (
                <div className="mt-2.5 relative">
                  <User size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    id="input-worker-custom-skills"
                    type="text"
                    value={customJob}
                    onChange={(e) => setCustomJob(e.target.value)}
                    placeholder={lang === 'bn' ? 'আপনার কাজের নাম লিখুন...' : lang === 'hi' ? 'अपने काम का नाम दर्ज करें...' : 'Enter your job title...'}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-secondary focus:ring-2 focus:ring-emerald-100/60 outline-none text-slate-800 text-sm transition-all"
                    required
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {t.labelQualification} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <FileText size={16} className="absolute left-3.5 top-3.5 text-slate-400 z-10" />
                <select
                  id="select-worker-experience"
                  value={selectedExp}
                  onChange={(e) => setSelectedExp(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-secondary focus:ring-2 focus:ring-emerald-100/60 outline-none text-slate-800 text-sm transition-all cursor-pointer"
                  required
                >
                  <option value="">{t.placeholderQualification}</option>
                  {EXPERIENCE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {lang === 'bn' ? opt.bn : lang === 'hi' ? opt.hi : opt.en}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Grid: Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {t.labelAvailableDate} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  id="input-worker-date"
                  type="text"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  placeholder={t.placeholderAvailableDate}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-secondary focus:ring-2 focus:ring-emerald-100/60 outline-none text-slate-800 text-sm transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {t.labelAvailableTime} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Clock size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  id="input-worker-time"
                  type="text"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder={t.placeholderAvailableTime}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-secondary focus:ring-2 focus:ring-emerald-100/60 outline-none text-slate-800 text-sm transition-all"
                  required
                />
              </div>
            </div>
          </div>

          {/* Hierarchical Location Section */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <MapPin size={16} className="text-brand-secondary" />
              {lang === 'bn' 
                ? 'পছন্দের কাজের এলাকা / ঠিকানা নির্ধারণ করুন' 
                : lang === 'hi'
                  ? 'पसंदीदा कार्य क्षेत्र / पता निर्दिष्ट करें'
                  : 'Specify Preferred Location'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Country Selection */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  🌐 {lang === 'bn' ? 'দেশ' : lang === 'hi' ? 'देश' : 'Country'} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="worker-country-select"
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
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  🗺️ {lang === 'bn' ? 'রাজ্য / বিভাগ' : lang === 'hi' ? 'রাজ্য / प्रभाग' : 'State / Division'} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="worker-state-select"
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
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  🎯 {lang === 'bn' ? 'জেলা / শহর' : lang === 'hi' ? 'जिला / शहर' : 'District / City'} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="worker-district-select"
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
                    id="input-worker-custom-country"
                    type="text"
                    required
                    value={customCountry}
                    onChange={(e) => setCustomCountry(e.target.value)}
                    placeholder={lang === 'bn' ? 'যেমন: বাংলাদেশ' : 'e.g. Bangladesh'}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none text-slate-800 text-xs"
                  />
                </div>
              )}

              {state === 'other' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">
                    {lang === 'bn' ? 'কাস্টম রাজ্য / বিভাগ' : 'Custom State'}
                  </label>
                  <input
                    id="input-worker-custom-state"
                    type="text"
                    required
                    value={customState}
                    onChange={(e) => setCustomState(e.target.value)}
                    placeholder={lang === 'bn' ? 'যেমন: ঢাকা' : 'e.g. Dhaka'}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none text-slate-800 text-xs"
                  />
                </div>
              )}

              {district === 'other' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">
                    {lang === 'bn' ? 'কাস্টম জেলা / শহর' : 'Custom District'}
                  </label>
                  <input
                    id="input-worker-custom-district"
                    type="text"
                    required
                    value={customDistrict}
                    onChange={(e) => setCustomDistrict(e.target.value)}
                    placeholder={lang === 'bn' ? 'যেমন: গাজীপুর' : 'e.g. Gazipur'}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none text-slate-800 text-xs"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Wage Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {t.labelExpectedWage} <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              {country === 'india' ? (
                <span className="absolute left-3.5 top-3 text-slate-400 font-extrabold text-sm select-none">₹</span>
              ) : country === 'bangladesh' ? (
                <span className="absolute left-3.5 top-3 text-slate-400 font-extrabold text-sm select-none">৳</span>
              ) : (
                <DollarSign size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
              )}
              <input
                id="input-worker-wage"
                type="text"
                value={expectedWage}
                onChange={(e) => setExpectedWage(e.target.value)}
                placeholder={t.placeholderExpectedWage}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-secondary focus:ring-2 focus:ring-emerald-100/60 outline-none text-slate-800 text-sm transition-all"
                required
              />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {t.labelPhone} <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Phone size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
              <input
                id="input-worker-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t.placeholderPhone}
                readOnly={!!localStorage.getItem('app_user_phone') && localStorage.getItem('app_user_phone') !== 'guest_user'}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-secondary focus:ring-2 focus:ring-emerald-100/60 outline-none text-slate-800 text-sm transition-all read-only:bg-slate-100/60 read-only:text-slate-500 read-only:cursor-not-allowed"
                required
              />
            </div>
            {localStorage.getItem('app_user_phone') && localStorage.getItem('app_user_phone') !== 'guest_user' && (
              <p className="text-[9.5px] text-emerald-600 font-extrabold mt-1.5 flex items-center gap-1">
                <span>✓</span>
                <span>{lang === 'bn' ? 'আপনার ভেরিফাইড অ্যাকাউন্ট নম্বরটি স্থায়ীভাবে লিংক করা হয়েছে।' : 'Your verified account number is permanently linked.'}</span>
              </p>
            )}
          </div>

          {/* About / Experience */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {t.labelAbout} <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <FileText size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
              <textarea
                id="input-worker-about"
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                placeholder={t.placeholderAbout}
                rows={4}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-secondary focus:ring-2 focus:ring-emerald-100/60 outline-none text-slate-800 text-sm transition-all resize-none"
                required
              />
            </div>
          </div>

          {/* Photo Upload Section */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              {t.labelPhoto}
            </label>
            
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-xl bg-slate-200 border border-slate-300 flex items-center justify-center overflow-hidden shrink-0">
                {photoUrl ? (
                  <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User size={24} className="text-slate-400" />
                )}
              </div>
              
              <div className="flex-1">
                <input
                  id="worker-photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <label
                  htmlFor="worker-photo-upload"
                  className="px-4 py-2 bg-white border border-slate-200 hover:border-brand-secondary text-slate-700 hover:text-brand-secondary text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer inline-block"
                >
                  {photoUrl 
                    ? (lang === 'bn' ? '✓ ছবি পরিবর্তন করুন' : '✓ Change Photo') 
                    : (lang === 'bn' ? '📷 ছবি আপলোড করুন' : '📷 Upload Photo')}
                </label>
                
                {photoUrl && (
                  <button
                    type="button"
                    onClick={() => setPhotoUrl('')}
                    className="ml-2 text-rose-500 hover:text-rose-600 text-xs font-semibold underline cursor-pointer"
                  >
                    {lang === 'bn' ? 'মুছে ফেলুন' : 'Remove'}
                  </button>
                )}
                
                <p className="text-[10px] text-slate-500 mt-1">
                  {lang === 'bn' 
                    ? 'সর্বোচ্চ সাইজ: ২MB। সরাসরি ফোটো আপলোড করুন।' 
                    : 'Max size: 2MB. Direct image upload.'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-3">
            <button
              id="cancel-worker-form"
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors cursor-pointer text-center"
            >
              {t.btnCancel}
            </button>
            <button
              id="submit-worker-form"
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-brand-secondary hover:bg-brand-secondary-hover disabled:bg-brand-secondary/60 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer text-center shadow-md shadow-emerald-100"
            >
              {isSubmitting ? t.loading : t.btnSubmit}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
