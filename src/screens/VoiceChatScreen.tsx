import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { GramSahayakAvatar } from '../components/Avatar/GramSahayakAvatar';
import { MicIcon, SpeakerIcon, AlertIcon } from '../components/Icons';
import { speechService } from '../services/speech';
import { WaveformVisualizer } from '../services/audioWaveform';
import { processVoiceTranscript } from '../services/api';

const DISTRICTS = [
  { id: 'Varanasi', name: 'वाराणसी (Varanasi, UP)' },
  { id: 'Gorakhpur', name: 'गोरखपुर (Gorakhpur, UP)' },
  { id: 'Bundelkhand', name: 'झांसी / बुंदेलखंड (Jhansi, UP)' },
  { id: 'Patna', name: 'पटना (Patna, Bihar)' }
];

export const VoiceChatScreen: React.FC = () => {
  const { 
    selectedLanguage, 
    selectedDistrict, 
    setDistrict, 
    saveInterviewResult, 
    setScreen 
  } = useApp();

  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [spokenPrompt, setSpokenPrompt] = useState('आपको किस काम का अनुभव है? आप क्या नया काम शुरू करना चाहते हैं?');
  const [lastAIResponse, setLastAIResponse] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const waveformRef = useRef<WaveformVisualizer | null>(null);

  // Initial welcome greeting when screen loads
  useEffect(() => {
    waveformRef.current = new WaveformVisualizer();

    const welcomeGreeting = selectedLanguage.includes('bho')
      ? 'राम राम भाई! हम आपके ग्राम सहायक बानी। रउवा कवन काम के अनुभव बा? खुल के बोलीं।'
      : selectedLanguage.includes('bun')
      ? 'राम राम भइया! हम आपके ग्राम सहायक हैं। आप बताओ कौन सो काम सीखवे की इच्छा है?'
      : 'नमस्ते! मैं आपका पीएम-अजय ग्राम सहायक हूँ। आपको किस काम का अनुभव है? बेझिझक बताएं।';

    setSpokenPrompt(welcomeGreeting);

    // Give a short gentle audio prompt
    const timer = setTimeout(() => {
      speechService.speak(
        welcomeGreeting, 
        selectedLanguage,
        () => setIsSpeaking(true),
        () => setIsSpeaking(false)
      );
    }, 600);

    return () => {
      clearTimeout(timer);
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

  const handleStartRecord = () => {
    setErrorMessage(null);
    setTranscript('');
    speechService.stopSpeaking();
    setIsSpeaking(false);

    if (canvasRef.current && waveformRef.current) {
      waveformRef.current.start(canvasRef.current);
    }

    setIsRecording(true);

    speechService.startListening(
      selectedLanguage,
      (text: string, isFinal: boolean) => {
        setTranscript(text);
        if (isFinal) {
          handleSpeechCompleted(text);
        }
      },
      (err: string) => {
        setErrorMessage(err);
        handleStopRecord();
      },
      () => {
        setIsRecording(false);
        if (waveformRef.current) {
          waveformRef.current.stop();
        }
      }
    );
  };

  const handleStopRecord = () => {
    setIsRecording(false);
    speechService.stopListening();
    if (waveformRef.current) {
      waveformRef.current.stop();
    }

    if (transcript.trim().length > 3) {
      handleSpeechCompleted(transcript);
    }
  };

  // Process Completed Speech Transcript
  const handleSpeechCompleted = async (spokenText: string) => {
    setIsRecording(false);
    if (waveformRef.current) {
      waveformRef.current.stop();
    }

    if (!spokenText || spokenText.trim().length < 2) {
      setErrorMessage("कोई आवाज सुनाई नहीं दी। कृपया बटन दबाकर दोबारा बोलें।");
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
      setErrorMessage("सर्वर से उत्तर प्राप्त नहीं हुआ। कृपया दोबारा प्रयास करें।");
    } finally {
      setIsProcessing(false);
    }
  };

  // Replay Last Spoken Audio
  const handleReplayAudio = () => {
    if (!spokenPrompt) return;
    speechService.speak(
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

  return (
    <div className="flex-1 flex flex-col justify-between p-5 items-center text-center">
      {/* Top District Selector */}
      <div className="w-full flex items-center justify-between text-xs text-ink-muted mb-2">
        <label htmlFor="district-select" className="font-caption">
          जिले का चयन करें:
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
          aria-label={isRecording ? "रिकॉर्डिंग रोकें" : "बोलने के लिए दबाएं"}
          className={`btn-mic ${isRecording ? 'recording' : ''} ${
            isProcessing ? 'opacity-60 cursor-wait' : 'hover:opacity-95'
          }`}
        >
          <MicIcon size={44} color="#F6F6F6" />
        </button>
        <span className="font-caption text-ink font-semibold mt-3 text-sm">
          {isProcessing
            ? "आवाज का विश्लेषण हो रहा है..."
            : isRecording
            ? "सुन रहे हैं, अपनी बात कहें (Tap to finish)"
            : "बोलने के लिए दबाएं (Tap to Speak)"}
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
          पहचाने गए शब्द (Spoken Transcript):
        </span>
        <p className="text-sm sm:text-base text-ink italic leading-snug">
          {transcript ? `"${transcript}"` : "माइक्रोफ़ोन पर टैप करके अपनी बात बोलें..."}
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
          उदाहरण वाक्य (Tap to test):
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
