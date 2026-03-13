// Language codes and supported languages
export const SUPPORTED_LANGUAGES = {
  en: 'English',
  hi: 'हिंदी (Hindi)',
  ta: 'தமிழ் (Tamil)',
  te: 'తెలుగు (Telugu)',
  kn: 'ಕನ್ನಡ (Kannada)',
  ml: 'മലയാളം (Malayalam)',
};

// Translate common equipment search terms
export const LANGUAGE_TRANSLATIONS = {
  tractor: {
    hi: 'ट्रैक्टर',
    ta: 'டிராக்டர்',
    te: 'ట్రాక్టర్',
    kn: 'ಟ್ರ್ಯಾಕ್ಟರ್',
    ml: 'ട്രാക്ടർ',
  },
  harvester: {
    hi: 'कंबाइन हार्वेस्टर',
    ta: 'அறுவடை இயந்திரம்',
    te: 'సంపిక యంత్రం',
    kn: 'ಸುಲೋಕನ ಯಂತ್ರ',
    ml: 'കൊയ്യൽ യന്ത്രം',
  },
  rotavator: {
    hi: 'रोटावेटर',
    ta: 'சுழலும் உழவு',
    te: 'భ్రమణ యంత్రం',
    kn: 'ತಿರುಗುವ ಕಲ್ತಿ',
    ml: 'കറങ്ങുന്ന നിരണി',
  },
  irrigation: {
    hi: 'सिंचाई',
    ta: 'நீர்ப்பாசன',
    te: 'నీటిపారుదల',
    kn: 'ಸಿಂಚನ',
    ml: 'ജലസേചനം',
  },
};

class VoiceSearchService {
  constructor() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.isListening = false;
  }

  startListening(language = 'en', onResult, onError) {
    if (this.isListening) return;

    const languageCode = this.getLanguageCode(language);
    this.recognition.language = languageCode;
    this.recognition.continuous = false;
    this.recognition.interimResults = true;

    this.recognition.onstart = () => {
      this.isListening = true;
    };

    this.recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      if (onResult) {
        onResult(transcript);
      }
    };

    this.recognition.onerror = (event) => {
      if (onError) {
        onError(event.error);
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };

    this.recognition.start();
  }

  stopListening() {
    if (this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  getLanguageCode(language) {
    const languageMap = {
      en: 'en-US',
      hi: 'hi-IN',
      ta: 'ta-IN',
      te: 'te-IN',
      kn: 'kn-IN',
      ml: 'ml-IN',
    };
    return languageMap[language] || 'en-US';
  }

  isSupported() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    return !!SpeechRecognition;
  }

  getLanguages() {
    return SUPPORTED_LANGUAGES;
  }

  getTranslation(word, language) {
    const lowerWord = word.toLowerCase();
    if (LANGUAGE_TRANSLATIONS[lowerWord]) {
      return LANGUAGE_TRANSLATIONS[lowerWord][language] || word;
    }
    return word;
  }
}

export default new VoiceSearchService();
