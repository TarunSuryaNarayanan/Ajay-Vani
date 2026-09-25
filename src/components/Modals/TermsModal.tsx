import React from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 overflow-y-auto">
      <div className="bg-surface rounded-card max-w-[440px] w-full p-6 border border-line shadow-lg max-h-[85vh] flex flex-col">
        <h2 className="font-display text-xl text-ink font-semibold mb-3">
          नियम एवं शर्तें (Terms and Conditions)
        </h2>
        
        <div className="overflow-y-auto text-sm text-ink-muted space-y-3 pr-1 leading-relaxed">
          <p>
            <strong>1. निःशुल्क नागरिक सेवा:</strong> AJAY-VANI एक निःशुल्क नागरिक आजीविका सहायक है। इसके उपयोग या आवेदन पत्र तैयार करने के लिए कोई भी शुल्क देय नहीं है।
          </p>
          <p>
            <strong>2. पीएम-अजय पात्रता:</strong> पीएम-अजय विशेष केंद्रीय सहायता घटक के अंतर्गत अनुदान एवं कौशल विकास लाभ भारत सरकार के सामाजिक न्याय एवं अधिकारिता मंत्रालय के दिशा-निर्देशों के अनुरूप अनुसूचित जाति के पात्र लाभार्थियों के लिए हैं।
          </p>
          <p>
            <strong>3. सत्यापन प्रक्रिया:</strong> ऐप द्वारा तैयार किया गया 1-पृष्ठ प्रस्ताव संबंधित ग्राम सहायक, ब्लॉक विकास अधिकारी (BDO) एवं बैंक शाखा द्वारा भौतिक दस्तावेजों के सत्यापन के अधीन होगा।
          </p>
          <p>
            <strong>4. आधिकारिक आंकड़े:</strong> प्रदर्शित रिक्तियां एवं कौशल केंद्र की जानकारियां राज्य एवं जिला रोजगार रजिस्टरी के अनुसार अद्यतन की जाती हैं।
          </p>
        </div>

        <button
          onClick={onClose}
          className="btn-primary mt-5 w-full text-base"
        >
          स्वीकार है, बंद करें
        </button>
      </div>
    </div>
  );
};
