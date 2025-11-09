import React, { useState, useEffect, useRef } from 'react';
import './DomainPages.css';

const SentimentAnalysis = () => {
  const [currentSentiment, setCurrentSentiment] = useState('neutral');
  const [sentimentScore, setSentimentScore] = useState(0);
  const [userActions, setUserActions] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [emotionHistory, setEmotionHistory] = useState([]);
  const recognitionRef = useRef(null);

  // Sentiment analysis function
  const analyzeSentiment = (text) => {
    const positiveWords = ['happy', 'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'perfect', 'awesome'];
    const negativeWords = ['sad', 'bad', 'terrible', 'awful', 'hate', 'horrible', 'disgusting', 'angry', 'frustrated', 'disappointed'];
    
    const words = text.toLowerCase().split(' ');
    let score = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) score += 1;
      if (negativeWords.includes(word)) score -= 1;
    });
    
    const normalizedScore = Math.max(-1, Math.min(1, score / words.length * 10));
    
    let sentiment = 'neutral';
    if (normalizedScore > 0.3) sentiment = 'positive';
    else if (normalizedScore < -0.3) sentiment = 'negative';
    
    // Store in localStorage for sidebar access
    localStorage.setItem('currentSentiment', JSON.stringify(sentiment));
    localStorage.setItem('sentimentScore', normalizedScore.toString());
    
    return { sentiment, score: normalizedScore };
  };

  // Generate recommendations based on sentiment and actions
  const generateRecommendations = (sentiment, actions) => {
    const recommendations = [];
    
    if (sentiment === 'negative') {
      recommendations.push({
        type: 'wellness',
        title: 'Take a Break',
        description: 'Consider taking a 5-minute mindfulness break',
        priority: 'high'
      });
      recommendations.push({
        type: 'activity',
        title: 'Listen to Music',
        description: 'Play some uplifting music to improve your mood',
        priority: 'medium'
      });
    } else if (sentiment === 'positive') {
      recommendations.push({
        type: 'productivity',
        title: 'Capitalize on Energy',
        description: 'Great time to tackle challenging tasks',
        priority: 'high'
      });
    } else {
      recommendations.push({
        type: 'engagement',
        title: 'Stay Active',
        description: 'Engage in activities to boost your mood',
        priority: 'medium'
      });
    }
    
    return recommendations;
  };

  // Start voice recognition
  const startListening = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        
        if (transcript.length > 10) {
          const analysis = analyzeSentiment(transcript);
          setCurrentSentiment(analysis.sentiment);
          setSentimentScore(analysis.score);
          
          const newAction = {
            timestamp: new Date().toLocaleTimeString(),
            action: 'voice_input',
            sentiment: analysis.sentiment,
            text: transcript.substring(0, 50) + '...'
          };
          
          setUserActions(prev => [newAction, ...prev.slice(0, 4)]);
          setEmotionHistory(prev => [...prev.slice(-9), {
            time: new Date().toLocaleTimeString(),
            sentiment: analysis.sentiment,
            score: analysis.score
          }]);
          
          setRecommendations(generateRecommendations(analysis.sentiment, userActions));
        }
      };
      
      recognitionRef.current = recognition;
      recognition.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  // Simulate user actions
  useEffect(() => {
    const interval = setInterval(() => {
      const actions = ['scroll', 'click', 'type', 'pause'];
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      
      const newAction = {
        timestamp: new Date().toLocaleTimeString(),
        action: randomAction,
        sentiment: currentSentiment
      };
      
      setUserActions(prev => [newAction, ...prev.slice(0, 4)]);
    }, 5000);

    return () => clearInterval(interval);
  }, [currentSentiment]);

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive': return '#4CAF50';
      case 'negative': return '#f44336';
      default: return '#FF9800';
    }
  };

  const getSentimentEmoji = (sentiment) => {
    switch (sentiment) {
      case 'positive': return '😊';
      case 'negative': return '😔';
      default: return '😐';
    }
  };

  return (
    <div className="domain-container">
      <div className="domain-header">
        <h1>Real-time Sentiment Analysis</h1>
        <p>Monitor your emotional state and get personalized recommendations</p>
      </div>

      <div className="domain-grid">
        {/* Current Sentiment Card */}
        <div className="domain-card">
          <h3>Current Sentiment</h3>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ 
              fontSize: '4rem', 
              marginBottom: '10px',
              color: getSentimentColor(currentSentiment)
            }}>
              {getSentimentEmoji(currentSentiment)}
            </div>
            <h2 style={{ 
              color: getSentimentColor(currentSentiment),
              textTransform: 'capitalize',
              margin: '10px 0'
            }}>
              {currentSentiment}
            </h2>
            <div style={{
              width: '100%',
              height: '10px',
              backgroundColor: '#e0e0e0',
              borderRadius: '5px',
              overflow: 'hidden',
              margin: '15px 0'
            }}>
              <div style={{
                width: `${Math.abs(sentimentScore) * 100}%`,
                height: '100%',
                backgroundColor: getSentimentColor(currentSentiment),
                transition: 'width 0.3s ease'
              }} />
            </div>
            <p>Score: {(sentimentScore * 100).toFixed(1)}%</p>
          </div>
        </div>

        {/* Voice Analysis */}
        <div className="domain-card">
          <h3>Voice Analysis</h3>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <button
              onClick={isListening ? stopListening : startListening}
              style={{
                padding: '15px 30px',
                fontSize: '16px',
                border: 'none',
                borderRadius: '25px',
                backgroundColor: isListening ? '#f44336' : '#4CAF50',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              {isListening ? '🛑 Stop Listening' : '🎤 Start Listening'}
            </button>
            <p style={{ marginTop: '15px', color: '#666' }}>
              {isListening ? 'Listening to your voice...' : 'Click to analyze your speech'}
            </p>
          </div>
        </div>

        {/* Recent Actions */}
        <div className="domain-card">
          <h3>Recent Actions</h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {userActions.map((action, index) => (
              <div key={index} style={{
                padding: '10px',
                margin: '5px 0',
                backgroundColor: '#f5f5f5',
                borderRadius: '8px',
                borderLeft: `4px solid ${getSentimentColor(action.sentiment)}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
                    {action.action.replace('_', ' ')}
                  </span>
                  <span style={{ fontSize: '12px', color: '#666' }}>
                    {action.timestamp}
                  </span>
                </div>
                {action.text && (
                  <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#555' }}>
                    {action.text}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="domain-card">
          <h3>Personalized Recommendations</h3>
          <div>
            {recommendations.map((rec, index) => (
              <div key={index} style={{
                padding: '15px',
                margin: '10px 0',
                backgroundColor: rec.priority === 'high' ? '#e8f5e8' : '#fff3e0',
                borderRadius: '8px',
                border: `1px solid ${rec.priority === 'high' ? '#4CAF50' : '#FF9800'}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: '0 0 5px 0', color: '#333' }}>{rec.title}</h4>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    backgroundColor: rec.priority === 'high' ? '#4CAF50' : '#FF9800',
                    color: 'white'
                  }}>
                    {rec.priority}
                  </span>
                </div>
                <p style={{ margin: '5px 0 0 0', color: '#666' }}>{rec.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Emotion Timeline */}
        <div className="domain-card" style={{ gridColumn: 'span 2' }}>
          <h3>Emotion Timeline</h3>
          <div style={{ display: 'flex', alignItems: 'end', height: '150px', padding: '20px' }}>
            {emotionHistory.map((emotion, index) => (
              <div key={index} style={{
                flex: 1,
                margin: '0 2px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <div style={{
                  height: `${Math.abs(emotion.score) * 100 + 20}px`,
                  width: '20px',
                  backgroundColor: getSentimentColor(emotion.sentiment),
                  borderRadius: '4px 4px 0 0',
                  marginBottom: '5px'
                }} />
                <span style={{ fontSize: '10px', color: '#666' }}>
                  {emotion.time.split(':').slice(0, 2).join(':')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="domain-card">
          <h3>Today's Summary</h3>
          <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '15px' }}>
              <span style={{ color: '#4CAF50' }}>😊 Positive: 45%</span>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <span style={{ color: '#FF9800' }}>😐 Neutral: 35%</span>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <span style={{ color: '#f44336' }}>😔 Negative: 20%</span>
            </div>
            <div style={{ 
              padding: '10px', 
              backgroundColor: '#e8f5e8', 
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <strong>Overall Mood: Good 👍</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SentimentAnalysis;
