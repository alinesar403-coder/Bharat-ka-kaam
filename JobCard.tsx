import React from 'react';
import { JobPost, AppLanguage, isJobExpired } from '../types';
import { translations } from '../translations';
import { Briefcase, MapPin, Calendar, Clock, DollarSign, Phone, Eye, Coins, Truck, Video, Sparkles, Heart, Globe } from 'lucide-react';
import { motion } from 'motion/react';
import { getRegionName, regionsData } from '../data/regions';

interface JobCardProps {
  key?: string | number;
  post: JobPost;
  lang: AppLanguage;
  onViewDetails: (post: JobPost) => void;
  isSaved?: boolean;
  onToggleSave?: (id: string) => void;
  onCallClick?: (id: string, phone: string) => void;
}

export default function JobCard({ post, lang, onViewDetails, isSaved, onToggleSave, onCallClick }: JobCardProps) {
  const t = translations[lang];
  const isExpired = isJobExpired(post);

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

  // Formatting date for displaying
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

  // Determine category-specific icons & visual styles
  const getCategoryConfig = (titleText: string, descText: string = '') => {
    const combined = (titleText + ' ' + descText).toLowerCase();
    
    const isDailyWage = combined.includes('wage') || combined.includes('daily') || combined.includes('labor') || combined.includes('মজুরি') || combined.includes('মজুর') || combined.includes('দৈনিক');
    const isDelivery = combined.includes('delivery') || combined.includes('rider') || combined.includes('courier') || combined.includes('ডেলিভারি') || combined.includes('রাইডার') || combined.includes('কুরিয়ার');
    const isEditing = combined.includes('edit') || combined.includes('video') || combined.includes('editor') || combined.includes('এডিটিং') || combined.includes('এডিট') || combined.includes('ভিডিও');

    if (isDailyWage) {
      return {
        badgeText: t.categoryDaily || '💰 Daily Wage',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/60',
        icon: <Coins size={20} className="text-amber-600" />,
        iconBg: 'bg-amber-100/50 border-amber-200/40',
        cardBorder: 'border-amber-200/40 hover:border-amber-300/80',
        cardBg: 'from-amber-50/20 to-white'
      };
    }
    if (isDelivery) {
      return {
        badgeText: t.categoryDelivery || '🚚 Delivery',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
        icon: <Truck size={20} className="text-emerald-600" />,
        iconBg: 'bg-emerald-100/50 border-emerald-200/40',
        cardBorder: 'border-emerald-200/40 hover:border-emerald-300/80',
        cardBg: 'from-emerald-50/20 to-white'
      };
    }
    if (isEditing) {
      return {
        badgeText: t.categoryVideo || '🎬 Editing / Video',
        badgeClass: 'bg-purple-50 text-purple-700 border-purple-200/60',
        icon: <Video size={20} className="text-purple-600" />,
        iconBg: 'bg-purple-100/50 border-purple-200/40',
        cardBorder: 'border-purple-200/40 hover:border-purple-300/80',
        cardBg: 'from-purple-50/20 to-white'
      };
    }

    return {
      badgeText: t.categoryGeneral || '💼 General Job',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-100',
      icon: <Briefcase size={20} className="text-brand-primary" />,
      iconBg: 'bg-blue-50 border-blue-100/60',
      cardBorder: 'border-slate-100 hover:border-slate-300',
      cardBg: 'from-white to-white'
    };
  };

  const config = getCategoryConfig(post.title, post.description);

  return (
    <motion.div
      id={`job-card-${post.id}`}
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

        {/* Title & Company */}
        <div className="mt-5">
          {post.isBrokerManaged && (
            <div className="mb-2 inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-rose-50 to-indigo-50 border border-rose-200/80 text-rose-700 rounded-md text-[9px] font-black uppercase tracking-wider">
              <span>🛡️</span>
              {lang === 'bn' ? 'দালাল দ্বারা পরিচালিত' : 'Broker Managed'}
            </div>
          )}
          <h3 className="text-lg font-bold text-slate-900 tracking-tight leading-snug group-hover:text-brand-primary transition-colors" id={`job-title-${post.id}`}>
            {post.title}
          </h3>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide notranslate">{t.companyLabel || 'Company:'}</span>
            <span className="text-sm font-bold text-slate-700" id={`job-company-${post.id}`}>
              {post.company}
            </span>
          </div>
        </div>

        {/* Dynamic Highlight Card Body Information Grid */}
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

          {/* Wage Badge Display */}
          <div className="mt-2 p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium notranslate">
              {post.country === 'india' ? (
                <span className="font-extrabold text-xs text-slate-400 w-3.5 text-center">₹</span>
              ) : post.country === 'bangladesh' ? (
                <span className="font-extrabold text-xs text-slate-400 w-3.5 text-center">৳</span>
              ) : (
                <DollarSign size={14} className="text-slate-400" />
              )}
              <span>{t.salaryWageLabel || 'Salary / Wage'}</span>
            </div>
            <span className="text-sm font-black text-brand-secondary" id={`job-salary-${post.id}`}>
              {post.country === 'india' && !post.salary.includes('₹') && !post.salary.toLowerCase().includes('inr') ? `₹${post.salary}` : 
               post.country === 'bangladesh' && !post.salary.includes('৳') && !post.salary.includes('টাকা') && !post.salary.toLowerCase().includes('bdt') ? `৳${post.salary}` : 
               post.salary}
            </span>
          </div>
        </div>
      </div>

      {/* Modern High-End Actions Section */}
      <div className="px-6 pb-6 pt-1 flex gap-2">
        <button
          id={`job-view-btn-${post.id}`}
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
              const directUrl = `${window.location.origin}/?profileType=job&id=${post.id}`;
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

        {isExpired ? (
          <div className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-3 bg-red-600 text-white text-[11px] font-black uppercase rounded-xl border border-red-700 select-none shadow-sm shadow-red-100 animate-pulse">
            <span>🛑</span>
            <span>{lang === 'bn' ? 'টাইম আউট (TIMEOUT)' : 'TIMEOUT (Expired)'}</span>
          </div>
        ) : (
          <a
            id={`job-call-btn-${post.id}`}
            href={`tel:${post.phone}`}
            onClick={() => {
              if (onCallClick) onCallClick(post.id, post.phone);
            }}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-3 bg-brand-primary hover:bg-brand-primary-hover active:bg-brand-primary-hover text-white text-xs font-black rounded-xl transition-all shadow-md shadow-blue-100 cursor-pointer active:scale-[0.98] notranslate"
          >
            <Phone size={13} className="animate-bounce" />
            {post.isBrokerManaged ? (lang === 'bn' ? 'দালালকে কল দিন' : lang === 'hi' ? 'दलाल को कॉल करें' : 'Call Broker') : (t.callEmployer || 'Call Employer')}
          </a>
        )}
      </div>
    </motion.div>
  );
}

