import React, { useState, useEffect } from 'react';
import { JobPost, AppLanguage } from '../types';
import { translations } from '../translations';
import { X, Briefcase, MapPin, Phone, FileText, User, Globe, Map, Navigation, DollarSign, Building2, Bell, Upload, Trash2, Camera, Users, Coins, Calendar, Clock } from 'lucide-react';
import { addDoc, collection, getDocs } from 'firebase/firestore';
import { db, isFirebaseAvailable } from '../firebase';
import { regionsData, otherOption, getRegionName } from '../data/regions';

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
  { id: 'role-hotel', bn: 'হোটেল / রেস্টুরেন্ট বয়', en: 'Hotel / Restaurant Staff', hi: 'होटल कर्मचारी' },
  { id: 'role-cook', bn: 'বাবুর্চি / শেফ', en: 'Cook / Chef', hi: 'रसोइया' },
  { id: 'role-maid', bn: 'গৃহকর্মী / কাজের লোক', en: 'Maid / Housekeeper', hi: 'घरेलू कामगार' },
  { id: 'role-loader', bn: 'লোডার / আনলোডার', en: 'Loader / Unloader', hi: 'कुली / लोडर' },
  { id: 'role-shop', bn: 'দোকান সহকারী / সেলসম্যান', en: 'Shop Assistant / Salesperson', hi: 'दुकान सहायक' },
  { id: 'role-packaging', bn: 'প্যাকেজিং কর্মী', en: 'Packaging Worker', hi: 'पैकेजिंग कर्मचारी' },
  { id: 'role-agriculture', bn: 'কৃষি কর্মী / চাষী', en: 'Agricultural Worker', hi: 'कृषि मजदूर' },
  { id: 'role-computer', bn: 'কম্পিউটার অপারেটর / ডাটা এন্ট্রি', en: 'Computer Operator / Data Entry', hi: 'कंप्यूटर ऑपरेटर' },
  { id: 'role-editor', bn: 'ভিডিও এডিটর / কনটেন্ট মেকার', en: 'Video Editor / Creator', hi: 'वीडियो एडिटर' }
];

interface CompanyRecruitmentFormProps {
  lang: AppLanguage;
  availableJobs: { id: string; title: string; company: string }[];
  onClose: () => void;
  onSuccess: (message: string, newPost: JobPost) => void;
  preselectedBrokerId?: string;
}

const localT = {
  bn: {
    brokerHeading: "৭. দালাল (ব্রোকার) নির্বাচন করুন",
    brokerSubheading: "দালাল ছাড়া কাজ সাবমিট করা যাবে না। আপনার নির্বাচিত এলাকা অনুযায়ী দালাল ফিল্টার করা হবে।",
    selectBrokerPlaceholder: "-- দালাল সিলেক্ট করুন --",
    noBrokers: "এই এলাকায় কোনো দালাল নেই। দয়া করে অন্য কোনো এলাকা চেষ্টা করুন অথবা ড্যাশবোর্ড থেকে দালাল তৈরি করুন।",
    brokerFeeLabel: "দালালের সোর্সিং চার্জ (১০০ - ১০০০ টাকা)",
    workerWageLabel: "কর্মীর দৈনিক/মাসিক মজুরি (২০০ - ৫০০০ টাকা)",
    uploadedPhotosLabel: "৮. কাজের জায়গার ৩ থেকে ৬টি ছবি আপলোড করুন",
    uploadPlaceholder: "ক্লিক করুন অথবা ড্রাগ অ্যান্ড ড্রপ করে ছবি দিন (৩-৬ টি ছবি আবশ্যিক)",
    workerCountLabel: "৯. কতজন কর্মী প্রয়োজন? (১ - ১০ জন)",
    submitting: "সাবমিট হচ্ছে...",
    alertWorkers: "কর্মী ও দালালকে নোটিফিকেশন পাঠান 🔔",
    brokerRequiredError: "দয়া করে একজন দালাল সিলেক্ট করুন। দালাল ছাড়া কাজের লোক নিয়োগ দেওয়া যাবে না।",
    photosRequiredError: "দয়া করে অন্তত ৩টি এবং সর্বোচ্চ ৬টি কাজের জায়গার ছবি আপলোড করুন।"
  },
  hi: {
    brokerHeading: "7. दलाल (ब्रोकर) चुनें",
    brokerSubheading: "दलाल के बिना काम जमा नहीं किया जा सकता है। आपके चुने हुए क्षेत्र के अनुसार दलाल फ़िल्टर किए जाएंगे।",
    selectBrokerPlaceholder: "-- दलाल चुनें --",
    noBrokers: "इस क्षेत्र में कोई दलाल नहीं है। कृपया कोई अन्य क्षेत्र प्रयास करें या डैशबोर्ड से दलाल बनाएं।",
    brokerFeeLabel: "दलाल का सोर्सिंग शुल्क (100 - 1000 रुपये)",
    workerWageLabel: "कामगार का दैनिक/मासिक वेतन (200 - 5000 रुपये)",
    uploadedPhotosLabel: "8. कार्य स्थल की 3 से 6 तस्वीरें अपलोड करें",
    uploadPlaceholder: "क्लिक करें या तस्वीरें खींचकर यहाँ छोड़ें (3-6 तस्वीरें अनिवार्य हैं)",
    workerCountLabel: "9. कितने कामगारों की आवश्यकता है? (1 - 10)",
    submitting: "जमा हो रहा है...",
    alertWorkers: "कामगार और दलाल को सूचित करें 🔔",
    brokerRequiredError: "कृपया एक दलाल चुनें। दलाल के बिना कामगारों को नियुक्त नहीं किया जा सकता है।",
    photosRequiredError: "कृपया कार्य स्थल की कम से कम 3 और अधिकतम 6 तस्वीरें अपलोड करें।"
  },
  en: {
    brokerHeading: "7. Select Broker",
    brokerSubheading: "Submission without a broker is not allowed. Brokers will be filtered according to your selected location.",
    selectBrokerPlaceholder: "-- Select Broker --",
    noBrokers: "No brokers registered in this location. Please try another location or register a broker from the dashboard.",
    brokerFeeLabel: "Broker's Sourcing Fee (100 - 1000 BDT/INR)",
    workerWageLabel: "Worker's Daily/Monthly Wage (200 - 5000 BDT/INR)",
    uploadedPhotosLabel: "8. Upload 3 to 6 Workplace Photos",
    uploadPlaceholder: "Click or drag & drop to upload images (3-6 photos required)",
    workerCountLabel: "9. How many workers needed? (1 - 10)",
    submitting: "Submitting...",
    alertWorkers: "Alert Workers & Broker 🔔",
    brokerRequiredError: "Please select a broker. Worker hiring requires broker sourcing.",
    photosRequiredError: "Please upload between 3 and 6 workplace photos."
  }
};

// Image compression utility to compress images on the fly using HTML5 Canvas
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Downscale if exceeds 800px width or height
        const MAX_DIM = 800;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Compress to JPEG with 0.6 quality (looks great but incredibly small, ~20-50KB)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
          resolve(dataUrl);
        } else {
          resolve(event.target?.result as string);
        }
      };
      img.onerror = () => {
        resolve(event.target?.result as string);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      resolve("");
    };
    reader.readAsDataURL(file);
  });
};

export default function CompanyRecruitmentForm({ lang, availableJobs, onClose, onSuccess, preselectedBrokerId }: CompanyRecruitmentFormProps) {
  const t = translations[lang] || translations['bn'];
  const lt = localT[lang] || localT['bn'];

  // Form states
  const [selectedJobId, setSelectedJobId] = useState('');
  const [customJobTitle, setCustomJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [salary, setSalary] = useState('');
  const [phone, setPhone] = useState('');
  const [addressDetails, setAddressDetails] = useState('');
  const [requirements, setRequirements] = useState('');

  // Hierarchical Location states
  const [country, setCountry] = useState('');
  const [customCountry, setCustomCountry] = useState('');
  const [state, setState] = useState('');
  const [customState, setCustomState] = useState('');
  const [district, setDistrict] = useState('');
  const [customDistrict, setCustomDistrict] = useState('');

  // Sourcing & Broker Features
  const [allBrokers, setAllBrokers] = useState<any[]>([]);
  const [isLoadingBrokers, setIsLoadingBrokers] = useState(false);
  const [selectedBrokerId, setSelectedBrokerId] = useState(preselectedBrokerId || '');
  const [brokerCharge, setBrokerCharge] = useState(500);
  const [workerWage, setWorkerWage] = useState(1500);
  const [workerCount, setWorkerCount] = useState(1);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [workplaceMapLink, setWorkplaceMapLink] = useState('');
  const [isLocationCaptured, setIsLocationCaptured] = useState(false);
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // New Sourcing Shift/Schedule and Gender preferences
  const [requiredDate, setRequiredDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [shiftStartTime, setShiftStartTime] = useState('08:00');
  const [shiftEndTime, setShiftEndTime] = useState('17:00');
  const [totalWorkHours, setTotalWorkHours] = useState(9);
  const [requiredGender, setRequiredGender] = useState<'any' | 'male' | 'female'>('any');

  // Automatically calculate total work hours
  useEffect(() => {
    if (shiftStartTime && shiftEndTime) {
      const [startH, startM] = shiftStartTime.split(':').map(Number);
      const [endH, endM] = shiftEndTime.split(':').map(Number);
      let diffMins = (endH * 60 + endM) - (startH * 60 + startM);
      if (diffMins < 0) {
        // Overnight shift
        diffMins += 24 * 60;
      }
      const hrs = Math.round((diffMins / 60) * 10) / 10;
      setTotalWorkHours(hrs);
    }
  }, [shiftStartTime, shiftEndTime]);

  // Status states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Load Brokers
  useEffect(() => {
    const fetchBrokers = async () => {
      setIsLoadingBrokers(true);
      const list: any[] = [];
      
      // 1. Fetch from Firestore
      try {
        const querySnapshot = await getDocs(collection(db, 'broker_posts'));
        querySnapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
      } catch (err) {
        console.error("Error fetching brokers from firestore:", err);
      }

      // 2. Fetch from LocalStorage as backup
      try {
        const localStr = localStorage.getItem('local_broker_posts');
        if (localStr) {
          const locals = JSON.parse(localStr);
          locals.forEach((localB: any) => {
            if (!list.some(b => b.id === localB.id || b.phone === localB.phone)) {
              list.push(localB);
            }
          });
        }
      } catch (err) {
        console.error("Error loading local brokers:", err);
      }

      setAllBrokers(list);
      setIsLoadingBrokers(false);

      if (preselectedBrokerId) {
        const preB = list.find(b => b.id === preselectedBrokerId);
        if (preB) {
          if (preB.country) setCountry(preB.country);
          if (preB.state) setState(preB.state);
          if (preB.district) setDistrict(preB.district);
          if (preB.customCountry) setCustomCountry(preB.customCountry);
          if (preB.customState) setCustomState(preB.customState);
          if (preB.customDistrict) setCustomDistrict(preB.customDistrict);
        }
      }
    };

    fetchBrokers();
  }, []);

  // Filter Brokers according to location details
  const filteredBrokers = allBrokers.filter((b) => {
    if (!country) return false;
    const matchCountry = b.country?.toLowerCase() === country.toLowerCase();
    if (!state) return matchCountry;
    const matchState = b.state?.toLowerCase() === state.toLowerCase();
    if (!district) return matchCountry && matchState;
    const matchDistrict = b.district?.toLowerCase() === district.toLowerCase();
    return matchCountry && matchState && matchDistrict;
  });

  // Location-based smart fallback lists
  const stateBrokers = allBrokers.filter((b) => {
    if (!country || !state) return false;
    return b.country?.toLowerCase() === country.toLowerCase() && b.state?.toLowerCase() === state.toLowerCase();
  });

  const countryBrokers = allBrokers.filter((b) => {
    if (!country) return false;
    return b.country?.toLowerCase() === country.toLowerCase();
  });

  // Display all registered brokers as requested: "সব দالاলের নাম থাকবে"
  const displayedBrokers = allBrokers;

  // Get selected job title as string
  const getSelectedJobTitle = () => {
    if (selectedJobId === 'custom') {
      return customJobTitle;
    } else if (selectedJobId.startsWith('role-')) {
      const role = defaultJobRoles.find(r => r.id === selectedJobId);
      return role ? (role[lang] || role['bn'] || '') : '';
    } else {
      const job = availableJobs.find(j => j.id === selectedJobId);
      return job ? job.title : '';
    }
  };

  const currentJobTitle = getSelectedJobTitle().trim();

  // Sort brokers so that local and matching-job brokers appear at the top
  const sortedDisplayedBrokers = [...displayedBrokers].sort((a, b) => {
    // 1. Check location matches
    const aLocMatch = country && a.country?.toLowerCase() === country.toLowerCase() &&
                      (!state || a.state?.toLowerCase() === state.toLowerCase()) &&
                      (!district || a.district?.toLowerCase() === district.toLowerCase());
    const bLocMatch = country && b.country?.toLowerCase() === country.toLowerCase() &&
                      (!state || b.state?.toLowerCase() === state.toLowerCase()) &&
                      (!district || b.district?.toLowerCase() === district.toLowerCase());

    // 2. Check job specialization matches
    const aJobMatch = a.selectedJobs && a.selectedJobs.some((j: string) => j.toLowerCase() === currentJobTitle.toLowerCase() || currentJobTitle.toLowerCase().includes(j.toLowerCase()));
    const bJobMatch = b.selectedJobs && b.selectedJobs.some((j: string) => j.toLowerCase() === currentJobTitle.toLowerCase() || currentJobTitle.toLowerCase().includes(j.toLowerCase()));

    // Score calculations
    const aScore = (aLocMatch ? 2 : 0) + (aJobMatch ? 1 : 0);
    const bScore = (bLocMatch ? 2 : 0) + (bJobMatch ? 1 : 0);

    return bScore - aScore; // Descending order of matches
  });

  // Auto-select a matching broker if found
  useEffect(() => {
    const currentJob = getSelectedJobTitle().trim();
    if (currentJob && sortedDisplayedBrokers.length > 0) {
      const matched = sortedDisplayedBrokers.find(b => 
        b.selectedJobs && b.selectedJobs.some((j: string) => j.toLowerCase() === currentJob.toLowerCase() || currentJob.toLowerCase().includes(j.toLowerCase()))
      );
      if (matched) {
        setSelectedBrokerId(matched.id || '');
      }
    }
  }, [selectedJobId, customJobTitle, country, state, district, allBrokers]);

  // Sourcing statistics messages
  const getFilterMessage = () => {
    const totalCount = allBrokers.length;
    return lang === 'bn'
      ? `📋 সিস্টেমে নিবন্ধিত মোট ${totalCount} জন দালালের তালিকা নিচে দেওয়া হয়েছে (আপনার এলাকার দালালদের প্রথমে দেখানো হচ্ছে)`
      : lang === 'hi'
        ? `📋 सिस्टम में पंजीकृत कुल ${totalCount} दलालों की सूची नीचे दी गई है`
        : `📋 Total of ${totalCount} registered brokers are listed below (local brokers shown first)`;
  };

  // Image Upload Handlers
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files) as File[];
      if (uploadedPhotos.length + filesArray.length > 6) {
        setErrorMessage(
          lang === 'bn'
            ? 'সর্বোচ্চ ৬টি ছবি আপলোড করতে পারবেন।'
            : lang === 'hi'
              ? 'आप अधिकतम 6 तस्वीरें अपलोड कर सकते हैं।'
              : 'You can upload a maximum of 6 photos.'
        );
        return;
      }
      
      const compressedList: string[] = [];
      for (const file of filesArray) {
        try {
          const compressed = await compressImage(file);
          if (compressed) {
            compressedList.push(compressed);
          }
        } catch (err) {
          console.error("Error compressing image:", err);
        }
      }
      if (compressedList.length > 0) {
        setUploadedPhotos(prev => [...prev, ...compressedList]);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files) {
      const filesArray = Array.from(e.dataTransfer.files) as File[];
      if (uploadedPhotos.length + filesArray.length > 6) {
        setErrorMessage(
          lang === 'bn'
            ? 'সর্বোচ্চ ৬টি ছবি আপলোড করতে পারবেন।'
            : lang === 'hi'
              ? 'आप अधिकतम 6 तस्वीरें अपलोड कर सकते हैं।'
              : 'You can upload a maximum of 6 photos.'
        );
        return;
      }
      
      const compressedList: string[] = [];
      for (const file of filesArray) {
        if (file.type.startsWith('image/')) {
          try {
            const compressed = await compressImage(file);
            if (compressed) {
              compressedList.push(compressed);
            }
          } catch (err) {
            console.error("Error compressing dropped image:", err);
          }
        }
      }
      if (compressedList.length > 0) {
        setUploadedPhotos(prev => [...prev, ...compressedList]);
      }
    }
  };

  const removePhoto = (index: number) => {
    setUploadedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleCaptureLiveLocation = () => {
    setIsCapturingLocation(true);
    setLocationError('');
    
    if (!navigator.geolocation) {
      const errMsg = lang === 'bn' 
        ? 'আপনার ব্রাউজার বা ফোনে জিপিএস লোকেশন সাপোর্ট করে না।' 
        : lang === 'hi'
          ? 'आपका ब्राउज़र या फोन जीपीएस स्थान का समर्थन नहीं करता है।'
          : 'Your browser or phone does not support GPS location.';
      setLocationError(errMsg);
      setIsCapturingLocation(false);
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
        
        setWorkplaceMapLink(mapsUrl);
        setIsLocationCaptured(true);
        setIsCapturingLocation(false);

        // Open in Google Maps app / web
        window.open(mapsUrl, '_blank');
      },
      (error) => {
        console.error("GPS retrieval error:", error);
        let errMsg = '';
        if (error.code === error.PERMISSION_DENIED) {
          errMsg = lang === 'bn'
            ? 'লোকেশন পারমিশন দেওয়া হয়নি। দয়া করে ব্রাউজার সেটিংস থেকে লোকেশন পারমিশন দিন।'
            : lang === 'hi'
              ? 'स्थान अनुमति अस्वीकार कर दी गई। कृपया अनुमति सक्षम करें।'
              : 'Location permission denied. Please allow location access in your browser/device settings.';
        } else {
          errMsg = lang === 'bn'
            ? 'ফোনের জিপিএস থেকে লোকেশন পেতে সমস্যা হয়েছে। দয়া করে ফোনের লোকেশন অন করে পুনরায় চেষ্টা করুন।'
            : lang === 'hi'
              ? 'जीपीएस स्थान प्राप्त करने में विफल। कृपया स्थान चालू करें।'
              : 'Failed to retrieve GPS location. Please ensure your device GPS is turned ON and try again.';
        }
        setLocationError(errMsg);
        setIsCapturingLocation(false);
      },
      options
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Determine final job title
    let finalTitle = '';
    if (selectedJobId === 'custom') {
      if (!customJobTitle.trim()) {
        setErrorMessage(
          lang === 'bn' 
            ? 'অনুগ্রহ করে কাস্টম কাজের নাম লিখুন।' 
            : lang === 'hi'
              ? 'कृपया कस्टम कार्य का नाम दर्ज करें।'
              : 'Please enter custom job title.'
        );
        return;
      }
      finalTitle = customJobTitle;
    } else if (selectedJobId.startsWith('role-')) {
      const selectedRole = defaultJobRoles.find(r => r.id === selectedJobId);
      finalTitle = selectedRole ? (selectedRole[lang] || selectedRole['bn']) : selectedJobId;
    } else {
      const selectedJob = availableJobs.find(j => j.id === selectedJobId);
      if (!selectedJob) {
        setErrorMessage(
          lang === 'bn' 
            ? 'অনুগ্রহ করে কাজের ক্যাটাগরি বা টাইটেল সিলেক্ট করুন।' 
            : lang === 'hi'
              ? 'कृपया कार्य श्रेणी या शीर्षक चुनें।'
              : 'Please select a job category/title.'
        );
        return;
      }
      finalTitle = selectedJob.title;
    }

    // Input Validation
    if (!companyName.trim() || !phone.trim() || !addressDetails.trim() || !requirements.trim()) {
      setErrorMessage(
        lang === 'bn' 
          ? 'অনুগ্রহ করে সব তথ্য সঠিকভাবে পূরণ করুন।' 
          : lang === 'hi'
            ? 'कृपया सभी जानकारी सही ढंग से भरें।'
            : 'Please fill all required fields correctly.'
      );
      return;
    }

    if (!country || !state || !district) {
      setErrorMessage(
        lang === 'bn' 
          ? 'অনুগ্রহ করে দেশ, রাজ্য এবং জেলা সিলেক্ট করুন।' 
          : lang === 'hi'
            ? 'कृपया देश, राज्य और जिला चुनें।'
            : 'Please select Country, State, and District.'
      );
      return;
    }

    // Contact phone validation
    const cleanPhone = phone.replace(/\s+/g, '');
    if (cleanPhone.length < 10) {
      setErrorMessage(
        lang === 'bn' 
          ? 'অনুগ্রহ করে সঠিক ১০-১১ ডিজিটের মোবাইল নম্বর দিন।' 
          : lang === 'hi'
            ? 'कृपया सही 10-11 अंकों का मोबाइल नंबर दर्ज करें।'
            : 'Please enter a valid 10-11 digit contact number.'
      );
      return;
    }

    // Broker validation
    if (!selectedBrokerId) {
      setErrorMessage(lt.brokerRequiredError);
      return;
    }

    // Photos constraint (3 to 6 photos required)
    if (uploadedPhotos.length < 3 || uploadedPhotos.length > 6) {
      setErrorMessage(lt.photosRequiredError);
      return;
    }

    // Workplace map link and GPS live location validation (mandatory to prevent scam/fraud)
    if (!isLocationCaptured || !workplaceMapLink || !workplaceMapLink.trim()) {
      setErrorMessage(
        lang === 'bn' 
          ? 'আপনার লাইভ জিপিএস লোকেশন কনফার্ম করা বাধ্যতামূলক! দয়া করে নিচের জিপিএস লোকেশন বারে ক্লিক করে আপনার লাইভ লোকেশন নিশ্চিত করুন।' 
          : lang === 'hi'
            ? 'आपका लाइव जीपीएस स्थान सत्यापित करना अनिवार्य है! कृपया नीचे दिए गए जीपीएस बटन पर क्लिक करके अपना लाइव स्थान सत्यापित करें।'
            : 'Your live GPS location confirmation is mandatory! Please click the GPS location bar below to confirm your live location.'
      );
      return;
    }

    setIsSubmitting(true);

    const countryName = getRegionName('country', country, lang, customCountry);
    const stateName = getRegionName('state', state, lang, customState);
    const districtName = getRegionName('district', district, lang, customDistrict);
    const fullLocation = `${addressDetails}, ${districtName}, ${stateName}, ${countryName}`;

    const selectedBroker = allBrokers.find(b => b.id === selectedBrokerId);

    try {
      // Create the recruitment post
      const recruitmentPost: any = {
        title: finalTitle,
        company: companyName,
        date: lang === 'bn' ? 'জরুরী নিয়োগ' : lang === 'hi' ? 'त्वरित भर्ती' : 'Urgent Hiring',
        time: lang === 'bn' ? `কর্মী সংখ্যা: ${workerCount} জন` : lang === 'hi' ? `कामगार संख्या: ${workerCount}` : `Workers: ${workerCount}`,
        location: fullLocation,
        country,
        state,
        district,
        customCountry: country === 'other' ? customCountry : undefined,
        customState: state === 'other' ? customState : undefined,
        customDistrict: district === 'other' ? customDistrict : undefined,
        phone: cleanPhone,
        salary: lang === 'bn' ? `${workerWage} টাকা/দৈনিক` : lang === 'hi' ? `${workerWage} रुपये/दैनिक` : `${workerWage} BDT/Daily`,
        description: requirements,
        createdAt: Date.now(),
        // New custom sourcing fields
        brokerId: selectedBrokerId,
        brokerName: selectedBroker?.name || 'Selected Broker',
        brokerPhone: selectedBroker?.phone || '',
        brokerCharge,
        workerWage,
        workerCount,
        uploadedPhotos: uploadedPhotos, // base64 string array
        requiredDate,
        shiftStartTime,
        shiftEndTime,
        totalWorkHours,
        requiredGender,
        workplaceMapLink
      };

      // Set date and time to custom schedule values
      recruitmentPost.date = requiredDate;
      recruitmentPost.time = `${shiftStartTime} - ${shiftEndTime} (${totalWorkHours} ${lang === 'bn' ? 'ঘণ্টা' : 'hrs'})`;

      // Generate a mock/temp representation of the post for success callbacks
      const savedPostWithId: JobPost = {
        id: `recruitment-req-${Date.now()}`,
        ...recruitmentPost
      };

      // B. Create system notification directly targeted to the selected broker
      const notifId = `notif-company-${Date.now()}`;
      const genderText = requiredGender === 'male'
        ? (lang === 'bn' ? 'পুরুষ' : lang === 'hi' ? 'पुरुष' : 'Male')
        : requiredGender === 'female'
          ? (lang === 'bn' ? 'মহিলা' : lang === 'hi' ? 'महिला' : 'Female')
          : (lang === 'bn' ? 'যেকোনো' : lang === 'hi' ? 'कोई भी' : 'Any');

      const newNotif = {
        id: notifId,
        title: lang === 'bn'
          ? `💼 কোম্পানি রিক্রুটমেন্ট এলার্ট!`
          : lang === 'hi'
            ? `💼 कंपनी भर्ती अलर्ट!`
            : `💼 Company Recruitment Alert!`,
        text: lang === 'bn'
          ? `কোম্পানি "${companyName}" আপনার মাধ্যমে ${workerCount} জন "${finalTitle}" কর্মী নিয়োগ করতে চায়! জেন্ডার: ${genderText}, তারিখ: ${requiredDate}, সময়: ${shiftStartTime} - ${shiftEndTime} (মোট ${totalWorkHours} ঘণ্টা)। প্রতি কর্মীর দৈনিক মজুরি: ${workerWage} টাকা, দালালি চার্জ: ${brokerCharge} টাকা। যোগাযোগ করুন: ${cleanPhone}।`
          : lang === 'hi'
            ? `कंपनी "${companyName}" आपके माध्यम से ${workerCount} "${finalTitle}" कामगारों को नियुक्त करना चाहती है! लिंग: ${genderText}, तारीख: ${requiredDate}, समय: ${shiftStartTime} - ${shiftEndTime} (कुल ${totalWorkHours} घंटे)। वेतन: ${workerWage} रुपये, दलाली शुल्क: ${brokerCharge} रुपये। संपर्क करें: ${cleanPhone}।`
            : `Company "${companyName}" wants to hire ${workerCount} "${finalTitle}" workers through you! Gender: ${genderText}, Date: ${requiredDate}, Time: ${shiftStartTime} - ${shiftEndTime} (Total ${totalWorkHours} hrs). Wage: ${workerWage} BDT/worker, Broker Fee: ${brokerCharge} BDT. Contact: ${cleanPhone}.`,
        time: lang === 'bn' ? 'এইমাত্র' : lang === 'hi' ? 'अभी-अभी' : 'Just now',
        read: false,
        createdAt: Date.now(),
        targetBrokerId: selectedBrokerId,
        targetBrokerName: selectedBroker?.name || '',
        companyPhone: cleanPhone,
        companyName,
        jobTitle: finalTitle,
        workLocation: fullLocation,
        workerCount,
        workerWage,
        brokerCharge,
        uploadedPhotos, // full photos list
        workplaceMapLink,
        requiredDate,
        shiftStartTime,
        shiftEndTime,
        totalWorkHours,
        requiredGender
      };

      // Save notification to local storage immediately so it shows up in UI instantly
      try {
        const localNotifsStr = localStorage.getItem('local_notifications');
        const localNotifs = localNotifsStr ? JSON.parse(localNotifsStr) : [];
        localNotifs.unshift(newNotif);
        localStorage.setItem('local_notifications', JSON.stringify(localNotifs));
      } catch (localErr) {
        console.error("Could not save notification locally:", localErr);
      }

      // Save notification in Firestore in background (asynchronously) to make form submission feel instantaneous
      if (isFirebaseAvailable) {
        addDoc(collection(db, 'notifications'), newNotif)
          .then(() => {
            console.log("Notification background sync to Firestore successful.");
          })
          .catch((dbNotifErr) => {
            console.error("Delayed background sync of notification to Firestore failed:", dbNotifErr);
          });
      }

      // Dispatch global storage update event to refresh local state instantly
      window.dispatchEvent(new Event('local_storage_posts_updated'));

      // Format Success Toast text & Trigger parent success action
      const successMsg = lang === 'bn' 
        ? `কোম্পানি কর্মী নিয়োগ চাহিদা দালাল "${selectedBroker?.name}" এর কাছে পাঠানো হয়েছে! শীঘ্রই তিনি আপনার সাথে যোগাযোগ করবেন।` 
        : lang === 'hi'
          ? `कंपनी कार्यकर्ता मांग ब्रोकर "${selectedBroker?.name}" को भेजी गई! वे जल्द ही आपसे संपर्क करेंगे।`
          : `Company worker request successfully sent to broker "${selectedBroker?.name}"! They will contact you shortly.`;
        
      onSuccess(successMsg, savedPostWithId);
    } catch (err) {
      console.error("Error submitting company recruitment form: ", err);
      setErrorMessage(
        lang === 'bn' 
          ? 'তথ্য সাবমিট করতে সমস্যা হয়েছে, আবার চেষ্টা করুন।' 
          : lang === 'hi'
            ? 'विवरण जमा करने में विफल। कृपया पुन: प्रयास करें।'
            : 'Failed to submit form. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedBroker = allBrokers.find(b => b.id === selectedBrokerId);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div 
        id="company-recruitment-container"
        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-scale-up"
      >
        {/* Top Header */}
        <div className="bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-4.5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Building2 size={22} className="text-teal-100" />
            <div>
              <h2 className="font-black text-base leading-tight" id="company-form-heading">
                {lang === 'bn' ? 'কোম্পানি রিক্রুটমেন্ট পোর্টাল' : lang === 'hi' ? 'कंपनी भर्ती पोर्टल' : 'Company Recruitment Form'}
              </h2>
              <p className="text-[10px] text-teal-100/90 font-medium mt-0.5">
                {lang === 'bn' ? 'আপনার কোম্পানির জন্য কাজের লোক খুঁজুন' : lang === 'hi' ? 'अपनी कंपनी के लिए कामगार खोजें' : 'Post your company vacancy and alert job seekers'}
              </p>
            </div>
          </div>
          <button
            id="close-company-form-btn"
            onClick={onClose}
            className="p-1.5 hover:bg-black/10 rounded-lg transition-colors cursor-pointer text-teal-100 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 max-h-[80vh]">
          {errorMessage && (
            <div id="company-form-error" className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-bold leading-relaxed">
              ⚠️ {errorMessage}
            </div>
          )}

          {/* Job Selection Dropdown */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
              {lang === 'bn' ? '১. কোন কাজের জন্য লোক প্রয়োজন? (কাজের লিস্ট)' : lang === 'hi' ? '1. किस काम के लिए लोग चाहिए? (काम की सूची)' : '1. Select Job Category / Title'} <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Briefcase size={15} className="absolute left-3 top-3.5 text-teal-600" />
              <select
                id="company-select-job-vacancy"
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="w-full pl-9 pr-8 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none text-slate-800 text-xs font-bold transition-all appearance-none cursor-pointer"
                required
              >
                <option value="">-- {lang === 'bn' ? 'আপনার প্রয়োজনীয় কাজ নির্বাচন করুন' : lang === 'hi' ? 'अपनी आवश्यक नौकरी का चयन करें' : 'Select Job from App List'} --</option>
                <optgroup label={lang === 'bn' ? '📌 কাজের তালিকা (সব কাজ)' : lang === 'hi' ? '📌 काम की सूची' : '📌 Standard Job Roles'}>
                  {defaultJobRoles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role[lang] || role['bn']}
                    </option>
                  ))}
                </optgroup>

                {availableJobs.length > 0 && (
                  <optgroup label={lang === 'bn' ? '🔄 ইতিপূর্বে পোস্টকৃত কাজ' : lang === 'hi' ? '🔄 पहले पोस्ट की गई नौकरियां' : '🔄 Previously Posted Jobs'}>
                    {availableJobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.title} ({j.company})
                      </option>
                    ))}
                  </optgroup>
                )}

                <optgroup label="➕">
                  <option value="custom" className="text-teal-600 font-extrabold">
                    ✨ {lang === 'bn' ? 'কাস্টম নতুন কাজ যোগ করুন' : lang === 'hi' ? 'কस्टम নতুন কাজ जोड़ें' : '+ Write Custom Job Title'}
                  </option>
                </optgroup>

                {false && (
                  <>
                    {availableJobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.title} ({j.company})
                      </option>
                    ))}
                    <option value="custom">custom</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Custom Job Title input */}
          {selectedJobId === 'custom' && (
            <div className="animate-fade-in">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                {lang === 'bn' ? 'কাজের নাম লিখুন' : lang === 'hi' ? 'काम का नाम लिखें' : 'Enter Custom Job Name'} <span className="text-rose-500">*</span>
              </label>
              <input
                id="company-custom-job-title"
                type="text"
                value={customJobTitle}
                onChange={(e) => setCustomJobTitle(e.target.value)}
                placeholder={lang === 'bn' ? 'যেমন: ফ্যাক্টরি অপারেটর, প্যাকিং ম্যান, ড্রাইভার' : lang === 'hi' ? 'जैसे: फैक्ट्री ऑपरेटर, पैकिंग मैन, ड्राइवर' : 'e.g. Factory Worker, Tailor'}
                className="w-full px-4 py-2.5 bg-slate-50 border border-teal-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none text-slate-800 text-xs font-semibold transition-all"
                required
              />
            </div>
          )}

          {/* Company / Owner Name */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
              {lang === 'bn' ? '২. কোম্পানি বা মালিকের নাম' : lang === 'hi' ? '2. कंपनी या मालिक का नाम' : '2. Company / Employer Name'} <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User size={15} className="absolute left-3 top-3 text-slate-400" />
              <input
                id="company-owner-name"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder={lang === 'bn' ? 'যেমন: এস আর গ্রুপ, বাপ্পি গার্মেন্টস লিমিটেড' : lang === 'hi' ? 'जैसे: एस आर ग्रुप, बापी गारमेंट्स' : 'e.g. SR Apparels, Amazon Hub'}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none text-slate-800 text-xs font-semibold transition-all"
                required
              />
            </div>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                {lang === 'bn' ? '৩. যোগাযোগের মোবাইল নম্বর' : lang === 'hi' ? '3. संपर्क मोबाइल नंबर' : '3. Contact Number'} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone size={15} className="absolute left-3 top-3 text-slate-400" />
                <input
                  id="company-contact-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 01712345678"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none text-slate-800 text-xs font-semibold transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                {lang === 'bn' ? '৪. কর্মী প্রতি বাজেট / মন্তব্য' : lang === 'hi' ? '4. प्रति कामगार बजट / टिप्पणी' : '4. Offered Budget Context'} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                {country === 'india' ? (
                  <span className="absolute left-3 top-2.5 text-slate-400 font-extrabold text-xs select-none">₹</span>
                ) : country === 'bangladesh' ? (
                  <span className="absolute left-3 top-2.5 text-slate-400 font-extrabold text-xs select-none">৳</span>
                ) : (
                  <DollarSign size={15} className="absolute left-3 top-3 text-slate-400" />
                )}
                <input
                  id="company-offered-salary"
                  type="text"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  placeholder={lang === 'bn' ? 'যেমন: দক্ষ কর্মী প্রয়োজন' : lang === 'hi' ? 'जैसे: कुशल कामगार' : 'e.g. urgent requirement'}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none text-slate-800 text-xs font-semibold transition-all"
                  required
                />
              </div>
            </div>
          </div>

          {/* Location Selection */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-3">
            <h4 className="text-xs font-black text-slate-700 flex items-center gap-1.5">
              <MapPin size={14} className="text-teal-600" />
              {lang === 'bn' ? '৫. কাজের এলাকা নির্বাচন করুন' : lang === 'hi' ? '5. कार्य क्षेत्र का चयन करें' : '5. Location Details'}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <select
                  id="company-country-select"
                  value={country}
                  onChange={(e) => {
                    setCountry(e.target.value);
                    setState('');
                    setDistrict('');
                  }}
                  className="w-full px-2 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 text-[11px] font-bold outline-none cursor-pointer"
                  required
                >
                  <option value="">{lang === 'bn' ? 'দেশ সিলেক্ট করুন' : lang === 'hi' ? 'দেশ' : 'Country'}</option>
                  {regionsData.map(c => (
                    <option key={c.id} value={c.id}>{c.flag} {lang === 'bn' ? c.nameBn : c.nameEn}</option>
                  ))}
                  <option value="other">{lang === 'bn' ? 'অন্যান্য দেশ' : lang === 'hi' ? 'অন্য দেশ' : 'Other Country'}</option>
                </select>
              </div>

              <div>
                <select
                  id="company-state-select"
                  value={state}
                  disabled={!country}
                  onChange={(e) => {
                    setState(e.target.value);
                    setDistrict('');
                  }}
                  className="w-full px-2 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 text-[11px] font-bold outline-none disabled:opacity-60 cursor-pointer"
                  required
                >
                  <option value="">{lang === 'bn' ? 'বিভাগ / রাজ্য' : lang === 'hi' ? 'राज्य' : 'State'}</option>
                  {country !== 'other' && regionsData.find(c => c.id === country)?.states.map(s => (
                    <option key={s.id} value={s.id}>{lang === 'bn' ? s.nameBn : s.nameEn}</option>
                  ))}
                  {country && <option value="other">{lang === 'bn' ? 'অন্যান্য' : lang === 'hi' ? 'अन्य' : 'Other'}</option>}
                </select>
              </div>

              <div>
                <select
                  id="company-district-select"
                  value={district}
                  disabled={!state}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-2 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 text-[11px] font-bold outline-none disabled:opacity-60 cursor-pointer"
                  required
                >
                  <option value="">{lang === 'bn' ? 'জেলা সিলেক্ট করুন' : lang === 'hi' ? 'जिला' : 'District'}</option>
                  {country !== 'other' && state !== 'other' && regionsData.find(c => c.id === country)?.states.find(s => s.id === state)?.districts.map(d => (
                    <option key={d.id} value={d.id}>{lang === 'bn' ? d.nameBn : d.nameEn}</option>
                  ))}
                  {state && <option value="other">{lang === 'bn' ? 'অন্যান্য' : lang === 'hi' ? 'अन्य' : 'Other'}</option>}
                </select>
              </div>
            </div>

            {/* Custom Inputs for Location */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {country === 'other' && (
                <input
                  id="company-custom-country"
                  type="text"
                  value={customCountry}
                  onChange={(e) => setCustomCountry(e.target.value)}
                  placeholder={lang === 'bn' ? 'কাস্টম দেশের নাম' : lang === 'hi' ? 'कस्टम देश' : 'Enter Country'}
                  className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                  required
                />
              )}
              {state === 'other' && (
                <input
                  id="company-custom-state"
                  type="text"
                  value={customState}
                  onChange={(e) => setCustomState(e.target.value)}
                  placeholder={lang === 'bn' ? 'কাস্টম রাজ্য' : lang === 'hi' ? 'कस्टम राज्य' : 'Enter State'}
                  className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                  required
                />
              )}
              {district === 'other' && (
                <input
                  id="company-custom-district"
                  type="text"
                  value={customDistrict}
                  onChange={(e) => setCustomDistrict(e.target.value)}
                  placeholder={lang === 'bn' ? 'কাস্টম জেলা' : lang === 'hi' ? 'कस्टम जिला' : 'Enter District'}
                  className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                  required
                />
              )}
            </div>

            {/* Complete Address */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">
                {lang === 'bn' ? 'কাজের সম্পূর্ণ ঠিকানা / ল্যান্ডমার্ক' : lang === 'hi' ? 'कार्य का पूरा पता / लैंडमार्क' : 'Full Job Address / Landmark'} <span className="text-rose-500">*</span>
              </label>
              <input
                id="company-landmark-address"
                type="text"
                value={addressDetails}
                onChange={(e) => setAddressDetails(e.target.value)}
                placeholder={lang === 'bn' ? 'যেমন: ব্লক-সি, মিরপুর-১১, ঢাকা (সড়ক নম্বর সহ)' : lang === 'hi' ? 'जैसे: ब्लॉक-सी, सेक्टर-11, मुंबई' : 'e.g. Road 12, Mirpur Sector 11, Landmark'}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold outline-none focus:border-teal-500"
              />
            </div>

            {/* Workplace Map Link or Coordinates (Mandatory GPS Tracker) */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-0.5 flex items-center gap-1.5">
                <span>📍</span>
                <span>{lang === 'bn' ? '৫.২ কাজের জায়গার লাইভ জিপিএস ভেরিফিকেশন (বাধ্যতামূলক)' : lang === 'hi' ? '5.2 कार्य स्थल का लाइव जीपीएस सत्यापन (अनिवार्य)' : '5.2 Workplace Live GPS Verification (Mandatory)'}</span> <span className="text-rose-500">*</span>
              </label>

              <div className={`p-4 rounded-2xl border-2 transition-all duration-300 ${
                isLocationCaptured 
                  ? 'border-emerald-500 bg-emerald-50/40 shadow-sm' 
                  : 'border-rose-500 bg-rose-50/50 border-dashed shadow-xs'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl shrink-0 ${isLocationCaptured ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                    <Navigation size={18} className={isCapturingLocation ? "animate-spin" : ""} />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div>
                      <h5 className={`text-xs font-bold leading-tight ${isLocationCaptured ? 'text-emerald-800' : 'text-rose-800'}`}>
                        {lang === 'bn' 
                          ? (isLocationCaptured ? '🟢 লাইভ জিপিএস লোকেশন কনফার্মড!' : '🔴 লাইভ জিপিএস লোকেশন ট্র্যাকার') 
                          : lang === 'hi'
                            ? (isLocationCaptured ? '🟢 लाइव जीपीएस स्थान सत्यापित!' : '🔴 लाइव जीपीएस स्थान ट्रैकर')
                            : (isLocationCaptured ? '🟢 Live GPS Location Confirmed!' : '🔴 Live GPS Location Tracker')}
                      </h5>
                      <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-0.5">
                        {lang === 'bn' 
                          ? 'কর্মী জালিয়াতি ও প্রতারণা রোধে আপনার বর্তমান কাজের জায়গার লাইভ জিপিএস লোকেশন সিস্টেমে সেভ করা ১০০% বাধ্যতামূলক।' 
                          : lang === 'hi'
                            ? 'धोखाधड़ी को रोकने के लिए, इस सिस्टम में आपके वास्तविक कार्यस्थल का लाइव जीपीएस दर्ज करना 100% अनिवार्य है।'
                            : 'To prevent fraud, saving your actual live GPS location in our database is 100% mandatory.'}
                      </p>
                    </div>

                    {locationError && (
                      <div className="text-[10px] font-bold text-rose-600 bg-rose-100/60 p-2 rounded-xl flex items-center gap-1.5 border border-rose-200">
                        <span>⚠️</span>
                        <span>{locationError}</span>
                      </div>
                    )}

                    {isLocationCaptured && workplaceMapLink && (
                      <div className="bg-emerald-100/40 p-2.5 rounded-xl border border-emerald-200/50 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700">
                            {lang === 'bn' ? 'সেভ করা জিপিএস লিংক' : 'Captured GPS Link'}
                          </span>
                          <span className="px-1.5 py-0.5 text-[8px] font-black uppercase rounded bg-emerald-500 text-white animate-pulse">
                            {lang === 'bn' ? 'সুরক্ষিত' : 'SECURED'}
                          </span>
                        </div>
                        <input
                          type="text"
                          readOnly
                          value={workplaceMapLink}
                          className="w-full bg-white px-2 py-1 text-[10px] font-mono font-medium text-emerald-800 border border-emerald-200 rounded-lg outline-none cursor-not-allowed select-all"
                        />
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleCaptureLiveLocation}
                        disabled={isCapturingLocation}
                        className={`px-3.5 py-2 text-xs font-extrabold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                          isLocationCaptured 
                            ? 'bg-slate-800 text-white hover:bg-slate-900 active:scale-95' 
                            : 'bg-rose-600 text-white hover:bg-rose-700 active:scale-95 animate-pulse'
                        }`}
                      >
                        <MapPin size={14} />
                        {isCapturingLocation ? (
                          <span>{lang === 'bn' ? 'লোকেশন ট্র্যাক হচ্ছে...' : 'Tracking...'}</span>
                        ) : isLocationCaptured ? (
                          <span>{lang === 'bn' ? 'পুনরায় লোকেশন সেট করুন 🔄' : 'Re-verify GPS 🔄'}</span>
                        ) : (
                          <span>{lang === 'bn' ? 'লাইভ লোকেশন সেট করুন (বাধ্যতামূলক) 📍' : 'Set Live Location (Mandatory) 📍'}</span>
                        )}
                      </button>

                      {isLocationCaptured && workplaceMapLink && (
                        <a
                          href={workplaceMapLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2 text-xs font-bold rounded-xl border border-emerald-300 text-emerald-700 hover:bg-emerald-100/30 transition-all flex items-center gap-1 cursor-pointer bg-white"
                        >
                          <Map size={14} />
                          <span>{lang === 'bn' ? 'ম্যাপ অ্যাপে দেখুন 🗺️' : 'View in Maps 🗺️'}</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Work Schedule & Shift, and Gender Preferences Section */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3.5">
            <h4 className="text-xs font-black text-slate-700 flex items-center gap-2 uppercase tracking-wider">
              <Calendar size={15} className="text-teal-600 shrink-0" />
              <span>
                {lang === 'bn' ? '৫. কাজের শিডিউল ও জেন্ডার নির্বাচন' : lang === 'hi' ? '5. काम का शेड्यूल और लिंग' : '5. Work Schedule & Required Gender'}
              </span>
            </h4>

            {/* Date Input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                  {lang === 'bn' ? 'কবে থেকে কর্মী লাগবে (তারিখ)' : lang === 'hi' ? 'किस तारीख से कामगार चाहिए' : 'Required Work Date'} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                  <input
                    type="date"
                    id="company-work-date"
                    value={requiredDate}
                    onChange={(e) => setRequiredDate(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs font-bold outline-none focus:border-teal-500 transition-all cursor-pointer"
                    required
                  />
                </div>
              </div>

              {/* Required Gender selection */}
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                  {lang === 'bn' ? 'কর্মী জেন্ডার (পুরুষ/মহিলা)' : lang === 'hi' ? 'कामगार लिंग (पुरुष/महिला)' : 'Preferred Gender'} <span className="text-rose-500">*</span>
                </label>
                <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200/50">
                  {(['any', 'male', 'female'] as const).map((gender) => {
                    const label = gender === 'any' 
                      ? (lang === 'bn' ? 'উভয়' : lang === 'hi' ? 'दोनों' : 'Both')
                      : gender === 'male'
                        ? (lang === 'bn' ? 'পুরুষ' : lang === 'hi' ? 'पुरुष' : 'Male')
                        : (lang === 'bn' ? 'মহিলা' : lang === 'hi' ? 'महिला' : 'Female');
                    
                    const isSelected = requiredGender === gender;
                    return (
                      <button
                        key={gender}
                        type="button"
                        onClick={() => setRequiredGender(gender)}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                          isSelected 
                            ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-xs' 
                            : 'text-slate-600 hover:text-slate-800'
                        }`}
                      >
                        {gender === 'male' ? '👨' : gender === 'female' ? '👩' : '👥'}
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Time Shift inputs and hour calculations */}
            <div className="bg-white p-3 rounded-xl border border-slate-200/60 space-y-2.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    {lang === 'bn' ? 'কয়টা থেকে শুরু (Start)' : lang === 'hi' ? 'काम शुरू होने का समय' : 'Work Starts From'}
                  </label>
                  <div className="relative">
                    <Clock size={13} className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                    <input
                      type="time"
                      id="company-shift-start"
                      value={shiftStartTime}
                      onChange={(e) => setShiftStartTime(e.target.value)}
                      className="w-full pl-8 pr-2 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-slate-700 text-xs font-bold outline-none cursor-pointer"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    {lang === 'bn' ? 'কয়টায় শেষ (End)' : lang === 'hi' ? 'काम खत्म होने का समय' : 'Work Ends At'}
                  </label>
                  <div className="relative">
                    <Clock size={13} className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                    <input
                      type="time"
                      id="company-shift-end"
                      value={shiftEndTime}
                      onChange={(e) => setShiftEndTime(e.target.value)}
                      className="w-full pl-8 pr-2 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-slate-700 text-xs font-bold outline-none cursor-pointer"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Calculated duration badge */}
              <div className="flex items-center justify-between bg-teal-50/40 p-2 rounded-lg border border-teal-100/50 text-[11px] text-teal-800 font-bold">
                <span className="flex items-center gap-1">
                  ⏱️ {lang === 'bn' ? 'মোট কাজের সময়কাল:' : lang === 'hi' ? 'कुल कार्य समय:' : 'Total Work Duration:'}
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="1"
                    max="24"
                    step="0.5"
                    value={totalWorkHours}
                    onChange={(e) => setTotalWorkHours(parseFloat(e.target.value) || 0)}
                    className="w-12 text-center bg-white border border-teal-200 rounded-md py-0.5 font-extrabold text-teal-800 text-xs outline-none"
                  />
                  <span>{lang === 'bn' ? 'ঘণ্টা' : lang === 'hi' ? 'घंटे' : 'hrs'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sourcing Worker Count Section */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Users size={15} className="text-teal-600" />
              {lt.workerCountLabel} <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setWorkerCount(num)}
                  className={`h-9 rounded-xl font-bold text-xs transition-all border flex items-center justify-center cursor-pointer ${
                    workerCount === num
                      ? 'bg-gradient-to-r from-teal-600 to-emerald-600 border-transparent text-white shadow-md'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Broker Selection Section */}
          <div className="bg-teal-50/50 p-4 rounded-2xl border border-teal-100/70 space-y-3">
            <div>
              <h3 className="text-xs font-black text-teal-800 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 size={16} className="text-teal-600 animate-bounce" />
                {lt.brokerHeading} <span className="text-rose-500">*</span>
              </h3>
              <p className="text-[10px] text-teal-700 mt-0.5 leading-tight">
                {lt.brokerSubheading}
              </p>
            </div>

            {/* Smart Location Match feedback */}
            <div className="text-[10px] font-bold text-teal-800 bg-teal-100/50 px-2.5 py-1.5 rounded-lg border border-teal-100 flex items-center gap-1.5">
              <span>{getFilterMessage()}</span>
            </div>

            {isLoadingBrokers ? (
              <div className="text-center py-2 text-xs text-slate-400 font-bold">
                🔄 Loading Brokers...
              </div>
            ) : (
              <div className="relative">
                <User size={15} className="absolute left-3 top-3.5 text-teal-600 z-10" />
                <select
                  id="broker-select-field"
                  value={selectedBrokerId}
                  onChange={(e) => setSelectedBrokerId(e.target.value)}
                  className="w-full pl-9 pr-8 py-3 bg-white border border-teal-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none text-slate-800 text-xs font-extrabold transition-all cursor-pointer relative z-0"
                  required
                >
                  <option value="">{lt.selectBrokerPlaceholder}</option>
                  {sortedDisplayedBrokers.map((b) => {
                    const isJobMatch = b.selectedJobs && b.selectedJobs.some((j: string) => j.toLowerCase() === currentJobTitle.toLowerCase() || currentJobTitle.toLowerCase().includes(j.toLowerCase()));
                    return (
                      <option key={b.id} value={b.id}>
                        {isJobMatch ? '⭐ MATCH: ' : ''}{b.name} {b.agency ? `(${b.agency})` : ''} - {b.location} ({lang === 'bn' ? `সর্বোচ্চ কাজ: ${b.maxJobsToBroker || 3}টি` : lang === 'hi' ? `अधिकतम कार्य: ${b.maxJobsToBroker || 3}` : `Max Jobs: ${b.maxJobsToBroker || 3}`}) {isJobMatch ? `[Specializes in: ${b.selectedJobs?.join(', ')}]` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {selectedBrokerId && (
              (() => {
                const b = sortedDisplayedBrokers.find(x => x.id === selectedBrokerId);
                const isMatch = b?.selectedJobs && b.selectedJobs.some((j: string) => j.toLowerCase() === currentJobTitle.toLowerCase() || currentJobTitle.toLowerCase().includes(j.toLowerCase()));
                if (isMatch) {
                  return (
                    <div className="text-[10px] font-black text-emerald-800 bg-emerald-50/70 px-2.5 py-2 rounded-xl border border-emerald-150 flex items-center gap-1.5 animate-pulse">
                      <span>⭐</span>
                      <span>
                        {lang === 'bn' 
                          ? `সরাসরি মিল! দালাল "${b.name}" এই ধরণের কাজের জন্য কর্মী সরবরাহ করেন ও অটোমেটিক সিলেক্ট হয়েছেন।` 
                          : lang === 'hi'
                            ? `सीधा मिलान! दलाल "${b.name}" इस काम के लिए कामगार प्रदान करते हैं।`
                            : `Direct Match! Broker "${b.name}" specializes in this job and is auto-selected.`}
                      </span>
                    </div>
                  );
                }
                return null;
              })()
            )}

            {/* If no brokers are present in the database at all */}
            {allBrokers.length === 0 && !isLoadingBrokers && (
              <div className="p-3 bg-amber-50 border border-amber-100 text-amber-700 rounded-xl text-[10px] font-bold leading-normal">
                ⚠️ {lt.noBrokers}
              </div>
            )}
          </div>

          {/* Interactive Pricing Chart/Panel (Unfolds when a broker is selected) */}
          {selectedBrokerId && selectedBroker && (
            <div className="bg-gradient-to-br from-teal-50 to-emerald-50 p-4 rounded-3xl border border-teal-100 space-y-4 animate-scale-up">
              <h4 className="text-xs font-black text-teal-800 flex items-center gap-1.5 uppercase tracking-wide">
                <Coins size={14} className="text-teal-600 animate-pulse" />
                {lang === 'bn' ? 'দালাল ও কর্মীদের চার্জ কনফিগারেশন' : lang === 'hi' ? 'दलाल और कामगार शुल्क विन्यास' : 'Sourcing Budget Rates'}
              </h4>

              {/* Broker Charge Slider + Box */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                  <span>{lt.brokerFeeLabel}</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      id="broker-charge-input"
                      type="number"
                      min="100"
                      max="1000"
                      value={brokerCharge}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setBrokerCharge(val);
                      }}
                      onBlur={() => {
                        if (brokerCharge < 100) setBrokerCharge(100);
                        if (brokerCharge > 1000) setBrokerCharge(1000);
                      }}
                      className="w-20 px-2 py-1 bg-white border border-teal-200 rounded-lg text-xs font-black text-teal-600 text-center outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-100"
                    />
                    <span className="text-teal-600 font-bold text-[10px]">BDT</span>
                  </div>
                </div>
                <input
                  id="broker-charge-slider"
                  type="range"
                  min="100"
                  max="1000"
                  step="50"
                  value={brokerCharge}
                  onChange={(e) => setBrokerCharge(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
                <span className="text-[9px] text-slate-400 font-bold block">
                  {lang === 'bn' ? '*সীমা: ১০০ টাকা থেকে ১০০০ টাকা' : '*Range: 100 BDT to 1000 BDT'}
                </span>
              </div>

              {/* Worker Wage Slider + Box */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                  <span>{lt.workerWageLabel}</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      id="worker-wage-input"
                      type="number"
                      min="200"
                      max="5000"
                      value={workerWage}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setWorkerWage(val);
                      }}
                      onBlur={() => {
                        if (workerWage < 200) setWorkerWage(200);
                        if (workerWage > 5000) setWorkerWage(5000);
                      }}
                      className="w-20 px-2 py-1 bg-white border border-emerald-200 rounded-lg text-xs font-black text-emerald-600 text-center outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-100"
                    />
                    <span className="text-emerald-600 font-bold text-[10px]">{lang === 'bn' ? 'টাকা/দৈনিক' : 'BDT/Daily'}</span>
                  </div>
                </div>
                <input
                  id="worker-wage-slider"
                  type="range"
                  min="200"
                  max="5000"
                  step="100"
                  value={workerWage}
                  onChange={(e) => setWorkerWage(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
                <span className="text-[9px] text-slate-400 font-bold block">
                  {lang === 'bn' ? '*সীমা: ২০০ টাকা থেকে ৫০০০ টাকা' : '*Range: 200 BDT to 5000 BDT'}
                </span>
              </div>

              {/* Live pricing receipt chart */}
              <div className="bg-white/80 p-3 rounded-2xl border border-teal-100/50 text-[11px] font-bold text-slate-700 space-y-1.5">
                <div className="flex justify-between">
                  <span>{lang === 'bn' ? 'নির্বাচিত দালাল:' : lang === 'hi' ? 'चयनित दलाल:' : 'Broker Name:'}</span>
                  <span className="text-slate-800 font-extrabold">{selectedBroker.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>{lang === 'bn' ? 'দালাল সার্ভিস ফি (সোর্সিং চার্জ):' : lang === 'hi' ? 'दलाल सेवा शुल्क:' : 'Broker service fee:'}</span>
                  <span className="text-teal-600">+{brokerCharge} BDT</span>
                </div>
                <div className="flex justify-between">
                  <span>{lang === 'bn' ? 'কর্মী সংখ্যা ও মজুরি:' : lang === 'hi' ? 'कामगार संख्या और वेतन:' : 'Workers count & daily wage:'}</span>
                  <span className="text-slate-600">{workerCount} × {workerWage} BDT</span>
                </div>
                <div className="border-t border-slate-100 pt-1.5 mt-1.5 flex justify-between text-xs font-black text-teal-800">
                  <span>{lang === 'bn' ? 'মোট বাজেট চাহিদা (দৈনিক কর্মী ফি সহ):' : lang === 'hi' ? 'कुल बजट आवश्यकता:' : 'Total sourcing budget:'}</span>
                  <span className="bg-teal-100/70 text-teal-700 px-2.5 py-0.5 rounded-lg border border-teal-100">{brokerCharge + (workerCount * workerWage)} BDT</span>
                </div>
              </div>
            </div>
          )}

          {/* workplace 3 to 6 photos uploader */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Camera size={15} className="text-teal-600" />
                {lt.uploadedPhotosLabel} <span className="text-rose-500">*</span>
              </label>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {lang === 'bn' ? 'আপনার কাজের জায়গার সঠিক প্রমাণ দিতে ৩ থেকে ৬টি ছবি আপলোড করুন' : lang === 'hi' ? 'अपने कार्य स्थल का सही प्रमाण देने के लिए 3 से 6 तस्वीरें अपलोड करें' : 'Provide 3 to 6 pictures of the actual workplace'}
              </p>
            </div>

            {/* Drag and Drop Box Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-4.5 text-center transition-all cursor-pointer ${
                isDragging 
                  ? 'border-teal-500 bg-teal-50' 
                  : 'border-slate-300 bg-white hover:border-teal-400 hover:bg-slate-50/50'
              }`}
              onClick={() => document.getElementById('company-photo-input')?.click()}
            >
              <input
                id="company-photo-input"
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
              <Upload size={24} className="mx-auto text-slate-400 mb-2 animate-pulse" />
              <p className="text-xs text-slate-600 font-bold leading-snug">
                {lt.uploadPlaceholder}
              </p>
              <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                JPEG, PNG, WEBP (Max 5MB per file)
              </p>
            </div>

            {/* Uploaded Photos Grid preview */}
            {uploadedPhotos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 pt-1">
                {uploadedPhotos.map((photo, index) => (
                  <div key={index} className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group">
                    <img
                      src={photo}
                      alt={`Workplace preview ${index + 1}`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-1 right-1 p-1 bg-rose-600/90 hover:bg-rose-700 text-white rounded-lg transition-all shadow cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </button>
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] text-white py-0.5 text-center font-bold">
                      Photo {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Photo count status helper */}
            <div className="flex justify-between text-[10px] font-bold">
              <span className={uploadedPhotos.length >= 3 ? 'text-emerald-600' : 'text-rose-500'}>
                {lang === 'bn' 
                  ? `আপলোড হয়েছে: ${uploadedPhotos.length} টি (কমপক্ষে ৩টি প্রয়োজন)` 
                  : lang === 'hi'
                    ? `अपलोड की गई: ${uploadedPhotos.length} (कम से कम 3 आवश्यक)`
                    : `Uploaded: ${uploadedPhotos.length} photos (min 3 required)`}
              </span>
              <span className="text-slate-400">{uploadedPhotos.length} / 6</span>
            </div>
          </div>

          {/* Job Requirements / Details */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
              {lang === 'bn' ? '৬. কাজের বিবরণ ও প্রয়োজনীয় যোগ্যতা' : lang === 'hi' ? '6. कार्य विवरण और आवश्यक योग्यता' : '6. Job Details & Worker Requirements'} <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <FileText size={15} className="absolute left-3 top-3.5 text-slate-400" />
              <textarea
                id="company-recruitment-requirements"
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder={lang === 'bn' ? 'যেমন: ৩ জন অভিজ্ঞ ডেলিভারিম্যান লাগবে, সাইকেল থাকতে হবে, কাজের সৎ স্বভাব থাকতে হবে।' : lang === 'hi' ? 'जैसे: 3 अनुभवी डिलीवरी मैन की आवश्यकता है, साइकिल होनी चाहिए।' : 'e.g. Need 3 active delivery workers with own bike/cycle.'}
                rows={3}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none text-slate-800 text-xs font-semibold transition-all resize-none"
                required
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2.5 pt-2">
            <button
              id="company-cancel-btn"
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl transition-all cursor-pointer text-center"
            >
              {lang === 'bn' ? 'বাতিল' : lang === 'hi' ? 'रद्द करें' : 'Cancel'}
            </button>
            <button
              id="company-submit-btn"
              type="submit"
              disabled={isSubmitting || !selectedBrokerId || uploadedPhotos.length < 3 || uploadedPhotos.length > 6}
              className="flex-1 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 disabled:from-slate-300 disabled:to-slate-400 text-white text-xs font-black rounded-xl transition-all cursor-pointer text-center shadow-md shadow-teal-100"
            >
              {isSubmitting ? lt.submitting : lt.alertWorkers}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
