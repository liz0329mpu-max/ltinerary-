import './TravelSuggestionBox.css';

interface TravelSuggestionBoxProps {
  suggestion: string;
  loading: boolean;
  error: string | null;
}

function TravelSuggestionBox({ suggestion, loading, error }: TravelSuggestionBoxProps) {
  if (!suggestion && !loading && !error) {
    return null;
  }

  return (
    <div className="travel-suggestion-box">
      {loading && (
        <div className="suggestion-loading">
          <span className="loading-spinner">⏳</span>
          <span>AI 正在为您生成旅游建议...</span>
        </div>
      )}
      
      {error && (
        <div className="suggestion-error">
          <span>⚠️ {error}</span>
        </div>
      )}
      
      {suggestion && !loading && (
        <div className="suggestion-content">
          <div className="suggestion-header">
            <span className="suggestion-icon">✨</span>
            <span className="suggestion-title">AI 旅游建议</span>
          </div>
          <div className="suggestion-text">
            {suggestion.split('\n').map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default TravelSuggestionBox;

