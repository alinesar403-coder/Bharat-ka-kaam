import { JobPost, WorkerPost, AppLanguage, isJobExpired } from '../types';
import { translations } from '../translations';
import { X, MapPin, Calendar, Clock, DollarSign, Phone, FileText, User, Briefcase, Tag } from 'lucide-react';
import { motion } from 'motion/react';
import { getRegionName, regionsData } from '../data/regions';

interface DetailModalProps {
  post: JobPost | WorkerPost | null;
  type: 'job' | 'worker';
  lang: AppLanguage;
  onClose: () => void;
  onCallClick?: (id: string, phone: string) => void;
}

export default function DetailModal({ post, type, lang, onClose, onCallClick }: DetailModalProps) {
  if (!post) return null;
  const t = translations[lang];

  // Type Guards
  const isJob = type === 'job';
  const isExpired = isJob && isJobExpired(post);
  const job = post as JobPost;
  const worker = post as WorkerPost;

  // Build beautifully formatted hierarchical location path
  const getDisplayLocation = () => {
    if (!post.country) return post.location;

    const countryName = post.country === 'other' 
      ? (post.customCountry || t.otherCountry || 'Other Country')
      : getRegionName('country', post.country, lang);

    const stateName = post.state === 'other'
      ? (post.customState || t.otherState || 'Other State')
      : getRegionName('state', post.state, lang);

    const districtName = post.district === 'other'
      ? (post.customDistrict || t.otherDistrict || 'Other District')
      : getRegionName('district', post.district, lang);

    // Let's strip flag prefix if getRegionName prepends it, because we display it separately
    const cleanCountryName = countryName.replace(/[\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF]\s*/g, '');

    return `${districtName}, ${stateName}, ${cleanCountryName}`;
  };

  // Get country flag emoji
  const getCountryFlag = () => {
    if (!post.country || post.country === 'other') return '🌐';
    const countryObj = regionsData.find(c => c.id === post.country);
    return countryObj?.flag || '🌐';
  };

  // Format date
  const formatTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return t.justNow;
    if (minutes < 60) return `${minutes} ${t.timeAgoMinute || 'm ago'}`;
    if (hours < 24) return `${hours} ${t.timeAgoHour || 'h ago'}`;
    return `${days} ${t.timeAgoDay || 'd ago'}`;
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <motion.div
        id="detail-modal-container"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className={`px-6 py-5 text-white flex items-center justify-between ${isJob ? 'bg-brand-primary' : 'bg-brand-secondary'}`}>
          <div className="flex items-center gap-2.5">
            {isJob ? <Briefcase size={22} /> : <User size={22} />}
            <div>
              <h2 className="font-bold text-lg leading-tight" id="detail-modal-heading">
                {isJob ? job.title : worker.skills}
              </h2>
              <p className="text-xs text-white/80 mt-0.5">
                {isJob ? job.company : worker.name}
              </p>
            </div>
          </div>
          <button
            id="close-detail-modal-btn"
            onClick={onClose}
            className="p-1.5 hover:bg-black/10 rounded-lg transition-colors cursor-pointer text-white/90 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 max-h-[70vh]">
          {/* Worker Profile Header with Photo, Age and Qualification */}
          {!isJob && (
            <div className="flex flex-col sm:flex-row gap-5 items-center bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <div className="w-24 h-24 rounded-2xl bg-slate-200 border-2 border-white overflow-hidden shrink-0 shadow-md">
                {worker.photoUrl ? (
                  <img src={worker.photoUrl} alt={worker.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <User size={40} />
                  </div>
                )}
              </div>
              <div className="text-center sm:text-left space-y-1.5 min-w-0">
                <h3 className="text-xl font-bold text-slate-800 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  {worker.name}
                  {worker.age && (
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-md whitespace-nowrap">
                      {worker.age} {lang === 'bn' ? 'বছর' : lang === 'hi' ? 'वर्ष' : 'years'}
                    </span>
                  )}
                </h3>
                <p className="text-xs font-semibold text-slate-500 bg-white border border-slate-200/60 px-3 py-1 rounded-lg inline-block">
                  {lang === 'bn' ? 'দক্ষতা/কাজের ধরন:' : lang === 'hi' ? 'कौशल/कार्य प्रकार:' : 'Trade/Skills:'} <span className="font-bold text-slate-800">{worker.skills}</span>
                </p>
                {worker.qualification && (
                  <p className="text-xs text-slate-600 font-medium flex items-center justify-center sm:justify-start gap-1">
                    <span>🎓</span> <span className="font-bold">{lang === 'bn' ? 'যোগ্যতা:' : lang === 'hi' ? 'योग्यता:' : 'Qualification:'}</span> <span>{worker.qualification}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Tag & Posted Time */}
          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full notranslate ${
              isJob ? 'bg-blue-50 text-brand-primary border border-blue-100' : 'bg-emerald-50 text-brand-secondary border border-emerald-100'
            }`}>
              <Tag size={12} />
              {isJob ? (t.jobVacancy || 'Job Vacancy') : (t.availableWorker || 'Available Worker')}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              <span className="notranslate">{t.postedAt}</span> {formatTimeAgo(post.createdAt)}
            </span>
          </div>

          {/* Quick Info Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-start gap-3">
              <MapPin size={18} className="text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 notranslate">
                  <span>{t.filterLocation || 'Location'}</span>
                  <span className="text-xs">{getCountryFlag()}</span>
                </p>
                <p className="text-sm font-semibold text-slate-700 mt-0.5">{getDisplayLocation()}</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-start gap-3">
              {post.country === 'india' ? (
                <span className="font-extrabold text-base text-slate-400 mt-0.5 shrink-0 w-[18px] text-center">₹</span>
              ) : post.country === 'bangladesh' ? (
                <span className="font-extrabold text-base text-slate-400 mt-0.5 shrink-0 w-[18px] text-center">৳</span>
              ) : (
                <DollarSign size={18} className="text-slate-400 mt-0.5 shrink-0" />
              )}
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider notranslate">{isJob ? t.labelSalary : t.labelExpectedWage}</p>
                <p className="text-sm font-semibold text-slate-700 mt-0.5">
                  {isJob ? (
                    post.country === 'india' && !job.salary.includes('₹') && !job.salary.toLowerCase().includes('inr') ? `₹${job.salary}` : 
                    post.country === 'bangladesh' && !job.salary.includes('৳') && !job.salary.includes('টাকা') && !job.salary.toLowerCase().includes('bdt') ? `৳${job.salary}` : 
                    job.salary
                  ) : (
                    post.country === 'india' && !worker.expectedWage.includes('₹') && !worker.expectedWage.toLowerCase().includes('inr') ? `₹${worker.expectedWage}` : 
                    post.country === 'bangladesh' && !worker.expectedWage.includes('৳') && !worker.expectedWage.includes('টাকা') && !worker.expectedWage.toLowerCase().includes('bdt') ? `৳${worker.expectedWage}` : 
                    worker.expectedWage
                  )}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-start gap-3">
              <Calendar size={18} className="text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider notranslate">{isJob ? t.labelDate : (t.availability || 'Availability')}</p>
                <p className="text-sm font-semibold text-slate-700 mt-0.5">{post.date}</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-start gap-3">
              <Clock size={18} className="text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider notranslate">{t.shift || 'Shift'}</p>
                <p className="text-sm font-semibold text-slate-700 mt-0.5">{post.time}</p>
              </div>
            </div>
          </div>

          {/* Sourcing Schedule and Gender details */}
          {isJob && (job.brokerName || job.requiredGender) && (
            <div className="bg-teal-50/40 border border-teal-100/50 p-4 rounded-2xl space-y-3">
              <h4 className="text-[11px] font-black text-teal-800 uppercase tracking-wider flex items-center gap-1.5">
                🛡️ {lang === 'bn' ? 'সোর্সিং ও কাজের শিডিউল' : 'Sourcing & Shift Details'}
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs text-slate-700 font-semibold">
                <div>
                  <span className="text-[10px] text-slate-400 block">{lang === 'bn' ? 'সোর্সিং দালাল:' : 'Sourcing Broker:'}</span>
                  <span className="text-slate-800 font-bold">{job.brokerName || (lang === 'bn' ? 'সরাসরি কোম্পানি' : 'Direct Employer')}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">{lang === 'bn' ? 'প্রয়োজনীয় জেন্ডার:' : 'Required Gender:'}</span>
                  <span className="text-slate-800 font-bold">
                    {job.requiredGender === 'male' 
                      ? (lang === 'bn' ? '👨 পুরুষ কর্মী' : '👨 Male Worker') 
                      : job.requiredGender === 'female'
                        ? (lang === 'bn' ? '👩 মহিলা কর্মী' : '👩 Female Worker')
                        : (lang === 'bn' ? '👥 যেকোনো (উভয়)' : '👥 Any / Both')}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">{lang === 'bn' ? 'কাজের নির্দিষ্ট ডেট/তারিখ:' : 'Specific Date Needed:'}</span>
                  <span className="text-emerald-700 font-bold">📅 {job.requiredDate || job.date}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">{lang === 'bn' ? 'কাজের শিফট/সময়কাল:' : 'Shift Timing:'}</span>
                  <span className="text-slate-800 font-bold">
                    ⏰ {job.shiftStartTime || '08:00'} - {job.shiftEndTime || '17:00'} ({job.totalWorkHours || 9} {lang === 'bn' ? 'ঘণ্টা' : 'hrs'})
                  </span>
                </div>
              </div>

              {/* Photos Gallery preview inside details modal */}
              {job.uploadedPhotos && job.uploadedPhotos.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] text-slate-400 block font-bold">{lang === 'bn' ? 'কাজের জায়গার ছবি সমূহ:' : 'Workplace Photos:'}</span>
                  <div className="flex gap-1.5 overflow-x-auto py-1 scrollbar-none">
                    {job.uploadedPhotos.map((photo, idx) => (
                      <img 
                        key={idx} 
                        src={photo} 
                        alt="Workplace preview" 
                        className="w-20 h-14 object-cover rounded-xl border border-slate-200 shadow-xs shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Verified Workplace Map Location Link (Anti-fraud) */}
              {job.workplaceMapLink && (
                <div className="pt-2 space-y-1.5">
                  <span className="text-[10px] text-slate-400 block font-bold">
                    {lang === 'bn' ? 'যাচাইকৃত কর্মস্থল লোকেশন ম্যাপ:' : lang === 'hi' ? 'सत्यापित कार्यस्थल मानचित्र:' : 'Verified Workplace Location Map:'}
                  </span>
                  <a
                    href={job.workplaceMapLink.startsWith('http') ? job.workplaceMapLink : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.workplaceMapLink)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-black rounded-xl border border-rose-200 transition-all cursor-pointer w-full justify-center shadow-xs"
                  >
                    <span>📍</span>
                    <span>
                      {lang === 'bn' ? 'বাস্তব গুগল ম্যাপ লোকেশন দেখুন (ভেরিফায়েড)' : lang === 'hi' ? 'वास्तविक गूगल मानचित्र देखें (सत्यापित)' : 'View Real Google Map Location (Verified)'}
                    </span>
                  </a>
                </div>
              )}

              {/* Scam & Fraud Prevention Security Box */}
              <div className="mt-2.5 p-3.5 bg-amber-50/75 border border-amber-200/80 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-1.5 text-amber-800 text-xs font-black">
                  <span>🛡️</span>
                  <span>
                    {lang === 'bn' ? 'নিরাপত্তা ও প্রতারণা প্রতিরোধ নির্দেশিকা' : lang === 'hi' ? 'सुरक्षा और धोखाधड़ी रोकथाम दिशानिर्देश' : 'Security & Fraud Prevention Guidelines'}
                  </span>
                </div>
                <ul className="text-[10px] text-amber-800 font-bold leading-relaxed list-disc list-inside space-y-1">
                  <li>
                    {lang === 'bn' 
                      ? 'এই কাজটির কর্মস্থল এবং ছবি আমাদের দালাল সোর্সিং টিম দ্বারা বাস্তবসম্মতভাবে যাচাই করা হয়েছে।' 
                      : lang === 'hi'
                        ? 'इस कार्य का कार्यस्थल और तस्वीरें हमारे दलालों द्वारा सत्यापित की गई हैं।'
                        : 'This workplace location and images have been verified by our broker sourcing team.'}
                  </li>
                  <li className="text-rose-700 font-black">
                    {lang === 'bn' 
                      ? 'সতর্কতা: কাজ পাওয়ার জন্য কাউকে কখনো কোনো অগ্রিম টাকা (সিকিউরিটি ডিপোজিট, ফরম ফি) দেবেন না।' 
                      : lang === 'hi'
                        ? 'चेतावनी: नौकरी पाने के लिए किसी को भी कभी भी अग्रिम पैसे (सुरक्षा जमा, फॉर्म शुल्क) न दें।'
                        : 'WARNING: Never pay any advance fees, security deposits, or form charges to anyone to get hired.'}
                  </li>
                  <li>
                    {lang === 'bn' 
                      ? 'কোনো ব্যক্তি যদি কাজের লোভে টাকা দাবি করে, তবে সাথে সাথে আমাদের এআই হেল্প সেন্টারে রিপোর্ট করুন।' 
                      : lang === 'hi'
                        ? 'यदि कोई व्यक्ति पैसे मांगता है, तो तुरंत हमारे एआई सहायता केंद्र पर रिपोर्ट करें।'
                        : 'If someone demands money, immediately report them to our AI Help Center.'}
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Details & Biography */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 notranslate">
              <FileText size={14} className="text-slate-400" />
              {isJob ? t.labelDesc : t.labelAbout}
            </h4>
            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
              <p className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed">
                {isJob ? job.description : worker.about}
              </p>
            </div>
          </div>

          {/* Contact details */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
            isJob ? 'bg-blue-50/30 border-blue-100/60' : 'bg-emerald-50/30 border-emerald-100/60'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl text-white ${isJob ? 'bg-brand-primary' : 'bg-brand-secondary'}`}>
                <Phone size={18} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider notranslate">{t.labelPhone}</p>
                <p className="text-base font-bold text-slate-700 mt-0.5" id="detail-modal-phone">{post.phone}</p>
              </div>
            </div>

            {isExpired ? (
              <div className="px-5 py-3 text-sm font-black text-white bg-red-600 border border-red-700 rounded-xl select-none shadow-sm shadow-red-100 animate-pulse flex items-center gap-1">
                <span>🛑</span>
                <span>{lang === 'bn' ? 'টাইম আউট (TIMEOUT)' : 'TIMEOUT (Expired)'}</span>
              </div>
            ) : (
              <a
                id="detail-modal-call-btn"
                href={`tel:${post.phone}`}
                onClick={() => {
                  if (onCallClick) onCallClick(post.id, post.phone);
                }}
                className={`px-5 py-3 text-sm font-bold text-white rounded-xl transition-all shadow-xs cursor-pointer notranslate ${
                  isJob ? 'bg-brand-primary hover:bg-brand-primary-hover' : 'bg-brand-secondary hover:bg-brand-secondary-hover'
                }`}
              >
                {t.callDirectly || 'Call Directly'}
              </a>
            )}
          </div>

          {/* 🌐 Personal Website & Sharing Block */}
          <div className="p-4 bg-amber-50/40 border border-amber-100/60 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-[11px] font-black text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                  🌐 {lang === 'bn' ? 'পার্সোনাল ওয়েবসাইট ও পাবলিক লিংক' : 'Personal Website & Public Link'}
                </h4>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                  {lang === 'bn' ? 'এআই স্টুডিও ছাড়াই এই প্রোফাইলের পাবলিক লিংক শেয়ার করুন' : 'Share this direct personal profile website anywhere'}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  try {
                    const directUrl = `${window.location.origin}/?profileType=${type}&id=${post.id}`;
                    navigator.clipboard.writeText(directUrl);
                    alert(lang === 'bn' ? '✓ পার্সোনাল ওয়েবসাইট লিংক সফলভাবে কপি করা হয়েছে!' : '✓ Personal website link copied successfully!');
                  } catch (err) {
                    console.error(err);
                  }
                }}
                className="flex-1 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all border border-slate-200/60 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                🔗 {lang === 'bn' ? 'লিংক কপি করুন (Copy Link)' : 'Copy Web Link'}
              </button>

              <button
                onClick={() => {
                  const directUrl = `${window.location.origin}/?profileType=${type}&id=${post.id}`;
                  const text = lang === 'bn' 
                    ? `আমার পার্সোনাল প্রোফাইল ওয়েবসাইট লিংক: ${directUrl}`
                    : `My personal professional portfolio website: ${directUrl}`;
                  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                }}
                className="px-3.5 py-2.5 bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                💬 {lang === 'bn' ? 'হোয়াটসঅ্যাপ' : 'Share'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            id="close-detail-modal-footer-btn"
            onClick={onClose}
            className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-semibold rounded-xl transition-all cursor-pointer notranslate"
          >
            {t.close || 'Close'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
