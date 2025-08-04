import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styled from 'styled-components';

const SuggestionsBox = styled.div`
  position: absolute;
  width: 100%;
  background-color: #1e1e1e;
  border-radius: 6px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.3);
  max-height: 200px;
  overflow-y: auto;
  z-index: 999;
`;

const SuggestionItem = styled.div`
  padding: 0.5rem;
  cursor: pointer;
  color: white;
  border-bottom: 1px solid #333;

  &:hover {
    background-color: #2a2a2a;
  }
`;

const AutocompleteWrapper = styled.div`
  position: relative;
`;

const MapboxAutocomplete = ({ value, onChange, onSelect }) => {
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (value.length < 3) {
      setSuggestions([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        const res = await axios.get('https://api.mapbox.com/geocoding/v5/mapbox.places/' + encodeURIComponent(value) + '.json', {
          params: {
            access_token: process.env.REACT_APP_MAPBOX_ACCESS_TOKEN,
            autocomplete: true,
            country: 'PH',
            limit: 5
          }
        });
        setSuggestions(res.data.features);
      } catch (err) {
        console.error(err);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [value]);

  return (
    <AutocompleteWrapper>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder="Address"
        style={{
          width: '100%',
          padding: '0.75rem',
          borderRadius: '6px',
          border: 'none',
          backgroundColor: '#1e1e1e',
          color: 'white',
          fontSize: '1rem',
          outline: 'none',
        }}
      />
      {suggestions.length > 0 && (
        <SuggestionsBox>
          {suggestions.map((sug) => (
            <SuggestionItem key={sug.id} onClick={() => {
              onSelect(sug.place_name);
              setSuggestions([]);
            }}>
              {sug.place_name}
            </SuggestionItem>
          ))}
        </SuggestionsBox>
      )}
    </AutocompleteWrapper>
  );
};

export default MapboxAutocomplete;
