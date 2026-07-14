import React from 'react';
import { BrokerPost, AppLanguage } from '../types';
import { translations } from '../translations';
import { User, MapPin, Calendar, Clock, DollarSign, Phone, Eye, Coins, Truck, Video, Sparkles, Heart, Shield, Users, ArrowRight, Briefcase, Globe } from 'lucide-react';
import { motion } from 'motion/react';
import { getRegionName, regionsData } from '../data/regions';

interface BrokerCardProps {
  key?: string | number;
  post: BrokerPost;
  lang: AppLanguage;
  onContact: (post: BrokerPost) => void;
  onRequestSourcing: (post: BrokerPost) => void;
}

export default function BrokerCard({ post, lang, onContact, onRequestSourcing }: BrokerCardProps) {
  const t = translations[lang] || translations['bn'];

  // Format hierarchical location path
  const getDisplayLocation = () => {
    if (!post.country) return post.location;

    const countryName = post.country === 'other' 
      ? (post.customCountry || 'Other Country')
      : getRegionName('country', post.country, lang);

    const stateName = post.state === 'other'
      ? (post.customState || 'Other State')
      : getRegionName('state', post.state, lang);

    const districtName = post.district === 'other'
      ? (post.customDistrict || 'Other District')
      : getRegionName('district', post.district, lang);

    const cleanCountryName = countryName.replace(/[\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF]\s*/g, '');

    return `${districtName}, ${stateName}, ${cleanCountryName}`;
  };

  const getCountryFlag = () => {
    if (!post.country || post.country === 'other') return '🌐';
    const countryObj = regionsData.find(c => c.id === post.country);
    return countryObj?.flag || '🌐';
  };

  return (
    <motion.div
      id={`broker-card-${post.id}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="bg-gradient-to-b from-rose-50/25 to-white rounded-3xl border border-rose-100 hover:border-rose-300 shadow-xs hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col justify-between p-6"
    >
      <div className="space-y-4">
        {/* Top Header with Icon and Badge */}
        <div className="flex items-center justify-between gap-2">
          <div className="p-3 bg-rose-100/50 border border-rose-200/40 rounded-2xl text-rose-600">
            <Shield size={20} />
          </div>
          <span className="text-[10px] font-black text-rose-700 bg-rose-100 px-2.5 py-1 rounded-full uppercase tracking-wider border border-rose-200/50">
            ⭐ {lang === 'bn' ? 'যাচাইকৃত দালাল' : lang === 'hi' ? 'सत्यापित दलाल' : 'Verified Agent'}
          </span>
        </div>

        {/* Broker Info */}
        <div>
          <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
            {post.name}
          </h3>
          {post.agency && (
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
              🏢 {post.agency}
            </p>
          )}
        </div>

        <div className="space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
          {/* Sourcing details */}
          <div className="flex items-start gap-2">
            <Users size={14} className="text-slate-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold text-slate-800">
                {lang === 'bn' ? 'দালালিকৃত কাজ:' : lang === 'hi' ? 'दलालीकृत कार्य:' : 'Brokered Jobs:'}
              </span>{' '}
              {post.selectedJobs && post.selectedJobs.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-1">
                  {post.selectedJobs.map((job, idx) => (
                    <span key={idx} className="inline-block px-2 py-0.5 bg-rose-50 border border-rose-100/60 text-rose-700 rounded-md text-[10px] font-extrabold">
                      {job}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="font-semibold">{post.workerTypes}</span>
              )}
            </div>
          </div>

          {/* Sourcing location */}
          <div className="flex items-start gap-2">
            <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold text-slate-800">
                {lang === 'bn' ? 'কাজের এলাকা:' : lang === 'hi' ? 'कार्य क्षेत्र:' : 'Areas:'}
              </span>{' '}
              <span className="font-semibold">{getCountryFlag()} {getDisplayLocation()}</span>
            </div>
          </div>

          {/* Experience */}
          <div className="flex items-start gap-2">
            <Sparkles size={14} className="text-slate-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold text-slate-800">
                {lang === 'bn' ? 'অভিজ্ঞতা:' : lang === 'hi' ? 'अनुभव:' : 'Experience:'}
              </span>{' '}
              <span className="font-semibold">{post.experience}</span>
            </div>
          </div>

          {/* Brokered Jobs Limit (1 to 3) */}
          <div className="flex items-start gap-2">
            <Briefcase size={14} className="text-slate-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold text-slate-800">
                {lang === 'bn' ? 'দালালি করার কাজের সীমা:' : lang === 'hi' ? 'दलाली कार्य सीमा:' : 'Brokered Jobs Limit:'}
              </span>{' '}
              <span className="ml-1 px-2 py-0.5 rounded-md font-black text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wider inline-block">
                {post.maxJobsToBroker || 3} {lang === 'bn' ? 'টি কাজ সর্বোচ্চ' : lang === 'hi' ? 'कार्य अधिकतम' : 'Jobs Max'}
              </span>
            </div>
          </div>
        </div>

        {/* Description / Bio */}
        <p className="text-[11px] text-slate-400 font-semibold bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed line-clamp-2">
          {post.description}
        </p>
      </div>

      {/* Footer Buttons */}
      <div className="flex items-center gap-2 mt-5 pt-3 border-t border-slate-100">
        <button
          onClick={() => onContact(post)}
          className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-xs shadow-rose-100 transition-all active:scale-95 select-none"
        >
          <Phone size={13} />
          {lang === 'bn' ? 'সরাসরি কল করুন' : lang === 'hi' ? 'सीधे कॉल करें' : 'Direct Call'}
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            try {
              const directUrl = `${window.location.origin}/?profileType=broker&id=${post.id}`;
              navigator.clipboard.writeText(directUrl);
              alert(lang === 'bn' ? '✓ পার্সোনাল ওয়েবসাইট লিংক কপি হয়েছে!' : '✓ Personal website link copied!');
            } catch (err) {
              console.error(err);
            }
          }}
          className="bg-amber-50 hover:bg-amber-100 text-amber-600 p-2 rounded-xl text-xs font-bold flex items-center justify-center cursor-pointer transition-all active:scale-95 border border-amber-100"
          title={lang === 'bn' ? 'পার্সোনাল ওয়েবসাইট লিংক' : 'Personal Website Link'}
        >
          <Globe size={14} />
        </button>

        <button
          onClick={() => onRequestSourcing(post)}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-xl text-xs font-bold flex items-center justify-center cursor-pointer transition-all active:scale-95"
          title={lang === 'bn' ? 'কর্মী সরবরাহের অনুরোধ করুন' : 'Request sourcing'}
        >
          <Users size={14} />
        </button>
      </div>
    </motion.div>
  );
}
