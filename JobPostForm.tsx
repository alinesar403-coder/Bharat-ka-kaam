import React, { useState } from 'react';
import { JobPost, AppLanguage } from '../types';
import { translations } from '../translations';
import { X, Briefcase, MapPin, Calendar, Clock, DollarSign, Phone, FileText, User, Globe, Map, Navigation } from 'lucide-react';
import { addDoc, collection } from 'firebase/firestore';
import { db, isFirebaseAvailable } from '../firebase';
import { regionsData, otherOption, getRegionName } from '../data/regions';

interface JobPostFormProps {
  lang: AppLanguage;
  onClose: () => void;
  onSuccess: () => void;
}

export default function JobPostForm({ lang, onClose, onSuccess }: JobPostFormProps) {
  const t = translations[lang];

  // Form states
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [phone, setPhone] = useState(() => {
    const saved = localStorage.getItem('app_user_phone');
    return (saved && saved !== 'guest_user') ? saved : '';
  });
  const [salary, setSalary] = useState('');
  const [description, setDescription] = useState('');

  // Hierarchical Location states
  const [country, setCountry] = useState(() => {
    return localStorage.getItem('app_onboarding_country') || 'other';
  });
  const [customCountry, setCustomCountry] = useState(() => {
    const obCountry = localStorage.getItem('app_onboarding_country');
    if (obCountry && obCountry !== 'other') return '';
    return lang === 'bn' ? 'বাংলাদেশ' : lang === 'hi' ? 'भारत' : 'India';
  });
  const [state, setState] = useState(() => {
    return localStorage.getItem('app_onboarding_state') || 'other';
  });
  const [customState, setCustomState] = useState('');
  const [district, setDistrict] = useState(() => {
    return localStorage.getItem('app_onboarding_district') || 'other';
  });
  const [customDistrict, setCustomDistrict] = useState('');

  // Status states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Simple validation
    if (!title || !company || !date || !time || !phone || !salary || !description) {
      setErrorMessage(t.errorFillAll);
      return;
    }

    // Hierarchical location validation
    if (!country || !state || !district) {
      setErrorMessage(
        lang === 'bn' 
          ? 'অনুগ্রহ করে কান্ট্রি, রাজ্য এবং ডিস্ট্রিক্ট সম্পূর্ণ সিলেক্ট করুন।' 
          : lang === 'hi' 
            ? 'कृपया अपना देश, राज्य और जिला पूरी तरह से चुनें।' 
            : 'Please select your Country, State, and District.'
      );
      return;
    }

    if (country === 'other' && !customCountry.trim()) {
      setErrorMessage(
        lang === 'bn' 
          ? 'অনুগ্রহ করে আপনার দেশের নাম লিখুন।' 
          : lang === 'hi' 
            ? 'कृपया अपने देश का नाम दर्ज करें।' 
            : 'Please enter your custom Country name.'
      );
      return;
    }
    if (state === 'other' && !customState.trim()) {
      setErrorMessage(
        lang === 'bn' 
          ? 'অনুগ্রহ করে আপনার রাজ্যের নাম লিখুন।' 
          : lang === 'hi' 
            ? 'कृपया अपने राज्य का नाम दर्ज करें।' 
            : 'Please enter your custom State name.'
      );
      return;
    }
    if (district === 'other' && !customDistrict.trim()) {
      setErrorMessage(
        lang === 'bn' 
          ? 'অনুগ্রহ করে আপনার ডিস্ট্রিক্টের নাম লিখুন।' 
          : lang === 'hi' 
            ? 'कृपया अपने जिले का नाम दर्ज करें।' 
            : 'Please enter your custom District name.'
      );
      return;
    }

    // Phone number validation (at least 10-11 digits)
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

    try {
      const jobData: Omit<JobPost, 'id'> = {
        title,
        company,
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
        salary,
        description,
        createdAt: Date.now()
      };

      if (!isFirebaseAvailable) {
        throw new Error(lang === 'bn' ? 'সিস্টেমটি বর্তমানে অফলাইনে কাজ করবে না। অনুগ্রহ করে ইন্টারনেটের সাথে যুক্ত হন।' : 'The system is currently online-only and offline work is disabled. Please connect to the internet.');
      }
      
      try {
        await addDoc(collection(db, 'job_posts'), jobData);
      } catch (fbErr) {
        console.error("Firebase addDoc failed:", fbErr);
        throw fbErr;
      }
      const savedP = localStorage.getItem('app_user_phone');
      if (!savedP || savedP === 'guest_user') {
        localStorage.setItem('app_user_phone', cleanPhone);
        localStorage.setItem('app_user_name', company);
        localStorage.setItem('app_user_logged_in', 'true');
        window.dispatchEvent(new Event('app_user_profile_updated'));
      }
      onSuccess();
    } catch (err) {
      console.error("Error publishing job post: ", err);
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
        id="job-form-container"
        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-brand-primary px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Briefcase size={22} />
            <div>
              <h2 className="font-bold text-lg leading-tight" id="job-form-heading">
                {t.btnPostJob}
              </h2>
              <p className="text-xs text-blue-100 mt-0.5">
                {lang === 'bn' 
                  ? 'সঠিক তথ্য দিয়ে দ্রুত কাজের লোক খুঁজুন' 
                  : lang === 'hi'
                    ? 'जल्दी से कामगार खोजने के लिए विवरण पोस्ट करें'
                    : 'Post details to find workers quickly'}
              </p>
            </div>
          </div>
          <button
            id="close-job-form-btn"
            onClick={onClose}
            className="p-1.5 hover:bg-black/10 rounded-lg transition-colors cursor-pointer text-blue-100 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 max-h-[75vh]">
          {errorMessage && (
            <div id="job-form-error" className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-sm font-medium">
              ⚠️ {errorMessage}
            </div>
          )}

          {/* Job Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {t.labelTitle} <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Briefcase size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
              <input
                id="input-job-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t.placeholderTitle}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-blue-100/60 outline-none text-slate-800 text-sm transition-all"
                required
              />
            </div>
          </div>

          {/* Company/Owner Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {t.labelCompany} <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
              <input
                id="input-job-company"
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder={t.placeholderCompany}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-blue-100/60 outline-none text-slate-800 text-sm transition-all"
                required
              />
            </div>
          </div>

          {/* Grid: Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {t.labelDate} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  id="input-job-date"
                  type="text"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  placeholder={t.placeholderDate}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-blue-100/60 outline-none text-slate-800 text-sm transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {t.labelTime} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Clock size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  id="input-job-time"
                  type="text"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder={t.placeholderTime}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-blue-100/60 outline-none text-slate-800 text-sm transition-all"
                  required
                />
              </div>
            </div>
          </div>

          {/* Hierarchical Location Section */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <MapPin size={16} className="text-brand-primary" />
              {lang === 'bn' ? 'কাজের এলাকা / ঠিকানা নির্ধারণ করুন' : 'Specify Job Location'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Country */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  {lang === 'bn' ? 'দেশ' : 'Country'} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Globe size={14} className="absolute left-3 top-3 text-slate-400" />
                  <select
                    id="select-job-country"
                    value={country}
                    onChange={(e) => {
                      setCountry(e.target.value);
                      setState('');
                      setDistrict('');
                    }}
                    className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl focus:border-brand-primary focus:ring-1 focus:ring-blue-100 outline-none text-slate-800 text-xs transition-all appearance-none"
                    required
                  >
                    <option value="">-- {lang === 'bn' ? 'দেশ সিলেক্ট করুন' : 'Select Country'} --</option>
                    {regionsData.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.flag} {lang === 'bn' ? c.nameBn : c.nameEn}
                      </option>
                    ))}
                    <option value={otherOption.id}>
                      {lang === 'bn' ? otherOption.nameBn : otherOption.nameEn}
                    </option>
                  </select>
                </div>
              </div>

              {/* State / Division */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  {lang === 'bn' ? 'রাজ্য / বিভাগ' : 'State / Division'} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Map size={14} className="absolute left-3 top-3 text-slate-400" />
                  <select
                    id="select-job-state"
                    value={state}
                    disabled={!country}
                    onChange={(e) => {
                      setState(e.target.value);
                      setDistrict('');
                    }}
                    className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl focus:border-brand-primary focus:ring-1 focus:ring-blue-100 outline-none text-slate-800 text-xs transition-all appearance-none disabled:opacity-60"
                    required
                  >
                    <option value="">-- {lang === 'bn' ? 'রাজ্য সিলেক্ট করুন' : 'Select State'} --</option>
                    {country !== 'other' && regionsData.find((c) => c.id === country)?.states.map((s) => (
                      <option key={s.id} value={s.id}>
                        {lang === 'bn' ? s.nameBn : s.nameEn}
                      </option>
                    ))}
                    {country && (
                      <option value={otherOption.id}>
                        {lang === 'bn' ? otherOption.nameBn : otherOption.nameEn}
                      </option>
                    )}
                  </select>
                </div>
              </div>

              {/* District */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  {lang === 'bn' ? 'জেলা / শহর' : 'District / City'} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Navigation size={14} className="absolute left-3 top-3 text-slate-400" />
                  <select
                    id="select-job-district"
                    value={district}
                    disabled={!state}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl focus:border-brand-primary focus:ring-1 focus:ring-blue-100 outline-none text-slate-800 text-xs transition-all appearance-none disabled:opacity-60"
                    required
                  >
                    <option value="">-- {lang === 'bn' ? 'জেলা সিলেক্ট করুন' : 'Select District'} --</option>
                    {country !== 'other' && state !== 'other' && regionsData.find((c) => c.id === country)?.states.find((s) => s.id === state)?.districts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {lang === 'bn' ? d.nameBn : d.nameEn}
                      </option>
                    ))}
                    {state && (
                      <option value={otherOption.id}>
                        {lang === 'bn' ? otherOption.nameBn : otherOption.nameEn}
                      </option>
                    )}
                  </select>
                </div>
              </div>
            </div>

            {/* Custom inputs if 'Other' is selected */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {country === 'other' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    {lang === 'bn' ? 'কাস্টম দেশ' : 'Custom Country'}
                  </label>
                  <input
                    id="custom-job-country"
                    type="text"
                    value={customCountry}
                    onChange={(e) => setCustomCountry(e.target.value)}
                    placeholder={lang === 'bn' ? 'দেশের নাম লিখুন' : 'Enter country name'}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:border-brand-primary focus:ring-1 focus:ring-blue-100 outline-none text-slate-800 text-xs"
                    required
                  />
                </div>
              )}

              {state === 'other' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    {lang === 'bn' ? 'কাস্টম রাজ্য / বিভাগ' : 'Custom State / Div'}
                  </label>
                  <input
                    id="custom-job-state"
                    type="text"
                    value={customState}
                    onChange={(e) => setCustomState(e.target.value)}
                    placeholder={lang === 'bn' ? 'রাজ্য/বিভাগের নাম' : 'Enter state/division'}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:border-brand-primary focus:ring-1 focus:ring-blue-100 outline-none text-slate-800 text-xs"
                    required
                  />
                </div>
              )}

              {district === 'other' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    {lang === 'bn' ? 'কাস্টম জেলা / শহর' : 'Custom District / City'}
                  </label>
                  <input
                    id="custom-job-district"
                    type="text"
                    value={customDistrict}
                    onChange={(e) => setCustomDistrict(e.target.value)}
                    placeholder={lang === 'bn' ? 'জেলা/শহরের নাম' : 'Enter district/city'}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:border-brand-primary focus:ring-1 focus:ring-blue-100 outline-none text-slate-800 text-xs"
                    required
                  />
                </div>
              )}
            </div>
          </div>

          {/* Salary Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {t.labelSalary} <span className="text-rose-500">*</span>
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
                id="input-job-salary"
                type="text"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder={t.placeholderSalary}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-blue-100/60 outline-none text-slate-800 text-sm transition-all"
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
                id="input-job-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t.placeholderPhone}
                readOnly={!!localStorage.getItem('app_user_phone') && localStorage.getItem('app_user_phone') !== 'guest_user'}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-blue-100/60 outline-none text-slate-800 text-sm transition-all read-only:bg-slate-100/60 read-only:text-slate-500 read-only:cursor-not-allowed"
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

          {/* Job Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {t.labelDesc} <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <FileText size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
              <textarea
                id="input-job-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t.placeholderDesc}
                rows={4}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-blue-100/60 outline-none text-slate-800 text-sm transition-all resize-none"
                required
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-3">
            <button
              id="cancel-job-form"
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors cursor-pointer text-center"
            >
              {t.btnCancel}
            </button>
            <button
              id="submit-job-form"
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-brand-primary hover:bg-brand-primary-hover disabled:bg-brand-primary/60 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer text-center shadow-md shadow-blue-100"
            >
              {isSubmitting ? t.loading : t.btnSubmit}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
