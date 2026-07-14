import React from 'react';
import { WorkerPost, AppLanguage } from '../types';
import { translations } from '../translations';
import { User, MapPin, Calendar, Clock, DollarSign, Phone, Eye, Coins, Truck, Video, Sparkles, Heart, Globe } from 'lucide-react';
import { motion } from 'motion/react';
import { getRegionName, regionsData } from '../data/regions';

interface WorkerCardProps {
  key?: string | number;
  post: WorkerPost;
  lang: AppLanguage;
  onViewDetails: (post: WorkerPost) => void;
  isSaved?: boolean;
  onToggleSave?: (id: string) => void;
}

export default function WorkerCard({ post, lang, onViewDetails, isSaved, onToggleSave }: WorkerCardProps) {
  const t = translations[lang];

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
  // Formatting date for display
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

  // Determine category-specific icons & visual styles for workers
  const getCategoryConfig = (skillsText: string, aboutText: string = '') => {
    const combined = (skillsText + ' ' + aboutText).toLowerCase();
    
    const isDailyWage = combined.includes('wage') || combined.includes('daily') || combined.includes('labor') || combined.includes('মজুরি') || combined.includes('মজুর') || combined.includes('দৈনিক');
    const isDelivery = combined.includes('delivery') || combined.includes('rider') || combined.includes('courier') || combined.includes('ডেলিভারি') || combined.includes('রাইডার') || combined.includes('কুরিয়ার');
    const isEditing = combined.includes('edit') || combined.includes('video') || combined.includes('editor') || combined.includes('এডিটিং') || combined.includes('এডিট') || combined.includes('ভিডিও');

    if (isDailyWage) {
      return {
        badgeText: t.categoryWorkerDaily || '💰 Daily Labor',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/60',
        icon: <Coins size={20} className="text-amber-600" />,
        iconBg: 'bg-amber-100/50 border-amber-200/40',
        cardBorder: 'border-amber-200/40 hover:border-amber-300/80',
        cardBg: 'from-amber-50/20 to-white'
      };
    }
    if (isDelivery) {
      return {
        badgeText: t.categoryWorkerDelivery || '🚚 Delivery Rider',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
        icon: <Truck size={20} className="text-emerald-600" />,
        iconBg: 'bg-emerald-100/50 border-emerald-200/40',
        cardBorder: 'border-emerald-200/40 hover:border-emerald-300/80',
        cardBg: 'from-emerald-50/20 to-white'
      };
    }
    if (isEditing) {
      return {
        badgeText: t.categoryWorkerVideo || '🎬 Video Editor',
        badgeClass: 'bg-purple-50 text-purple-700 border-purple-200/60',
        icon: <Video size={20} className="text-purple-600" />,
        iconBg: 'bg-purple-100/50 border-purple-200/40',
        cardBorder: 'border-purple-200/40 hover:border-purple-300/80',
        cardBg: 'from-purple-50/20 to-white'
      };
    }

    return {
      badgeText: t.categoryWorkerProfessional || '👷 Professional Worker',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-100',
      icon: <User size={20} className="text-brand-primary" />,
      iconBg: 'bg-blue-50 border-blue-100/60',
      cardBorder: 'border-slate-100 hover:border-slate-300',
      cardBg: 'from-white to-white'
    };
  };

  const config = getCategoryConfig(post.skills, post.about);

  return (
    <motion.div
      id={`worker-card-${post.id}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className={`bg-gradient-to-b ${config.cardBg} rounded-[12px] border ${config.cardBorder} shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col justify-between`}
    >
      {/* Top Content Area */}
      <div className="p-6">
        <div className="flex items-center justify-between gap-3">
          {/* Custom Stylized Category Icon */}
          <div className={`p-3 rounded-xl border ${config.iconBg} transition-all duration-300`}>
            {config.icon}
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <span className="text-[10px] font-semibold text-slate-400 bg-slate-100/80 px-2.5 py-1 rounded-full uppercase tracking-wider">
              {formatTimeAgo(post.createdAt)}
            </span>
            <div className="flex items-center gap-1.5">
              {onToggleSave && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSave(post.id);
                  }}
                  className={`p-1 rounded-full transition-colors cursor-pointer ${
                    isSaved ? 'text-rose-500 bg-rose-50/50' : 'text-slate-400 hover:text-rose-500 hover:bg-slate-100/50'
                  }`}
                  title={t.saveLabel || 'Save'}
                >
                  <Heart size={14} fill={isSaved ? "currentColor" : "none"} />
                </button>
              )}
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${config.badgeClass}`}>
                {config.badgeText}
              </span>
            </div>
          </div>
        </div>

        {/* Name, Avatar & Gender */}
        <div className="mt-5 flex gap-4 items-start">
          {post.photoUrl && (
            <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-slate-100 shrink-0 shadow-sm bg-slate-50">
              <img src={post.photoUrl} alt={post.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight leading-snug flex flex-wrap items-center gap-2" id={`worker-name-${post.id}`}>
              {post.name}
              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded-sm whitespace-nowrap">
                {post.gender === 'Male' || post.gender === 'পুরুষ' ? t.genderMale : post.gender === 'Female' || post.gender === 'মহিলা' ? t.genderFemale : t.genderOther}
              </span>
              {post.age && (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-sm whitespace-nowrap">
                  {post.age} {lang === 'bn' ? 'বছর' : lang === 'hi' ? 'वर्ष' : 'years'}
                </span>
              )}
            </h3>
            
            {post.qualification && (
              <p className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-1 min-w-0" title={post.qualification}>
                <span className="shrink-0">🎓</span> <span className="truncate">{post.qualification}</span>
              </p>
            )}

            <div className="mt-1.5">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide mr-1.5 notranslate">{t.skillsLabel || 'Skills:'}</span>
              <span className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg inline-block" id={`worker-skills-${post.id}`}>
                {post.skills}
              </span>
            </div>
          </div>
        </div>

        {/* Information Grid */}
        <div className="mt-5 pt-4 border-t border-slate-100/80 space-y-3 text-slate-600">
          <div className="flex items-center gap-2.5 text-sm">
            <div className="w-6 h-6 bg-slate-100 rounded-md flex items-center justify-center shrink-0">
              <MapPin size={13} className="text-slate-500" />
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs shrink-0 select-none bg-slate-100 px-1 py-0.5 rounded border border-slate-200/60 leading-none">{getCountryFlag()}</span>
              <span className="font-semibold text-slate-700 truncate" title={getDisplayLocation()}>{getDisplayLocation()}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 text-xs">
              <Calendar size={13} className="text-slate-400 shrink-0" />
              <span className="text-slate-500 truncate">{post.date}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Clock size={13} className="text-slate-400 shrink-0" />
              <span className="text-slate-500 truncate">{post.time}</span>
            </div>
          </div>

          {/* Wage / Rate info */}
          <div className="mt-2 p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium notranslate">
              {post.country === 'india' ? (
                <span className="font-extrabold text-xs text-slate-400 w-3.5 text-center">₹</span>
              ) : post.country === 'bangladesh' ? (
                <span className="font-extrabold text-xs text-slate-400 w-3.5 text-center">৳</span>
              ) : (
                <DollarSign size={14} className="text-slate-400" />
              )}
              <span>{t.expectedWageLabel || 'Expected Wage'}</span>
            </div>
            <span className="text-sm font-black text-brand-secondary" id={`worker-wage-${post.id}`}>
              {post.country === 'india' && !post.expectedWage.includes('₹') && !post.expectedWage.toLowerCase().includes('inr') ? `₹${post.expectedWage}` : 
               post.country === 'bangladesh' && !post.expectedWage.includes('৳') && !post.expectedWage.includes('টাকা') && !post.expectedWage.toLowerCase().includes('bdt') ? `৳${post.expectedWage}` : 
               post.expectedWage}
            </span>
          </div>
        </div>
      </div>

      {/* Modern Actions Section */}
      <div className="px-6 pb-6 pt-1 flex gap-2">
        <button
          id={`worker-view-btn-${post.id}`}
          onClick={() => onViewDetails(post)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-3 bg-slate-100/80 hover:bg-slate-200/80 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-[0.98] notranslate"
        >
          <Eye size={13} />
          {t.moreDetails || 'More Details'}
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            try {
              const directUrl = `${window.location.origin}/?profileType=worker&id=${post.id}`;
              navigator.clipboard.writeText(directUrl);
              alert(lang === 'bn' ? '✓ পার্সোনাল ওয়েবসাইট লিংক কপি হয়েছে!' : '✓ Personal website link copied!');
            } catch (err) {
              console.error(err);
            }
          }}
          className="px-3 py-3 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-xl transition-all cursor-pointer flex items-center justify-center border border-amber-100"
          title={lang === 'bn' ? 'পার্সোনাল ওয়েবসাইট লিংক' : 'Personal Website Link'}
        >
          <Globe size={14} />
        </button>

        <a
          id={`worker-call-btn-${post.id}`}
          href={`tel:${post.phone}`}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-3 bg-brand-primary hover:bg-brand-primary-hover active:bg-brand-primary-hover text-white text-xs font-black rounded-xl transition-all shadow-md shadow-blue-100 cursor-pointer active:scale-[0.98] notranslate"
        >
          <Phone size={13} className="animate-bounce" />
          {t.callWorker || 'Call Worker'}
        </a>
      </div>
    </motion.div>
  );
}

