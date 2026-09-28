import { SkillingCenter } from '../../src/types';

export interface DistrictMarketData {
  district: string;
  state: string;
  odopSector: string;
  odopSectorHi: string;
  openingsCount: number;
  activeTradeFocus: string;
  activeTradeFocusHi: string;
  centers: SkillingCenter[];
}

export const DISTRICT_MARKET_REGISTRY: Record<string, DistrictMarketData> = {
  "Varanasi": {
    district: "Varanasi",
    state: "Uttar Pradesh",
    odopSector: "Green Energy & Banarasi Zari Handicrafts",
    odopSectorHi: "सोलर ऊर्जा एवं बनारसी जरी-हस्तशिल्प (ओडीओपी)",
    openingsCount: 120,
    activeTradeFocus: "Solar Rooftop Technicians & Agro-Solar Pumps",
    activeTradeFocusHi: "सोलर तकनीशियन एवं कृषि पंप रखरखाव",
    centers: [
      {
        id: "ctr-vns-1",
        name: "Government ITI Karaundi PM-AJAY Skill Center",
        nameHi: "राजकीय आईटीआई करौंदी (पीएम-अजय कौशल केंद्र)",
        district: "Varanasi",
        latitude: 25.2818,
        longitude: 82.9863,
        distanceKm: 5.2,
        courseName: "Short-Term Solar PV Maintenance (ELE/Q5901)",
        courseNameHi: "सोलर पीवी इंस्टॉलर एवं रखरखाव (300 घंटे)",
        durationHours: 300,
        benefits: ["Free Tuition", "Free Uniform & Tool Kit", "Daily Food & Travel Allowance (₹150/day)"],
        benefitsHi: ["निःशुल्क प्रशिक्षण", "मुफ्त टूलकिट एवं यूनिफॉर्म", "दैनिक भोजन व यात्रा भत्ता (₹150/दिन)"],
        coordinatorName: "Shri Rajesh Kumar Mishra",
        coordinatorPhone: "+91 94520 18290",
        address: "Karaundi, Near BHU Campus, Varanasi, UP - 221005",
        addressHi: "करौंदी, बीएचयू परिसर के समीप, वाराणसी - 221005",
         googleMapsUrl: "https://maps.google.com/?q=25.2818,82.9863",
         pincode: "221005",
         qpCode: "ELE/Q5901"
       },
       {
         id: "ctr-vns-2",
         name: "Pradhan Mantri Kaushal Kendra (PMKK) Rohaniya",
        nameHi: "प्रधानमंत्री कौशल केंद्र, रोहनिया",
        district: "Varanasi",
        latitude: 25.2677,
        longitude: 82.9431,
        distanceKm: 9.8,
        courseName: "Rural Micro-Enterprise & Equipment Care",
        courseNameHi: "ग्रामीण सूक्ष्म-उद्यमिता एवं कृषि उपकरण देखभाल",
        durationHours: 240,
        benefits: ["Govt Certification", "Placement Assistance", "MUDRA Loan Facilitation"],
        benefitsHi: ["सरकारी प्रमाण पत्र", "रोजगार सहायता", "मुद्रा ऋण मार्गदर्शन"],
        coordinatorName: "Smt. Sunita Verma",
        coordinatorPhone: "+91 98391 44521",
        address: "GT Road, Rohaniya Block, Varanasi, UP - 221108",
        addressHi: "जीटी रोड, रोहनिया ब्लॉक, वाराणसी - 221108",
        googleMapsUrl: "https://maps.google.com/?q=25.2677,82.9431",
        pincode: "221108"
      },
      {
        id: "ctr-vns-3",
        name: "Government ITI Chauka Ghat PM-AJAY Cell",
        nameHi: "राजकीय आईटीआई चौकाघाट पीएम-अजय सेल",
        district: "Varanasi",
        latitude: 25.3262,
        longitude: 82.9995,
        distanceKm: 3.8,
        courseName: "Zari & Traditional Handicrafts Artisan (AMH/Q0101)",
        courseNameHi: "जरी-जरदोजी एवं हस्तशिल्प कारीगर (300 घंटे)",
        durationHours: 300,
        benefits: ["Free Raw Material Kit", "Govt Artisan Card", "Stipend Provided"],
        benefitsHi: ["मुफ्त कच्चा माल किट", "सरकारी कारीगर कार्ड", "मासिक वजीफा भत्ता"],
        coordinatorName: "Shri Ramesh Chandra Pandey",
        coordinatorPhone: "+91 94158 12390",
        address: "Chauka Ghat, Near Railway Station, Varanasi, UP - 221002",
        addressHi: "चौकाघाट, रेलवे स्टेशन के पास, वाराणसी - 221002",
         googleMapsUrl: "https://maps.google.com/?q=25.3262,82.9995",
         pincode: "221002",
         qpCode: "AMH/Q0101"
       }
    ]
  },
  "Gorakhpur": {
    district: "Gorakhpur",
    state: "Uttar Pradesh",
    odopSector: "Agro Food Processing & Terracotta Craft",
    odopSectorHi: "कृषि खाद्य प्रसंस्करण एवं टेराकोटा शिल्प (ओडीओपी)",
    openingsCount: 140,
    activeTradeFocus: "Dairy Processing & Rural Cold Chain Operators",
    activeTradeFocusHi: "डेयरी प्रसंस्करण एवं ग्रामीण कोल्ड चेन ऑपरेटर",
    centers: [
      {
        id: "ctr-gkp-1",
        name: "Govt ITI Chargawan Skill Development Center",
        nameHi: "राजकीय आईटीआई चरगांवा कौशल केंद्र",
        district: "Gorakhpur",
        latitude: 26.7997,
        longitude: 83.3855,
        distanceKm: 4.6,
        courseName: "Dairy Producer & Cold Chain Technician (AGR/Q6701)",
        courseNameHi: "डेयरी उद्यमी एवं दुग्ध संकलन कोर्स (300 घंटे)",
        durationHours: 300,
        benefits: ["Free Training", "Govt Dairy Kit", "Food Allowance Included"],
        benefitsHi: ["निःशुल्क प्रशिक्षण", "सरकारी डेयरी किट", "भोजन भत्ता उपलब्ध"],
        coordinatorName: "Shri Anand Swaroop",
        coordinatorPhone: "+91 94152 77319",
        address: "Chargawan Road, Medical College Link, Gorakhpur - 273013",
        addressHi: "चरगांवा रोड, मेडिकल कॉलेज लिंक, गोरखपुर - 273013",
         googleMapsUrl: "https://maps.google.com/?q=26.7641,83.3423",
         pincode: "273013",
         qpCode: "AGR/Q6701"
       },
       {
         id: "ctr-gkp-2",
         name: "PMKK Fertilizer Campus Center Gorakhpur",
        nameHi: "प्रधानमंत्री कौशल केंद्र, फर्टिलाइजर कैंपस, गोरखपुर",
        district: "Gorakhpur",
        latitude: 26.7905,
        longitude: 83.3591,
        distanceKm: 7.1,
        courseName: "Terracotta Handicraft Entrepreneurship",
        courseNameHi: "टेराकोटा हस्तशिल्प एवं सूक्ष्म उद्योग कोर्स",
        durationHours: 280,
        benefits: ["Free Electric Pottery Wheel", "Exhibition Stall Access", "Direct GIA Grant"],
        benefitsHi: ["मुफ्त इलेक्ट्रिक चाक", "प्रदर्शनी स्टॉल सुविधा", "सीधा GIA सब्सिडी अनुदान"],
        coordinatorName: "Shri Vinay Bhushan",
        coordinatorPhone: "+91 94512 88204",
        address: "Fertilizer Township, Gorakhpur, UP - 273007",
        addressHi: "फर्टिलाइजर टाउनशिप, गोरखपुर - 273007",
         googleMapsUrl: "https://maps.google.com/?q=26.7626,83.3258",
         pincode: "273007",
         qpCode: "AMH/Q0101"
       }
     ]
  },
  "Jhansi": {
    district: "Jhansi (Bundelkhand)",
    state: "Uttar Pradesh",
    odopSector: "Solar Agricultural Pump & Water Conservation Infrastructure",
    odopSectorHi: "सोलर कृषि पंप एवं जल संरक्षण अवसंरचना (ओडीओपी)",
    openingsCount: 185,
    activeTradeFocus: "Solar Pump Installation & Farm Machinery Repair",
    activeTradeFocusHi: "सोलर पंप इंस्टालेशन एवं ट्रैक्टर मिस्त्री",
    centers: [
      {
        id: "ctr-jhs-1",
        name: "District Rural Training Center (PM-AJAY Wing) Jhansi",
        nameHi: "जिला ग्रामीण प्रशिक्षण संस्थान (पीएम-अजय प्रकोष्ठ) झांसी",
        district: "Jhansi",
        latitude: 25.4484,
        longitude: 78.5685,
        distanceKm: 6.1,
        courseName: "Tractor & Solar Pump Field Technician (AGR/Q1201)",
        courseNameHi: "ट्रैक्टर एवं सोलर पंप तकनीशियन कोर्स",
        durationHours: 320,
        benefits: ["Free Lodging & Food", "Complete Toolkit", "Direct BDO Subsidy Liaison"],
        benefitsHi: ["निःशुल्क आवास व भोजन", "पूर्ण टूलकिट", "सीधा बीडीओ सब्सिडी समन्वय"],
        coordinatorName: "Er. Mahendra Pratap Singh",
        coordinatorPhone: "+91 94500 33812",
        address: "Near Collectorate, Civil Lines, Jhansi - 284001",
        addressHi: "कलेक्ट्रेट के समीप, सिविल लाइंस, झांसी - 284001",
         googleMapsUrl: "https://maps.google.com/?q=25.4484,78.5685",
         pincode: "284001",
         qpCode: "AGR/Q1201"
       }
    ]
  },
  "Patna": {
    district: "Patna",
    state: "Bihar",
    odopSector: "Light Engineering & Electrical Appliance Servicing",
    odopSectorHi: "लाइट इंजीनियरिंग एवं विद्युत उपकरण सेवा (ओडीओपी)",
    openingsCount: 110,
    activeTradeFocus: "Home Appliances & Rural Electrical Work",
    activeTradeFocusHi: "घरेलू उपकरण एवं ग्रामीण विद्युत कार्य",
    centers: [
      {
        id: "ctr-pat-1",
        name: "State Industrial Training Institute Digha Patna",
        nameHi: "राजकीय औद्योगिक प्रशिक्षण संस्थान दीघा, पटना",
        district: "Patna",
        latitude: 25.6322,
        longitude: 85.1017,
        distanceKm: 7.3,
        courseName: "Electrician & Equipment Repair (ELE/Q5901)",
        courseNameHi: "इलेक्ट्रीशियन एवं उपकरण मरम्मत कोर्स",
        durationHours: 300,
        benefits: ["Free Course", "Stipend Allowance", "Apprenticeship Linkage"],
        benefitsHi: ["निःशुल्क कोर्स", "वजीफा भत्ता", "शिक्षुता / अप्रेंटिसशिप अवसर"],
        coordinatorName: "Shri Alok Sinha",
        coordinatorPhone: "+91 94310 66723",
        address: "Digha Ghat Road, Patna, Bihar - 800011",
        addressHi: "दीघा घाट रोड, पटना, बिहार - 800011",
         googleMapsUrl: "https://maps.google.com/?q=25.6322,85.1017",
         pincode: "800011",
         qpCode: "ELE/Q5901"
       }
     ]
  }
};
