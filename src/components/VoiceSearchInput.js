import React, { useState } from 'react';
import { FiMic, FiX } from 'react-icons/fi';
import VoiceSearchService from '../utils/voiceSearchUtils';
import './VoiceSearchInput.css';

const VoiceSearchInput = ({ onSearch, language = 'en' }) => {
  const [isListening, setIsListening] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [error, setError] = useState(null);

  const handleVoiceSearch = () => {
    if (!VoiceSearchService.isSupported()) {
      setError('Voice search is not supported in your browser');
      return;
    }

    if (isListening) {
      VoiceSearchService.stopListening();
      setIsListening(false);
    } else {
      setIsListening(true);
      setError(null);
      VoiceSearchService.startListening(
        language,
        (transcript) => {
          setSearchText(transcript);
          if (onSearch) {
            onSearch(transcript);
          }
        },
        (error) => {
          setError(`Error: ${error}`);
          setIsListening(false);
        }
      );
    }
  };

  const handleTextSearch = (e) => {
    const value = e.target.value;
    setSearchText(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  const handleClear = () => {
    setSearchText('');
    if (onSearch) {
      onSearch('');
    }
  };

  return (
    <div className="voice-search-container">
      <div className="search-input-wrapper">
        <input
          type="text"
          value={searchText}
          onChange={handleTextSearch}
          placeholder={`Search equipment... (${language.toUpperCase()})`}
          className="search-input"
        />
        {searchText && (
          <button className="clear-btn" onClick={handleClear}>
            <FiX size={20} />
          </button>
        )}
        <button
          className={`voice-btn ${isListening ? 'listening' : ''}`}
          onClick={handleVoiceSearch}
          title={isListening ? 'Listening...' : 'Click to speak'}
        >
          <FiMic size={20} />
        </button>
      </div>
      {error && <div className="error-message">{error}</div>}
      {isListening && <div className="listening-indicator">🎤 Listening...</div>}
    </div>
  );
};

export default VoiceSearchInput;
