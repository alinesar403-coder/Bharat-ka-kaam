export interface RegionItem {
  id: string;
  nameEn: string;
  nameBn: string;
}

export interface DistrictItem extends RegionItem {}

export interface StateItem extends RegionItem {
  districts: DistrictItem[];
}

export interface CountryItem extends RegionItem {
  flag: string;
  states: StateItem[];
}

const dummyBangladesh: any[] = [
  {
    id: "bangladesh",
    nameEn: "Bangladesh",
    nameBn: "বাংলাদেশ",
    flag: "🇧🇩",
    states: [
      {
        id: "dhaka",
        nameEn: "Dhaka Division",
        nameBn: "ঢাকা বিভাগ",
        districts: [
          { id: "dhaka_dist", nameEn: "Dhaka", nameBn: "ঢাকা" },
          { id: "gazipur", nameEn: "Gazipur", nameBn: "গাজীপুর" },
          { id: "narayanganj", nameEn: "Narayanganj", nameBn: "নারায়ণগঞ্জ" },
          { id: "tangail", nameEn: "Tangail", nameBn: "টাঙ্গাইল" },
          { id: "manikganj", nameEn: "Manikganj", nameBn: "মানিকগঞ্জ" },
          { id: "munshiganj", nameEn: "Munshiganj", nameBn: "মুন্সিগঞ্জ" },
          { id: "narsingdi", nameEn: "Narsingdi", nameBn: "নরসিংদী" },
          { id: "kishoreganj", nameEn: "Kishoreganj", nameBn: "কিশোরগঞ্জ" },
          { id: "faridpur", nameEn: "Faridpur", nameBn: "ফরিদপুর" },
          { id: "gopalganj", nameEn: "Gopalganj", nameBn: "গোপালগঞ্জ" },
          { id: "madaripur", nameEn: "Madaripur", nameBn: "মাদারীপুর" },
          { id: "rajbari", nameEn: "Rajbari", nameBn: "রাজবাড়ী" },
          { id: "shariatpur", nameEn: "Shariatpur", nameBn: "শরীয়তপুর" }
        ]
      },
      {
        id: "chattogram",
        nameEn: "Chattogram Division",
        nameBn: "চট্টগ্রাম বিভাগ",
        districts: [
          { id: "chattogram_dist", nameEn: "Chattogram", nameBn: "চট্টগ্রাম" },
          { id: "cox_bazar", nameEn: "Cox's Bazar", nameBn: "কক্সবাজার" },
          { id: "cumilla", nameEn: "Cumilla", nameBn: "কুমিল্লা" },
          { id: "feni", nameEn: "Feni", nameBn: "ফেনী" },
          { id: "brahmanbaria", nameEn: "Brahmanbaria", nameBn: "ব্রাহ্মণবাড়িয়া" },
          { id: "noakhali", nameEn: "Noakhali", nameBn: "নোয়াখালী" },
          { id: "lakshmipur", nameEn: "Lakshmipur", nameBn: "লক্ষ্মীপুর" },
          { id: "chandpur", nameEn: "Chandpur", nameBn: "চাঁদপুর" },
          { id: "rangamati", nameEn: "Rangamati", nameBn: "রাঙ্গামাটি" },
          { id: "khagrachhari", nameEn: "Khagrachhari", nameBn: "খাগড়াছড়ি" },
          { id: "bandarban", nameEn: "Bandarban", nameBn: "বান্দরবান" }
        ]
      },
      {
        id: "sylhet",
        nameEn: "Sylhet Division",
        nameBn: "সিলেট বিভাগ",
        districts: [
          { id: "sylhet_dist", nameEn: "Sylhet", nameBn: "সিলেট" },
          { id: "moulvibazar", nameEn: "Moulvibazar", nameBn: "মৌলভীবাজার" },
          { id: "habiganj", nameEn: "Habiganj", nameBn: "হবিগঞ্জ" },
          { id: "sunamganj", nameEn: "Sunamganj", nameBn: "সুনামগঞ্জ" }
        ]
      },
      {
        id: "khulna",
        nameEn: "Khulna Division",
        nameBn: "খুলনা বিভাগ",
        districts: [
          { id: "khulna_dist", nameEn: "Khulna", nameBn: "খুলনা" },
          { id: "jashore", nameEn: "Jashore", nameBn: "যশোর" },
          { id: "bagerhat", nameEn: "Bagerhat", nameBn: "বাগেরহাট" },
          { id: "satkhira", nameEn: "Satkhira", nameBn: "সাতক্ষীরা" },
          { id: "kushtia", nameEn: "Kushtia", nameBn: "কুষ্টিয়া" },
          { id: "magura", nameEn: "Magura", nameBn: "মাগুরা" },
          { id: "meherpur", nameEn: "Meherpur", nameBn: "মেহেরপুর" },
          { id: "narail", nameEn: "Narail", nameBn: "নড়াইল" },
          { id: "chuadanga", nameEn: "Chuadanga", nameBn: "চুয়াডাঙ্গা" },
          { id: "jhenaidah", nameEn: "Jhenaidah", nameBn: "ঝিনাইদহ" }
        ]
      },
      {
        id: "rajshahi",
        nameEn: "Rajshahi Division",
        nameBn: "রাজশাহী বিভাগ",
        districts: [
          { id: "rajshahi_dist", nameEn: "Rajshahi", nameBn: "রাজশাহী" },
          { id: "bogra", nameEn: "Bogra", nameBn: "বগুড়া" },
          { id: "pabna", nameEn: "Pabna", nameBn: "পাবনা" },
          { id: "natore", nameEn: "Natore", nameBn: "নাটোর" },
          { id: "naogaon", nameEn: "Naogaon", nameBn: "নওগাঁ" },
          { id: "joypurhat", nameEn: "Joypurhat", nameBn: "জয়পুরহাট" },
          { id: "chapainawabganj", nameEn: "Chapainawabganj", nameBn: "চাঁপাইনবাবগঞ্জ" },
          { id: "sirajganj", nameEn: "Sirajganj", nameBn: "সিরাজগঞ্জ" }
        ]
      },
      {
        id: "barishal",
        nameEn: "Barishal Division",
        nameBn: "বরিশাল বিভাগ",
        districts: [
          { id: "barishal_dist", nameEn: "Barishal", nameBn: "বরিশাল" },
          { id: "bhola", nameEn: "Bhola", nameBn: "ভোলা" },
          { id: "patuakhali", nameEn: "Patuakhali", nameBn: "পটুয়াখালী" },
          { id: "pirojpur", nameEn: "Pirojpur", nameBn: "পিরোজপুর" },
          { id: "jhalokati", nameEn: "Jhalokati", nameBn: "ঝালকাঠি" },
          { id: "barguna", nameEn: "Barguna", nameBn: "বরগুনা" }
        ]
      },
      {
        id: "rangpur",
        nameEn: "Rangpur Division",
        nameBn: "রংপুর বিভাগ",
        districts: [
          { id: "rangpur_dist", nameEn: "Rangpur", nameBn: "রংপুর" },
          { id: "dinajpur", nameEn: "Dinajpur", nameBn: "দিনাজপুর" },
          { id: "kurigram", nameEn: "Kurigram", nameBn: "কুড়িগ্রাম" },
          { id: "gaibandha", nameEn: "Gaibandha", nameBn: "গাইবান্ধা" },
          { id: "lalmonirhat", nameEn: "Lalmonirhat", nameBn: "লালমনিরহাট" },
          { id: "nilphamari", nameEn: "Nilphamari", nameBn: "নীলফামারী" },
          { id: "panchagarh", nameEn: "Panchagarh", nameBn: "পঞ্চগড়" },
          { id: "thakurgaon", nameEn: "Thakurgaon", nameBn: "ঠাকুরগাঁও" }
        ]
      },
      {
        id: "mymensingh",
        nameEn: "Mymensingh Division",
        nameBn: "ময়মনসিংহ বিভাগ",
        districts: [
          { id: "mymensingh_dist", nameEn: "Mymensingh", nameBn: "ময়মনসিংহ" },
          { id: "jamalpur", nameEn: "Jamalpur", nameBn: "জামালপুর" },
          { id: "sherpur", nameEn: "Sherpur", nameBn: "শেরপুর" },
          { id: "netrokona", nameEn: "Netrokona", nameBn: "নেত্রকোণা" }
        ]
      }
    ]
  }
];

export const regionsData: CountryItem[] = [
  {
    id: "india",
    nameEn: "India",
    nameBn: "ভারত",
    flag: "🇮🇳",
    states: [
      {
        id: "andhra_pradesh",
        nameEn: "Andhra Pradesh",
        nameBn: "অন্ধ্রপ্রদেশ",
        districts: [
          { id: "alluri_sitharama_raju", nameEn: "Alluri Sitharama Raju", nameBn: "আলুরি সীতারাম রাজু" },
          { id: "annamayya", nameEn: "Annamayya", nameBn: "অন্নমাইয়া" },
          { id: "anantapuramu", nameEn: "Anantapuramu", nameBn: "অনন্তপুরম" },
          { id: "bapatla", nameEn: "Bapatla", nameBn: "বাপাতলা" },
          { id: "chittoor", nameEn: "Chittoor", nameBn: "চিত্তুর" },
          { id: "east_godavari", nameEn: "East Godavari", nameBn: "পূর্ব গোদাবরী" },
          { id: "guntur", nameEn: "Guntur", nameBn: "গুন্টুর" },
          { id: "kakinada", nameEn: "Kakinada", nameBn: "কাকিদা" },
          { id: "krishna", nameEn: "Krishna", nameBn: "কৃষ্ণা" },
          { id: "kurnool", nameEn: "Kurnool", nameBn: "কুর্নুল" },
          { id: "nandyal", nameEn: "Nandyal", nameBn: "নন্দিয়াল" },
          { id: "ntr", nameEn: "NTR", nameBn: "এনটিআর" },
          { id: "palnadu", nameEn: "Palnadu", nameBn: "পালনাড়ু" },
          { id: "parvathipuram_manyam", nameEn: "Parvathipuram Manyam", nameBn: "পার্বতীপুরম মন্যম" },
          { id: "prakasam", nameEn: "Prakasam", nameBn: "প্রকাশম" },
          { id: "sri_potti_sriramulu_nellore", nameEn: "Sri Potti Sriramulu Nellore", nameBn: "শ্রী পট্টি শ্রীরামুলু নেলোর" },
          { id: "sri_sathya_sai", nameEn: "Sri Sathya Sai", nameBn: "শ্রী সত্য সাই" },
          { id: "srikakulam", nameEn: "Srikakulam", nameBn: "শ্রীকাকুলাম" },
          { id: "tirupati", nameEn: "Tirupati", nameBn: "তিরুপতি" },
          { id: "visakhapatnam", nameEn: "Visakhapatnam", nameBn: "বিশাখাপত্তনম" },
          { id: "vizianagaram", nameEn: "Vizianagaram", nameBn: "বিজয়নগরাম" },
          { id: "west_godavari", nameEn: "West Godavari", nameBn: "পশ্চিম গোদাবরী" },
          { id: "ysr_kadapa", nameEn: "YSR Kadapa", nameBn: "ওয়াইএসআর (কাডাপা)" }
        ]
      },
      {
        id: "arunachal_pradesh",
        nameEn: "Arunachal Pradesh",
        nameBn: "অরুণাচল প্রদেশ",
        districts: [
          { id: "itanagar", nameEn: "Itanagar", nameBn: "ইটানগর" }
        ]
      },
      {
        id: "assam",
        nameEn: "Assam",
        nameBn: "আসাম",
        districts: [
          { id: "baksa", nameEn: "Baksa", nameBn: "বাক্সা" },
          { id: "barpeta", nameEn: "Barpeta", nameBn: "বরপেটা" },
          { id: "biswanath", nameEn: "Biswanath", nameBn: "বিশ্বনাথ" },
          { id: "bongaigaon", nameEn: "Bongaigaon", nameBn: "বঙাইগাঁও" },
          { id: "cachar", nameEn: "Cachar", nameBn: "কাছাড়" },
          { id: "charaideo", nameEn: "Charaideo", nameBn: "চরাইদেউ" },
          { id: "chirang", nameEn: "Chirang", nameBn: "চিরাং" },
          { id: "darrang", nameEn: "Darrang", nameBn: "দারাং" },
          { id: "dhemaji", nameEn: "Dhemaji", nameBn: "ধেমাজি" },
          { id: "dhubri", nameEn: "Dhubri", nameBn: "ধুবড়ি" },
          { id: "dibrugarh", nameEn: "Dibrugarh", nameBn: "ডিব্রুগড়" },
          { id: "dima_hasao", nameEn: "Dima Hasao", nameBn: "ডিমা হাসাও" },
          { id: "goalpara", nameEn: "Goalpara", nameBn: "গোয়ালপাড়া" },
          { id: "golaghat", nameEn: "Golaghat", nameBn: "গোলাঘাট" },
          { id: "hailakandi", nameEn: "Hailakandi", nameBn: "হাইলাকান্দি" },
          { id: "hojai", nameEn: "Hojai", nameBn: "হোজাই" },
          { id: "jorhat", nameEn: "Jorhat", nameBn: "জোরহাট" },
          { id: "kamrup", nameEn: "Kamrup", nameBn: "কামরূপ" },
          { id: "kamrup_metropolitan", nameEn: "Kamrup Metropolitan", nameBn: "কামরূপ মেট্রোপলিটন" },
          { id: "karbi_anglong", nameEn: "Karbi Anglong", nameBn: "কার্বি আংলং" },
          { id: "karimganj", nameEn: "Karimganj", nameBn: "করিমগঞ্জ" },
          { id: "kokrajhar", nameEn: "Kokrajhar", nameBn: "কোকড়াঝাড়" },
          { id: "lakhimpur", nameEn: "Lakhimpur", nameBn: "লখিমপুর" },
          { id: "majuli", nameEn: "Majuli", nameBn: "মাজুলি" },
          { id: "morigaon", nameEn: "Morigaon", nameBn: "মরিগাঁও" },
          { id: "nagaon", nameEn: "Nagaon", nameBn: "নগাঁও" },
          { id: "nalbari", nameEn: "Nalbari", nameBn: "নলবাড়ি" },
          { id: "sivasagar", nameEn: "Sivasagar", nameBn: "শিবসাগর" },
          { id: "sonitpur", nameEn: "Sonitpur", nameBn: "শোনিতপুর" },
          { id: "south_salmara_mankachar", nameEn: "South Salmara-Mankachar", nameBn: "দক্ষিণ সালমারা-মানকাচর" },
          { id: "tinsukia", nameEn: "Tinsukia", nameBn: "তিনসুকিয়া" },
          { id: "udalguri", nameEn: "Udalguri", nameBn: "উদালগুড়ি" },
          { id: "west_karbi_anglong", nameEn: "West Karbi Anglong", nameBn: "পশ্চিম কার্বি আংলং" }
        ]
      },
      {
        id: "bihar",
        nameEn: "Bihar",
        nameBn: "বিহার",
        districts: [
          { id: "araria", nameEn: "Araria", nameBn: "আরারিয়া" },
          { id: "arwal", nameEn: "Arwal", nameBn: "আরওয়াল" },
          { id: "aurangabad_bh", nameEn: "Aurangabad", nameBn: "ঔরঙ্গাবাদ" },
          { id: "banka", nameEn: "Banka", nameBn: "বাঁকা" },
          { id: "begusarai", nameEn: "Begusarai", nameBn: "বেগুসরাই" },
          { id: "bhagalpur", nameEn: "Bhagalpur", nameBn: "ভাগলপুর" },
          { id: "bhojpur", nameEn: "Bhojpur", nameBn: "ভোজপুর" },
          { id: "buxar", nameEn: "Buxar", nameBn: "বক্সার" },
          { id: "darbhanga", nameEn: "Darbhanga", nameBn: "দ্বারভাঙা" },
          { id: "east_champaran", nameEn: "East Champaran", nameBn: "পূর্ব চম্পারণ" },
          { id: "gaya", nameEn: "Gaya", nameBn: "গয়া" },
          { id: "gopalganj", nameEn: "Gopalganj", nameBn: "গোপালগঞ্জ" },
          { id: "jamui", nameEn: "Jamui", nameBn: "জামুই" },
          { id: "jehanabad", nameEn: "Jehanabad", nameBn: "জেহানাবাদ" },
          { id: "kaimur", nameEn: "Kaimur", nameBn: "কাইমুর" },
          { id: "katihar", nameEn: "Katihar", nameBn: "কাটিহার" },
          { id: "khagaria", nameEn: "Khagaria", nameBn: "খগাড়িয়া" },
          { id: "kishanganj", nameEn: "Kishanganj", nameBn: "কিশনগঞ্জ" },
          { id: "lakhisarai", nameEn: "Lakhisarai", nameBn: "লখিসরাই" },
          { id: "madhepura", nameEn: "Madhepura", nameBn: "মাধেপুরা" },
          { id: "madhubani", nameEn: "Madhubani", nameBn: "مधুবাণী" },
          { id: "munger", nameEn: "Munger", nameBn: "মুঙ্গের" },
          { id: "muzaffarpur", nameEn: "Muzaffarpur", nameBn: "মুজাফফরপুর" },
          { id: "nalanda", nameEn: "Nalanda", nameBn: "নালন্দা" },
          { id: "nawada", nameEn: "Nawada", nameBn: "নওয়াদা" },
          { id: "patna", nameEn: "Patna", nameBn: "পাটনা" },
          { id: "purnia", nameEn: "Purnia", nameBn: "পূর্ণিয়া" },
          { id: "rohtas", nameEn: "Rohtas", nameBn: "রোহতাস" },
          { id: "saharsa", nameEn: "Saharsa", nameBn: "সহরসা" },
          { id: "samastipur", nameEn: "Samastipur", nameBn: "সমস্তিপুর" },
          { id: "saran", nameEn: "Saran", nameBn: "সারণ" },
          { id: "sheikhpura", nameEn: "Sheikhpura", nameBn: "শেখপুরা" },
          { id: "sheohar", nameEn: "Sheohar", nameBn: "শিওহর" },
          { id: "sitamarhi", nameEn: "Sitamarhi", nameBn: "সীতামঢ়ী" },
          { id: "siwan", nameEn: "Siwan", nameBn: "সিবান" },
          { id: "supaul", nameEn: "Supaul", nameBn: "সুপল" },
          { id: "vaishali", nameEn: "Vaishali", nameBn: "বৈশালী" },
          { id: "west_champaran", nameEn: "West Champaran", nameBn: "পশ্চিম চম্পারণ" }
        ]
      },
      {
        id: "chhattisgarh",
        nameEn: "Chhattisgarh",
        nameBn: "ছত্তিশগড়",
        districts: [
          { id: "raipur", nameEn: "Raipur", nameBn: "রায়পুর" },
          { id: "bilaspur_cg", nameEn: "Bilaspur", nameBn: "বিলাসপুর" }
        ]
      },
      {
        id: "goa",
        nameEn: "Goa",
        nameBn: "গোয়া",
        districts: [
          { id: "panaji", nameEn: "Panaji", nameBn: "পানাজি" }
        ]
      },
      {
        id: "gujarat",
        nameEn: "Gujarat",
        nameBn: "গুজরাট",
        districts: [
          { id: "ahmedabad", nameEn: "Ahmedabad", nameBn: "আহমেদাবাদ" },
          { id: "amreli", nameEn: "Amreli", nameBn: "আমরেলি" },
          { id: "anand", nameEn: "Anand", nameBn: "আনন্দ" },
          { id: "aravalli", nameEn: "Aravalli", nameBn: "অরাবল্লী" },
          { id: "banaskantha", nameEn: "Banaskantha", nameBn: "বনাসকান্থা" },
          { id: "bharuch", nameEn: "Bharuch", nameBn: "ভারুচ" },
          { id: "bhavnagar", nameEn: "Bhavnagar", nameBn: "ভাবনগর" },
          { id: "botad", nameEn: "Botad", nameBn: "বোটাড" },
          { id: "chhota_udepur", nameEn: "Chhota Udepur", nameBn: "ছোটা উদয়পুর" },
          { id: "dahod", nameEn: "Dahod", nameBn: "দাহোদ" },
          { id: "dang", nameEn: "Dang", nameBn: "ডাং" },
          { id: "devbhumi_dwarka", nameEn: "Devbhumi Dwarka", nameBn: "দেবভূমি দ্বারকা" },
          { id: "gandhinagar", nameEn: "Gandhinagar", nameBn: "গান্ধীনগর" },
          { id: "gir_somnath", nameEn: "Gir Somnath", nameBn: "গির সোমনাথ" },
          { id: "jamnagar", nameEn: "Jamnagar", nameBn: "জামনগর" },
          { id: "junagadh", nameEn: "Junagadh", nameBn: "জুনাগড়" },
          { id: "kutch", nameEn: "Kutch", nameBn: "কচ্ছ" },
          { id: "kheda", nameEn: "Kheda", nameBn: "খেদা" },
          { id: "mahisagar", nameEn: "Mahisagar", nameBn: "মহিসাগর" },
          { id: "mehsana", nameEn: "Mehsana", nameBn: "মেহসানা" },
          { id: "morbi", nameEn: "Morbi", nameBn: "মোরবি" },
          { id: "narmada", nameEn: "Narmada", nameBn: "নর্মদা" },
          { id: "navsari", nameEn: "Navsari", nameBn: "নবসারি" },
          { id: "panchmahal", nameEn: "Panchmahal", nameBn: "পঞ্চমহল" },
          { id: "patan", nameEn: "Patan", nameBn: "পাটান" },
          { id: "porbandar", nameEn: "Porbandar", nameBn: "পোরবন্দর" },
          { id: "rajkot", nameEn: "Rajkot", nameBn: "রাজকোট" },
          { id: "sabarkantha", nameEn: "Sabarkantha", nameBn: "সবরকান্থা" },
          { id: "surat", nameEn: "Surat", nameBn: "সুরাট" },
          { id: "surendranagar", nameEn: "Surendranagar", nameBn: "সুরেন্দ্রনগর" },
          { id: "tapi", nameEn: "Tapi", nameBn: "তapi" },
          { id: "vadodara", nameEn: "Vadodara", nameBn: "ভদোদরা" },
          { id: "valsad", nameEn: "Valsad", nameBn: "বলসাদ" }
        ]
      },
      {
        id: "haryana",
        nameEn: "Haryana",
        nameBn: "হরিয়ানা",
        districts: [
          { id: "gurugram", nameEn: "Gurugram", nameBn: "গুরুগ্রাম" },
          { id: "faridabad", nameEn: "Faridabad", nameBn: "ফরিদাবাদ" }
        ]
      },
      {
        id: "himachal_pradesh",
        nameEn: "Himachal Pradesh",
        nameBn: "হিমাচল প্রদেশ",
        districts: [
          { id: "shimla", nameEn: "Shimla", nameBn: "শিমলা" }
        ]
      },
      {
        id: "jharkhand",
        nameEn: "Jharkhand",
        nameBn: "ঝাড়খণ্ড",
        districts: [
          { id: "ranchi", nameEn: "Ranchi", nameBn: "রাঁচি" },
          { id: "jamshedpur", nameEn: "Jamshedpur", nameBn: "জামশেদপুর" }
        ]
      },
      {
        id: "karnataka",
        nameEn: "Karnataka",
        nameBn: "কর্ণাটক",
        districts: [
          { id: "bengaluru", nameEn: "Bengaluru", nameBn: "বেঙ্গালুরু" },
          { id: "mysuru", nameEn: "Mysuru", nameBn: "মহীশূর" },
          { id: "mangaluru", nameEn: "Mangaluru", nameBn: "মাঙ্গালোর" }
        ]
      },
      {
        id: "kerala",
        nameEn: "Kerala",
        nameBn: "কেরালা",
        districts: [
          { id: "kochi", nameEn: "Kochi", nameBn: "কোচি" },
          { id: "thiruvananthapuram", nameEn: "Thiruvananthapuram", nameBn: "তিরুবনন্তপুরম" },
          { id: "kozhikode", nameEn: "Kozhikode", nameBn: "কোজিকোড" }
        ]
      },
      {
        id: "madhya_pradesh",
        nameEn: "Madhya Pradesh",
        nameBn: "মধ্যপ্রদেশ",
        districts: [
          { id: "bhopal", nameEn: "Bhopal", nameBn: "ভোপাল" },
          { id: "indore", nameEn: "Indore", nameBn: "ইন্দোর" }
        ]
      },
      {
        id: "maharashtra",
        nameEn: "Maharashtra",
        nameBn: "মহারাষ্ট্র",
        districts: [
          { id: "ahmednagar", nameEn: "Ahmednagar", nameBn: "আহমেদনগর" },
          { id: "akola", nameEn: "Akola", nameBn: "আকোলা" },
          { id: "amravati", nameEn: "Amravati", nameBn: "অমরাবতী" },
          { id: "aurangabad_mh", nameEn: "Aurangabad (Chhatrapati Sambhajinagar)", nameBn: "ঔরঙ্গাবাদ (সম্ভাজিনগর)" },
          { id: "beed", nameEn: "Beed", nameBn: "বিড়" },
          { id: "bhandara", nameEn: "Bhandara", nameBn: "ভাণ্ডারা" },
          { id: "buldhana", nameEn: "Buldhana", nameBn: "বুলঢানা" },
          { id: "chandpur", nameEn: "Chandrapur", nameBn: "চন্দ্রপুর" },
          { id: "dhule", nameEn: "Dhule", nameBn: "ধুলে" },
          { id: "gadchiroli", nameEn: "Gadchiroli", nameBn: "গড়চিরোলি" },
          { id: "gondia", nameEn: "Gondia", nameBn: "গোন্দিয়া" },
          { id: "hingoli", nameEn: "Hingoli", nameBn: "হিঙ্গোলি" },
          { id: "jalgaon", nameEn: "Jalgaon", nameBn: "জলগাঁও" },
          { id: "jalna", nameEn: "Jalna", nameBn: "জালনা" },
          { id: "kolhapur", nameEn: "Kolhapur", nameBn: "কোলাপুর" },
          { id: "latur", nameEn: "Latur", nameBn: "লাতুর" },
          { id: "mumbai_city", nameEn: "Mumbai City", nameBn: "মুম্বাই শহর" },
          { id: "mumbai_suburban", nameEn: "Mumbai Suburban", nameBn: "মুম্বাই উপনগরী" },
          { id: "nagpur", nameEn: "Nagpur", nameBn: "নাগপুর" },
          { id: "nanded", nameEn: "Nanded", nameBn: "নান্দেদ" },
          { id: "nandurbar", nameEn: "Nandurbar", nameBn: "নন্দুরবার" },
          { id: "nashik", nameEn: "Nashik", nameBn: "নাসিক" },
          { id: "osmanabad", nameEn: "Osmanabad (Dharashiv)", nameBn: "ওসমানাবাদ (ধারাশিব)" },
          { id: "palghar", nameEn: "Palghar", nameBn: "পালঘর" },
          { id: "parbhani", nameEn: "Parbhani", nameBn: "পারভানি" },
          { id: "pune", nameEn: "Pune", nameBn: "পুনে" },
          { id: "raigad", nameEn: "Raigad", nameBn: "রায়গড়" },
          { id: "ratnagiri", nameEn: "Ratnagiri", nameBn: "রত্নগিরি" },
          { id: "sangli", nameEn: "Sangli", nameBn: "সাঙ্গলি" },
          { id: "satara", nameEn: "Satara", nameBn: "সাতারা" },
          { id: "sindhudurg", nameEn: "Sindhudurg", nameBn: "সিন্ধুদুর্গ" },
          { id: "solapur", nameEn: "Solapur", nameBn: "সোলাপুর" },
          { id: "thane", nameEn: "Thane", nameBn: "থানে" },
          { id: "wardha", nameEn: "Wardha", nameBn: "ওয়ার্ধা" },
          { id: "washim", nameEn: "Washim", nameBn: "ওয়াশিম" },
          { id: "yavatmal", nameEn: "Yavatmal", nameBn: "ইয়াভাতমাল" }
        ]
      },
      {
        id: "manipur",
        nameEn: "Manipur",
        nameBn: "মণিপুর",
        districts: [
          { id: "imphal", nameEn: "Imphal", nameBn: "ইম্ফল" }
        ]
      },
      {
        id: "meghalaya",
        nameEn: "Meghalaya",
        nameBn: "মেঘালয়",
        districts: [
          { id: "shillong", nameEn: "Shillong", nameBn: "শিলং" }
        ]
      },
      {
        id: "mizoram",
        nameEn: "Mizoram",
        nameBn: "মিজোরাম",
        districts: [
          { id: "aizawl", nameEn: "Aizawl", nameBn: "আইজল" }
        ]
      },
      {
        id: "nagaland",
        nameEn: "Nagaland",
        nameBn: "নাগাল্যান্ড",
        districts: [
          { id: "kohima", nameEn: "Kohima", nameBn: "কোহিমা" }
        ]
      },
      {
        id: "odisha",
        nameEn: "Odisha",
        nameBn: "ওড়িশা",
        districts: [
          { id: "bhubaneswar", nameEn: "Bhubaneswar", nameBn: "ভুবনেশ্বর" },
          { id: "cuttack", nameEn: "Cuttack", nameBn: "কটক" }
        ]
      },
      {
        id: "punjab",
        nameEn: "Punjab",
        nameBn: "পাঞ্জাব",
        districts: [
          { id: "amritsar", nameEn: "Amritsar", nameBn: "অমৃতসর" },
          { id: "ludhiana", nameEn: "Ludhiana", nameBn: "লুধিয়ানা" },
          { id: "jalandhar", nameEn: "Jalandhar", nameBn: "জলন্ধর" }
        ]
      },
      {
        id: "rajasthan",
        nameEn: "Rajasthan",
        nameBn: "রাজস্থান",
        districts: [
          { id: "jaipur", nameEn: "Jaipur", nameBn: "জয়পুর" },
          { id: "jodhpur", nameEn: "Jodhpur", nameBn: "যোধপুর" },
          { id: "udaipur", nameEn: "Udaipur", nameBn: "উদয়পুর" }
        ]
      },
      {
        id: "sikkim",
        nameEn: "Sikkim",
        nameBn: "সিকিম",
        districts: [
          { id: "gangtok", nameEn: "Gangtok", nameBn: "গ্যাংটক" }
        ]
      },
      {
        id: "tamil_nadu",
        nameEn: "Tamil Nadu",
        nameBn: "তামিলনাড়ু",
        districts: [
          { id: "chennai", nameEn: "Chennai", nameBn: "চেন্নাই" },
          { id: "coimbatore", nameEn: "Coimbatore", nameBn: "কোয়েম্বাটোর" },
          { id: "madurai", nameEn: "Madurai", nameBn: "মাদুরাই" }
        ]
      },
      {
        id: "telangana",
        nameEn: "Telangana",
        nameBn: "তেলেঙ্গানা",
        districts: [
          { id: "hyderabad", nameEn: "Hyderabad", nameBn: "হায়দ্রাবাদ" },
          { id: "warangal", nameEn: "Warangal", nameBn: "ওয়ারাঙ্গল" }
        ]
      },
      {
        id: "tripura",
        nameEn: "Tripura",
        nameBn: "ত্রিপুরা",
        districts: [
          { id: "agartala", nameEn: "Agartala", nameBn: "আগরতলা" },
          { id: "dharmanagar", nameEn: "Dharmanagar", nameBn: "ধর্মনগর" },
          { id: "udaipur_tri", nameEn: "Udaipur", nameBn: "উদয়পুর" }
        ]
      },
      {
        id: "uttar_pradesh",
        nameEn: "Uttar Pradesh",
        nameBn: "উত্তরপ্রদেশ",
        districts: [
          { id: "lucknow", nameEn: "Lucknow", nameBn: "লখনউ" },
          { id: "kanpur", nameEn: "Kanpur", nameBn: "কানপুর" },
          { id: "noida", nameEn: "Noida", nameBn: "নয়ডা" },
          { id: "varanasi", nameEn: "Varanasi", nameBn: "বারাণসী" },
          { id: "agra", nameEn: "Agra", nameBn: "আগ্রা" }
        ]
      },
      {
        id: "uttarakhand",
        nameEn: "Uttarakhand",
        nameBn: "উত্তরাখণ্ড",
        districts: [
          { id: "dehradun", nameEn: "Dehradun", nameBn: "দেরাদুন" }
        ]
      },
      {
        id: "west_bengal",
        nameEn: "West Bengal",
        nameBn: "পশ্চিমবঙ্গ",
        districts: [
          { id: "alipurduar", nameEn: "Alipurduar", nameBn: "আলিপুরদুয়ার" },
          { id: "bankura", nameEn: "Bankura", nameBn: "বাঁকুড়া" },
          { id: "birbhum", nameEn: "Birbhum", nameBn: "বীরভূম" },
          { id: "cooch_behar", nameEn: "Cooch Behar", nameBn: "কোচবিহার" },
          { id: "dakshin_dinajpur", nameEn: "Dakshin Dinajpur", nameBn: "দক্ষিণ দিনাজপুর" },
          { id: "south_24_pgs", nameEn: "South 24 Parganas", nameBn: "দক্ষিণ ২৪ পরগনা" },
          { id: "darjeeling", nameEn: "Darjeeling", nameBn: "দার্জিলিং" },
          { id: "purba_bardhaman", nameEn: "Purba Bardhaman", nameBn: "পূর্ব বর্ধমান" },
          { id: "purba_medinipur", nameEn: "Purba Medinipur", nameBn: "পূর্ব মেদিনীপুর" },
          { id: "hooghly", nameEn: "Hooghly", nameBn: "হুগলি" },
          { id: "howrah", nameEn: "Howrah", nameBn: "হাওড়া" },
          { id: "jalpaiguri", nameEn: "Jalpaiguri", nameBn: "জলপাইগুড়ি" },
          { id: "jhargram", nameEn: "Jhargram", nameBn: "ঝাড়গ্রাম" },
          { id: "kalimpong", nameEn: "Kalimpong", nameBn: "কালিম্পং" },
          { id: "kolkata", nameEn: "Kolkata", nameBn: "কলকাতা" },
          { id: "malda", nameEn: "Malda", nameBn: "মালদা" },
          { id: "murshidabad", nameEn: "Murshidabad", nameBn: "মুর্শিদাবাদ" },
          { id: "nadia", nameEn: "Nadia", nameBn: "নদীয়া" },
          { id: "north_24_pgs", nameEn: "North 24 Parganas", nameBn: "উত্তর ২৪ পরগনা" },
          { id: "uttar_dinajpur", nameEn: "Uttar Dinajpur", nameBn: "উত্তর দিনাজপুর" },
          { id: "paschim_bardhaman", nameEn: "Paschim Bardhaman", nameBn: "পশ্চিম বর্ধমান" },
          { id: "paschim_medinipur", nameEn: "Paschim Medinipur", nameBn: "পশ্চিম মেদিনীপুর" },
          { id: "purulia", nameEn: "Purulia", nameBn: "পুরুলিয়া" }
        ]
      }
    ]
  },
  {
    id: "usa",
    nameEn: "United States (USA)",
    nameBn: "যুক্তরাষ্ট্র (USA)",
    flag: "🇺🇸",
    states: [
      {
        id: "california",
        nameEn: "California",
        nameBn: "ক্যালিফোর্নিয়া",
        districts: [
          { id: "los_angeles", nameEn: "Los Angeles", nameBn: "লস অ্যাঞ্জেলেস" },
          { id: "san_francisco", nameEn: "San Francisco", nameBn: "সান ফ্রান্সিসকো" },
          { id: "san_diego", nameEn: "San Diego", nameBn: "সান দিয়েগো" },
          { id: "san_jose", nameEn: "San Jose", nameBn: "সান জোসে" }
        ]
      },
      {
        id: "new_york",
        nameEn: "New York",
        nameBn: "নিউ ইয়র্ক",
        districts: [
          { id: "new_york_city", nameEn: "New York City", nameBn: "নিউ ইয়র্ক সিটি" },
          { id: "buffalo", nameEn: "Buffalo", nameBn: "বাফেলো" },
          { id: "albany", nameEn: "Albany", nameBn: "আলবানি" }
        ]
      }
    ]
  },
  {
    id: "saudi_arabia",
    nameEn: "Saudi Arabia",
    nameBn: "সৌদি আরব",
    flag: "🇸🇦",
    states: [
      {
        id: "riyadh_prov",
        nameEn: "Riyadh Province",
        nameBn: "রিয়াদ প্রদেশ",
        districts: [
          { id: "riyadh", nameEn: "Riyadh", nameBn: "রিয়াদ" },
          { id: "al_kharj", nameEn: "Al-Kharj", nameBn: "আল-খারজ" }
        ]
      },
      {
        id: "makkah_prov",
        nameEn: "Makkah Province",
        nameBn: "মক্কা প্রদেশ",
        districts: [
          { id: "makkah", nameEn: "Makkah", nameBn: "মক্কা" },
          { id: "jeddah", nameEn: "Jeddah", nameBn: "জেত্তা" },
          { id: "taif", nameEn: "Taif", nameBn: "তায়েফ" }
        ]
      }
    ]
  },
  {
    id: "uae",
    nameEn: "United Arab Emirates (UAE)",
    nameBn: "সংযুক্ত আরব আমিরাত (UAE)",
    flag: "🇦🇪",
    states: [
      {
        id: "uae_emirates",
        nameEn: "Emirates",
        nameBn: "আমিরাতসমূহ",
        districts: [
          { id: "dubai", nameEn: "Dubai", nameBn: "দুবাই" },
          { id: "abu_dhabi", nameEn: "Abu Dhabi", nameBn: "আুধাবি" },
          { id: "sharjah", nameEn: "Sharjah", nameBn: "শারজাহ" },
          { id: "ajman", nameEn: "Ajman", nameBn: "আজমান" }
        ]
      }
    ]
  },
  {
    id: "united_kingdom",
    nameEn: "United Kingdom (UK)",
    nameBn: "যুক্তরাজ্য (UK)",
    flag: "🇬🇧",
    states: [
      {
        id: "england",
        nameEn: "England",
        nameBn: "ইংল্যান্ড",
        districts: [
          { id: "london", nameEn: "London", nameBn: "লন্ডন" },
          { id: "manchester", nameEn: "Manchester", nameBn: "ম্যানচেস্টার" },
          { id: "birmingham", nameEn: "Birmingham", nameBn: "বার্মিংহাম" },
          { id: "leeds", nameEn: "Leeds", nameBn: "লিডস" }
        ]
      },
      {
        id: "scotland",
        nameEn: "Scotland",
        nameBn: "স্কটল্যান্ড",
        districts: [
          { id: "edinburgh", nameEn: "Edinburgh", nameBn: "এডিনবরা" },
          { id: "glasgow", nameEn: "Glasgow", nameBn: "গ্লাসগো" }
        ]
      }
    ]
  },
  {
    id: "canada",
    nameEn: "Canada",
    nameBn: "কানাডা",
    flag: "🇨🇦",
    states: [
      {
        id: "ontario",
        nameEn: "Ontario",
        nameBn: "অন্টারিও",
        districts: [
          { id: "toronto", nameEn: "Toronto", nameBn: "টরন্টো" },
          { id: "ottawa", nameEn: "Ottawa", nameBn: "অটোয়া" }
        ]
      },
      {
        id: "british_columbia",
        nameEn: "British Columbia",
        nameBn: "ব্রিটিশ কলম্বিয়া",
        districts: [
          { id: "vancouver", nameEn: "Vancouver", nameBn: "ভ্যাঙ্কুভার" },
          { id: "victoria", nameEn: "Victoria", nameBn: "ভিক্টোরিয়া" }
        ]
      }
    ]
  },
  {
    id: "malaysia",
    nameEn: "Malaysia",
    nameBn: "মালয়েশিয়া",
    flag: "🇲🇾",
    states: [
      {
        id: "selangor",
        nameEn: "Selangor",
        nameBn: "সেলাঙ্গর",
        districts: [
          { id: "shah_alam", nameEn: "Shah Alam", nameBn: "শাহ আলম" },
          { id: "petaling_jaya", nameEn: "Petaling Jaya", nameBn: "পেটালিং জয়া" },
          { id: "klang", nameEn: "Klang", nameBn: "ক্লাং" }
        ]
      },
      {
        id: "kuala_lumpur",
        nameEn: "Kuala Lumpur",
        nameBn: "কুয়ালালামপুর",
        districts: [
          { id: "kl_city", nameEn: "KL City Centre", nameBn: "কেএল সিটি সেন্টার" }
        ]
      }
    ]
  },
  {
    id: "singapore",
    nameEn: "Singapore",
    nameBn: "সিঙ্গাপুর",
    flag: "🇸🇬",
    states: [
      {
        id: "singapore_state",
        nameEn: "Singapore",
        nameBn: "সিঙ্গাপুর",
        districts: [
          { id: "downtown", nameEn: "Downtown Core", nameBn: "ডাউনটাউন" },
          { id: "woodlands", nameEn: "Woodlands", nameBn: "উডল্যান্ডস" },
          { id: "jurong", nameEn: "Jurong", nameBn: "জোরং" }
        ]
      }
    ]
  },
  {
    id: "oman",
    nameEn: "Oman",
    nameBn: "ওমান",
    flag: "🇴🇲",
    states: [
      {
        id: "muscat",
        nameEn: "Muscat",
        nameBn: "মাস্কাট",
        districts: [
          { id: "seeb", nameEn: "Seeb", nameBn: "সিব" },
          { id: "muttrah", nameEn: "Muttrah", nameBn: "মুত্রাহ" },
          { id: "bawshar", nameEn: "Bawshar", nameBn: "বাউশার" }
        ]
      }
    ]
  },
  {
    id: "qatar",
    nameEn: "Qatar",
    nameBn: "কাতার",
    flag: "🇶🇦",
    states: [
      {
        id: "doha",
        nameEn: "Doha",
        nameBn: "দোহা",
        districts: [
          { id: "west_bay", nameEn: "West Bay", nameBn: "ওয়েস্ট বে" },
          { id: "pearl", nameEn: "The Pearl", nameBn: "দ্য পার্ল" }
        ]
      }
    ]
  }
];

export const otherOption = {
  id: "other",
  nameEn: "Other (Custom)",
  nameBn: "অন্যান্য (লিখুন)"
};

export function getRegionName(
  type: "country" | "state" | "district",
  id: string,
  lang: string,
  customValue?: string
): string {
  if (id === "other") {
    return customValue || (lang === "en" ? "Other" : "অন্যান্য");
  }

  if (type === "country") {
    const item = regionsData.find((c) => c.id === id);
    if (item) {
      const flagStr = item.flag ? `${item.flag} ` : "";
      return flagStr + (lang === "en" ? item.nameEn : item.nameBn);
    }
  } else if (type === "state") {
    for (const c of regionsData) {
      const item = c.states.find((s) => s.id === id);
      if (item) return lang === "en" ? item.nameEn : item.nameBn;
    }
  } else if (type === "district") {
    for (const c of regionsData) {
      for (const s of c.states) {
         const item = s.districts.find((d) => d.id === id);
         if (item) return lang === "en" ? item.nameEn : item.nameBn;
      }
    }
  }

  return customValue || id;
}
