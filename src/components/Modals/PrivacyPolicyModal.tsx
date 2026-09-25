import React from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 overflow-y-auto">
      <div className="bg-surface rounded-card max-w-[440px] w-full p-6 border border-line shadow-lg max-h-[85vh] flex flex-col">
        <h2 className="font-display text-xl text-ink font-semibold mb-3">
          गोपनीयता नीति (Privacy Policy)
        </h2>
        
        <div className="overflow-y-auto text-sm text-ink-muted space-y-3 pr-1 leading-relaxed">
          <p>
            <strong>1. वॉयस डेटा संग्रहण एवं उपयोग:</strong> AJAY-VANI ऐप केवल आपकी आजीविका प्राथमिकताओं और कौशल मिलान के लिए आपकी अनुमति से माइक्रोफ़ोन ऑडियो कैप्चर करता है।
          </p>
          <p>
            <strong>2. डेटा भंडारण सीमा:</strong> वॉयस रिकॉर्डिंग को व्यावसायिक मॉडल प्रशिक्षण के लिए उपयोग नहीं किया जाता है। स्थानीय सत्र समाप्त होने या प्रस्ताव दस्तावेज बनने के बाद वॉयस डेटा हटा दिया जाता है।
          </p>
          <p>
            <strong>3. आधार एवं जाति प्रमाण पत्र की सुरक्षा:</strong> आपका आधार नंबर या जाति प्रमाण पत्र सर्वर पर अनएन्क्रिप्टेड रूप में कभी संग्रहीत नहीं किया जाता है। इसका उपयोग केवल पीएम-अजय (PM-AJAY) सहायता पात्रता सत्यापन और बीडीओ आवेदन पत्र भरने के लिए आपके डिवाइस पर किया जाता है।
          </p>
          <p>
            <strong>4. तीसरे पक्ष के साथ साझाकरण:</strong> आपका डेटा केवल अधिकृत सरकारी कौशल केंद्रों (ITI) एवं पीएम-अजय कार्यान्वयन एजेंसियों के साथ सरकारी योजना लाभों के लिए ही साझा किया जाता है।
          </p>
        </div>

        <button
          onClick={onClose}
          className="btn-primary mt-5 w-full text-base"
        >
          समझ गया, बंद करें
        </button>
      </div>
    </div>
  );
};
