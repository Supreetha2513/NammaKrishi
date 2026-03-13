import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Sidebar from './Sidebar';
import './AiAssistant.css';

const REQUIRED_FIELDS = ['name', 'category', 'price_per_hour', 'price_per_day', 'location'];

const normalizeNumber = (value) => {
  if (typeof value === 'number') return value;
  if (!value) return '';
  const cleaned = value.toString().replace(/[^0-9.]/g, '');
  return cleaned;
};

const parseEquipmentFromPrompt = (prompt) => {
  const lower = prompt.toLowerCase();

  const result = {
    name: '',
    category: '',
    description: '',
    price_per_hour: '',
    price_per_day: '',
    location: '',
    image_url: '',
    image_urls: [],
    horsepower: '',
    fuel_type: '',
    year_of_manufacture: '',
    model_number: '',
    gps_location: '',
    status: 'available',
  };

  // Basic extraction patterns
  const nameMatch = prompt.match(/(?:name|called|called\s+\b)(?:[:\-]?\s*)([A-Za-z0-9\s\-]+)/i);
  if (nameMatch) {
    result.name = nameMatch[1].trim();
  }

  const categoryMatch = prompt.match(/(?:category|type|kind)\s*(?:is\s*)?[:\-]?\s*([A-Za-z0-9\s]+)/i);
  if (categoryMatch) {
    result.category = categoryMatch[1].trim();
  }

  // Try to parse pricing in either order ("₹5000 per hour" or "per hour ₹5000")
  // Also handle variations like "500 rupees per hour", "rate 500/hour", etc.
  const priceHourMatch = prompt.match(/(?:₹|rs\.?\s*|rupees?\s*)?\s*([0-9,]+(?:\.[0-9]+)?)\s*(?:per\s*hour|\/hour|hourly|per\s*hr|\/hr)/i)
    || prompt.match(/(?:per\s*hour|\/hour|hourly|per\s*hr|\/hr)\s*(?:at\s*|rate\s*(?:of\s*)?)?(?:₹|rs\.?\s*|rupees?\s*)?\s*([0-9,]+(?:\.[0-9]+)?)/i)
    || prompt.match(/(?:hourly\s*rate|rate\s*per\s*hour)\s*(?:of\s*|is\s*)?(?:₹|rs\.?\s*|rupees?\s*)?\s*([0-9,]+(?:\.[0-9]+)?)/i);
  if (priceHourMatch) {
    const price = priceHourMatch[1] || priceHourMatch[2] || priceHourMatch[3];
    result.price_per_hour = normalizeNumber(price);

  }

  const priceDayMatch = prompt.match(/(?:₹|rs\.?\s*|rupees?\s*)?\s*([0-9,]+(?:\.[0-9]+)?)\s*(?:per\s*day|\/day|daily|per\s*dy|\/dy)/i)
    || prompt.match(/(?:per\s*day|\/day|daily|per\s*dy|\/dy)\s*(?:at\s*|rate\s*(?:of\s*)?)?(?:₹|rs\.?\s*|rupees?\s*)?\s*([0-9,]+(?:\.[0-9]+)?)/i)
    || prompt.match(/(?:daily\s*rate|rate\s*per\s*day)\s*(?:of\s*|is\s*)?(?:₹|rs\.?\s*|rupees?\s*)?\s*([0-9,]+(?:\.[0-9]+)?)/i);
  if (priceDayMatch) {
    const price = priceDayMatch[1] || priceDayMatch[2] || priceDayMatch[3];
    result.price_per_day = normalizeNumber(price);

  }

  // Fallback for price parsing if the prompt doesn't explicitly say "per hour/day"
  if ((!result.price_per_hour || !result.price_per_day) && prompt.match(/[0-9]/)) {
    const numberMatches = Array.from(prompt.matchAll(/([0-9]+(?:\.[0-9]+)?)/g)).map((m) => m[1]);

    if (!result.price_per_hour) {
      const hourContext = prompt.match(/([0-9,]+(?:\.[0-9]+)?)\s*(?:rupees?|rs\.?|₹)?\s*(?:per\s*hour|\/hour|hourly|per\s*hr|hr)/i);
      if (hourContext) {
        result.price_per_hour = normalizeNumber(hourContext[1]);
      }
    }

    if (!result.price_per_day) {
      const dayContext = prompt.match(/([0-9,]+(?:\.[0-9]+)?)\s*(?:rupees?|rs\.?|₹)?\s*(?:per\s*day|\/day|daily|per\s*dy|dy)/i);
      if (dayContext) {
        result.price_per_day = normalizeNumber(dayContext[1]);
      }
    }

    if (!result.price_per_hour && numberMatches.length > 0) {
      result.price_per_hour = normalizeNumber(numberMatches[0]);
    }
    if (!result.price_per_day && numberMatches.length > 1) {
      result.price_per_day = normalizeNumber(numberMatches[1]);
    }
  }

  const locationMatch = prompt.match(/(?:located\s*(?:in|at)|location\s*(?:is)?|available\s*(?:at|in)|in\s*the\s*area\s*of)\s*([A-Za-z0-9',\s\-]+)/i);
  if (locationMatch) {
    result.location = locationMatch[1].trim();
  }

  const fuelMatch = prompt.match(/\b(diesel|petrol|electric|hybrid)\b/i);
  if (fuelMatch) {
    result.fuel_type = fuelMatch[1].toLowerCase();
  }

  const hpMatch = prompt.match(/(\d{2,4})\s*(?:hp|horsepower)\b/i);
  if (hpMatch) {
    result.horsepower = hpMatch[1];
  }

  const yearMatch = prompt.match(/(?:year\s*(?:of\s*)?manufacture|made\s*in|model\s*year)\s*(?:is\s*)?(\d{4})/i);
  if (yearMatch) {
    result.year_of_manufacture = yearMatch[1];
  }

  const modelMatch = prompt.match(/(?:model\s*(?:number)?\s*(?:is)?\s*[:\-]?\s*)([A-Za-z0-9\-]+)/i);
  if (modelMatch) {
    result.model_number = modelMatch[1].trim();
  }

  // If user includes a clear description part, use it as description
  const descMatch = prompt.match(/(?:description|details|about)\s*[:\-]?\s*(.+)/i);
  if (descMatch) {
    result.description = descMatch[1].trim();
  }

  // If we didn't capture name, try to extract it from natural phrasing like "rent my <name>" or "I'm listing <name>".
  if (!result.name) {
    const rentMatch = prompt.match(/rent\s+(?:my\s+)?([A-Za-z0-9\s\-]+?)\s*(?:for|at|in|with|to|\bcharge\b)/i);
    if (rentMatch) {
      result.name = rentMatch[1].trim();
    }
  }

  // If still no name, try using a detected category keyword (e.g., Tractor) or fallback placeholder.
  if (!result.name) {
    const categoryKeywords = [
      { keyword: 'tractor', label: 'Tractor' },
      { keyword: 'harvester', label: 'Harvester' },
      { keyword: 'plough', label: 'Plough' },
      { keyword: 'sprayer', label: 'Sprayer' },
      { keyword: 'rotavator', label: 'Rotavator' },
      { keyword: 'thresher', label: 'Thresher' },
      { keyword: 'seed drill', label: 'Seed Drill' },
    ];
    const found = categoryKeywords.find((item) => lower.includes(item.keyword));
    if (found) {
      result.name = found.label;
    } else {
      // If there isn't a clear name, use a neutral placeholder so the form stays clean.
      result.name = 'New Equipment';
    }
  }

  // If no category, attempt to guess from keywords
  if (!result.category) {
    const categoryKeywords = [
      { keyword: 'tractor', category: 'Tractor' },
      { keyword: 'harvester', category: 'Harvester' },
      { keyword: 'plough', category: 'Plough' },
      { keyword: 'sprayer', category: 'Sprayer' },
      { keyword: 'rotavator', category: 'Rotavator' },
      { keyword: 'thresher', category: 'Thresher' },
      { keyword: 'seed drill', category: 'Seed Drill' },
    ];
    const found = categoryKeywords.find((item) => lower.includes(item.keyword));
    if (found) {
      result.category = found.category;
    }
  }

  // If we didn't find a location, check for city names or phrases after "in".
  if (!result.location) {
    const locMatch = prompt.match(/in\s+([A-Za-z][A-Za-z\s]+)(?:\.|,|$)/i);
    if (locMatch) {
      result.location = locMatch[1].trim();
    }
  }

  // Ensure price fields are strings (backend expects strings)
  result.price_per_hour = result.price_per_hour ? result.price_per_hour.toString() : '';
  result.price_per_day = result.price_per_day ? result.price_per_day.toString() : '';

  return result;
};

const validateEquipmentData = (data) => {
  const missing = REQUIRED_FIELDS.filter((key) => !data[key] || data[key].toString().trim() === '');
  return {
    isValid: missing.length === 0,
    missing,
  };
};

function AiAssistant() {
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Hi there! Describe the equipment you want to list (text or use voice), and I will auto-fill the details for you.',
    },
  ]);

  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parsedData, setParsedData] = useState({
    name: '',
    category: '',
    description: '',
    price_per_hour: '',
    price_per_day: '',
    location: '',
    image_url: '',
    image_urls: [],
    horsepower: '',
    fuel_type: '',
    year_of_manufacture: '',
    model_number: '',
    gps_location: '',
    status: 'available',
  });
  const [formMode, setFormMode] = useState(false);
  const [validation, setValidation] = useState({ isValid: true, missing: [] });
  const [error, setError] = useState(null);
  const [formHint, setFormHint] = useState('');
  const [micPermissionGranted, setMicPermissionGranted] = useState(false);
  const scrollRef = useRef(null);
  const transcriptRef = useRef('');

  const resetParsedData = () => {
    setParsedData({
      name: '',
      category: '',
      description: '',
      price_per_hour: '',
      price_per_day: '',
      location: '',
      image_url: '',
      image_urls: [],
      horsepower: '',
      fuel_type: '',
      year_of_manufacture: '',
      model_number: '',
      gps_location: '',
      status: 'available',
    });
  };

  // Debug: Check environment on mount
  useEffect(() => {
    // Ensure the component mounts cleanly; no debug output.
  }, []);

  const recognition = useMemo(() => {
    // Check if we're in a secure context (HTTPS or localhost)
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      console.warn('SpeechRecognition requires HTTPS. Voice input disabled.');
      return null;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('SpeechRecognition API not supported in this browser');
      return null;
    }
    const recog = new SpeechRecognition();
    recog.lang = 'en-US';
    recog.interimResults = true;
    recog.continuous = true;
    recog.maxAlternatives = 1;
    return recog;
  }, []);

  const finalizeVoiceRecording = () => {
    const finalText = (voiceTranscript || transcriptRef.current || '').trim();
    if (!finalText) {
      setFormHint('No audio captured. Try speaking clearly and press Stop when done.');
      setIsListening(false);
      return;
    }

    setFormHint('Filling the form now...');
    handleSend(finalText);
    setVoiceTranscript('');
    transcriptRef.current = '';
    setIsListening(false);
  };

  useEffect(() => {
    if (!recognition) return;

    const handleResult = (event) => {
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;

        if (result.isFinal) {
          transcriptRef.current += transcript + ' ';

        } else {
          interimTranscript += transcript;
        }
      }

      const combined = `${transcriptRef.current.trim()} ${interimTranscript.trim()}`.trim();
      setVoiceTranscript(combined);
    };

    const handleError = (event) => {
      console.error('SpeechRecognition error:', event.error, event);
      // Don't show error for 'aborted' as it's expected when stopping
      if (event.error !== 'aborted') {
        setFormHint(`Microphone error: ${event.error}. Please check permissions or try again.`);
      }
      setIsListening(false);
    };

    const handleStart = () => {
      setFormHint('Recording... speak now, then press Stop to fill the form.');
    };

    const handleEnd = () => {
      const hasTranscript = transcriptRef.current.trim().length > 0 || voiceTranscript.trim().length > 0;
      if (hasTranscript) {
        finalizeVoiceRecording();
      } else {
        setFormHint('Recording stopped. No audio detected; try speaking more clearly.');
        setIsListening(false);
      }
    };

    recognition.addEventListener('result', handleResult);
    recognition.addEventListener('end', handleEnd);
    recognition.addEventListener('error', handleError);
    recognition.addEventListener('start', handleStart);

    return () => {
      recognition.removeEventListener('result', handleResult);
      recognition.removeEventListener('end', handleEnd);
      recognition.removeEventListener('error', handleError);
      recognition.removeEventListener('start', handleStart);
      // Don't abort here as it might interfere with ongoing recognition
    };
  }, [recognition]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (text) => {
    if (!text || isSubmitting) return;

    setMessages((prev) => [...prev, { role: 'user', text }]);
    setInput('');
    setError(null);

    const parsed = parseEquipmentFromPrompt(text);


    const cleanedParsed = Object.fromEntries(
      Object.entries(parsed).filter(([, value]) => value !== '' && value !== null && value !== undefined)
    );

    const merged = {
      ...parsedData,
      ...cleanedParsed,
    };

    const validationResult = validateEquipmentData(merged);

    setParsedData(merged);
    setValidation(validationResult);
    setFormMode(true);

    const summary = [];
    if (merged.name) summary.push(`Name: ${merged.name}`);
    if (merged.category) summary.push(`Category: ${merged.category}`);
    if (merged.location) summary.push(`Location: ${merged.location}`);
    if (merged.price_per_hour) summary.push(`Price/hr: ₹${merged.price_per_hour}`);
    if (merged.price_per_day) summary.push(`Price/day: ₹${merged.price_per_day}`);
    if (merged.fuel_type) summary.push(`Fuel: ${merged.fuel_type}`);
    if (merged.horsepower) summary.push(`HP: ${merged.horsepower}`);

    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        text: `✅ I captured the following information:\n${summary.join('\n')}\n\nEdit the form below if needed, then click Create Listing to publish.`,
      },
    ]);

    if (!validationResult.isValid) {
      setFormHint(`Missing required fields: ${validationResult.missing.join(', ')}. Please fill them before creating.`);
    } else {
      setFormHint('Looks good! Click Create Listing when you are ready.');
    }
  };

  const handleCreateListing = async () => {

    const validationResult = validateEquipmentData(parsedData);
    setValidation(validationResult);

    if (!validationResult.isValid) {
      setError(`Missing required fields: ${validationResult.missing.join(', ')}`);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await api.post('/equipment', parsedData);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: '🎉 Equipment created successfully! You can view it in the My Equipment list.' },
      ]);
      resetParsedData();
      setFormMode(false);
      setValidation({ isValid: true, missing: [] });
      await new Promise((res) => setTimeout(res, 500));
      navigate('/equipment');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to create equipment.');
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: `❌ Failed to create equipment: ${err.response?.data?.error || err.message}` },
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleListening = async () => {
    if (!recognition) {
      setFormHint('Voice recording is not supported in this browser. Please use text input instead.');
      return;
    }

    if (isListening) {
      // Stop recording
      try {
        recognition.stop();

      } catch (err) {
        console.error('Error stopping recognition:', err);
      }
      setIsListening(false);
      setFormHint('Processing your voice input...');
    } else {
      // Start recording - check permissions first if not already granted
      if (!micPermissionGranted) {
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true });
          setMicPermissionGranted(true);
        } catch (err) {
          console.error('Error getting microphone permission:', err);
          setIsListening(false);
          if (err.name === 'NotAllowedError') {
            setError('Microphone permission denied. Please allow microphone access and try again.');
          } else if (err.name === 'NotFoundError') {
            setError('No microphone found. Please check your microphone connection.');
          } else {
            setError(`Error accessing microphone: ${err.message}`);
          }
          return;
        }
      }

      // Reset transcript and start recording
      transcriptRef.current = '';
      setVoiceTranscript('');
      setError(null);
      setFormHint('Recording... speak now, then press Stop to fill the form.');
      setIsListening(true);

      try {
        recognition.start();
      } catch (err) {
        console.error('SpeechRecognition start error:', err);
        setIsListening(false);
        setError(`Error starting speech recognition: ${err.message}`);
      }
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)} />
      <div className="main-content">
        <div className="topbar">
          <button className="menu-btn" onClick={() => setShowSidebar(!showSidebar)}>
            ☰
          </button>
          <h1>AI Listing Assistant</h1>
          <button className="btn btn-secondary" onClick={() => navigate('/equipment')}>
            ← Back to Equipment
          </button>
        </div>

        <div className="ai-assistant-container">
          <div className="chat-panel" ref={scrollRef}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`chat-message ${msg.role}`}>
                <div className="chat-bubble">
                  {msg.text.split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="chat-input-row">
            <button
              className={`mic-btn ${isListening ? 'listening' : ''}`}
              onClick={toggleListening}
              disabled={!recognition}
              title={
                recognition
                  ? isListening
                    ? 'Stop voice input'
                    : 'Start voice input'
                  : 'Voice input not supported in this browser'
              }
            >
              {isListening ? '🎙️ Listening...' : '🎙️'}
            </button>

            <input
              type="text"
              placeholder="Describe equipment to list (e.g., Tractor with 40 HP, ₹500/hr, in Mysore)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(input);
                }
              }}
            />

            <button className="send-btn" onClick={() => handleSend(input)} disabled={!input.trim()}>
              Send
            </button>
          </div>

          {/* Environment status indicator */}
          <div className="env-status">
            {!recognition && (
              <div className="status-warning">
                ⚠️ Voice recording unavailable: Requires HTTPS or localhost, and a supported browser (Chrome/Edge/Safari)
              </div>
            )}
            {recognition && (
              <div className="status-ok">
                ✅ Voice recording ready
              </div>
            )}
          </div>

          {isListening && (
            <div className="voice-status">
              🎙️ Recording... speak clearly. (Stop to finalize)
            </div>
          )}

          {!isListening && voiceTranscript && (
            <div className="voice-status">
              📌 Captured: {voiceTranscript}
            </div>
          )}

          {formMode && (
            <div className="assistant-form">
              <h2>Review & Confirm Listing</h2>
              {error && <div className="error-banner">{error}</div>}
              {formHint && <div className="hint">{formHint}</div>}
              <div className="form-grid">
                <label>
                  Name <span className="required">*</span>
                  <input
                    value={parsedData.name}
                    onChange={(e) => setParsedData({ ...parsedData, name: e.target.value })}
                  />
                </label>
                <label>
                  Category <span className="required">*</span>
                  <input
                    value={parsedData.category}
                    onChange={(e) => setParsedData({ ...parsedData, category: e.target.value })}
                  />
                </label>
                <label>
                  Location <span className="required">*</span>
                  <input
                    value={parsedData.location}
                    onChange={(e) => setParsedData({ ...parsedData, location: e.target.value })}
                  />
                </label>
                <label>
                  Price per hour (₹) <span className="required">*</span>
                  <input
                    type="number"
                    value={parsedData.price_per_hour}
                    onChange={(e) =>
                      setParsedData({ ...parsedData, price_per_hour: e.target.value })
                    }
                  />
                </label>
                <label>
                  Price per day (₹) <span className="required">*</span>
                  <input
                    type="number"
                    value={parsedData.price_per_day}
                    onChange={(e) =>
                      setParsedData({ ...parsedData, price_per_day: e.target.value })
                    }
                  />
                </label>
                <label>
                  Fuel type
                  <input
                    value={parsedData.fuel_type}
                    onChange={(e) => setParsedData({ ...parsedData, fuel_type: e.target.value })}
                    placeholder="Diesel / Petrol / Electric"
                  />
                </label>
                <label>
                  Horsepower
                  <input
                    type="number"
                    value={parsedData.horsepower}
                    onChange={(e) => setParsedData({ ...parsedData, horsepower: e.target.value })}
                    placeholder="e.g., 40"
                  />
                </label>
                <label>
                  Year of manufacture
                  <input
                    type="number"
                    value={parsedData.year_of_manufacture}
                    onChange={(e) =>
                      setParsedData({ ...parsedData, year_of_manufacture: e.target.value })
                    }
                    placeholder="e.g., 2021"
                  />
                </label>
                <label>
                  Model number
                  <input
                    value={parsedData.model_number}
                    onChange={(e) => setParsedData({ ...parsedData, model_number: e.target.value })}
                  />
                </label>
                <label className="full-width">
                  Description
                  <textarea
                    value={parsedData.description}
                    onChange={(e) => setParsedData({ ...parsedData, description: e.target.value })}
                    rows={3}
                  />
                </label>
              </div>
              <div className="form-actions">
                <button
                  className="btn btn-primary"
                  onClick={handleCreateListing}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Listing'}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setFormMode(false);
                    resetParsedData();
                    setError(null);
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              </div>
              {!validation.isValid && (
                <div className="hint">
                  Missing required fields: {validation.missing.join(', ')}. Fill them above to create.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AiAssistant;
