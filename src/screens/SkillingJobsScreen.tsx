import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { MapPinIcon, PhoneIcon, GraduationCapIcon, SpeakerIcon, SearchIcon } from '../components/Icons';
import { speechService } from '../services/speech';
import { CenterMap } from '../components/Map/CenterMap';
import { DISTRICT_MARKET_REGISTRY } from '../../server/data/districtJobs';
import { SkillingCenter, LanguageCode } from '../types';
import { buildCentersResponse } from '../services/spokenResponse';
import { QrTokenCard } from '../components/Governance/QrTokenCard';

// ── i18n label map ────────────────────────────────────────────────────────────
const LABELS: Record<string, Record<string, string>> = {
  'en-IN': {
    title: 'Training Centres & Live Tracking',
    subtitle: 'PM-AJAY real centre locations & live map',
    odopLabel: 'ODOP District Employment Demand',
    vacancies: 'active vacancies available',
    odopNote: 'Direct requirement in local micro-enterprises registered under PM-AJAY scheme.',
    findHint: 'Tap the button below to find the nearest training centres in your district.',
    locating: 'Finding your location…',
    findBtn: 'Find Nearest Centres',
    noLocation: 'Could not get your location. Showing default distances.',
    mapLabel: 'Track centres on map (Live Map Tracking):',
    centresFound: 'centres found',
    noCentre: 'No matching centre found. Please choose another.',
    centreListLabel: 'PM-AJAY Skill Centres List:',
    recommended: 'Recommended',
    course: 'Training Course:',
    duration: 'Duration',
    hours: 'hrs (free training + ₹150 daily food & travel allowance)',
    coordinator: 'Centre Coordinator:',
    directions: 'Directions',
    call: 'Call',
    distance: 'Distance unavailable',
    cta: 'View Loan & Subsidy Information',
    dataSource: 'Data source: data.gov.in (static snapshot) | New govt. scheme & centre allocation',
  },
  'hi-IN': {
    title: 'प्रशिक्षण केंद्र एवं लाइव ट्रैकिंग',
    subtitle: 'पीएम-अजय वास्तविक केंद्र स्थान व लाइव मानचित्र',
    odopLabel: 'ओडीओपी जिला रोजगार मांग (ODOP Demand)',
    vacancies: 'सक्रिय रिक्तियां उपलब्ध',
    odopNote: 'पीएम-अजय योजना के तहत पंजीकृत स्थानीय सूक्ष्म उद्यमों में सीधी आवश्यकता।',
    findHint: 'नीचे दिए गए बटन दबाकर अपने जिले के नजदीकी प्रशिक्षण केंद्र खोजें।',
    locating: 'अपना स्थान खोज रहा है…',
    findBtn: 'नजदीकी केंद्र खोजें (Find Nearest Centers)',
    noLocation: 'अपना स्थान नहीं मिल पाया। डिफ़ॉल्ट दूरियां दिखाई जा रही हैं।',
    mapLabel: 'नक्शे पर केंद्र ट्रैक करें (Live Map Tracking):',
    centresFound: 'वास्तविक केंद्र मिले',
    noCentre: 'कोई मिलान केंद्र नहीं मिला। कृपया दूसरा केंद्र चुनें।',
    centreListLabel: 'पीएम-अजय कौशल केंद्रों की सूची (Skill Centers List):',
    recommended: 'अनुशंसित (Recommended)',
    course: 'प्रशिक्षण पाठ्यक्रम:',
    duration: 'अवधि',
    hours: 'घंटे (निःशुल्क प्रशिक्षण + ₹150 दैनिक भोजन व यात्रा भत्ता)',
    coordinator: 'केंद्र समन्वयक:',
    directions: 'दिशा-निर्देश',
    call: 'कॉल करें',
    distance: 'दूरी उपलब्ध नहीं',
    cta: 'ऋण एवं सब्सिडी की जानकारी देखें',
    dataSource: 'डेटा स्रोत: data.gov.in (स्थिर स्नैपशॉट) | नई सरकारी योजना एवं केंद्र आवंटन',
  },
  'te-IN': {
    title: 'శిక్షణ కేంద్రాలు & లైవ్ ట్రాకింగ్',
    subtitle: 'పీఎం-అజయ్ నిజమైన కేంద్ర స్థానాలు & లైవ్ మ్యాప్',
    odopLabel: 'ODOP జిల్లా ఉద్యోగ డిమాండ్',
    vacancies: 'సక్రియ ఖాళీలు అందుబాటులో',
    odopNote: 'పీఎం-అజయ్ పథకంలో నమోదైన స్థానిక సూక్ష్మ సంస్థలలో నేరుగా అవసరం.',
    findHint: 'మీ జిల్లాలో దగ్గరి శిక్షణ కేంద్రాలను కనుగొనడానికి క్రింది బటన్ నొక్కండి.',
    locating: 'మీ స్థానం కనుగొంటోంది…',
    findBtn: 'దగ్గరి కేంద్రాలు కనుగొనండి',
    noLocation: 'మీ స్థానం తెలియలేదు. డిఫాల్ట్ దూరాలు చూపిస్తున్నాం.',
    mapLabel: 'మ్యాప్‌లో కేంద్రాలు ట్రాక్ చేయండి:',
    centresFound: 'కేంద్రాలు దొరికాయి',
    noCentre: 'సరిపోలే కేంద్రం దొరకలేదు. దయచేసి మరొకటి ఎంచుకోండి.',
    centreListLabel: 'పీఎం-అజయ్ నైపుణ్య కేంద్రాల జాబితా:',
    recommended: 'సిఫార్సు చేయబడింది',
    course: 'శిక్షణ కోర్సు:',
    duration: 'వ్యవధి',
    hours: 'గంటలు (ఉచిత శిక్షణ + ₹150 రోజువారీ ఆహారం & ప్రయాణ భత్యం)',
    coordinator: 'కేంద్ర సమన్వయకుడు:',
    directions: 'దిశలు',
    call: 'కాల్ చేయండి',
    distance: 'దూరం అందుబాటులో లేదు',
    cta: 'రుణం & సబ్సిడీ సమాచారం చూడండి',
    dataSource: 'డేటా మూలం: data.gov.in (స్టాటిక్ స్నాప్‌షాట్)',
  },
  'ta-IN': {
    title: 'பயிற்சி மையங்கள் & நேரலை கண்காணிப்பு',
    subtitle: 'பிஎம்-அஜய் நிஜமான மைய இடங்கள் & நேரலை வரைபடம்',
    odopLabel: 'ODOP மாவட்ட வேலைவாய்ப்பு தேவை',
    vacancies: 'செயலில் உள்ள காலிப்பணியிடங்கள் கிடைக்கின்றன',
    odopNote: 'பிஎம்-அஜய் திட்டத்தில் பதிவு செய்யப்பட்ட உள்ளூர் நுண்நிறுவனங்களில் நேரடி தேவை.',
    findHint: 'உங்கள் மாவட்டத்தில் அருகிலுள்ள பயிற்சி மையங்களைக் கண்டுபிடிக்க கீழே உள்ள பொத்தானை தட்டவும்.',
    locating: 'உங்கள் இருப்பிடம் தேடுகிறது…',
    findBtn: 'அருகிலுள்ள மையங்களைக் கண்டுபிடி',
    noLocation: 'உங்கள் இருப்பிடம் தெரியவில்லை. இயல்புநிலை தூரங்கள் காட்டப்படுகின்றன.',
    mapLabel: 'வரைபடத்தில் மையங்களை கண்காணி:',
    centresFound: 'மையங்கள் கிடைத்தன',
    noCentre: 'பொருந்தும் மையம் இல்லை. வேறொன்றை தேர்ந்தெடுக்கவும்.',
    centreListLabel: 'பிஎம்-அஜய் திறன் மையங்கள் பட்டியல்:',
    recommended: 'பரிந்துரைக்கப்பட்டது',
    course: 'பயிற்சி பாடம்:',
    duration: 'காலம்',
    hours: 'மணி நேரம் (இலவச பயிற்சி + ₹150 தினசரி உணவு & பயண படி)',
    coordinator: 'மைய ஒருங்கிணைப்பாளர்:',
    directions: 'திசைகள்',
    call: 'அழைக்கவும்',
    distance: 'தூரம் கிடைக்கவில்லை',
    cta: 'கடன் & மானியத் தகவல் காண்க',
    dataSource: 'தரவு ஆதாரம்: data.gov.in (நிலையான படம்)',
  },
  'mr-IN': {
    title: 'प्रशिक्षण केंद्रे आणि लाइव्ह ट्रॅकिंग',
    subtitle: 'पीएम-अजय वास्तविक केंद्र स्थाने आणि लाइव्ह नकाशा',
    odopLabel: 'ODOP जिल्हा रोजगार मागणी',
    vacancies: 'सक्रिय रिक्त जागा उपलब्ध',
    odopNote: 'पीएम-अजय योजनेअंतर्गत नोंदणीकृत स्थानिक सूक्ष्म उद्योगांमध्ये थेट आवश्यकता.',
    findHint: 'तुमच्या जिल्ह्यातील जवळचे प्रशिक्षण केंद्र शोधण्यासाठी खाली बटण दाबा.',
    locating: 'तुमचे स्थान शोधत आहे…',
    findBtn: 'जवळचे केंद्र शोधा',
    noLocation: 'तुमचे स्थान मिळाले नाही. डीफॉल्ट अंतर दाखवत आहोत.',
    mapLabel: 'नकाशावर केंद्रे ट्रॅक करा:',
    centresFound: 'केंद्रे सापडली',
    noCentre: 'जुळणारे केंद्र सापडले नाही. कृपया दुसरे केंद्र निवडा.',
    centreListLabel: 'पीएम-अजय कौशल्य केंद्रे यादी:',
    recommended: 'शिफारस केलेले',
    course: 'प्रशिक्षण अभ्यासक्रम:',
    duration: 'कालावधी',
    hours: 'तास (मोफत प्रशिक्षण + ₹150 दैनिक जेवण व प्रवास भत्ता)',
    coordinator: 'केंद्र समन्वयक:',
    directions: 'मार्गदर्शन',
    call: 'कॉल करा',
    distance: 'अंतर उपलब्ध नाही',
    cta: 'कर्ज आणि अनुदान माहिती पाहा',
    dataSource: 'डेटा स्रोत: data.gov.in (स्थिर स्नॅपशॉट)',
  },
  'bn-IN': {
    title: 'প্রশিক্ষণ কেন্দ্র এবং লাইভ ট্র্যাকিং',
    subtitle: 'পিএম-অজয় বাস্তব কেন্দ্রের অবস্থান এবং লাইভ ম্যাপ',
    odopLabel: 'ODOP জেলা কর্মসংস্থান চাহিদা',
    vacancies: 'সক্রিয় শূন্যপদ উপলব্ধ',
    odopNote: 'পিএম-অজয় প্রকল্পের অধীনে নিবন্ধিত স্থানীয় ক্ষুদ্র উদ্যোগে সরাসরি প্রয়োজন।',
    findHint: 'আপনার জেলার কাছের প্রশিক্ষণ কেন্দ্র খুঁজতে নিচের বোতাম চাপুন।',
    locating: 'আপনার অবস্থান খুঁজছে…',
    findBtn: 'কাছের কেন্দ্র খুঁজুন',
    noLocation: 'আপনার অবস্থান পাওয়া যায়নি। ডিফল্ট দূরত্ব দেখানো হচ্ছে।',
    mapLabel: 'ম্যাপে কেন্দ্র ট্র্যাক করুন:',
    centresFound: 'কেন্দ্র পাওয়া গেছে',
    noCentre: 'কোনো মিলানো কেন্দ্র পাওয়া যায়নি। অন্যটি বেছে নিন।',
    centreListLabel: 'পিএম-অজয় দক্ষতা কেন্দ্রের তালিকা:',
    recommended: 'প্রস্তাবিত',
    course: 'প্রশিক্ষণ কোর্স:',
    duration: 'সময়কাল',
    hours: 'ঘন্টা (বিনামূল্যে প্রশিক্ষণ + ₹150 দৈনিক খাবার ও ভ্রমণ ভাতা)',
    coordinator: 'কেন্দ্র সমন্বয়কারী:',
    directions: 'দিকনির্দেশনা',
    call: 'কল করুন',
    distance: 'দূরত্ব পাওয়া যায়নি',
    cta: 'ঋণ ও ভর্তুকির তথ্য দেখুন',
    dataSource: 'ডেটা উৎস: data.gov.in (স্থির স্ন্যাপশট)',
  },
  'bho-IN': {
    title: 'प्रशिक्षण केंद्र एवं लाइव ट्रैकिंग',
    subtitle: 'पीएम-अजय असली केंद्र स्थान व लाइव नक्शा',
    odopLabel: 'ओडीओपी जिला रोजगार मांग (ODOP Demand)',
    vacancies: 'सक्रिय रिक्तियां उपलब्ध',
    odopNote: 'पीएम-अजय योजना के तहत दर्ज स्थानीय सूक्ष्म उद्यमों में सीधी जरूरत बा।',
    findHint: 'नीचे के बटन दबाइल अपने जिले के नजदीकी प्रशिक्षण केंद्र खोजीं।',
    locating: 'अपन स्थान खोजत बा…',
    findBtn: 'नजदीकी केंद्र खोजीं',
    noLocation: 'अपन स्थान नहीं मिलल। डिफ़ॉल्ट दूरी दिखावत बा।',
    mapLabel: 'नक्शे पर केंद्र ट्रैक करीं:',
    centresFound: 'असली केंद्र मिलल',
    noCentre: 'कोनो केंद्र नहीं मिलल। दूसरा केंद्र चुनीं।',
    centreListLabel: 'पीएम-अजय कौशल केंद्रों की सूची:',
    recommended: 'अनुशंसित',
    course: 'प्रशिक्षण पाठ्यक्रम:',
    duration: 'अवधि',
    hours: 'घंटा (मुफ़्त ट्रेनिंग + ₹150 रोज खाना व यात्रा भत्ता)',
    coordinator: 'केंद्र समन्वयक:',
    directions: 'दिशा-निर्देश',
    call: 'कॉल करीं',
    distance: 'दूरी उपलब्ध नहीं',
    cta: 'ऋण एवं सब्सिडी की जानकारी देखीं',
    dataSource: 'डेटा स्रोत: data.gov.in (स्थिर स्नैपशॉट)',
  },
  'mai-IN': {
    title: 'प्रशिक्षण केंद्र एवं लाइव ट्रैकिंग',
    subtitle: 'पीएम-अजय असली केंद्र स्थान व लाइव नक्शा',
    odopLabel: 'ओडीओपी जिला रोजगार मांग (ODOP Demand)',
    vacancies: 'सक्रिय रिक्तियां उपलब्ध',
    odopNote: 'पीएम-अजय योजना के अंतर्गत दर्ज स्थानीय उद्यमों में सीधी जरूरत अछि।',
    findHint: 'नीचे के बटन दबाय अपने जिले के नजदीकी प्रशिक्षण केंद्र खोजीं।',
    locating: 'अहांक स्थान खोजि रहल बा…',
    findBtn: 'नजदीकी केंद्र खोजीं',
    noLocation: 'अहांक स्थान नहीं मिलल। डिफ़ॉल्ट दूरी दिखाइल जा रहल बा।',
    mapLabel: 'नक्शे पर केंद्र ट्रैक करीं:',
    centresFound: 'असली केंद्र मिलल',
    noCentre: 'कोनो केंद्र नहीं मिलल। दूसरा केंद्र चुनीं।',
    centreListLabel: 'पीएम-अजय कौशल केंद्रों की सूची:',
    recommended: 'अनुशंसित',
    course: 'प्रशिक्षण पाठ्यक्रम:',
    duration: 'अवधि',
    hours: 'घंटा (निःशुल्क प्रशिक्षण + ₹150 दैनिक भोजन व यात्रा भत्ता)',
    coordinator: 'केंद्र समन्वयक:',
    directions: 'दिशा-निर्देश',
    call: 'कॉल करीं',
    distance: 'दूरी उपलब्ध नहीं',
    cta: 'ऋण एवं सब्सिडी की जानकारी देखीं',
    dataSource: 'डेटा स्रोत: data.gov.in (स्थिर स्नैपशॉट)',
  },
  'bun-IN': {
    title: 'प्रशिक्षण केंद्र एवं लाइव ट्रैकिंग',
    subtitle: 'पीएम-अजय असली केंद्र स्थान व लाइव नक्शा',
    odopLabel: 'ओडीओपी जिला रोजगार मांग (ODOP Demand)',
    vacancies: 'सक्रिय रिक्तियां उपलब्ध',
    odopNote: 'पीएम-अजय योजना के तहत दर्ज स्थानीय उद्यमों में सीधी जरूरत है।',
    findHint: 'नीचे के बटन दबाओ और अपने जिले के नजदीकी प्रशिक्षण केंद्र खोजो।',
    locating: 'अपन स्थान खोज रहल है…',
    findBtn: 'नजदीकी केंद्र खोजो',
    noLocation: 'अपन स्थान नहीं मिलल। डिफ़ॉल्ट दूरियां दिखाई जा रही हैं।',
    mapLabel: 'नक्शे पर केंद्र ट्रैक करो:',
    centresFound: 'असली केंद्र मिले',
    noCentre: 'कोनो केंद्र नहीं मिलल। दूसरा केंद्र चुनो।',
    centreListLabel: 'पीएम-अजय कौशल केंद्रों की सूची:',
    recommended: 'अनुशंसित',
    course: 'प्रशिक्षण पाठ्यक्रम:',
    duration: 'अवधि',
    hours: 'घंटे (निःशुल्क प्रशिक्षण + ₹150 दैनिक भत्ता)',
    coordinator: 'केंद्र समन्वयक:',
    directions: 'दिशा-निर्देश',
    call: 'कॉल करो',
    distance: 'दूरी उपलब्ध नहीं',
    cta: 'ऋण एवं सब्सिडी की जानकारी देखो',
    dataSource: 'डेटा स्रोत: data.gov.in (स्थिर स्नैपशॉट)',
  },
  'chg-IN': {
    title: 'प्रशिक्षण केंद्र एवं लाइव ट्रैकिंग',
    subtitle: 'पीएम-अजय असली केंद्र स्थान व लाइव नक्शा',
    odopLabel: 'ओडीओपी जिला रोजगार मांग (ODOP Demand)',
    vacancies: 'सक्रिय रिक्तियां उपलब्ध',
    odopNote: 'पीएम-अजय योजना के तहत दर्ज स्थानीय सूक्ष्म उद्यमों में सीधी आवश्यकता।',
    findHint: 'नीचे के बटन दभाय अपने जिले के नजदीकी प्रशिक्षण केंद्र खोजीं।',
    locating: 'अपन स्थान खोजत बा…',
    findBtn: 'नजदीकी केंद्र खोजीं',
    noLocation: 'अपन स्थान नहीं मिलल। डिफ़ॉल्ट दूरी दिखावत बा।',
    mapLabel: 'नक्शे पर केंद्र ट्रैक करीं:',
    centresFound: 'असली केंद्र मिलल',
    noCentre: 'कोनो केंद्र नहीं मिलल। दूसरा केंद्र चुनीं।',
    centreListLabel: 'पीएम-अजय कौशल केंद्रों की सूची:',
    recommended: 'अनुशंसित',
    course: 'प्रशिक्षण पाठ्यक्रम:',
    duration: 'अवधि',
    hours: 'घंटा (निःशुल्क प्रशिक्षण + ₹150 दैनिक भत्ता)',
    coordinator: 'केंद्र समन्वयक:',
    directions: 'दिशा-निर्देश',
    call: 'कॉल करीं',
    distance: 'दूरी उपलब्ध नहीं',
    cta: 'ऋण एवं सब्सिडी की जानकारी देखीं',
    dataSource: 'डेटा स्रोत: data.gov.in (स्थिर स्नैपशॉट)',
  },
};

function t(lang: LanguageCode, key: string): string {
  return LABELS[lang]?.[key] ?? LABELS['hi-IN'][key] ?? key;
}

interface CentreProvenance {
  fetchedAt: string;
  publisher: string;
  datasetTitle: string;
  sourceUrl: string;
  lastUpdated: string | null;
  licence: string;
  recordCount: number;
}

interface CentreResponse {
  success: boolean;
  source: 'data.gov.in' | 'demo' | 'none';
  provenance: CentreProvenance | null;
  district: string;
  count: number;
  centres: Array<SkillingCenter & { dataSource?: 'demo' | 'government' }>;
  notice?: string;
}

export const SkillingJobsScreen: React.FC = () => {
  const { currentResult, selectedDistrict, selectedLanguage, setScreen } = useApp();
  const lang = selectedLanguage as LanguageCode;
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [selectedCenterId, setSelectedCenterId] = useState<string | undefined>(undefined);
  const [centersLoaded, setCentersLoaded] = useState(false);
  const [reconciledCenters, setReconciledCenters] = useState<SkillingCenter[]>([]);
  const [centreSource, setCentreSource] = useState<'data.gov.in' | 'demo' | 'none' | null>(null);
  const [provenance, setProvenance] = useState<CentreProvenance | null>(null);
  const [sourceNotice, setSourceNotice] = useState<string | null>(null);
  const [isLoadingCentres, setIsLoadingCentres] = useState(false);
  const [districtCentres, setDistrictCentres] = useState<SkillingCenter[]>([]);

  const defaultRegistry = DISTRICT_MARKET_REGISTRY[selectedDistrict || "Varanasi"] || DISTRICT_MARKET_REGISTRY["Varanasi"];

  const readsDevanagari = ['hi-IN', 'bho-IN', 'bun-IN', 'chg-IN', 'mai-IN', 'mr-IN'].includes(selectedLanguage);
  const centreLabel = (c: SkillingCenter, field: 'name' | 'courseName') =>
    readsDevanagari ? (c[`${field}Hi`] || c[field]) : c[field] || c[`${field}Hi`];

  const districtMarket = currentResult?.districtMarket || {
    district: defaultRegistry.district,
    state: defaultRegistry.state,
    odopSector: defaultRegistry.odopSector,
    odopSectorHi: defaultRegistry.odopSectorHi,
    vacanciesCount: defaultRegistry.openingsCount,
    centers: districtCentres.length ? districtCentres : defaultRegistry.centers
  };

  useEffect(() => {
    const recommendedQpCode = currentResult?.recommendedNSQF?.qpCode || "";
    const allCenters = districtMarket.centers || [];
    const prioritized = [...allCenters].sort((a, b) => {
      const aQpCode = a.qpCode || '';
      const bQpCode = b.qpCode || '';
      const aMatches = aQpCode === recommendedQpCode || a.courseName.includes(recommendedQpCode);
      const bMatches = bQpCode === recommendedQpCode || b.courseName.includes(recommendedQpCode);
      if (aMatches && !bMatches) return -1;
      if (!aMatches && bMatches) return 1;
      return (a.distanceKm || 999) - (b.distanceKm || 999);
    });
    setReconciledCenters(prioritized);
  }, [currentResult, districtMarket]);

  useEffect(() => {
    const district = selectedDistrict || 'Varanasi';
    let cancelled = false;
    setIsLoadingCentres(true);
    fetch(`/api/centres?district=${encodeURIComponent(district)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((data: CentreResponse) => {
        if (cancelled) return;
        if (data?.success && Array.isArray(data.centres) && data.centres.length) {
          setDistrictCentres(data.centres as SkillingCenter[]);
          setCentreSource(data.source);
          setProvenance(data.provenance);
          setSourceNotice(data.source === 'demo' ? data.notice || null : null);
        } else {
          setDistrictCentres(defaultRegistry.centers);
          setCentreSource('demo');
          setProvenance(null);
          setSourceNotice('Centre list could not be loaded from the server. Showing built-in demo centres.');
        }
      })
      .catch(() => {
        if (cancelled) return;
        setDistrictCentres(defaultRegistry.centers);
        setCentreSource('demo');
        setProvenance(null);
        setSourceNotice('Centre list could not be loaded from the server. Showing built-in demo centres.');
      })
      .finally(() => { if (!cancelled) setIsLoadingCentres(false); });
    return () => { cancelled = true; };
  }, [selectedDistrict]);

  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locatingError, setLocatingError] = useState<string | null>(null);

  const requestUserLocation = (): Promise<{ lat: number; lon: number } | null> => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return Promise.resolve(null);
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
    });
  };

  const announceNearest = (centers: SkillingCenter[]) => {
    const sorted = [...centers].sort((a, b) => (a.distanceKm || 999) - (b.distanceKm || 999));
    const nearest = sorted[0];
    const text = buildCentersResponse(lang, districtMarket.district, centers.length, nearest?.distanceKm || 5.2);
    speechService.speak(text, selectedLanguage, () => setIsPlayingAudio(true), () => setIsPlayingAudio(false));
  };

  const handleFindCenters = async () => {
    setLocatingError(null);
    setLocating(true);
    const loc = await requestUserLocation();
    if (loc) {
      setUserLocation(loc);
      const district = selectedDistrict || 'Varanasi';
      const url = `/api/centres?district=${encodeURIComponent(district)}&lat=${loc.lat}&lon=${loc.lon}`;
      try {
        const res = await fetch(url);
        const data: CentreResponse = await res.json();
        if (data?.success && Array.isArray(data.centres) && data.centres.length) {
          setDistrictCentres(data.centres as SkillingCenter[]);
          setCentreSource(data.source);
          setProvenance(data.provenance);
          setSourceNotice(data.source === 'demo' ? data.notice || null : null);
          announceNearest(data.centres);
        } else {
          setDistrictCentres(defaultRegistry.centers);
          setCentreSource('demo');
          setProvenance(null);
          setSourceNotice('Centre list could not be loaded from the server. Showing built-in demo centres.');
          announceNearest(defaultRegistry.centers);
        }
      } catch {
        setDistrictCentres(defaultRegistry.centers);
        setCentreSource('demo');
        setProvenance(null);
        setSourceNotice('Centre list could not be loaded from the server. Showing built-in demo centres.');
        announceNearest(defaultRegistry.centers);
      }
    } else {
      setLocatingError(t(lang, 'noLocation'));
      setDistrictCentres(defaultRegistry.centers);
      setCentreSource('demo');
      setProvenance(null);
      announceNearest(defaultRegistry.centers);
    }
    setLocating(false);
    setCentersLoaded(true);
    // Explicit action taken -> enroll for nudges in their chosen language
    triggerLifecycleEnrollment();
  };

  const displayedCenters = centersLoaded ? reconciledCenters : [];

  const spokenCenters = buildCentersResponse(
    lang,
    districtMarket.district,
    districtMarket.centers.length,
    districtMarket.centers[0]?.distanceKm || 5.2
  );

  const handlePlayVoice = () => {
    speechService.speak(spokenCenters, selectedLanguage, () => setIsPlayingAudio(true), () => setIsPlayingAudio(false));
  };

  const activeSelectedCenter = displayedCenters.find(c => c.id === selectedCenterId) || displayedCenters[0];

  const formatDistance = (km: number | null | undefined): string => {
    if (km == null || !Number.isFinite(km)) return t(lang, 'distance');
    return `${km.toFixed(1)} km`;
  };

  const handleEnrollToCourse = () => {
    speechService.stopSpeaking();
    setScreen('micro-finance');
  };

  // Helper to enroll the user in the lifecycle scheduler
  const triggerLifecycleEnrollment = async () => {
    const sessionStr = localStorage.getItem('aadhaarSession');
    if (!sessionStr) return;
    try {
      const session = JSON.parse(sessionStr);
      await fetch('/api/lifecycle/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beneficiaryId: session.aadhaarNumber,
          beneficiaryName: session.beneficiaryName,
          district: selectedDistrict || 'Varanasi',
          whatsappNumber: '+918431852247', // Hardcoded friend's number for demo
          language: selectedLanguage,
          enrolledAt: Date.now() - (45 * 24 * 60 * 60 * 1000) // Instantly triggers Day-45 IVR
        })
      });
      console.log('Enrolled in lifecycle nudges with language', selectedLanguage);
    } catch (e) {
      console.error('Failed to enroll in lifecycle:', e);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-5">
      <div className="space-y-4">
        {/* Screen Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl text-ink">{t(lang, 'title')}</h1>
            <p className="font-caption text-sm text-ink-muted mt-1">{t(lang, 'subtitle')}</p>
          </div>
          <button
            onClick={handlePlayVoice}
            className={`w-11 h-11 rounded border flex items-center justify-center transition-colors ${
              isPlayingAudio ? 'bg-action text-white border-action' : 'bg-surface border-line text-trust'
            }`}
            aria-label="Listen to centre info"
          >
            <SpeakerIcon size={20} color={isPlayingAudio ? '#FFFFFF' : '#009378'} />
          </button>
        </div>

        {/* ODOP Market Demand Badge */}
        <div className="card-flat bg-trust/5 border-trust/20 p-4">
          <div className="flex items-center space-x-2 text-trust text-xs font-semibold uppercase tracking-wider mb-1">
            <GraduationCapIcon size={16} color="#009378" />
            <span>{t(lang, 'odopLabel')}</span>
          </div>
          <h2 className="text-base font-bold text-ink">
            {readsDevanagari ? districtMarket.odopSectorHi : districtMarket.odopSector}
          </h2>
          <div className="mt-2 inline-flex items-center space-x-2 bg-trust text-surface px-3 py-1.5 rounded text-xs font-bold">
            <span>{districtMarket.vacanciesCount} {t(lang, 'vacancies')}</span>
          </div>
          <p className="text-xs text-ink-muted mt-2">{t(lang, 'odopNote')}</p>
        </div>

        {/* Find Nearest Centers Button */}
        {!centersLoaded ? (
          <div className="space-y-3">
            <p className="font-caption text-xs text-ink-muted text-center">{t(lang, 'findHint')}</p>
            {locatingError && (
              <p className="text-xs text-alert text-center">{locatingError}</p>
            )}
            <button
              onClick={handleFindCenters}
              className="btn-primary w-full space-x-2"
              disabled={locating}
            >
              <SearchIcon size={18} color="#FFFFFF" />
              <span>{locating ? t(lang, 'locating') : t(lang, 'findBtn')}</span>
            </button>
          </div>
        ) : (
          <>
            {/* Interactive Map */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-caption text-xs text-ink-muted uppercase tracking-wide font-semibold flex items-center space-x-1">
                  <MapPinIcon size={14} color="#009378" />
                  <span>{t(lang, 'mapLabel')}</span>
                </span>
                <span className="text-[11px] text-trust font-bold">
                  {displayedCenters.length} {t(lang, 'centresFound')}
                </span>
              </div>

              {displayedCenters.length > 0 ? (
                <CenterMap
                  centers={displayedCenters}
                  selectedCenterId={selectedCenterId || activeSelectedCenter?.id}
                  onSelectCenter={(center: SkillingCenter) => setSelectedCenterId(center.id)}
                  userLocation={userLocation}
                  onRecenter={handleFindCenters}
                />
              ) : (
                <div className="card-flat bg-white border-line p-4 text-center">
                  <p className="text-sm text-ink-muted">{t(lang, 'noCentre')}</p>
                </div>
              )}
            </div>

            {/* Centre Cards */}
            <div className="space-y-3 pt-2">
              <span className="font-caption text-xs text-ink-muted uppercase tracking-wide block font-semibold">
                {t(lang, 'centreListLabel')}
              </span>

              {displayedCenters.map((center) => {
                const isSelected = (selectedCenterId || activeSelectedCenter?.id) === center.id;
                const isRecommended = currentResult?.recommendedNSQF?.qpCode &&
                  (center.qpCode === currentResult.recommendedNSQF.qpCode ||
                   center.courseName.includes(currentResult.recommendedNSQF.qpCode));
                return (
                  <div
                    key={center.id}
                    onClick={() => setSelectedCenterId(center.id)}
                    className={`card-flat border p-4 space-y-3 transition-all cursor-pointer ${
                      isSelected ? 'bg-white border-trust shadow-sm ring-1 ring-trust/30' : 'bg-white border-line hover:border-trust/40'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-base text-ink leading-tight flex items-center gap-1.5">
                          <span>{centreLabel(center, 'name')}</span>
                          {isRecommended && (
                            <span className="text-[10px] bg-trust/10 text-trust px-1.5 py-0.5 rounded font-bold">
                              {t(lang, 'recommended')}
                            </span>
                          )}
                        </h3>
                        <div className="flex items-center space-x-1.5 text-xs text-ink-muted mt-1">
                          <MapPinIcon size={14} color="#009378" />
                          <span>{readsDevanagari ? (center.addressHi || center.address) : center.address}</span>
                        </div>
                      </div>
                      <span className="shrink-0 bg-surface border border-line text-ink font-semibold text-xs px-2 py-1 rounded">
                        {formatDistance(center.distanceKm)}
                      </span>
                    </div>

                    {/* Course Detail */}
                    <div className="bg-surface/60 rounded p-2.5 text-xs border border-line/60">
                      <span className="text-ink-muted block">{t(lang, 'course')}</span>
                      <span className="font-semibold text-ink text-sm block mt-0.5">
                        {centreLabel(center, 'courseName')}
                      </span>
                      <span className="text-trust font-medium mt-1 block">
                        {t(lang, 'duration')}: {center.durationHours} {t(lang, 'hours')}
                      </span>
                    </div>

                    {/* Call & Directions */}
                    <div className="pt-2 border-t border-line flex items-center justify-between">
                      <div className="text-xs">
                        <span className="text-ink-muted block">{t(lang, 'coordinator')}</span>
                        <span className="font-medium text-ink">{center.coordinatorName}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <a
                          href={center.googleMapsUrl || `https://www.google.com/maps/dir/?api=1&destination=${center.latitude},${center.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="btn-secondary text-xs !min-h-[44px] !py-2 !px-2.5 inline-flex items-center space-x-1"
                        >
                          <MapPinIcon size={14} color="#009378" />
                          <span>{t(lang, 'directions')}</span>
                        </a>
                        <a
                          href={`tel:${center.coordinatorPhone.replace(/\s+/g, '')}`}
                          onClick={(e) => e.stopPropagation()}
                          className="btn-primary text-xs !min-h-[44px] !py-2 !px-3 inline-flex items-center space-x-1.5"
                        >
                          <PhoneIcon size={14} color="#FFFFFF" />
                          <span>{t(lang, 'call')}</span>
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* QR Enrolment Token */}
      <div className="mt-6">
        <QrTokenCard />
      </div>

      {/* CTA */}
      <div className="mt-4 pt-4 border-t border-line">
        <button onClick={handleEnrollToCourse} className="btn-primary w-full">
          {t(lang, 'cta')}
        </button>
      </div>

      {/* Data attribution */}
      <div className="mt-4 pt-3 border-t border-line text-center">
        <span className="inline-flex items-center gap-1.5 text-[10px] text-ink-muted">
          <span className="w-1.5 h-1.5 bg-info/50 rounded-full"></span>
          <span>{t(lang, 'dataSource')}</span>
        </span>
      </div>
    </div>
  );
};