import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { GramSahayakAvatar } from '../components/Avatar/GramSahayakAvatar';
import { MicIcon, SpeakerIcon, AlertIcon } from '../components/Icons';
import { speechService } from '../services/speech';
import { WaveformVisualizer } from '../services/audioWaveform';
import { processVoiceTranscript, localFallbackProcess } from '../services/api';
import { getUiText } from '../services/translations';
import { LanguageCode } from '../types';
import { packStateManager } from '../services/modelPackManager';

const DISTRICTS = [
  { id: 'Varanasi', name: 'वाराणसी (Varanasi, UP)' },
  { id: 'Gorakhpur', name: 'गोरखपुर (Gorakhpur, UP)' },
  { id: 'Jhansi', name: 'झांसी (Jhansi, UP)' },
  { id: 'Patna', name: 'पटना (Patna, Bihar)' }
];

export const VoiceChatScreen: React.FC = () => {
  const { 
    selectedLanguage,
    selectedDistrict, 
    setDistrict, 
    saveInterviewResult, 
    setScreen,
    isOnline
  } = useApp();

  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [spokenPrompt, setSpokenPrompt] = useState('आपको किस काम का अनुभव है? आप क्या नया काम शुरू करना चाहते हैं?');
  const [lastAIResponse, setLastAIResponse] = useState<string | null>(null);
  const [packState] = useState(() => packStateManager.getState(selectedLanguage || 'hi-IN'));

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const waveformRef = useRef<WaveformVisualizer | null>(null);

  const DISTRICT_AUDIO_PROMPT = "नमस्ते! कृपया स्क्रीन पर दिए गए सूची से अपना ज़िला (district) चुनें।";
    // Initial welcome greeting when screen loads
  useEffect(() => {
    waveformRef.current = new WaveformVisualizer();

    const welcomeGreeting = selectedLanguage === 'ta-IN'
      ? 'வணக்கம்! நான் உங்கள் பிஎம்-அஜய் கிராம உதவியாளர். எந்த வேலை கற்க விரும்புகிறீர்கள்?'
      : selectedLanguage === 'te-IN'
      ? 'నమస్కారం! నేను మీ పిఎం-అజయ్ గ్రామ సహాయకుడిని. మీరు ఏ పని నేర్చుకోవాలి?'
      : selectedLanguage === 'mr-IN'
      ? 'नमस्कार! मी तुमचा पीएम-अजय ग्राम सहाय्यक आहे. तुम्हाला कोणत्या कामाचा अनुभव आहे?'
      : selectedLanguage === 'bn-IN'
      ? 'নমস্কার! আমি আপনার পিএম-অজয় গ্রাম সহায়ক। আপনি কোন কাজ শিখতে চান?'
      : selectedLanguage.includes('bho')
      ? 'राम राम भाई! हम आपके ग्राम सहायक बानी। रउवा कवन काम के अनुभव बा? खुल के बोलीं।'
      : selectedLanguage.includes('bun')
      ? 'राम राम भइया! हम आपके ग्राम सहायक हैं। आप बताओ कौन सो काम सीखवे की इच्छा है?'
      : selectedLanguage.includes('chg')
      ? 'जय जोहार संगी! मैं तोर ग्राम सहायक आंव। तंय कोन काम सीखे बर चाहत हस?'
      : selectedLanguage.includes('mai')
      ? 'प्रणाम! हम अहांक ग्राम सहायक छी। अहां कोन काज मे आगां बढ़य चाहैत छी?'
      : 'नमस्ते! मैं आपका पीएम-अजय ग्राम सहायक हूँ। आपको किस काम का अनुभव है? बेझिझक बोलें।';

    setSpokenPrompt(welcomeGreeting);

    const districtTimer = setTimeout(() => {
      speechService.speak(
        DISTRICT_AUDIO_PROMPT,
        selectedLanguage,
        () => {},
        () => {
          speechService.speak(
            welcomeGreeting,
            selectedLanguage,
            () => setIsSpeaking(true),
            () => setIsSpeaking(false)
          );
        }
      );
    }, 300);

    return () => {
      clearTimeout(districtTimer);
      speechService.stopSpeaking();
      speechService.stopListening();
      if (waveformRef.current) {
        waveformRef.current.stop();
      }
    };
  }, [selectedLanguage]);

  // Handle Big Mic Button Tap
  const handleToggleRecord = () => {
    if (isProcessing) return;

    if (isRecording) {
      handleStopRecord();
    } else {
      handleStartRecord();
    }
  };

  const handleStartRecord = async () => {
    setErrorMessage(null);
    setTranscript('');
    speechService.stopSpeaking();
    setIsSpeaking(false);

    if (canvasRef.current && waveformRef.current) {
      waveformRef.current.start(canvasRef.current);
    }

    // VAD is now listening; isRecording becomes true when VAD detects speech
    await speechService.startListening(
      selectedLanguage,
      (text: string, isFinal: boolean) => {
        setTranscript(text);
        if (isFinal) {
          handleSpeechCompleted(text);
        }
      },
      (err: string) => {
        setErrorMessage(err);
        setIsRecording(false);
        if (waveformRef.current) waveformRef.current.stop();
      },
      () => {
        setIsRecording(false);
        if (waveformRef.current) waveformRef.current.stop();
      },
      // onSpeechStart: VAD fires this when it detects the user begins speaking
      () => {
        setIsRecording(true);
        if (canvasRef.current && waveformRef.current) {
          waveformRef.current.start(canvasRef.current);
        }
      }
    );

    // Show "listening" state (VAD active but not yet speaking)
    setIsRecording(true);
  };

  const handleStopRecord = async () => {
    setIsRecording(false);
    await speechService.stopListening();
    if (waveformRef.current) {
      waveformRef.current.stop();
    }
    // ASR result arrives via onResult callback in handleStartRecord
    // which calls handleSpeechCompleted when isFinal is true
  };


  // Process Completed Speech Transcript
  const handleSpeechCompleted = async (spokenText: string) => {
    setIsRecording(false);
    if (waveformRef.current) {
      waveformRef.current.stop();
    }

      if (!spokenText || spokenText.trim().length < 2) {
      setErrorMessage(uiTexts.noAudio);
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const data = await processVoiceTranscript(
        spokenText,
        selectedDistrict,
        "Uttar Pradesh",
        selectedLanguage
      );

      setLastAIResponse(data.friendlyAudioResponse);
      setSpokenPrompt(data.friendlyAudioResponse);

      // Playback Empathetic Response per Developer Guide §3 Screen 2
      speechService.speak(
        data.friendlyAudioResponse,
        selectedLanguage,
        () => setIsSpeaking(true),
        async () => {
          setIsSpeaking(false);
          // Save and navigate to Screen 3 (NSQF Skill Profile)
          await saveInterviewResult(data, spokenText);
          setScreen('nsqf-profile');
        }
      );
    } catch (err: any) {
      setErrorMessage(null);
      try {
        const fallbackResult = localFallbackProcess(spokenText, selectedDistrict, selectedLanguage);
        setLastAIResponse(fallbackResult.friendlyAudioResponse);
        setSpokenPrompt(fallbackResult.friendlyAudioResponse);
        speechService.speak(
          fallbackResult.friendlyAudioResponse,
          selectedLanguage,
          () => setIsSpeaking(true),
          async () => {
            setIsSpeaking(false);
            await saveInterviewResult(fallbackResult, spokenText);
            setScreen('nsqf-profile');
          }
        );
      } catch (fallbackErr) {
        setErrorMessage("सर्वर से उत्तर प्राप्त नहीं हुआ। कृपया दोबारा प्रयास करें।");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Replay Last Spoken Audio
  const handleReplayAudio = async () => {
    if (!spokenPrompt) return;
    await speechService.speak(
      spokenPrompt,
      selectedLanguage,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false)
    );
  };

  // Quick preset voice responses (beneficiary sample phrases)
  const handleSamplePhrase = (text: string) => {
    setTranscript(text);
    handleSpeechCompleted(text);
  };

  const uiTexts = {
    districtLabel: getUiText(selectedLanguage as LanguageCode, 'districtLabel'),
    tapToSpeak: getUiText(selectedLanguage as LanguageCode, 'tapToSpeak'),
    listening: getUiText(selectedLanguage as LanguageCode, 'listening'),
    processing: getUiText(selectedLanguage as LanguageCode, 'processing'),
    transcriptLabel: getUiText(selectedLanguage as LanguageCode, 'transcriptLabel'),
    transcriptPlaceholder: getUiText(selectedLanguage as LanguageCode, 'transcriptPlaceholder'),
    samplePhrases: getUiText(selectedLanguage as LanguageCode, 'samplePhrases'),
    replayAudio: getUiText(selectedLanguage as LanguageCode, 'replayAudio'),
    stopRecording: getUiText(selectedLanguage as LanguageCode, 'stopRecording'),
    noAudio: getUiText(selectedLanguage as LanguageCode, 'noAudioDetected'),
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-5 items-center text-center">
      {/* Top District Selector */}
      <div className="w-full flex items-center justify-between text-xs text-ink-muted mb-2">
        <label htmlFor="district-select" className="font-caption">
          {uiTexts.districtLabel}
        </label>
        <select
          id="district-select"
          value={selectedDistrict}
          onChange={(e) => setDistrict(e.target.value)}
          className="bg-surface border border-line rounded px-2 py-1 text-ink text-xs focus:outline-trust"
        >
          {DISTRICTS.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {/* Mode Indicator (E23) — Local vs Enhanced */}
      <div className="flex items-center justify-center mb-2">
        <span className={`mode-badge ${isOnline && packState !== 'ready' ? 'mode-enhanced' : packState === 'ready' ? 'mode-local' : 'mode-enhanced'}`}>
          {isOnline && packState !== 'ready' ? 'Enhanced' : packState === 'ready' ? 'Local' : 'Enhanced'}
        </span>
      </div>

      {/* Illustrated Gram Sahayak Avatar per design.md §5 */}
      <div className="my-2 flex flex-col items-center">
        <GramSahayakAvatar isSpeaking={isSpeaking} size={118} />
      </div>

      {/* Spoken-Question Echo (Body Scale 18px per design.md §3 & §4) */}
      <div className="w-full max-w-[400px] my-2 bg-surface/80 rounded-card p-3 border border-line/60">
        <p className="font-body text-ink text-base sm:text-lg leading-relaxed font-medium">
          "{spokenPrompt}"
        </p>
        <button
          onClick={handleReplayAudio}
          className="mt-2 inline-flex items-center space-x-1.5 text-xs text-trust hover:text-trust/80 font-semibold cursor-pointer"
          aria-label="फिर से सुनें"
        >
          <SpeakerIcon size={16} color="#009378" />
          <span>फिर से सुनें (Listen again)</span>
        </button>
      </div>

      {/* Big Circular Microphone Button (96px, color-action #FC8A15 per design.md §4 & §5) */}
      <div className="my-3 flex flex-col items-center">
        <button
          onClick={handleToggleRecord}
          disabled={isProcessing}
           aria-label={isRecording ? uiTexts.stopRecording : uiTexts.tapToSpeak}
          className={`btn-mic ${isRecording ? 'recording' : ''} ${
            isProcessing ? 'opacity-60 cursor-wait' : 'hover:opacity-95'
          }`}
        >
          <MicIcon size={44} color="#F6F6F6" />
        </button>
        <span className="font-caption text-ink font-semibold mt-3 text-sm">
          {isProcessing
             ? uiTexts.processing
             : isRecording
             ? uiTexts.listening
             : uiTexts.tapToSpeak}
        </span>
      </div>

      {/* Live Waveform Visualizer per design.md §4 & §6 */}
      <div className="w-full max-w-[280px] h-[36px] my-1 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={280}
          height={36}
          className={`w-full h-full ${isRecording ? 'opacity-100' : 'opacity-20'} transition-opacity`}
        />
      </div>

      {/* Live Transcript Display Box */}
      <div className="w-full max-w-[420px] min-h-[64px] rounded-card border border-line bg-white/70 p-3 text-left">
         <span className="font-caption text-xs text-ink-muted block mb-1">
           {uiTexts.transcriptLabel}
         </span>
         <p className="text-sm sm:text-base text-ink italic leading-snug">
           {transcript ? `"${transcript}"` : uiTexts.transcriptPlaceholder}
         </p>
      </div>

      {/* Error / Alert feedback */}
      {errorMessage && (
        <div className="w-full max-w-[420px] mt-2 p-2.5 rounded border border-alert/30 bg-alert/10 flex items-center space-x-2 text-left">
          <AlertIcon size={18} color="#C6482E" />
          <span className="text-xs text-alert font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Rural Sample Voice Prompts (Quick taps for testing/zero-typing) */}
      <div className="w-full max-w-[420px] mt-3 pt-3 border-t border-line text-left">
        <span className="font-caption text-xs text-ink-muted block mb-1.5 font-medium">
           {uiTexts.samplePhrases}
        </span>
        <div className="flex flex-col space-y-1.5">
          <button
            onClick={() => handleSamplePhrase("मेरा नाम रमेश है, मैं गांव में बिजली का काम करता हूँ और सोलर सीखना चाहता हूँ।")}
            className="text-left text-xs p-2 rounded border border-line hover:border-trust bg-white text-ink active:bg-surface"
          >
            "मेरा नाम रमेश है, मैं गांव में बिजली का काम करता हूँ और सोलर सीखना चाहता हूँ।"
          </button>
          <button
            onClick={() => handleSamplePhrase("हमार नाम श्यामू बा, हम गाय भैंस पालेनी और डेयरी के व्यवसाय बढ़ावे के बा।")}
            className="text-left text-xs p-2 rounded border border-line hover:border-trust bg-white text-ink active:bg-surface"
          >
            "हमार नाम श्यामू बा, हम गाय भैंस पालेनी और डेयरी के व्यवसाय बढ़ावे के बा।"
          </button>
          <button
            onClick={() => handleSamplePhrase("मेरा नाम रीता है, मैं साड़ी पर जरी जरदोजी और सिलाई का काम करती हूँ।")}
            className="text-left text-xs p-2 rounded border border-line hover:border-trust bg-white text-ink active:bg-surface"
          >
            "मेरा नाम रीता है, मैं साड़ी पर जरी जरदोजी और सिलाई का काम करती हूँ।"
          </button>
        </div>
      </div>
    </div>
  );
};
