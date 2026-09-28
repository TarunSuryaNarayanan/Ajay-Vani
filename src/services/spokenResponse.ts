import { LanguageCode } from '../types';

export interface SpokenResponseVars {
  beneficiaryName: string;
  qpCode: string;
  roleName: string;
  roleNameHi: string;
  district: string;
  /**
   * Count of listed training centres in the district. This is a count of
   * records in a periodic dataset, NOT a live vacancy count — the spoken copy
   * below is worded accordingly.
   */
  centreCount: number;
  hours?: number;
}

const DEFAULT_HOURS = 300;

const DEFAULT_NAME: Record<LanguageCode, string> = {
  'hi-IN': 'साथी',
  'en-IN': 'friend',
  'bho-IN': 'साथी',
  'bun-IN': 'साथी',
  'chg-IN': 'साथी',
  'mai-IN': 'साथी',
  'ta-IN': 'தோழர்',
  'te-IN': 'మా',
  'mr-IN': 'मित्रा',
  'bn-IN': 'বন্ধু',
};

const NAME_STOPWORDS = new Set([
  'मैं', 'मेरा', 'मेरे', 'मेरी', 'हम', 'हमार', 'हमरे', 'आम्हे', 'आम्हारो', 'मदा', 'हमर', 'मोर',
  'i', 'my', 'am', 'i am',
]);

const NAME_PARTICLES = /^(हैं|है|हे|हो|बा|बर|छी|छीं|में|के|की|का|रहे|गए|था|थी|थें|आहे|आहेत|নे|না|छो|আছে|আছেন|আছি|এর|এরা|என்று|என|ஆண்|అని|అన్న|ఆయన|என்றால்|म्हणून|म्हणजे|आहेत|आहो)$/i;

/**
 * Spoken names arrive with sentence glue attached ("रमेश है", "श्यामू बा"). Reading
 * that out sounds broken, so keep the name words and drop everything else.
 */
export function normaliseSpokenName(raw: string | undefined, lang: LanguageCode): string {
  const fallback = DEFAULT_NAME[lang] || DEFAULT_NAME['hi-IN'];
  if (!raw) return fallback;

  const kept: string[] = [];
  for (const word of raw.trim().split(/\s+/)) {
    if (!word) continue;
    if (NAME_STOPWORDS.has(word.toLowerCase())) continue;
    if (NAME_PARTICLES.test(word)) continue;
    kept.push(word);
    if (kept.length === 2) break;
  }

  return kept.length ? kept.join(' ') : fallback;
}

/**
 * Trade names in the scripts each language is actually spoken in. Packs only
 * carry English and Hindi names, so a Tamil or Bengali user would otherwise hear
 * a Devanagari word read by a Tamil voice, which comes out as noise.
 */
const TRADE_LABELS: Partial<Record<LanguageCode, Record<string, string>>> = {
  'ta-IN': {
    'ELE/Q5901': 'சோலார் பிவி நிறுவிப்பவன் மற்றும் மின்சார பணியாளர்',
    'AGR/Q6701': 'பால் வணிகர் மற்றும் பால் செயன்முறை உரியமையாளர்',
    'AGR/Q1201': 'டிராக்டர் மற்றும் விவசாய உபகரண பழுதுபார்ப்பு நிபுணர்',
    'AMH/Q0101': 'ஜரி மற்றும் பாரம்பரிய கைத்தெலவு கலைஞர்',
    'CON/Q0101': 'இணைப்பு கட்டுமானம் மற்றும் கிராமகட்டுமான பணியாளர்',
    'FSS/Q0101': 'சிறு உணவு மற்றும் மதிப்பு கூட்டு இயக்குநர்',
  },
  'te-IN': {
    'ELE/Q5901': 'సోలార్ పీవీ ఇన్‌స్టాలర్ మరియు ఎలక్ట్రీషియన్',
    'AGR/Q6701': 'పాల వ్యాపారి మరియు పాల ప్రसंస్కరణ స్వామి',
    'AGR/Q1201': 'ట్రాక్టర్ మరియు వ్యవసాయ యంత్రాల మరమ్మతు నిపుణుడు',
    'AMH/Q0101': 'జరి మరియు సంప్రదాయ చేతితో తయారి కార్గితర్',
    'CON/Q0101': 'అసిస్టెంట్ రాజుడు మరియు గ్రామీణ నిర్మాణ నిపుణుడు',
    'FSS/Q0101': 'క్షుద్ర ఆహార ప్రాసెసింగ్ మరియు విలువ సమ్పద్రణే పరిశ్రమకుడు',
  },
  'mr-IN': {
    'ELE/Q5901': 'सोलर पीवी इन्स्टॉलर आणि इलेक्ट्रिशियन',
    'AGR/Q6701': 'दुग्ध व्यापारी आणि दुग्ध प्रक्रिया उद्यमी',
    'AGR/Q1201': 'ट्रॅक्टर व कृषी अवजारे दुरुस्ती तज्ज्ञ',
    'AMH/Q0101': 'जरी आणि पारंपरिक हस्तशिल्प कारागीर',
    'CON/Q0101': 'सहाय्यक गवंडी आणि ग्रामीण बांधकाम कर्ता',
    'FSS/Q0101': 'सूक्ष्म अन्नप्रक्रिया आणि मूल्यवर्धन उद्यमी',
  },
  'bn-IN': {
    'ELE/Q5901': 'সোলার পিভি ইনস্টলার ও ইলেকট্রিশিয়ন',
    'AGR/Q6701': 'দুধ ব্যবসায়ী ও দুধ প্রক্রিয়াজাতক',
    'AGR/Q1201': 'ট্রাক্টর ও কৃষি যন্ত্র মেরামত বিশেষজ্ঞ',
    'AMH/Q0101': 'জরি ও ঐতিহ্যবাহী হাতশিল্প কারিগর',
    'CON/Q0101': 'সহকারী রাজু ও গ্রামীণ অবকাঠামো নির্মাণ কর্মী',
    'FSS/Q0101': 'ক্ষুদ্র খাদ্য প্রক্রিয়াজাত ও মূল্য সংযোজন উদ্যোক্তা',
  },
};

/** Trade name in the script the beneficiary's voice will actually pronounce. */
export function localTradeName(vars: SpokenResponseVars, lang: LanguageCode): string {
  const labels = TRADE_LABELS[lang];
  if (labels && labels[vars.qpCode]) return labels[vars.qpCode];
  // Devanagari languages and English already have a name in the pack.
  if (lang === 'en-IN') return vars.roleName;
  if (lang.endsWith('-IN') && ['hi-IN', 'bho-IN', 'bun-IN', 'chg-IN', 'mai-IN'].includes(lang)) {
    return vars.roleNameHi;
  }
  return vars.roleName;
}

/**
 * Speech engines read the script they are given. A name transcribed in
 * Devanagari dropped into a Tamil sentence is noise, so strip scripts the
 * selected language's voice cannot pronounce.
 */
const SCRIPT_BLOCKS: Record<string, RegExp> = {
  devanagari: /[ऀ-ॿ]/g,
  tamil: /[஀-௿]/g,
  telugu: /[ఀ-౿]/g,
  bengali: /[ঀ-৿]/g,
};

const TARGET_SCRIPT: Record<string, keyof typeof SCRIPT_BLOCKS | 'latin'> = {
  'hi-IN': 'devanagari',
  'bho-IN': 'devanagari',
  'bun-IN': 'devanagari',
  'chg-IN': 'devanagari',
  'mai-IN': 'devanagari',
  'mr-IN': 'devanagari',
  'ta-IN': 'tamil',
  'te-IN': 'telugu',
  'bn-IN': 'bengali',
  'en-IN': 'latin',
};

function scriptSafeName(name: string, lang: LanguageCode): string {
  const target = TARGET_SCRIPT[lang] || 'devanagari';
  let cleaned = name;
  for (const [script, range] of Object.entries(SCRIPT_BLOCKS)) {
    if (script !== target) cleaned = cleaned.replace(range, '');
  }
  return cleaned.replace(/\s{2,}/g, ' ').trim();
}

/**
 * The sentence Gram Sahayak reads out after profiling. It is generated per
 * language because the speech engine synthesises from the script, not from a
 * language tag: Devanagari text pushed through a Tamil voice is unintelligible.
 */
export function buildSpokenResponse(lang: LanguageCode, vars: SpokenResponseVars): string {
  const { district } = vars;
  const centres = vars.centreCount;
  const beneficiaryName =
    scriptSafeName(vars.beneficiaryName, lang) || (DEFAULT_NAME[lang] || DEFAULT_NAME['hi-IN']);
  const hours = vars.hours ?? DEFAULT_HOURS;
  const role = localTradeName(vars, lang);

  switch (lang) {
    case 'bho-IN':
      return `राम राम ${beneficiaryName} भाई! आपके बात से साफ बा कि आपमें हुनर बा। ${role} खातिर आपके जिले ${district} में ${centres} गो प्रशिक्षण केंद्र दर्ज बा। पास के सेंटर में ${hours} घंटा के मुफ़्त ट्रेनिंग और भोजन भत्ता भी मिले के व्यवस्था बा।`;
    case 'bun-IN':
      return `राम राम ${beneficiaryName} भइया! आपके जिले ${district} में ${role} के लेखे ${centres} गो प्रशिक्षण केंद्र दर्ज बा। पास के केंद्र में ${hours} घंटा के मुफ्त ट्रेनिंग के संगे भोजन भत्ता भी मिलेगो।`;
    case 'chg-IN':
      return `जय जोहार ${beneficiaryName} भाई! आपके जिले ${district} में ${role} के हेतु ${centres} गो प्रशिक्षण केंद्र दर्बल बा। पास के केंद्र में ${hours} घंटा के मुफ्त ट्रेनिंग एवं भोजन भत्ता भी मिलेगा।`;
    case 'mai-IN':
      return `प्रणाम ${beneficiaryName} जी! आपके अनुभव कें सभ कें से ${role} उपयुक्त अछी। आपके जिले ${district} में एकर ${centres} प्रशिक्षण केंद्र सूचीबद्ध अछि। पास के केंद्र में ${hours} घंटा के निःशुल्क ट्रेनिंग उपलब्ध अछि।`;
    case 'ta-IN':
      return `வணக்கம் ${beneficiaryName}! உங்கள் அனுபவத்தின் அடிப்படையில், ${role} உங்களுக்குச் சிறந்த பொருத்தம். ${district} மாவிரசத்தில் இந்தத் தொழிலுக்கு ${centres} பயிற்சி மையங்கள் பட்டியலிடப்பட்டுள்ளன. அருகிலுள்ள மையத்தில் ${hours} மணி நேர இலவசப் பயிற்சி கிடைக்கிறது.`;
    case 'te-IN':
      return `నమస్కారం ${beneficiaryName}! మీ అనుభవం ఆధారంగా, ${role} మీకు అత్యుత్తమ సరైన ఎంపిక. మీ ${district} జిల్లాలో ఈ పనికి ${centres} శిక్షణ కేంద్రాలు జాబితా చేయబడ్డాయి. దగ్గరి కేంద్రంలో ${hours} గంటల ఉచిత శిక్షణ అందుబాటులో ఉంది.`;
    case 'mr-IN':
      return `नमस्कार ${beneficiaryName}! तुमच्या अनुभवाच्या आधारे, ${role} तुमच्यासाठी सर्वात योग्य आहे. ${district} जिल्ह्यात या व्यवसायासाठी ${centres} प्रशिक्षण केंद्रे नोंदवलेली आहेत. जवळच्या केंद्रात ${hours} तासांचे मोफत प्रशिक्षण उपलब्ध आहे.`;
    case 'bn-IN':
      return `নমস্কার ${beneficiaryName}! আপনার অভিজ্ঞতার ভিত্তিতে, ${role} আপনার জন্য সবচেয়ে উপযুক্ত। ${district} জেলায় এই পেশার ${centres}টি প্রশিক্ষণ কেন্দ্র তালিকাভুক্ত। কাছের কেন্দ্রে ${hours} ঘণ্টার বিনামূল্যে প্রশিক্ষণ পাওয়া যাচ্ছে।`;
    case 'en-IN':
      return `Hello ${beneficiaryName}! Based on your experience, ${role} is the best fit for you. ${district} district lists ${centres} training centre(s) for this work. A free ${hours}-hour training is available at the nearest centre.`;
    case 'hi-IN':
    default:
      return `नमस्ते ${beneficiaryName} जी! आपके अनुभव के आधार पर ${role} आपके लिए सबसे उपयुक्त है। आपके जिले ${district} में इस ट्रेड के ${centres} प्रशिक्षण केंद्र सूचीबद्ध हैं। पास के केंद्र में ${hours} घंटे का निःशुल्क प्रशिक्षण उपलब्ध है।`;
  }
}
