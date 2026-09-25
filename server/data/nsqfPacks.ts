export interface NSQFPack {
  qpCode: string;
  roleName: string;
  roleNameHi: string;
  nsqfLevel: number;
  sector: string;
  keywords: string[];
  districtDemandScore: Record<string, number>;
  description: string;
  descriptionHi: string;
  estimatedWageOrIncome: string;
}

export const NSQF_PACKS: NSQFPack[] = [
  {
    qpCode: "ELE/Q5901",
    roleName: "Solar PV Installer & Electrician",
    roleNameHi: "सोलर पीवी इंस्टॉलर एवं तकनीशियन",
    nsqfLevel: 4,
    sector: "Green Jobs / Renewable Energy",
    keywords: ["solar", "bijli", "electrician", "wire", "battery", "panel", "light", "सोलर", "बिजली", "तार"],
    districtDemandScore: {
      "Varanasi": 92,
      "Gorakhpur": 88,
      "Patna": 90,
      "Bundelkhand": 95,
      "Default": 89
    },
    description: "Installation and maintenance of rooftop and agricultural solar pump systems.",
    descriptionHi: "रूफटॉप सोलर एवं कृषि सोलर पंप प्रणाली की स्थापना और रखरखाव।",
    estimatedWageOrIncome: "₹18,000 - ₹26,000 / माह"
  },
  {
    qpCode: "AGR/Q6701",
    roleName: "Dairy Farmer & Milk Processing Entrepreneur",
    roleNameHi: "डेयरी उद्यमी एवं दुग्ध संकलन संचालक",
    nsqfLevel: 4,
    sector: "Agriculture & Allied",
    keywords: ["gai", "bhains", "doodh", "dairy", "pashu", "gay", "cow", "buffalo", "milk", "गाय", "भैंस", "दूध", "डेयरी", "पशुपालन"],
    districtDemandScore: {
      "Varanasi": 89,
      "Gorakhpur": 94,
      "Patna": 91,
      "Bundelkhand": 93,
      "Default": 90
    },
    description: "Modern cattle management, clean milk production, and village collection point setup.",
    descriptionHi: "आधुनिक पशु प्रबंधन, स्वच्छ दुग्ध उत्पादन और ग्रामीण संकलन केंद्र का संचालन।",
    estimatedWageOrIncome: "₹20,000 - ₹35,000 / माह"
  },
  {
    qpCode: "AGR/Q1201",
    roleName: "Tractor & Farm Equipment Repair Specialist",
    roleNameHi: "ट्रैक्टर एवं कृषि उपकरण मरम्मत विशेषज्ञ",
    nsqfLevel: 4,
    sector: "Automotive & Agricultural Machinery",
    keywords: ["tractor", "khet", "repair", "mistri", "diesel", "motor", "engine", "ट्रैक्टर", "खेत", "मिस्त्री", "डीजल", "इंजन"],
    districtDemandScore: {
      "Varanasi": 87,
      "Gorakhpur": 91,
      "Patna": 86,
      "Bundelkhand": 94,
      "Default": 88
    },
    description: "Troubleshooting, hydraulics and engine overhaul of farm machinery and tractors.",
    descriptionHi: "कृषि यंत्रों, रोटावेटर एवं ट्रैक्टरों की हाइड्रोलिक्स व इंजन मरम्मत।",
    estimatedWageOrIncome: "₹18,000 - ₹28,000 / माह"
  },
  {
    qpCode: "AMH/Q0101",
    roleName: "Zari & Traditional Hand Embroidery Artisan",
    roleNameHi: "जरी-जरदोजी एवं पारंपरिक हस्तशिल्प कारीगर",
    nsqfLevel: 3,
    sector: "Apparel & Handicrafts (ODOP)",
    keywords: ["kapda", "silai", "zari", "banarasi", "saree", "embroidery", "handicraft", "कपड़ा", "सिलाई", "जरी", "साड़ी", "शिल्प"],
    districtDemandScore: {
      "Varanasi": 96,
      "Gorakhpur": 82,
      "Patna": 85,
      "Bundelkhand": 79,
      "Default": 84
    },
    description: "Traditional Banarasi zari work, garment design, and collective self-help group production.",
    descriptionHi: "पारंपरिक बनारसी जरी कार्य, वस्त्र निर्माण एवं स्वयं सहायता समूह आधारित स्वरोजगार।",
    estimatedWageOrIncome: "₹15,000 - ₹24,000 / माह"
  },
  {
    qpCode: "CON/Q0101",
    roleName: "Assistant Mason & Rural Infrastructure Builder",
    roleNameHi: "सहायक राजमिस्त्री एवं ग्रामीण निर्माण कारीगर",
    nsqfLevel: 2,
    sector: "Construction & Rural Housing",
    keywords: ["makan", "rajmistri", "it", "cement", "plaster", "ghar", "building", "मकान", "राजमिस्त्री", "ईंट", "सीमेंट", "घर"],
    districtDemandScore: {
      "Varanasi": 85,
      "Gorakhpur": 89,
      "Patna": 88,
      "Bundelkhand": 92,
      "Default": 86
    },
    description: "Bricklaying, plastering, and RCC foundation under PMAY-G and rural community halls.",
    descriptionHi: "आवास योजना एवं ग्रामीण अधोसंरचना निर्माण में ईंट जुड़ाई व प्लास्टर कार्य।",
    estimatedWageOrIncome: "₹650 - ₹850 / दैनिक देहाड़ी"
  },
  {
    qpCode: "FSS/Q0101",
    roleName: "Micro Food Processing & Value Addition Operator",
    roleNameHi: "लघु खाद्य प्रसंस्करण एवं मूल्यवर्धन उद्यमी",
    nsqfLevel: 4,
    sector: "Food Processing (PM-FME)",
    keywords: ["aachar", "papad", "tel", "chakki", "anaj", "spices", "masala", "अचार", "पापड़", "तेल", "चक्की", "मसाला", "खाद्य"],
    districtDemandScore: {
      "Varanasi": 88,
      "Gorakhpur": 93,
      "Patna": 89,
      "Bundelkhand": 90,
      "Default": 87
    },
    description: "Processing pulses, spices, and packaging organic rural produce for regional mandis.",
    descriptionHi: "दाल, मसाला पिसाई एवं जैविक कृषि उत्पादों की पैकेजिंग व बाजार आपूर्ति।",
    estimatedWageOrIncome: "₹22,000 - ₹38,000 / माह"
  }
];
