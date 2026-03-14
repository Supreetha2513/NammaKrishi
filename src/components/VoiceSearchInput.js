import React, { useState, useRef } from 'react';
import { FiMic, FiX } from 'react-icons/fi';
import VoiceSearchService from '../utils/voiceSearchUtils';
import EquipmentService from '../services/equipmentService';
import './VoiceSearchInput.css';

const VoiceSearchInput = ({ onSearch, onCategoryChange, language = 'en' }) => {
  const [isListening, setIsListening] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [error, setError] = useState(null);
  const searchTimeoutRef = useRef(null);

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
        async (transcript) => {
          setSearchText(transcript);
          console.log('Voice input recognized:', transcript);

          try {
            // Normalize the voice-translated text
            const normalizedTranscript = transcript.trim().toLowerCase();
            console.log('Normalized voice input:', normalizedTranscript);

            // Extract keywords from the transcript
            const words = normalizedTranscript.split(' ');
            const categoryMap = {
              tractor: 'Tractor',
              harvester: 'Harvester',
              rotavator: 'Rotavator',
            };

            const locationMap = ['bangalore', 'delhi', 'mumbai', 'chennai']; // Example locations

            let matchedCategory = null;
            let matchedLocation = null;

            // Match category
            for (const word of words) {
              if (categoryMap[word]) {
                matchedCategory = categoryMap[word];
                break;
              }
            }

            // Match location
            for (const word of words) {
              if (locationMap.includes(word)) {
                matchedLocation = word;
                break;
              }
            }

            // Extract relevant search term
            const relevantSearchTerm = matchedCategory || normalizedTranscript;
            console.log('Relevant search term:', relevantSearchTerm);

            // Debugging logs to verify keyword extraction
            console.log('Voice input:', transcript);
            console.log('Extracted words:', words);

            // Debugging logs for matched filters
            console.log('Matched category:', matchedCategory);
            console.log('Matched location:', matchedLocation);

            // Ensure filters are applied correctly
            if (onCategoryChange && matchedCategory) {
              console.log('Updating category filter to:', matchedCategory);
              onCategoryChange(matchedCategory);
            }

            if (onSearch) {
              const filters = {};
              
              // Only add search filter if we don't have a matched category
              if (matchedCategory) {
                filters.category = matchedCategory;
              } else {
                filters.search = relevantSearchTerm;
              }
              
              if (matchedLocation) filters.location = matchedLocation;

              console.log('Applying filters:', filters);
              const results = await EquipmentService.searchEquipment(filters);
              console.log('Search results:', results);
              onSearch(results);
            }
          } catch (searchError) {
            setError(`Search failed: ${searchError.message}`);
          }
        },
        (error) => {
          setError(`Error: ${error}`);
          setIsListening(false);
        }
      );
    }
  };

  const handleTextSearch = async (e) => {
    const value = e.target.value;
    setSearchText(value);
    setError(null);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Only search if there's meaningful text (at least 2 characters)
    if (value.length < 2) {
      if (onSearch) {
        onSearch([]);
      }
      return;
    }

    // Debounce the search - wait 500ms before searching
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await EquipmentService.searchEquipment({ search: value });
        if (onSearch) {
          onSearch(results);
        }
      } catch (searchError) {
        // Don't show index errors to user - they'll be resolved automatically
        if (searchError.message.includes('index')) {
          console.warn('Firebase index not ready yet. Please try again in a moment.');
          return;
        }
        setError(`Search failed: ${searchError.message}`);
      }
    }, 500); // Wait 500ms after user stops typing
  };

  const handleClear = () => {
    setSearchText('');
    if (onSearch) {
      onSearch([]);
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
