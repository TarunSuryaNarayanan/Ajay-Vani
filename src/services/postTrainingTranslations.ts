import { LanguageCode } from '../types';

export type PostTrainingPathKey = 'business' | 'job' | 'mudra';

export interface ChecklistStep {
  title: string;
  body: string;
}

export interface PostTrainingCopy {
  screenTitle: string;
  certifiedTrade: string; // %s = roleName, %s = qpCode
  trainingCompleted: string; // %s = elapsed text
  listenAria: string;
  previewNotice: string;
  promptLabel: string;
  openerCombined: string; // %s = business prompt, %s = job prompt
  voiceAnswerHint: string;
  voiceHeard: string; // %s = transcript
  voiceListening: string;
  answerByVoice: string;
  /** Shown instead of a vacancy/wage figure the dataset does not publish. */
  fieldVacancies: string;
  fieldWage: string;
  fieldDistance: string;
  pathBusinessTitle: string;
  pathBusinessSub: string;
  pathJobTitle: string;
  pathJobSub: string; // %s = district, %s = qpCode
  pathMudraTitle: string;
  pathMudraSub: string;
  prompts: Record<PostTrainingPathKey, string>;
  autoFilledLabel: string;
  fieldBeneficiary: string;
  fieldTrade: string;
  fieldQp: string;
  fieldDistrict: string;
  fieldGrant: string;
  checklistLabel: string;
  checklist: ChecklistStep[];
  jobsLabel: string; // %s = district
  jobsLoading: string;
  jobsError: string;
  jobsEmpty: string;
  jobsDataNotice: string;
  jobMatchCertified: string;
  jobMatchRelated: string;
  jobCallCoordinator: string; // %s = phone
  jobUnknownField: string;
  reloadButton: string;
  mudraIntro: string;
  mudraSteps: ChecklistStep[];
  pdfGenerating: string;
  pdfRedownload: string;
  pdfDownload: string;
  legacyPath: string;
  backToDashboard: string;
  lockedTitle: string;
  lockedBody: string;
  lockedOpenLegacy: string;
}

/**
 * Post-training guidance screen copy (F3).
 *
 * The Hindi entry is the source of truth and is reproduced verbatim from
 * `governance.ts` (BDO_SUBMISSION_CHECKLIST, MUDRA_LOAN_STEPS,
 * POST_TRAINING_VOICE_PROMPTS) and `PostTrainingGuidanceScreen.tsx`.
 *
 * `jobsDataNotice` is deliberately honest: the openings list is built from a
 * snapshot of a government training/certification centre dataset, so no live
 * vacancy counts exist. Every language says so rather than implying live jobs.
 */
export const POST_TRAINING_COPY: Record<LanguageCode, PostTrainingCopy> = {
  'hi-IN': {
    screenTitle: 'प्रशिक्षणोत्तर मार्गदर्शन',
    certifiedTrade: 'प्रमाणित ट्रेड: %s (%s)',
    trainingCompleted: 'प्रशिक्षण पूर्ण: %s',
    listenAria: 'मार्गदर्शन सुनें',
    previewNotice:
      'दिन 90 की अवधि पूरी नहीं हुई है — यह पूर्वावलोकन (preview) है। पूर्ण दिन 90 के बाद यह मार्गदर्शन स्वतः खुलेगा।',
    promptLabel: 'एआई वॉइस प्रॉम्प्ट (Second Conversation Loop)',
    openerCombined: '%s — या — %s',
    voiceAnswerHint: 'बोलकर या नीचे बटन दबाकर जवाब दें',
    voiceHeard: 'आपने कहा: %s',
    voiceListening: 'सुन रहे हैं...',
    answerByVoice: 'बोलकर जवाब दीं',
    pathBusinessTitle: 'पथ A: अपना व्यापार शुरू करें',
    pathBusinessSub: '₹50,000 पीएम-अजय व्यापार प्रस्ताव + बीडीओ जमा चेकलिस्ट',
    pathJobTitle: 'पथ B: नौकरी खोजें',
    pathJobSub: '%s ज़िले में आपके NSQF कोड (%s) के लिए सत्यापित नियोक्ता',
    pathMudraTitle: 'पथ C: पीएम मुद्रा ऋण',
    pathMudraSub: '₹10 लाख तक — अनुदान से परे की पूंजी हेतु निकटतम बैंक शाखा में आवेदन',
    prompts: {
      business: 'क्या आप अपना खुद का व्यापार शुरू करना चाहते हैं?',
      job: 'क्या आप किसी कंपनी में नौकरी ढूंढना चाहते हैं?',
      mudra: 'क्या आप मुद्रा ऋण लेकर व्यापार बड़ा करना चाहते हैं?',
    },
    autoFilledLabel: 'स्वतः भरे गए विवरण (Auto-Populated from Certification)',
    fieldBeneficiary: 'लाभार्थी:',
    fieldTrade: 'प्रमाणित ट्रेड:',
    fieldQp: 'QP कोड:',
    fieldDistrict: 'ज़िला:',
    fieldGrant: 'अनुदान:',
    fieldVacancies: 'रिक्त पद',
    fieldWage: 'वेतन',
    fieldDistance: 'दूरी',
    checklistLabel: 'बीडीओ को भौतिक जमा हेतु चरण (Submission Checklist)',
    checklist: [
      {
        title: 'चरण 1: प्रस्ताव तैयार करें',
        body: 'नीचे दिए बटन से 1-पृष्ठ पीएम-अजय व्यापार प्रस्ताव (PDF) डाउनलोड करें। इसमें आपका पंजीकृत विवरण और प्रमाणित NSQF ट्रेड पहले से भरा होगा।',
      },
      {
        title: 'चरण 2: आधार एवं जाति प्रमाण पत्र',
        body: 'आधार कार्ड, अनुसूचित जाति प्रमाण पत्र और बैंक पासबुक की स्कैन कॉपी साथ रखें।',
      },
      {
        title: 'चरण 3: ग्राम सहायक से सत्यापन',
        body: 'अपने ग्राम सहायक / अंचलवार कर्मचारी से दस्तावेज़ सत्यापन (attestation) कराएं।',
      },
      {
        title: 'चरण 4: बीडीओ कार्यालय में भौतिक जमा',
        body: 'प्रस्ताव, ₹50,000 अनुदान के लिए भरा आवेदन और ऊपर की सभी प्रमाणित प्रतियाँ खंड विकास अधिकारी (BDO) के कार्यालय में जमा करें।',
      },
      {
        title: 'चरण 5: पंजीकरण एवं अनुदान ट्रैकिंग',
        body: 'जमा रसीद अपने डैशबोर्ड पर सेव करें। अनुदान स्वीकृति और राशि हस्तांतरण की स्थिति इसी ऐप के अनुदान ट्रैकर में दिखती है।',
      },
    ],
    jobsLabel: 'सत्यापित स्थानीय नियोक्ता (%s)',
    jobsLoading: 'नौकरी सूची खोजी जा रही है...',
    jobsError: 'नौकरी सूची लोड नहीं हो सकी। इंटरनेट कनेक्शन जाँचें।',
    jobsEmpty: 'इस ज़िले में आपके ट्रेड के लिए अभी सत्यापित रिक्त पद नहीं हैं।',
    jobsDataNotice:
      'यह सूची सरकारी डेटा सेट के एक स्नैपशॉट से ली गई प्रशिक्षण एवं प्रमाणन केंद्रों की है। रिक्त पदों की लाइव संख्या उपलब्ध नहीं है — सीधे नियोक्ता को फोन करके पक्का करें।',
    jobMatchCertified: 'प्रमाणित NSQF मैच',
    jobMatchRelated: 'ज़िला-सम्बंधित माँग',
    jobCallCoordinator: 'समन्वयक को कॉल करें: %s',
    jobUnknownField: 'उपलब्ध नहीं',
    reloadButton: 'सूची पुनः लोड करें',
    mudraIntro:
      'पीएम-अजय ₹50,000 अनुदान के बाद भी यदि व्यापार के लिए अधिक पूंजी चाहिए, तो प्रधानमंत्री मुद्रा योजना के तहत ₹10 लाख तक का ऋण बिना कॉलेटरल लिया जा सकता है। निकटतम बैंक शाखा या BRC केंद्र में आवेदन करें। श्रेणियाँ: शिशु ₹50,000 तक, किशोर ₹50,001 से ₹5 लाख तक, तरुण ₹5,00,001 से ₹10 लाख तक।',
    mudraSteps: [
      {
        title: '1. बैंक शाखा में आवेदन',
        body: 'अपने निकटतम बैंक / बीआरसी केंद्र में "प्रधानमंत्री मुद्रा योजना (शिशु/किशोर/तरुण) फॉर्म" भरें। आधार, पैन और जाति प्रमाण पत्र अनिवार्य हैं।',
      },
      {
        title: '2. ₹50,000 अनुदान का प्रमाण',
        body: 'पीएम-अजय अनुदान स्वीकृति पत्र / बीडीओ सत्यापन संलग्न करें — इससे अनुदान की राशि ऋण से घट जाती है।',
      },
      {
        title: '3. व्यापार योजना (Project Report)',
        body: '2-3 पृष्ठ की योजना बनाएं: उत्पाद, कच्चा माल, जगह, अनुमानित लागत, बाज़ार और वित्तीय विवरण।',
      },
      {
        title: '4. बैंक सत्यापन एवं स्वीकृति',
        body: 'बैंक आपके केंद्र/ODOP इकाई का भ्रमण कर स्वीकृति देता है। मुद्रा ऋण ₹10 लाख तक, बिना कॉलेटरल के स्वीकृत हो सकता है।',
      },
      {
        title: '5. पहला किस्ता एवं शिक्षुता',
        body: 'स्वीकृति के बाद पहली किस्ता मिलते ही शिपा/ट्रेनिंग शुरू करें और रजिस्टर रजिस्टर बनवाएं।',
      },
    ],
    pdfGenerating: 'दस्तावेज़ तैयार हो रहा है...',
    pdfRedownload: 'प्रस्ताव पुनः डाउनलोड करें',
    pdfDownload: '₹50,000 व्यापार प्रस्ताव डाउनलोड करें',
    legacyPath: 'पुराना अनुदान पथ (Micro-Finance) खोलें',
    backToDashboard: 'डैशबोर्ड पर लौटें',
    lockedTitle: 'प्रशिक्षणोत्तर मार्गदर्शन',
    lockedBody:
      'यह मार्गदर्शन केवल प्रमाणित एवं पूर्ण प्रशिक्षण (दिन 90+) वाले लाभार्थियों के लिए खुलता है। आपका प्रशिक्षण अभी जारी है — नीचे दिए पुराने अनुदान पथ का उपयोग करें।',
    lockedOpenLegacy: '₹50,000 अनुदान पथ खोलें (पुराना पथ)',
  },

  'en-IN': {
    screenTitle: 'After training guide',
    certifiedTrade: 'Certified trade: %s (%s)',
    trainingCompleted: 'Training complete: %s',
    listenAria: 'Listen to the guide',
    previewNotice:
      'The 90 days are not over yet — this is only a preview. This guide opens by itself after the full 90 days.',
    promptLabel: 'AI VOICE PROMPT (Second Conversation Loop)',
    openerCombined: '%s — or — %s',
    voiceAnswerHint: 'Answer by speaking, or by pressing the button below',
    voiceHeard: 'You said: %s',
    voiceListening: 'Listening...',
    answerByVoice: 'Answer by voice',
    pathBusinessTitle: 'Path A: Start your own business',
    pathBusinessSub: 'Rs 50,000 PM-AJAY business proposal + BDO submit checklist',
    pathJobTitle: 'Path B: Find a job',
    pathJobSub: 'Verified employers in %s district for your NSQF code (%s)',
    pathMudraTitle: 'Path C: PM MUDRA loan',
    pathMudraSub: 'Up to Rs 10 lakh — apply at your nearest bank branch for money beyond the grant',
    prompts: {
      business: 'Do you want to start your own business?',
      job: 'Do you want to find a job in a company?',
      mudra: 'Do you want to take a MUDRA loan and grow your business?',
    },
    autoFilledLabel: 'Details filled in for you (Auto-Populated from Certification)',
    fieldBeneficiary: 'Name:',
    fieldTrade: 'Certified trade:',
    fieldQp: 'QP code:',
    fieldDistrict: 'District:',
    fieldGrant: 'Grant:',
    fieldVacancies: 'Vacancies',
    fieldWage: 'Wage',
    fieldDistance: 'Distance',
    checklistLabel: 'Steps to submit in person at the BDO (Submission Checklist)',
    checklist: [
      {
        title: 'Step 1: Prepare the proposal',
        body: 'Tap the button below to download the 1-page PM-AJAY business proposal (PDF). Your registered details and your certified NSQF trade are already filled in it.',
      },
      {
        title: 'Step 2: Aadhaar and caste certificate',
        body: 'Keep copies of your Aadhaar card, Scheduled Caste certificate and bank passbook together.',
      },
      {
        title: 'Step 3: Get the papers verified',
        body: 'Get the documents attested (attestation) by your village helper / block staff.',
      },
      {
        title: 'Step 4: Submit in person at the BDO office',
        body: 'Submit the proposal, the filled application for the Rs 50,000 grant, and all the certified copies listed above at the office of the Block Development Officer (BDO).',
      },
      {
        title: 'Step 5: Register and track the grant',
        body: 'Save the submission receipt on your dashboard. The grant approval and money transfer status is shown in the grant tracker of this same app.',
      },
    ],
    jobsLabel: 'Verified local employers (%s)',
    jobsLoading: 'Searching for jobs...',
    jobsError: 'The job list could not be loaded. Please check the internet connection.',
    jobsEmpty: 'There are no verified vacancies for your trade in this district right now.',
    jobsDataNotice:
      'This list comes from a fixed snapshot of a government training and certification centre dataset. Live vacancy counts are not available. Please call the centre to confirm before you go.',
    jobMatchCertified: 'Certified NSQF match',
    jobMatchRelated: 'District-linked demand',
    jobCallCoordinator: 'Call the coordinator: %s',
    jobUnknownField: 'Not available',
    reloadButton: 'Load the list again',
    mudraIntro:
      'Even after the PM-AJAY grant of Rs 50,000, if you need more money for the business you can take a loan of up to Rs 10 lakh under the Prime Minister MUDRA Yojana, with no collateral. Apply at your nearest bank branch or BRC centre. The three tiers are: Shishu up to Rs 50,000, Kishore Rs 50,001 to Rs 5 lakh, Tarun Rs 5,00,001 to Rs 10 lakh.',
    mudraSteps: [
      {
        title: '1. Apply at the bank branch',
        body: 'Fill the "Prime Minister MUDRA Yojana (Shishu / Kishore / Tarun) form" at your nearest bank or BRC centre. Aadhaar, PAN and the caste certificate are compulsory.',
      },
      {
        title: '2. Proof of the Rs 50,000 grant',
        body: 'Attach the PM-AJAY grant approval letter or BDO verification — this brings the loan amount down.',
      },
      {
        title: '3. Business plan (Project Report)',
        body: 'Write a 2-3 page plan: what you will make, raw material, place, estimated cost, market and money details.',
      },
      {
        title: '4. Bank checking and approval',
        body: 'The bank visits your centre or ODOP unit and then approves. The MUDRA loan can be approved up to Rs 10 lakh, without collateral.',
      },
      {
        title: '5. First instalment and training',
        body: 'As soon as the first instalment comes after approval, start the work or training and get your register registered.',
      },
    ],
    pdfGenerating: 'Making the document...',
    pdfRedownload: 'Download the proposal again',
    pdfDownload: 'Download the Rs 50,000 business proposal',
    legacyPath: 'Open the old grant path (Micro-Finance)',
    backToDashboard: 'Go back to dashboard',
    lockedTitle: 'After training guide',
    lockedBody:
      'This guide opens only for beneficiaries who have finished the certified training (day 90+). Your training is still going on — please use the old grant path given below.',
    lockedOpenLegacy: 'Open the Rs 50,000 grant path (old path)',
  },

  'bho-IN': {
    screenTitle: 'प्रशिक्षण के बाद मार्गदर्शन',
    certifiedTrade: 'प्रमाणित ट्रेड: %s (%s)',
    trainingCompleted: 'प्रशिक्षण पूरल: %s',
    listenAria: 'मार्गदर्शन सुनीं',
    previewNotice:
      'दिन 90 के अवधि पूरि ना भइल — ई सिर्फ पूर्वावलोकन (preview) बा। पूरा दिन 90 के बाद ई मार्गदर्शन अपने आप खुल जाई।',
    promptLabel: 'एआई वॉइस प्रॉम्प्ट (Second Conversation Loop)',
    openerCombined: '%s — या — %s',
    voiceAnswerHint: 'बोल के या नीचे के बटन दभा के जवाब दीं',
    voiceHeard: 'आप बोलीं: %s',
    voiceListening: 'सुन रहल बा...',
    answerByVoice: 'बोलकर जवाब दीं',
    pathBusinessTitle: 'पथ A: अपनल व्यापार शुरू करीं',
    pathBusinessSub: '₹50,000 पीएम-अजय व्यापार प्रस्ताव + बीडीओ जमा चेकलिस्ट',
    pathJobTitle: 'पथ B: नौकरी खोजीं',
    pathJobSub: '%s जिला में आपनल NSQF कोड (%s) खाति सत्यापित नियोक्ता',
    pathMudraTitle: 'पथ C: पीएम मुद्रा ऋण',
    pathMudraSub: '₹10 लाख लेज — अनुदान से बाहर के पूंजी खाति नजदीकी बैंक शाखा में आवेदन करीं',
    prompts: {
      business: 'क्या आप अपनल खुद के व्यापार शुरू करे के चाहीं?',
      job: 'क्या आप कवन कंपनी में नौकरी खोजे के चाहीं?',
      mudra: 'क्या आप मुद्रा ऋण ले के अपनल व्यापार बढ़ावे के चाहीं?',
    },
    autoFilledLabel: 'अपने आप भरल विवरण (Auto-Populated from Certification)',
    fieldBeneficiary: 'लाभार्थी:',
    fieldTrade: 'प्रमाणित ट्रेड:',
    fieldQp: 'QP कोड:',
    fieldDistrict: 'जिला:',
    fieldGrant: 'अनुदान:',
    fieldVacancies: 'रिक्त पद',
    fieldWage: 'मजदूरी',
    fieldDistance: 'दूरी',
    checklistLabel: 'बीडीओ के सामने जमा खाति चरण (Submission Checklist)',
    checklist: [
      {
        title: 'चरण 1: प्रस्ताव तैयार करीं',
        body: 'नीचे दिए बटन से 1-पृष्ठ पीएम-अजय व्यापार प्रस्ताव (PDF) डाउनलोड करीं। ईमें आपनल पंजीकृत विवरण अउर प्रमाणित NSQF ट्रेड पहिले से भरल बा।',
      },
      {
        title: 'चरण 2: आधार अउर जाति प्रमाण पत्र',
        body: 'आधार कार्ड, अनुसूचित जाति प्रमाण पत्र अउर बैंक पासबुक के स्कैन कॉपी एक साथ रखीं।',
      },
      {
        title: 'चरण 3: ग्राम सहायक से सत्यापन',
        body: 'आपनल ग्राम सहायक / अंचलवार कर्मचारी से कागज़ के सत्यापन (attestation) करवीं।',
      },
      {
        title: 'चरण 4: बीडीओ कार्यालय में जमा करीं',
        body: 'प्रस्ताव, ₹50,000 अनुदान खाति भरल आवेदन अउर ऊपर के सभी प्रमाणित प्रति खंड विकास अधिकारी (BDO) के कार्यालय में जमा करीं।',
      },
      {
        title: 'चरण 5: पंजीकरण अउर अनुदान ट्रैकिंग',
        body: 'जमा के रसीद आपनल डैशबोर्ड पर सेव करीं। अनुदान स्वीकृति अउर राशि हस्तांतरण के हालत ईही ऐप के अनुदान ट्रैकर में दिखी।',
      },
    ],
    jobsLabel: 'सत्यापित स्थानीय नियोक्ता (%s)',
    jobsLoading: 'नौकरी सूची खोजल जा रहल बा...',
    jobsError: 'नौकरी सूची लोड ना भई। इंटरनेट कनेक्शन जाँचीं।',
    jobsEmpty: 'ईस जिला में आपनल ट्रेड खाति अभी कोनो सत्यापित रिक्त पद ना बा।',
    jobsDataNotice:
      'ई सूची सरकारी डेटा के एक स्नैपशॉट से ले गई प्रशिक्षण अउर प्रमाणन केंद्र के बा। रिक्त पद के लाइव गिनती उपलब्ध ना बा — सीधे नियोक्ता के फोन कर के पक्का करीं।',
    jobMatchCertified: 'प्रमाणित NSQF मैच',
    jobMatchRelated: 'जिला-जुड़ी माँग',
    jobCallCoordinator: 'समन्वयक के फोन करीं: %s',
    jobUnknownField: 'उपलब्ध ना बा',
    reloadButton: 'सूची फेर से लोड करीं',
    mudraIntro:
      'पीएम-अजय ₹50,000 अनुदान के बाद भी जइले व्यापार खाति अउर पूंजी चाहीं, त प्रधानमंत्री मुद्रा योजना के तहत ₹10 लाख लेज बिना कॉलेटरल के ले सकल बानी। नजदीकी बैंक शाखा या BRC केंद्र में आवेदन करीं। श्रेणी: शिशु ₹50,000 तक, किशोर ₹50,001 से ₹5 लाख तक, तरुण ₹5,00,001 से ₹10 लाख तक।',
    mudraSteps: [
      {
        title: '1. बैंक शाखा में आवेदन करीं',
        body: 'आपनल नजदीकी बैंक / बीआरसी केंद्र में "प्रधानमंत्री मुद्रा योजना (शिशु/किशोर/तरुण) फॉर्म" भरीं। आधार, पैन अउर जाति प्रमाण पत्र अनिवार्य बा।',
      },
      {
        title: '2. ₹50,000 अनुदान के प्रमाण',
        body: 'पीएम-अजय अनुदान स्वीकृति पत्र / बीडीओ सत्यापन जोड़ीं — ईसे अनुदान के राशि ऋण से घट जाला।',
      },
      {
        title: '3. व्यापार योजना (Project Report)',
        body: '2-3 पृष्ठ के योजना बनाईं: उत्पाद, कच्चा माल, जगह, अनुमानित लागत, बाज़ार अउर वित्तीय विवरण।',
      },
      {
        title: '4. बैंक सत्यापन अउर स्वीकृति',
        body: 'बैंक आपनल केंद्र/ODOP इकाई के भ्रमण कर के स्वीकृति देला। मुद्रा ऋण ₹10 लाख तक, बिना कॉलेटरल के स्वीकृत हो सकल बा।',
      },
      {
        title: '5. पहिल किस्ता अउर ट्रेनिंग',
        body: 'स्वीकृति के बाद पहिल किस्ता मिलतेइ काम/ट्रेनिंग शुरू करीं अउर रजिस्टर रजिस्टर करवीं।',
      },
    ],
    pdfGenerating: 'कागज़ तैयार हो रहल बा...',
    pdfRedownload: 'प्रस्ताव फेर से डाउनलोड करीं',
    pdfDownload: '₹50,000 व्यापार प्रस्ताव डाउनलोड करीं',
    legacyPath: 'पुरान अनुदान पथ (Micro-Finance) खोलीं',
    backToDashboard: 'डैशबोर्ड पर लवटीं',
    lockedTitle: 'प्रशिक्षण के बाद मार्गदर्शन',
    lockedBody:
      'ई मार्गदर्शन सिर्फ प्रमाणित अउर पूरा प्रशिक्षण (दिन 90+) वाला लाभार्थी खाति खुलल बा। आपनल प्रशिक्षण अभी जारी बा — नीचे दिहल पुरान अनुदान पथ के इस्तेमाल करीं।',
    lockedOpenLegacy: '₹50,000 अनुदान पथ खोलीं (पुरान पथ)',
  },

  'bun-IN': {
    screenTitle: 'प्रशिक्षण के बाद मार्गदर्शन',
    certifiedTrade: 'प्रमाणित ट्रेड: %s (%s)',
    trainingCompleted: 'प्रशिक्षण पूरल: %s',
    listenAria: 'मार्गदर्शन सुनो',
    previewNotice:
      'दिन 90 के अवधि पूरइ नइल — ई सिर्फ पूर्वावलोकन (preview) है। पूरा दिन 90 के बाद ई मार्गदर्शन अपने आप खुल जाई।',
    promptLabel: 'एआई वॉइस प्रॉम्प्ट (Second Conversation Loop)',
    openerCombined: '%s — या — %s',
    voiceAnswerHint: 'बोल के या नीचे के बटन दबा के जवाब दो',
    voiceHeard: 'तुम बोलीं: %s',
    voiceListening: 'सुन रहल हैं...',
    answerByVoice: 'बोलकर जवाब दीं',
    pathBusinessTitle: 'पथ A: तुम्हार व्यापार शुरू करो',
    pathBusinessSub: '₹50,000 पीएम-अजय व्यापार प्रस्ताव + बीडीओ जमा चेकलिस्ट',
    pathJobTitle: 'पथ B: नौकरी खोजो',
    pathJobSub: '%s जिला में तुम्हार NSQF कोड (%s) खाति सत्यापित नियोक्ता',
    pathMudraTitle: 'पथ C: पीएम मुद्रा ऋण',
    pathMudraSub: '₹10 लाख तक — अनुदान से बाहर के पूंजी खाति नजदीकी बैंक शाखा में आवेदन करो',
    prompts: {
      business: 'तुम अपन व्यापार शुरू करे के चाहीं?',
      job: 'तुम कवन कंपनी में नौकरी खोजे के चाहीं?',
      mudra: 'तुम मुद्रा ऋण ले के व्यापार बढ़ावे के चाहीं?',
    },
    autoFilledLabel: 'अपने आप भरे गए विवरण (Auto-Populated from Certification)',
    fieldBeneficiary: 'लाभार्थी:',
    fieldTrade: 'प्रमाणित ट्रेड:',
    fieldQp: 'QP कोड:',
    fieldDistrict: 'जिला:',
    fieldGrant: 'अनुदान:',
    fieldVacancies: 'खाली पद',
    fieldWage: 'मजदूरी',
    fieldDistance: 'दूरी',
    checklistLabel: 'बीडीओ के सामने जमा खाति चरण (Submission Checklist)',
    checklist: [
      {
        title: 'चरण 1: प्रस्ताव तैयार करो',
        body: 'नीचे दिए बटन से 1-पृष्ठ पीएम-अजय व्यापार प्रस्ताव (PDF) डाउनलोड करो। ईमें तुम्हार पंजीकृत विवरण अउर प्रमाणित NSQF ट्रेड पहिले से भरल हैं।',
      },
      {
        title: 'चरण 2: आधार अउर जाति प्रमाण पत्र',
        body: 'आधार कार्ड, अनुसूचित जाति प्रमाण पत्र अउर बैंक पासबुक के स्कैन कॉपी एक साथ रखो।',
      },
      {
        title: 'चरण 3: ग्राम सहायक से सत्यापन',
        body: 'तुम्हार ग्राम सहायक / अंचलवार कर्मचारी से कागज़ के सत्यापन (attestation) करवो।',
      },
      {
        title: 'चरण 4: बीडीओ कार्यालय में जमा करो',
        body: 'प्रस्ताव, ₹50,000 अनुदान खाति भरल आवेदन अउर ऊपर के सभी प्रमाणित प्रति खंड विकास अधिकारी (BDO) के कार्यालय में जमा करो।',
      },
      {
        title: 'चरण 5: पंजीकरण अउर अनुदान ट्रैकिंग',
        body: 'जमा के रसीद तुम्हार डैशबोर्ड पर सेव करो। अनुदान स्वीकृति अउर राशि हस्तांतरण के हालत ईहीं ऐप के अनुदान ट्रैकर में दिखी।',
      },
    ],
    jobsLabel: 'सत्यापित स्थानीय नियोक्ता (%s)',
    jobsLoading: 'नौकरी सूची खोजल जा रहल हैं...',
    jobsError: 'नौकरी सूची लोड नइल। इंटरनेट कनेक्शन जाँचो।',
    jobsEmpty: 'ईस जिला में तुम्हार ट्रेड खाति अभी कोनो सत्यापित रिक्त पद नइल।',
    jobsDataNotice:
      'ई सूची सरकारी डेटा के एक स्नैपशॉट से ली गई प्रशिक्षण अउर प्रमाणन केंद्र के है। रिक्त पद के लाइव गिनती उपलब्ध नइल — सीधे नियोक्ता के फोन कर के पक्का करो।',
    jobMatchCertified: 'प्रमाणित NSQF मैच',
    jobMatchRelated: 'जिला-जुड़ी माँग',
    jobCallCoordinator: 'समन्वयक के फोन करो: %s',
    jobUnknownField: 'उपलब्ध नइल',
    reloadButton: 'सूची फिर से लोड करो',
    mudraIntro:
      'पीएम-अजय ₹50,000 अनुदान के बाद भी जइले व्यापार खाति अधिक पूंजी चाहीं, त प्रधानमंत्री मुद्रा योजना के तहत ₹10 लाख तक का ऋण बिना कॉलेटरल लिह सकत हैं। नजदीकी बैंक शाखा या BRC केंद्र में आवेदन करो। श्रेणी: शिशु ₹50,000 तक, किशोर ₹50,001 से ₹5 लाख तक, तरुण ₹5,00,001 से ₹10 लाख तक।',
    mudraSteps: [
      {
        title: '1. बैंक शाखा में आवेदन करो',
        body: 'तुम्हार नजदीकी बैंक / बीआरसी केंद्र में "प्रधानमंत्री मुद्रा योजना (शिशु/किशोर/तरुण) फॉर्म" भरो। आधार, पैन अउर जाति प्रमाण पत्र अनिवार्य हैं।',
      },
      {
        title: '2. ₹50,000 अनुदान के प्रमाण',
        body: 'पीएम-अजय अनुदान स्वीकृति पत्र / बीडीओ सत्यापन जोड़ो — ईसे अनुदान के राशि ऋण से घट जाली।',
      },
      {
        title: '3. व्यापार योजना (Project Report)',
        body: '2-3 पृष्ठ के योजना बनाओ: उत्पाद, कच्चा माल, जगह, अनुमानित लागत, बाज़ार अउर वित्तीय विवरण।',
      },
      {
        title: '4. बैंक सत्यापन अउर स्वीकृति',
        body: 'बैंक तुम्हार केंद्र/ODOP इकाई के भ्रमण कर के स्वीकृति देली। मुद्रा ऋण ₹10 लाख तक, बिना कॉलेटरल के स्वीकृत हो सकत हैं।',
      },
      {
        title: '5. पहिल किस्ता अउर ट्रेनिंग',
        body: 'स्वीकृति के बाद पहिल किस्ता मिलतइ काम/ट्रेनिंग शुरू करो अउर रजिस्टर रजिस्टर करवो।',
      },
    ],
    pdfGenerating: 'कागज़ तैयार हो रहल हैं...',
    pdfRedownload: 'प्रस्ताव फिर से डाउनलोड करो',
    pdfDownload: '₹50,000 व्यापार प्रस्ताव डाउनलोड करो',
    legacyPath: 'पुरान अनुदान पथ (Micro-Finance) खोलो',
    backToDashboard: 'डैशबोर्ड पर लवटो',
    lockedTitle: 'प्रशिक्षण के बाद मार्गदर्शन',
    lockedBody:
      'ई मार्गदर्शन सिर्फ प्रमाणित अउर पूरा प्रशिक्षण (दिन 90+) वाले लाभार्थी खाति खुलल है। तुम्हार प्रशिक्षण अभी जारी है — नीचे दिहल पुरान अनुदान पथ के इस्तेमाल करो।',
    lockedOpenLegacy: '₹50,000 अनुदान पथ खोलो (पुरान पथ)',
  },

  'chg-IN': {
    screenTitle: 'प्रशिक्षण के बाद मार्गदर्शन',
    certifiedTrade: 'प्रमाणित ट्रेड: %s (%s)',
    trainingCompleted: 'प्रशिक्षण पूरल: %s',
    listenAria: 'मार्गदर्शन सुनीं',
    previewNotice:
      'दिन 90 के अवधि पूरि नइय — ई सिर्फ पूर्वावलोकन (preview) बा। पूरा दिन 90 के बाद ई मार्गदर्शन आपने आप खुल जाई।',
    promptLabel: 'एआई वॉइस प्रॉम्प्ट (Second Conversation Loop)',
    openerCombined: '%s — या — %s',
    voiceAnswerHint: 'बोल के या नीचे के बटन दबा के जवाब दीं',
    voiceHeard: 'तंय बोलीं: %s',
    voiceListening: 'सुन रहल बा...',
    answerByVoice: 'बोलकर जवाब दीं',
    pathBusinessTitle: 'पथ A: तोर व्यापार शुरू करीं',
    pathBusinessSub: '₹50,000 पीएम-अजय व्यापार प्रस्ताव + बीडीओ जमा चेकलिस्ट',
    pathJobTitle: 'पथ B: नौकरी खोजीं',
    pathJobSub: '%s जिला में तोर NSQF कोड (%s) खाति सत्यापित नियोक्ता',
    pathMudraTitle: 'पथ C: पीएम मुद्रा ऋण',
    pathMudraSub: '₹10 लाख तक — अनुदान से बाहर के पूंजी खाति नजदीकी बैंक शाखा में आवेदन करीं',
    prompts: {
      business: 'तंय अपन व्यापार शुरू करे बर चाहत हस?',
      job: 'तंय कवन कंपनी में नौकरी खोजे बर चाहत हस?',
      mudra: 'तंय मुद्रा ऋण ले के व्यापार बढ़ावे बर चाहत हस?',
    },
    autoFilledLabel: 'आपने आप भरे गए विवरण (Auto-Populated from Certification)',
    fieldBeneficiary: 'लाभार्थी:',
    fieldTrade: 'प्रमाणित ट्रेड:',
    fieldQp: 'QP कोड:',
    fieldDistrict: 'जिला:',
    fieldGrant: 'अनुदान:',
    fieldVacancies: 'रिक्त पद',
    fieldWage: 'मजदूरी',
    fieldDistance: 'दूरी',
    checklistLabel: 'बीडीओ के सामने जमा खाति चरण (Submission Checklist)',
    checklist: [
      {
        title: 'चरण 1: प्रस्ताव तैयार करीं',
        body: 'नीचे दिए बटन से 1-पृष्ठ पीएम-अजय व्यापार प्रस्ताव (PDF) डाउनलोड करीं। ईमें तोर पंजीकृत विवरण अउर प्रमाणित NSQF ट्रेड पहिले से भरल बा।',
      },
      {
        title: 'चरण 2: आधार अउर जाति प्रमाण पत्र',
        body: 'आधार कार्ड, अनुसूचित जाति प्रमाण पत्र अउर बैंक पासबुक के स्कैन कॉपी एक साथ रखीं।',
      },
      {
        title: 'चरण 3: ग्राम सहायक से सत्यापन',
        body: 'तोर ग्राम सहायक / अंचलवार कर्मचारी से कागज़ के सत्यापन (attestation) करवीं।',
      },
      {
        title: 'चरण 4: बीडीओ कार्यालय में जमा करीं',
        body: 'प्रस्ताव, ₹50,000 अनुदान खाति भरल आवेदन अउर ऊपर के सभी प्रमाणित प्रति खंड विकास अधिकारी (BDO) के कार्यालय में जमा करीं।',
      },
      {
        title: 'चरण 5: पंजीकरण अउर अनुदान ट्रैकिंग',
        body: 'जमा के रसीद तोर डैशबोर्ड पर सेव करीं। अनुदान स्वीकृति अउर राशि हस्तांतरण के हालत ईही ऐप के अनुदान ट्रैकर में दिखी।',
      },
    ],
    jobsLabel: 'सत्यापित स्थानीय नियोक्ता (%s)',
    jobsLoading: 'नौकरी सूची खोजल जा रहल बा...',
    jobsError: 'नौकरी सूची लोड नइय। इंटरनेट कनेक्शन जाँचीं।',
    jobsEmpty: 'ईस जिला में तोर ट्रेड खाति अभी कवनो सत्यापित रिक्त पद नइय।',
    jobsDataNotice:
      'ई सूची सरकारी डेटा के एक स्नैपशॉट से ले गई प्रशिक्षण अउर प्रमाणन केंद्र सबके बा। रिक्त पद के लाइव गिनती उपलब्ध नइय — सीधे नियोक्ता के फोन कर के पक्का करीं।',
    jobMatchCertified: 'प्रमाणित NSQF मैच',
    jobMatchRelated: 'जिला-जुड़ी माँग',
    jobCallCoordinator: 'समन्वयक के फोन करीं: %s',
    jobUnknownField: 'उपलब्ध नइय',
    reloadButton: 'सूची दोबार लोड करीं',
    mudraIntro:
      'पीएम-अजय ₹50,000 अनुदान के बाद भी जइले व्यापार खाति अधिक पूंजी चाहीं, त प्रधानमंत्री मुद्रा योजना के तहत ₹10 लाख तक का ऋण बिना कॉलेटरल ले सकत बा। नजदीकी बैंक शाखा या BRC केंद्र में आवेदन करीं। श्रेणी: शिशु ₹50,000 तक, किशोर ₹50,001 से ₹5 लाख तक, तरुण ₹5,00,001 से ₹10 लाख तक।',
    mudraSteps: [
      {
        title: '1. बैंक शाखा में आवेदन करीं',
        body: 'तोर नजदीकी बैंक / बीआरसी केंद्र में "प्रधानमंत्री मुद्रा योजना (शिशु/किशोर/तरुण) फॉर्म" भरीं। आधार, पैन अउर जाति प्रमाण पत्र अनिवार्य बा।',
      },
      {
        title: '2. ₹50,000 अनुदान के प्रमाण',
        body: 'पीएम-अजय अनुदान स्वीकृति पत्र / बीडीओ सत्यापन जोड़ीं — ईसे अनुदान के राशि ऋण से घट जाला।',
      },
      {
        title: '3. व्यापार योजना (Project Report)',
        body: '2-3 पृष्ठ के योजना बनाईं: उत्पाद, कच्चा माल, जगह, अनुमानित लागत, बाज़ार अउर वित्तीय विवरण।',
      },
      {
        title: '4. बैंक सत्यापन अउर स्वीकृति',
        body: 'बैंक तोर केंद्र/ODOP इकाई के भ्रमण कर के स्वीकृति देला। मुद्रा ऋण ₹10 लाख तक, बिना कॉलेटरल के स्वीकृत हो सकत बा।',
      },
      {
        title: '5. पहिल किस्ता अउर ट्रेनिंग',
        body: 'स्वीकृति के बाद पहिल किस्ता मिलतेइ काम/ट्रेनिंग शुरू करीं अउर रजिस्टर रजिस्टर करवीं।',
      },
    ],
    pdfGenerating: 'कागज़ तैयार हो रहल बा...',
    pdfRedownload: 'प्रस्ताव दोबार डाउनलोड करीं',
    pdfDownload: '₹50,000 व्यापार प्रस्ताव डाउनलोड करीं',
    legacyPath: 'पुरान अनुदान पथ (Micro-Finance) खोलीं',
    backToDashboard: 'डैशबोर्ड पर लवटीं',
    lockedTitle: 'प्रशिक्षण के बाद मार्गदर्शन',
    lockedBody:
      'ई मार्गदर्शन सिर्फ प्रमाणित अउर पूरा प्रशिक्षण (दिन 90+) वाला लाभार्थी खाति खुलल बा। तोर प्रशिक्षण अभी जारी बा — नीचे दिहल पुरान अनुदान पथ के इस्तेमाल करीं।',
    lockedOpenLegacy: '₹50,000 अनुदान पथ खोलीं (पुरान पथ)',
  },

  'mai-IN': {
    screenTitle: 'प्रशिक्षण के बाद मार्गदर्शन',
    certifiedTrade: 'प्रमाणित ट्रेड: %s (%s)',
    trainingCompleted: 'प्रशिक्षण पूरल: %s',
    listenAria: 'मार्गदर्शन सुनीं',
    previewNotice:
      'दिन 90 के अवधि पूरि नइख — ई सिर्फ पूर्वावलोकन (preview) छी। पूरा दिन 90 के बाद ई मार्गदर्शन अपने आप खुल जाई।',
    promptLabel: 'एआई वॉइस प्रॉम्प्ट (Second Conversation Loop)',
    openerCombined: '%s — या — %s',
    voiceAnswerHint: 'बोल के या नीचे के बटन दभा के जवाब दीं',
    voiceHeard: 'अहाँ बोलीं: %s',
    voiceListening: 'सुन रहल छीं...',
    answerByVoice: 'बोलकर जवाब दीं',
    pathBusinessTitle: 'पथ A: अहाँक व्यापार शुरू करीं',
    pathBusinessSub: '₹50,000 पीएम-अजय व्यापार प्रस्ताव + बीडीओ जमा चेकलिस्ट',
    pathJobTitle: 'पथ B: नौकरी खोजीं',
    pathJobSub: '%s जिला में अहाँक NSQF कोड (%s) खाति सत्यापित नियोक्ता',
    pathMudraTitle: 'पथ C: पीएम मुद्रा ऋण',
    pathMudraSub: '₹10 लाख तक — अनुदान से बाहरक पूंजी हेतु नजदीकी बैंक शाखा में आवेदन करीं',
    prompts: {
      business: 'क्या अहाँ अपन व्यापार शुरू करै चाहीं?',
      job: 'क्या अहाँ कवन कंपनी में नौकरी खोजै चाहीं?',
      mudra: 'क्या अहाँ मुद्रा ऋण लै के व्यापार बढ़ाबै चाहीं?',
    },
    autoFilledLabel: 'अपने आप भरल विवरण (Auto-Populated from Certification)',
    fieldBeneficiary: 'लाभार्थी:',
    fieldTrade: 'प्रमाणित ट्रेड:',
    fieldQp: 'QP कोड:',
    fieldDistrict: 'जिला:',
    fieldGrant: 'अनुदान:',
    fieldVacancies: 'रिक्त पद',
    fieldWage: 'मजदूरी',
    fieldDistance: 'दूर',
    checklistLabel: 'बीडीओ के सामने जमा खाति चरण (Submission Checklist)',
    checklist: [
      {
        title: 'चरण 1: प्रस्ताव तैयार करीं',
        body: 'नीचे दिए बटन से 1-पृष्ठ पीएम-अजय व्यापार प्रस्ताव (PDF) डाउनलोड करीं। ईमें अहाँक पंजीकृत विवरण अउर प्रमाणित NSQF ट्रेड पहिले से भरल छी।',
      },
      {
        title: 'चरण 2: आधार अउर जाति प्रमाण पत्र',
        body: 'आधार कार्ड, अनुसूचित जाति प्रमाण पत्र अउर बैंक पासबुक के स्कैन कॉपी एक साथ रखीं।',
      },
      {
        title: 'चरण 3: ग्राम सहायक से सत्यापन',
        body: 'अहाँक ग्राम सहायक / अंचलवार कर्मचारी से कागज़ के सत्यापन (attestation) करवीं।',
      },
      {
        title: 'चरण 4: बीडीओ कार्यालय में जमा करीं',
        body: 'प्रस्ताव, ₹50,000 अनुदान खाति भरल आवेदन अउर ऊपर के सभी प्रमाणित प्रति खंड विकास अधिकारी (BDO) के कार्यालय में जमा करीं।',
      },
      {
        title: 'चरण 5: पंजीकरण अउर अनुदान ट्रैकिंग',
        body: 'जमा के रसीद अहाँक डैशबोर्ड पर सेव करीं। अनुदान स्वीकृति अउर राशि हस्तांतरण के हालत ईहीं ऐप के अनुदान ट्रैकर में दिखी।',
      },
    ],
    jobsLabel: 'सत्यापित स्थानीय नियोक्ता (%s)',
    jobsLoading: 'नौकरी सूची खोजल जा रहल छी...',
    jobsError: 'नौकरी सूची लोड नइख। इंटरनेट कनेक्शन जाँचीं।',
    jobsEmpty: 'ईस जिला में अहाँक ट्रेड खाति अभी कोनो सत्यापित रिक्त पद नइख।',
    jobsDataNotice:
      'ई सूची सरकारी डेटा के एक स्नैपशॉट से ले गई प्रशिक्षण अउर प्रमाणन केंद्र सभ के छी। रिक्त पद के लाइव गिनती उपलब्ध नइख — नियोक्ता के सीधे फोन कर के पक्का करीं।',
    jobMatchCertified: 'प्रमाणित NSQF मैच',
    jobMatchRelated: 'जिला-जुड़ी माँग',
    jobCallCoordinator: 'समन्वयक के फोन करीं: %s',
    jobUnknownField: 'उपलब्ध नइख',
    reloadButton: 'सूची फेर लोड करीं',
    mudraIntro:
      'पीएम-अजय ₹50,000 अनुदान के बाद भी जइले व्यापार खाति अधिक पूंजी चाहीं, त प्रधानमंत्री मुद्रा योजना के तहत ₹10 लाख तक का ऋण बिना कॉलेटरल लै सकछी। नजदीकी बैंक शाखा या BRC केंद्र में आवेदन करीं। श्रेणी: शिशु ₹50,000 तक, किशोर ₹50,001 से ₹5 लाख तक, तरुण ₹5,00,001 से ₹10 लाख तक।',
    mudraSteps: [
      {
        title: '1. बैंक शाखा में आवेदन करीं',
        body: 'अहाँक नजदीकी बैंक / बीआरसी केंद्र में "प्रधानमंत्री मुद्रा योजना (शिशु/किशोर/तरुण) फॉर्म" भरीं। आधार, पैन अउर जाति प्रमाण पत्र अनिवार्य बा।',
      },
      {
        title: '2. ₹50,000 अनुदान के प्रमाण',
        body: 'पीएम-अजय अनुदान स्वीकृति पत्र / बीडीओ सत्यापन जोड़ीं — ईसे अनुदान के राशि ऋण से घट जाला।',
      },
      {
        title: '3. व्यापार योजना (Project Report)',
        body: '2-3 पृष्ठ के योजना बनाईं: उत्पाद, कच्चा माल, जगह, अनुमानित लागत, बाज़ार अउर वित्तीय विवरण।',
      },
      {
        title: '4. बैंक सत्यापन अउर स्वीकृति',
        body: 'बैंक अहाँक केंद्र/ODOP इकाई के भ्रमण कर के स्वीकृति देला। मुद्रा ऋण ₹10 लाख तक, बिना कॉलेटरल के स्वीकृत हो सकछी।',
      },
      {
        title: '5. पहिल किस्ता अउर ट्रेनिंग',
        body: 'स्वीकृति के बाद पहिल किस्ता मिलतेइ काम/ट्रेनिंग शुरू करीं अउर रजिस्टर रजिस्टर करवीं।',
      },
    ],
    pdfGenerating: 'कागज़ तैयार हो रहल छी...',
    pdfRedownload: 'प्रस्ताव फेर डाउनलोड करीं',
    pdfDownload: '₹50,000 व्यापार प्रस्ताव डाउनलोड करीं',
    legacyPath: 'पुरान अनुदान पथ (Micro-Finance) खोलीं',
    backToDashboard: 'डैशबोर्ड पर लवटीं',
    lockedTitle: 'प्रशिक्षण के बाद मार्गदर्शन',
    lockedBody:
      'ई मार्गदर्शन सिर्फ प्रमाणित अउर पूरा प्रशिक्षण (दिन 90+) वाला लाभार्थी खाति खुलल छी। अहाँक प्रशिक्षण अभी जारी छी — नीचे दिहल पुरान अनुदान पथ के इस्तेमाल करीं।',
    lockedOpenLegacy: '₹50,000 अनुदान पथ खोलीं (पुरान पथ)',
  },

  'ta-IN': {
    screenTitle: 'பயிற்சி முடிவுக்குப் பிந்தைய வழிகாட்டல்',
    certifiedTrade: 'சான்றித் தொழில்: %s (%s)',
    trainingCompleted: 'பயிற்சி முடிந்தது: %s',
    listenAria: 'வழிகாட்டலைக் கேட்கவும்',
    previewNotice:
      '90 நாட்கள் நிறைவாகவில்லை — இது ஒரு முன்னோட்டம் (preview) மட்டுமே. முழு 90 நாட்களுக்குப் பிறகு இந்த வழிகாட்டல் தானாகத் திறக்கும்.',
    promptLabel: 'ஏஐ வாய்ச் ப்ராம்ப்ட் (Second Conversation Loop)',
    openerCombined: '%s — அல்லது — %s',
    voiceAnswerHint: 'பேசி, அல்லது கீழே உள்ள பொத்தானை அழுத்திப் பதிலளியுங்கள்',
    voiceHeard: 'நீங்கள் சொன்னது: %s',
    voiceListening: 'கேட்கிறது...',
    answerByVoice: 'விடையளித்து பதிலளியுங்கள்',
    pathBusinessTitle: 'வழி A: உங்கள் சொந்த வணிகத்தைத் தொடங்குங்கள்',
    pathBusinessSub: '₹50,000 பிஎம்-அஜய் வணிக முன்மொழிவு + பிடிஓஓ சமர்ப்பி பட்டியல்',
    pathJobTitle: 'வழி B: வேலை தேடுங்கள்',
    pathJobSub: '%s மாவட்டத்தில் உங்கள் NSQF குறியீடு (%s) சரிபார்க்கப்பட்ட முதலாளிகள்',
    pathMudraTitle: 'வழி C: பிஎம் முத்ரா கடன்',
    pathMudraSub: '₹10 லட்சம் வரை — அருளுக்கு வெளியே முதலீட்டிற்கு அருகிலுள்ள வங்கி கிளையில் விண்ணப்பிக்கவும்',
    prompts: {
      business: 'உங்கள் சொந்த வணிகத்தைத் தொடங்க விரும்புகிறீர்களா?',
      job: 'நீங்கள் ஏதாவது நிறுவனத்தில் வேலை தேட விரும்புகிறீர்களா?',
      mudra: 'முத்ரா கடன் எடுத்து உங்கள் வணிகத்தை வளர்க்க விரும்புகிறீர்களா?',
    },
    autoFilledLabel: 'தானாக நிரப்பப்பட்ட விவரங்கள் (Auto-Populated from Certification)',
    fieldBeneficiary: 'பயனாளி:',
    fieldTrade: 'சான்றித் தொழில்:',
    fieldQp: 'QP குறியீடு:',
    fieldDistrict: 'மாவட்டம்:',
    fieldGrant: 'அருள்:',
    fieldVacancies: 'வெற்றிடங்கள்',
    fieldWage: 'மாதாந்திரம்',
    fieldDistance: 'தூரம்',
    checklistLabel: 'பிடிஓஓ கார்த்தாலையில் நேரில் சமர்ப்பிக்கும் படிநிலைகள் (Submission Checklist)',
    checklist: [
      {
        title: 'படி 1: முன்மொழிவைத் தயாரிக்கவும்',
        body: 'கீழே உள்ள பொத்தானை அழுத்தி 1 பக்க பிஎம்-அஜய் வணிக முன்மொழிவை (PDF) பதிவிறக்கவும். உங்கள் பதிவு விவரங்களும் சான்றித் NSQF தொழிலும் அதில் ஏற்கனவே நிரப்பப்பட்டுள்ளன.',
      },
      {
        title: 'படி 2: ஆதார் மற்றும் சாதி சான்றித்தாள்',
        body: 'ஆதார் அட்டை, அனுசூபியூடி சாதி சான்றித்தாள், வங்கி பாஸ்புக் ஆகியவற்றின் நகலெடுப்புகளை ஒரே இடத்தில் வையுங்கள்.',
      },
      {
        title: 'படி 3: கிராம உதவியாளரிடம் சரிபார்',
        body: 'உங்கள் கிராம உதவியாளர் / தொகுதி அலுவலரிடம் ஆவணங்களுக்கு சான்றளிக்க (attestation) வையுங்கள்.',
      },
      {
        title: 'படி 4: பிடிஓஓ அலுவலகத்தில் நேரில் சமர்ப்பி',
        body: 'முன்மொழிவை, ₹50,000 அருளுக்கான நிரப்பப்பட்ட விண்ணப்பத்தையும், மேலே உள்ள சான்றித் பிரதிகளையும், தொகுதி வளர்ச்சி அதிகாரியின் (BDO) அலுவலகத்தில் சமர்ப்பியுங்கள்.',
      },
      {
        title: 'படி 5: பதிவு செய்து அருளைக் கண்காணியுங்கள்',
        body: 'சமர்ப்பி ரசீதை உங்கள் டாஷ்போர்டில் சேமியுங்கள். அருள் ஒப்புதல் மற்றும் பணம் பரிமாற்றம் நிலை இந்தச் செயலியின் அருள் கண்காணிப்பில் தெரியும்.',
      },
    ],
    jobsLabel: 'சரிபார்க்கப்பட்ட உள்ளூர் முதலாளிகள் (%s)',
    jobsLoading: 'வேலைப் பட்டியல் தேடப்படுகிறது...',
    jobsError: 'வேலைப் பட்டியலை ஏற்ற முடியவில்லை. இணைய இணைப்பைச் சரிபார்க்கவும்.',
    jobsEmpty: 'இந்த மாவட்டத்தில் உங்கள் தொழிக்காக இப்போது சரிபார்க்கப்பட்ட வெற்றிடங்கள் இல்லை.',
    jobsDataNotice:
      'இந்தப் பட்டியல் அரசு தரவுத் தொகுப்பின் ஒரு நிலையான படத்திலிருந்து எடுக்கப்பட்ட பயிற்சி மற்றும் சான்றிப்படுத்தல் மையங்களைக் காட்டுகிறது. வெற்றிட எண்ணிக்கை நேரடியாக இங்கு கிடைக்காது — முதலாளியை நேரடியாக அழைத்து உறுதி செய்யுங்கள்.',
    jobMatchCertified: 'சான்றித்த NSQF பொருத்தம்',
    jobMatchRelated: 'மாவட்ட தொடர்பான தேவை',
    jobCallCoordinator: 'ஒருங்கிணைப்பாளரை அழைக்கவும்: %s',
    jobUnknownField: 'கிடைக்கவில்லை',
    reloadButton: 'பட்டியலை மீண்டும் ஏற்றவும்',
    mudraIntro:
      'பிஎம்-அஜய் ₹50,000 அருளுக்குப் பிறகும் வணிகத்திற்கு அதிக முதலீடு தேவைப்பட்டால், பிரதமர் முத்ரா யோजனத்தின் கீழ் ₹10 லட்சம் வரை கடனை நிரப்பல் இல்லாமல் பெறலாம். உங்கள் அருகிலுள்ள வங்கி கிளை அல்லது BRC மையத்தில் விண்ணப்பிக்கவும். அளவுகள்: சிசு ₹50,000 வரை, கிஷோர் ₹50,001 முதல் ₹5 லட்சம் வரை, தருண் ₹5,00,001 முதல் ₹10 லட்சம் வரை.',
    mudraSteps: [
      {
        title: '1. வங்கி கிளையில் விண்ணப்பிக்கவும்',
        body: 'உங்கள் அருகிலுள்ள வங்கி / பிஆர்சி மையத்தில் "பிரதமர் முத்ரா யோजனம் (சிசு / கிஷோர் / தருண்) படிவத்தை" நிரப்பவும். ஆதார், பான் மற்றும் சாதி சான்றித்தாள் கட்டாயம்.',
      },
      {
        title: '2. ₹50,000 அருளுக்கான சான்று',
        body: 'பிஎம்-அஜய் அருள் ஒப்புதல் கடிதம் அல்லது பிடிஓஓ சரிபார் பை இணைக்கவும் — இதனால் எடுக்க வேண்டிய கடன் தொகை குறையும்.',
      },
      {
        title: '3. வணிகத் திட்டம் (Project Report)',
        body: '2-3 பக்கத் திட்டம் எழுதுங்கள்: என்ன உற்பத்தி செய்வீர்கள், மூலப்பொருள், இடம், மதிப்பிடப்பட்ட செலவு, சந்தை மற்றும் நிதி விவரங்கள்.',
      },
      {
        title: '4. வங்கி சரிபார் மற்றும் ஒப்புதல்',
        body: 'வங்கி உங்கள் மையம் / ODOP அலகிற்கு வந்து பின்னர் ஒப்புதல் அளிக்கும். முத்ரா கடன் ₹10 லட்சம் வரை நிரப்பல் இல்லாமல் ஒப்புதல் பெறலாம்.',
      },
      {
        title: '5. முதல் தவணை மற்றும் பயிற்சி',
        body: 'ஒப்புதலுக்குப் பிறகு முதல் தவணை கிடைத்தவுடன் வேலையையோ பயிற்சியையோ தொடங்குங்கள், பதிவேட்டுப் பதிவு செய்து வைத்துக்கொள்ளுங்கள்.',
      },
    ],
    pdfGenerating: 'ஆவணம் தயாராகிறது...',
    pdfRedownload: 'முன்மொழிவை மீண்டும் பதிவிறக்கவும்',
    pdfDownload: '₹50,000 வணிக முன்மொழிவைப் பதிவிறக்கவும்',
    legacyPath: 'பழைய அருள் வழியைத் திறக்கவும் (Micro-Finance)',
    backToDashboard: 'டாஷ்போர்டுக்குத் திரும்பவும்',
    lockedTitle: 'பயிற்சி முடிவுக்குப் பிந்தைய வழிகாட்டல்',
    lockedBody:
      'இந்த வழிகாட்டல் சான்றித்த மற்றும் முடிந்த பயிற்சியைக் கொண்ட பயனாளிகளுக்கு மட்டுமே (90+ நாட்கள்) திறக்கும். உங்கள் பயிற்சி இன்னும் நடக்கிறது — கீழே உள்ள பழைய அருள் வழியைப் பயன்படுத்துங்கள்.',
    lockedOpenLegacy: '₹50,000 அருள் வழியைத் திறக்கவும் (பழைய வழி)',
  },

  'te-IN': {
    screenTitle: 'శిక్షణ తరువాత మార్గదర్శకం',
    certifiedTrade: 'ధృవీకరించిన ట్రేడ్: %s (%s)',
    trainingCompleted: 'శిక్షణ పూర్తయింది: %s',
    listenAria: 'మార్గదర్శకం వినండి',
    previewNotice:
      '90 రోజులు పూర్తి కాలేదు — ఇది కేవలం ప్రివ్యూ మాత్రమే. పూర్తి 90 రోజుల తర్వాత ఈ మార్గదర్శకం తామ్మేతగా తెరుచుకుంటుంది.',
    promptLabel: 'ఏఐ వాయిస్ ప్రాంప్ట్ (Second Conversation Loop)',
    openerCombined: '%s — లేదా — %s',
    voiceAnswerHint: 'మాట్లాడండి లేదా కింద ఉన్న బటన్ నొక్కి సమాధానం ఇవ్వండి',
    voiceHeard: 'మీరు చెప్పింది: %s',
    voiceListening: 'వింటోంది...',
    answerByVoice: 'గొంతితో సమాధానం ఇవ్వండి',
    pathBusinessTitle: 'మార్గం A: మీ స్వంత వ్యాపారం ప్రారంభించండి',
    pathBusinessSub: '₹50,000 పీఎం-అజయ్ వ్యాపార ప్రతిపాదన + BDO సమర్పణ చెక్‌లిస్ట్',
    pathJobTitle: 'మార్గం B: ఉద్యోగం వెతకండి',
    pathJobSub: '%s జిల్లాలో మీ NSQF కోడ్ (%s) కు ధృవీకరించిన యజమానులు',
    pathMudraTitle: 'మార్గం C: పీఎం ముద్రా రుణం',
    pathMudraSub: '₹10 లక్షల వరకు — సబ్సిడీకి వెలుపల మూలధనం కోసం సమీప బ్యాంకు శాఖలో దరఖాస్తు చేసుకోండి',
    prompts: {
      business: 'మీరు మీ స్వంత వ్యాపారం ప్రారంభించాలనుకుంటున్నారా?',
      job: 'మీరు ఏ కంపెనీలో ఉద్యోగం వెతకాలనుకుంటున్నారా?',
      mudra: 'మీరు ముద్రా రుణం తీసుకొని వ్యాపారాన్ని పెంచాలనుకుంటున్నారా?',
    },
    autoFilledLabel: 'స్వయంగా నింపబడిన వివరాలు (Auto-Populated from Certification)',
    fieldBeneficiary: 'లబ్ధిదారు:',
    fieldTrade: 'ధృవీకరించిన ట్రేడ్:',
    fieldQp: 'QP కోడ్:',
    fieldDistrict: 'జిల్లా:',
    fieldGrant: 'సబ్సిడీ:',
    fieldVacancies: 'ఖాళీ పోసీలు',
    fieldWage: 'జీతం',
    fieldDistance: 'దూరం',
    checklistLabel: 'BDO కార్యాలయంలో సమర్పించే దశలు (Submission Checklist)',
    checklist: [
      {
        title: 'దశ 1: ప్రతిపాదనను సిద్ధం చేయండి',
        body: 'కింద ఉన్న బటన్ నొక్కి 1 పేజీ పీఎం-అజయ్ వ్యాపార ప్రతిపాదన (PDF) డౌన్‌లోడ్ చేయండి. మీ నమోదు వివరాలు మరియు ధృవీకరించిన NSQF ట్రేడ్ అందులో ఇప్పటికే నింపబడి ఉంటాయి.',
      },
      {
        title: 'దశ 2: ఆధార్ మరియు కుల ధృవీకరణ పత్రం',
        body: 'ఆధార్ కార్డు, ఎస్సీ సర్టిఫికెట్ మరియు బ్యాంకు పాస్‌బుక్ కాపీలను కలిపి ఉంచండి.',
      },
      {
        title: 'దశ 3: గ్రామ సహాయకుడి నుండి ధృవీకరణ',
        body: 'మీ గ్రామ సహాయకుడు / బ్లాక్ సిబ్బంది నుండి పత్రాలకు సర్టిఫికేషన్ (attestation) చేయించుకోండి.',
      },
      {
        title: 'దశ 4: BDO కార్యాలయంలో సమర్పించండి',
        body: 'ప్రతిపాదనను, ₹50,000 సబ్సిడీ కోసం నింపిన దరఖాస్తును, పైన పేర్కొన్న అన్ని ధృవీకరించిన కాపీలను బ్లాక్ డెవలప్మెంట్ ఆఫిసర్ (BDO) కార్యాలయంలో సమర్పించండి.',
      },
      {
        title: 'దశ 5: నమోదు మరియు సబ్సిడీ ట్రాకింగ్',
        body: 'సమర్పణ రసీదును మీ డాష్‌బోర్డ్‌లో సేవ్ చేయండి. సబ్సిడీ ఆమోదం మరియు డబ్బు బదిలీ స్థితి ఈ యాప్‌లోని గ్రాంట్ ట్రాకర్‌లో కనిపిస్తుంది.',
      },
    ],
    jobsLabel: 'ధృవీకరించిన స్థానిక యజమానులు (%s)',
    jobsLoading: 'ఉద్యోగాల జాబితా వెతుకుతోంది...',
    jobsError: 'ఉద్యోగాల జాబితా లోడ్ కాలేదు. ఇంటర్నెట్ కనెక్షన్ చూడండి.',
    jobsEmpty: 'ఈ జిల్లాలో మీ ట్రేడ్ కోసం ఇప్పుడు ధృవీకరించిన ఖాళీ పోసీలు లేవు.',
    jobsDataNotice:
      'ఈ జాబితా ప్రభుత్వ డేటా స్నాప్‌షాట్‌లోని శిక్షణ మరియు సర్టిఫికేషన్ సెంటర్ల నుండి తీసుకోబడినది. ఖాళీ పోసీల సంఖ్య లైవ్‌గా లేదు — యజమానిని నేరుగా కాల్ చేసి నిర్ధారించండి.',
    jobMatchCertified: 'ధృవీకరించిన NSQF సరిపోలిక',
    jobMatchRelated: 'జిల్లాకు సంబంధించిన అభ్యర్థన',
    jobCallCoordinator: 'సమన్వయకుడికి కాల్ చేయండి: %s',
    jobUnknownField: 'అందుబాటులో లేదు',
    reloadButton: 'జాబితాను మళ్ళీ లోడ్ చేయండి',
    mudraIntro:
      'పీఎం-అజయ్ ₹50,000 సబ్సిడీ తర్వాత కూడా వ్యాపారానికి మరిన్ని మూలధనం అవసరమైతే, ప్రధానమంత్రి ముద్రా యోజన పథకు గుర్తా ₹10 లక్షల వరకు రుణం కల్లెరల్ లేకుండా తీసుకోవచ్చు. సమీప బ్యాంకు శాఖలో లేదా BRC కేంద్రంలో దరఖాస్తు చేసుకోండి. పరిమాణాలు: శిశు ₹50,000 వరకు, కిశోర్ ₹50,001 నుండి ₹5 లక్షల వరకు, తరుణ్ ₹5,00,001 నుండి ₹10 లక్షల వరకు.',
    mudraSteps: [
      {
        title: '1. బ్యాంకు శాఖలో దరఖాస్తు',
        body: 'మీ సమీప బ్యాంకు లేదా BRC కేంద్రంలో "ప్రధానమంత్రి ముద్రా యోజన (శిశు / కిశోర్ / తరుణ్) ఫారం" నింపండి. ఆధార్, పాన్ మరియు కుల ధృవీకరణ పత్రం తప్పనిసరి.',
      },
      {
        title: '2. ₹50,000 సబ్సిడీ ఆధారం',
        body: 'పీఎం-అజయ్ సబ్సిడీ ఆమోద పత్రం లేదా BDO ధృవీకరణను జత చేయండి — ఫలితంగా తీసుకోవల్సిన రుణం తగ్గుతుంది.',
      },
      {
        title: '3. వ్యాపార ప్రణాళిక (Project Report)',
        body: '2-3 పేజీల ప్రణాళిక రాయండి: ఏం తయారు చేస్తారు, ముడి వస్తువు, స్థలం, అంచనా వ్యయం, మార్కెట్ మరియు ఆర్థిక వివరాలు.',
      },
      {
        title: '4. బ్యాంకు తనిఖీ మరియు ఆమోదం',
        body: 'బ్యాంకు మీ సెంటర్ / ODOP యూనిట్‌ను సందర్శించి ఆమోదం ఇస్తుంది. ముద్రా రుణం ₹10 లక్షల వరకు కల్లెరల్ లేకుండా ఆమోదించబడుతుంది.',
      },
      {
        title: '5. మొదటి వాయిదా మరియు శిక్షణ',
        body: 'ఆమోదం తర్వాత మొదటి వాయిదా వచ్చిన వెంటనే పని లేదా శిక్షణ ప్రారంభించండి మరియు రిజిస్టర్ నమోదు చేయించుకోండి.',
      },
    ],
    pdfGenerating: 'పత్రం సిద్ధమవుతోంది...',
    pdfRedownload: 'ప్రతిపాదనను మళ్ళీ డౌన్‌లోడ్ చేయండి',
    pdfDownload: '₹50,000 వ్యాపార ప్రతిపాదన డౌన్‌లోడ్ చేయండి',
    legacyPath: 'పాత సబ్సిడీ మార్గాన్ని తెరవండి (Micro-Finance)',
    backToDashboard: 'డాష్‌బోర్డ్‌కు తిరిగి వెళ్లండి',
    lockedTitle: 'శిక్షణ తరువాత మార్గదర్శకం',
    lockedBody:
      'ఈ మార్గదర్శకం ధృవీకరించిన మరియు పూర్తి శిక్షణ (90+ రోజులు) ఉన్న లబ్ధిదారులకు మాత్రమే తెరుచుకుంటుంది. మీ శిక్షణ ఇంకా కొనసాగుతోంది — కింద ఉన్న పాత సబ్సిడీ మార్గాన్ని ఉపయోగించండి.',
    lockedOpenLegacy: '₹50,000 సబ్సిడీ మార్గాన్ని తెరవండి (పాత మార్గం)',
  },

  'mr-IN': {
    screenTitle: 'प्रशिक्षणानंतर मार्गदर्शन',
    certifiedTrade: 'प्रमाणित ट्रेड: %s (%s)',
    trainingCompleted: 'प्रशिक्षण पूर्ण: %s',
    listenAria: 'मार्गदर्शन ऐका',
    previewNotice:
      '90 दिवसांचा कालावधी पूर्ण झालेला नाही — हे फक्त पूर्वावलोकन (preview) आहे. पूर्ण 90 दिवसांनंतर हे मार्गदर्शन आपोआप उघडेल.',
    promptLabel: 'एआय व्हॉइस प्रॉम्प्ट (Second Conversation Loop)',
    openerCombined: '%s — किंवा — %s',
    voiceAnswerHint: 'बोलून किंवा खालील बटण दाबून उत्तर द्या',
    voiceHeard: 'तुम्ही म्हणालात: %s',
    voiceListening: 'ऐकत आहे...',
    answerByVoice: 'बोलून उत्तर द्या',
    pathBusinessTitle: 'मार्ग A: तुमचा स्वतःचा व्यवसाय सुरू करा',
    pathBusinessSub: '₹50,000 पीएम-अजय व्यवसाय प्रस्ताव + बीडीओ जमा चेकलिस्ट',
    pathJobTitle: 'मार्ग B: नौकरी शोधा',
    pathJobSub: '%s जिल्ह्यात तुमच्या NSQF कोडसाठी (%s) सत्यापित मालक',
    pathMudraTitle: 'मार्ग C: पीएम मुद्रा कर्ज',
    pathMudraSub: '₹10 लाखांपर्यंत — अनुदानाबाहेरील भांडवलासाठी जवळच्या बँक शाखेत अर्ज करा',
    prompts: {
      business: 'तुम्हाला स्वतःचा व्यवसाय सुरू करायचा आहे का?',
      job: 'तुम्हाला कोणत्याही कंपनीत नौकरी हवी आहे का?',
      mudra: 'तुम्हाला मुद्रा कर्ज घेऊन व्यवसाय वाढवायचा आहे का?',
    },
    autoFilledLabel: 'स्वतः भरलेली माहिती (Auto-Populated from Certification)',
    fieldBeneficiary: 'लाभार्थी:',
    fieldTrade: 'प्रमाणित ट्रेड:',
    fieldQp: 'QP कोड:',
    fieldDistrict: 'जिल्हा:',
    fieldGrant: 'अनुदान:',
    fieldVacancies: 'रिक्त पदे',
    fieldWage: 'वेतन',
    fieldDistance: 'अंतर',
    checklistLabel: 'बीडीओकडे प्रत्यक्ष जमा करण्याच्या पायऱ्या (Submission Checklist)',
    checklist: [
      {
        title: 'पायरी 1: प्रस्ताव तयार करा',
        body: 'खालील बटण दाबून 1-पानी पीएम-अजय व्यवसाय प्रस्ताव (PDF) डाउनलोड करा. त्यात तुमची नोंदणीकृत माहिती आणि प्रमाणित NSQF ट्रेड आधीच भरलेली असेल.',
      },
      {
        title: 'पायरी 2: आधार आणि जात प्रमाणपत्र',
        body: 'आधार कार्ड, अनुसूचित जात प्रमाणपत्र आणि बँक पासबुकच्या स्कॅन प्रती एकत्र ठेवा.',
      },
      {
        title: 'पायरी 3: ग्राम सहाय्यकाकडून तपासणी',
        body: 'तुमच्या ग्राम सहाय्यकाकडून / कार्यालयीन कर्मचाऱ्याकडून कागदपत्रांचे प्रमाणीकरण (attestation) करून घ्या.',
      },
      {
        title: 'पायरी 4: बीडीओ कार्यालयात प्रत्यक्ष जमा करा',
        body: 'प्रस्ताव, ₹50,000 अनुदानासाठी भरलेला अर्ज आणि वरील सर्व प्रमाणित प्रती ब्लॉक विकास अधिकारी (BDO) यांच्या कार्यालयात जमा करा.',
      },
      {
        title: 'पायरी 5: नोंदणी आणि अनुदान मागोवा',
        body: 'जमा केलेली पावती तुमच्या डॅशबोर्डवर जतन करा. अनुदान मंजुरी आणि रक्कम हस्तांतरणाची स्थिती याच ॲपच्या ग्रंट ट्रॅकरमध्ये दिसते.',
      },
    ],
    jobsLabel: 'सत्यापित स्थानिक मालक (%s)',
    jobsLoading: 'नौकरी यादी शोधत आहे...',
    jobsError: 'नौकरी यादी लोड होऊ शकली नाही. इंटरनेट कनेक्शन तपासा.',
    jobsEmpty: 'या जिल्ह्यात तुमच्या ट्रेडसाठी सध्या सत्यापित रिक्त जागा नाहीत.',
    jobsDataNotice:
      'ही यादी सरकारी डेटा स्रोताच्या एका स्थिर स्नॅपशॉटमधून घेतलेल्या प्रशिक्षण व प्रमाणन केंद्रांची आहे. रिक्त जागांची थेट माहिती उपलब्ध नाही — मालकाला थेट फोन करून खात्री करा.',
    jobMatchCertified: 'प्रमाणित NSQF जुळणी',
    jobMatchRelated: 'जिल्ह्याशी संबंधित मागणी',
    jobCallCoordinator: 'समन्वयकाला फोन करा: %s',
    jobUnknownField: 'उपलब्ध नाही',
    reloadButton: 'यादी पुन्हा लोड करा',
    mudraIntro:
      'पीएम-अजय ₹50,000 अनुदानानंतरही व्यवसायासाठी अधिक भांडवल हवे असल्यास, प्रधानमंत्री मुद्रा योजनेअंतर्गत ₹10 लाखांपर्यंतचे कर्ज कोलेटरलशिवाय घेता येते. जवळच्या बँक शाखेत किंवा BRC केंद्रात अर्ज करा. श्रेण्या: शिशु ₹50,000 पर्यंत, किशोर ₹50,001 ते ₹5 लाख, तरुण ₹5,00,001 ते ₹10 लाख.',
    mudraSteps: [
      {
        title: '1. बँक शाखेत अर्ज',
        body: 'जवळच्या बँक / बीआरसी केंद्रात "प्रधानमंत्री मुद्रा योजना (शिशू / किशोर / तरुण) फॉर्म" भरा. आधार, पॅन आणि जात प्रमाणपत्र अनिवार्य आहेत.',
      },
      {
        title: '2. ₹50,000 अनुदानाचा पुरावा',
        body: 'पीएम-अजय अनुदान मंजुरी पत्र किंवा बीडीओ तपासणी जोडा — यामुळे घ्यावयाची कर्ज रक्कम कमी होते.',
      },
      {
        title: '3. व्यवसाय योजना (Project Report)',
        body: '2-3 पानांची योजना लिहा: उत्पादन, कच्चा माल, जागा, अंदाजित खर्च, बाजार आणि आर्थिक तपशील.',
      },
      {
        title: '4. बँक तपासणी आणि मंजुरी',
        body: 'बँक तुमच्या केंद्र / ODOP युनिटला भेट देऊन मंजुरी देते. मुद्रा कर्ज ₹10 लाखांपर्यंत, कोलेटरलशिवाय मंजूर होऊ शकते.',
      },
      {
        title: '5. पहिला हप्ता आणि प्रशिक्षण',
        body: 'मंजुरीनंतर पहिला हप्ता मिळताच काम किंवा प्रशिक्षण सुरू करा आणि नोंदणीकरण करून घ्या.',
      },
    ],
    pdfGenerating: 'दस्तऐवज तयार होत आहे...',
    pdfRedownload: 'प्रस्ताव पुन्हा डाउनलोड करा',
    pdfDownload: '₹50,000 व्यवसाय प्रस्ताव डाउनलोड करा',
    legacyPath: 'जुने अनुदान मार्ग उघडा (Micro-Finance)',
    backToDashboard: 'डॅशबोर्डवर परत जा',
    lockedTitle: 'प्रशिक्षणानंतर मार्गदर्शन',
    lockedBody:
      'हे मार्गदर्शन फक्त प्रमाणित आणि पूर्ण प्रशिक्षण (90+ दिवस) असलेल्या लाभार्थ्यांसाठीच उघडते. तुमचे प्रशिक्षण अजून सुरू आहे — खालील जुना अनुदान मार्ग वापरा.',
    lockedOpenLegacy: '₹50,000 अनुदान मार्ग उघडा (जुना मार्ग)',
  },

  'bn-IN': {
    screenTitle: 'প্রশিক্ষণ-পরবর্তী নির্দেশনা',
    certifiedTrade: 'স্বীকৃত ট্রেড: %s (%s)',
    trainingCompleted: 'প্রশিক্ষণ সম্পন্ন: %s',
    listenAria: 'নির্দেশনা শুনুন',
    previewNotice:
      '90 দিন শেষ হয়নি — এটি শুধু একটি প্রিভিউ। পূর্ণ 90 দিন পর এই নির্দেশনা নিজে থেকেই খুলবে।',
    promptLabel: 'এআই ভয়েস প্রম্পট (Second Conversation Loop)',
    openerCombined: '%s — অথবা — %s',
    voiceAnswerHint: 'কথা বলে অথবা নিচের বাটনে চেপে উত্তর দিন',
    voiceHeard: 'আপনি বলেছেন: %s',
    voiceListening: 'শুনছি...',
    answerByVoice: 'কথা বলে উত্তর দিন',
    pathBusinessTitle: 'পথ A: নিজের ব্যবসা শুরু করুন',
    pathBusinessSub: '₹50,000 পিএম-অজয় ব্যবসা প্রস্তাব + বিডিও জমা চেকলিস্ট',
    pathJobTitle: 'পথ B: চাকরি খুঁজুন',
    pathJobSub: '%s জেলায় আপনার NSQF কোডের (%s) জন্য যাচাই করা মালিক',
    pathMudraTitle: 'পথ C: পিএম মুদ্রা ঋণ',
    pathMudraSub: '₹10 লক্ষ পর্যন্ত — অনুদানের বাইরের মূলধনের জন্য নিকটতম ব্যাংক শাখায় আবেদন করুন',
    prompts: {
      business: 'আপনি কি নিজের ব্যবসা শুরু করতে চান?',
      job: 'আপনি কি কোনো কোম্পানিতে চাকরি খুঁজতে চান?',
      mudra: 'আপনি কি মুদ্রা ঋণ নিয়ে ব্যবসা বড় করতে চান?',
    },
    autoFilledLabel: 'স্বয়ংক্রিয়ভাবে পূরণ করা তথ্য (Auto-Populated from Certification)',
    fieldBeneficiary: 'উপভোক্তা:',
    fieldTrade: 'স্বীকৃত ট্রেড:',
    fieldQp: 'QP কোড:',
    fieldDistrict: 'জেলা:',
    fieldGrant: 'অনুদান:',
    fieldVacancies: 'খালি পদ',
    fieldWage: 'মজুরি',
    fieldDistance: 'দূরত্ব',
    checklistLabel: 'বিডিও-এর কাছে সরাসরি জমা দেওয়ার ধাপ (Submission Checklist)',
    checklist: [
      {
        title: 'ধাপ 1: প্রস্তাব তৈরি করুন',
        body: 'নিচের বাটনে চেপে 1-পৃষ্ঠার পিএম-অজয় ব্যবসা প্রস্তাব (PDF) ডাউনলোড করুন। এতে আপনার নিবন্ধিত তথ্য ও স্বীকৃত NSQF ট্রেড আগেই ভরা থাকবে।',
      },
      {
        title: 'ধাপ 2: আধার ও জাতি প্রমাণপত্র',
        body: 'আধার কার্ড, অনুষ্ণিজাতি প্রমাণপত্র ও ব্যাংক পাসবইয়ের স্ক্যান কপি একসাথে রাখুন।',
      },
      {
        title: 'ধাপ 3: গ্রাম সহায়কের কাছে যাচাই',
        body: 'আপনার গ্রাম সহায়ক / ব্লক কর্মচারীর কাছে কাগজগুলোর সত্যায়ন (attestation) করান।',
      },
      {
        title: 'ধাপ 4: বিডিও দপ্তরে সরাসরি জমা',
        body: 'প্রস্তাব, ₹50,000 অনুদানের জন্য পূরণ করা আবেদন এবং উপরের সব স্বীকৃত কপি ব্লক ডেভেলপমেন্ট অফিসার (BDO)-এর দপ্তরে জমা দিন।',
      },
      {
        title: 'ধাপ 5: নিবন্ধন ও অনুদান ট্র্যাকিং',
        body: 'জমার রসিদ আপনার ড্যাশবোর্ডে সেভ করুন। অনুদান অনুমোদন ও টাকা হস্তান্তরের অবস্থা এই অ্যাপের গ্রান্ট ট্র্যাকারে দেখা যায়।',
      },
    ],
    jobsLabel: 'যাচাই করা স্থানীয় মালিক (%s)',
    jobsLoading: 'চাকরির তালিকা খোঁজা হচ্ছে...',
    jobsError: 'চাকরির তালিকা লোড করা যায়নি। ইন্টারনেট সংযোগ দেখুন।',
    jobsEmpty: 'এই জেলায় আপনার ট্রেডের জন্য এখন কোনো যাচাই করা খালি পদ নেই।',
    jobsDataNotice:
      'এই তালিকা সরকারি ডেটার একটি নির্দিষ্ট স্ন্যাপশট থেকে নেওয়া প্রশিক্ষণ ও সার্টিফিকেশন কেন্দ্রের তালিকা। খালি পদের সরাসরি সংখ্যা পাওয়া যায় না — মালিককে সরাসরি ফোন করে নিশ্চিত করুন।',
    jobMatchCertified: 'স্বীকৃত NSQF ম্যাচ',
    jobMatchRelated: 'জেলা-সংক্রান্ত চাহিদা',
    jobCallCoordinator: 'সমন্বয়ককে ফোন করুন: %s',
    jobUnknownField: 'পাওয়া যাচ্ছে না',
    reloadButton: 'তালিকা আবার লোড করুন',
    mudraIntro:
      'পিএম-অজয় ₹50,000 অনুদানের পরও ব্যবসার জন্য বেশি মূলধন লাগলে প্রধানমন্ত্রী মুদ্রা যোজনার অধীনে ₹10 লক্ষ পর্যন্ত ঋণ কোনো কলেটারেল ছাড়াই নেওয়া যায়। নিকটতম ব্যাংক শাখা বা BRC কেন্দ্রে আবেদন করুন। স্তর: শিশু ₹50,000 পর্যন্ত, কিশোর ₹50,001 থেকে ₹5 লক্ষ পর্যন্ত, তরুণ ₹5,00,001 থেকে ₹10 লক্ষ পর্যন্ত।',
    mudraSteps: [
      {
        title: '1. ব্যাংক শাখায় আবেদন',
        body: 'নিকটতম ব্যাংক বা BRC কেন্দ্রে "প্রধানমন্ত্রী মুদ্রা যোজনা (শিশু / কিশোর / তরুণ) ফর্ম" পূরণ করুন। আধার, প্যান ও জাতি প্রমাণপত্র আবশ্যক।',
      },
      {
        title: '2. ₹50,000 অনুদানের প্রমাণ',
        body: 'পিএম-অজয় অনুদান অনুমোদনপত্র বা বিডিও সত্যায়ন সংযুক্ত করুন — এতে ঋণের পরিমাণ কমে যায়।',
      },
      {
        title: '3. ব্যবসার পরিকল্পনা (Project Report)',
        body: '2-3 পৃষ্ঠার পরিকল্পনা লিখুন: কী তৈরি হবে, কাঁচামাল, জায়গা, আনুমানিক খরচ, বাজার এবং আর্থিক বিবরণ।',
      },
      {
        title: '4. ব্যাংক যাচাই ও অনুমোদন',
        body: 'ব্যাংক আপনার কেন্দ্র বা ODOP ইউনিট পরিদর্শন করে অনুমোদন দেয়। মুদ্রা ঋণ ₹10 লক্ষ পর্যন্ত কোনো কলেটারেল ছাড়াই অনুমোদিত হতে পারে।',
      },
      {
        title: '5. প্রথম কিস্তি ও প্রশিক্ষণ',
        body: 'অনুমোদনের পর প্রথম কিস্তি পেলেই কাজ বা প্রশিক্ষণ শুরু করুন এবং রেজিস্টার নিবন্ধন করান।',
      },
    ],
    pdfGenerating: 'নথি তৈরি হচ্ছে...',
    pdfRedownload: 'প্রস্তাব আবার ডাউনলোড করুন',
    pdfDownload: '₹50,000 ব্যবসা প্রস্তাব ডাউনলোড করুন',
    legacyPath: 'পুরোনো অনুদান পথ খুলুন (Micro-Finance)',
    backToDashboard: 'ড্যাশবোর্ডে ফিরে যান',
    lockedTitle: 'প্রশিক্ষণ-পরবর্তী নির্দেশনা',
    lockedBody:
      'এই নির্দেশনা কেবল স্বীকৃত ও সম্পূর্ণ প্রশিক্ষণ (90+ দিন) থাকা উপভোক্তাদের জন্যই খোলে। আপনার প্রশিক্ষণ এখনও চলছে — নিচে দেওয়া পুরোনো অনুদান পথটি ব্যবহার করুন।',
    lockedOpenLegacy: '₹50,000 অনুদান পথ খুলুন (পুরোনো পথ)',
  },
};

/** Returns the copy for `lang`, falling back to Hindi when the code is unknown. */
export function getPostTrainingCopy(lang: LanguageCode): PostTrainingCopy {
  return POST_TRAINING_COPY[lang] ?? POST_TRAINING_COPY['hi-IN'];
}
