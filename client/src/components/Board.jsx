import React, { useState, useEffect } from 'react';
import styles from './Board.module.css';

const Card = ({ card, flipped, handleChoice, disabled }) => {
  const handleClick = () => {
    if (!disabled && !flipped) {
      handleChoice(card);
    }
  };

  return (
    <div className={styles.card} onClick={handleClick}>
      <div className={`${styles.cardInner} ${flipped ? styles.flipped : ''}`}>
        {/* Back of card */}
        <div className={styles.cardBack}>
          <div className={styles.cardBackContent}>
            <span className={styles.questionMark}>?</span>
          </div>
        </div>
        
        {/* Front of card */}
        <div className={styles.cardFront}>
          <div className={styles.cardSymbol}>
            {card.symbol}
          </div>
        </div>
      </div>
    </div>
  );
};

function MemoryGame() {
  const cardSymbols = [
    { symbol: '❤️', matchId: 1, matched: false },
    { symbol: '❤️', matchId: 1, matched: false },
    { symbol: '⭐', matchId: 2, matched: false },
    { symbol: '⭐', matchId: 2, matched: false },
    { symbol: '🌙', matchId: 3, matched: false },
    { symbol: '🌙', matchId: 3, matched: false },
    { symbol: '☀️', matchId: 4, matched: false },
    { symbol: '☀️', matchId: 4, matched: false },
    { symbol: '🔥', matchId: 5, matched: false },
    { symbol: '🔥', matchId: 5, matched: false },
    { symbol: '💎', matchId: 6, matched: false },
    { symbol: '💎', matchId: 6, matched: false },
    { symbol: '🌸', matchId: 7, matched: false },
    { symbol: '🌸', matchId: 7, matched: false },
    { symbol: '⚡', matchId: 8, matched: false },
    { symbol: '⚡', matchId: 8, matched: false }
  ];

  const [cards, setCards] = useState([]);
  const [choiceOne, setChoiceOne] = useState(null);
  const [choiceTwo, setChoiceTwo] = useState(null);
  const [disabled, setDisabled] = useState(false);
  const [turns, setTurns] = useState(0);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [bestScore, setBestScore] = useState(null);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // API base URL - adjust this to match your backend
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Get auth token from localStorage (you'll need to implement login/auth first)
  const getAuthToken = () => {
    // Try both possible key names
    let token = localStorage.getItem('authToken') || localStorage.getItem('token');
    console.log('Retrieved token:', token ? 'Token exists' : 'No token found');
    console.log('Token length:', token ? token.length : 0);
    return token;
  };

  // API call to fetch best score
  const fetchBestScore = async () => {
    const token = getAuthToken();
    if (!token) {
      console.log('No auth token found, using local storage fallback');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/scores/best`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBestScore(data.bestScore);
        setGamesPlayed(data.gamesPlayed);
      } else if (response.status === 401 || response.status === 403) {
        console.log('Auth token invalid, clearing token');
        localStorage.removeItem('authToken');
      } else {
        throw new Error('Failed to fetch best score');
      }
    } catch (error) {
      console.error('Error fetching best score:', error);
      setError('Failed to load best score from server');
    }
  };

  // API call to save score
  const saveScore = async (score) => {
    const token = getAuthToken();
    console.log('Attempting to save score:', score);
    console.log('Token exists:', !!token);
    
    if (!token) {
      console.log('No auth token found, score not saved to server');
      return { isNewBest: false, savedToServer: false };
    }

    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Making API call to save score...');
      const response = await fetch(`${API_BASE_URL}/api/scores`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ score }),
      });

      console.log('API Response status:', response.status);
      const responseText = await response.text();
      console.log('Raw API Response:', responseText);

      if (response.ok) {
        const data = JSON.parse(responseText);
        console.log('Parsed API Response:', data);
        setBestScore(data.bestScore);
        setGamesPlayed(data.gamesPlayed);
        return { 
          isNewBest: data.isNewBest, 
          savedToServer: true,
          bestScore: data.bestScore 
        };
      } else if (response.status === 401 || response.status === 403) {
        console.log('Auth token invalid, clearing token');
        localStorage.removeItem('authToken');
        setError('Session expired. Please sign in again.');
        throw new Error('Authentication failed');
      } else {
        console.error('API Error:', responseText);
        throw new Error(`Failed to save score: ${response.status}`);
      }
    } catch (error) {
      console.error('Error saving score:', error);
      setError(`Failed to save score: ${error.message}`);
      return { isNewBest: false, savedToServer: false };
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    shuffleCards();
    fetchBestScore();
  }, []);

  useEffect(() => {
    if (cards.length > 0 && cards.every(card => card.matched)) {
      setGameCompleted(true);
      handleGameComplete();
    }
  }, [cards]);

  // Handle game completion
  const handleGameComplete = async () => {
    const currentScore = turns;
    let newRecord = false;

    console.log('Game completed with score:', currentScore);
    console.log('Auth token exists:', !!getAuthToken());

    // Save score to backend if authenticated
    const saveResult = await saveScore(currentScore);
    
    console.log('Save result:', saveResult);
    
    if (saveResult.savedToServer) {
      // Use server response for best score logic
      newRecord = saveResult.isNewBest;
      setBestScore(saveResult.bestScore);
      console.log('Score saved to server. New best:', newRecord);
    } else {
      // Fallback to local logic if not authenticated or server error
      console.log('Using local fallback logic');
      if (bestScore === null || currentScore < bestScore) {
        newRecord = true;
        setBestScore(currentScore);
        // Save to localStorage as fallback
        localStorage.setItem('memoryGameBestScore', currentScore.toString());
      }
    }

    setIsNewRecord(newRecord);
  };

  const shuffleCards = () => {
    const shuffledCards = [...cardSymbols]
      .map(card => ({ ...card, id: Math.random() }))
      .sort(() => Math.random() - 0.5);

    setChoiceOne(null);
    setChoiceTwo(null);
    setCards(shuffledCards);
    setTurns(0);
    setGameCompleted(false);
    setIsNewRecord(false);
    setError(null);
  };

  const handleChoice = (card) => {
    if (card.id === choiceOne?.id) return;
    choiceOne ? setChoiceTwo(card) : setChoiceOne(card);
  };

  useEffect(() => {
    if (choiceOne && choiceTwo) {
      setDisabled(true);

      if (choiceOne.matchId === choiceTwo.matchId) {
        setCards(prevCards => prevCards.map(card =>
          card.matchId === choiceOne.matchId ? { ...card, matched: true } : card
        ));
        resetTurn();
      } else {
        setTimeout(() => resetTurn(), 1000);
      }
    }
  }, [choiceOne, choiceTwo]);

  const resetTurn = () => {
    setChoiceOne(null);
    setChoiceTwo(null);
    setTurns(prev => prev + 1);
    setDisabled(false);
  };

  // Check if user is authenticated
  const isAuthenticated = !!getAuthToken();

  return (
    <div className={styles.gameContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>🧠 Memory Game</h1>
        <p className={styles.subtitle}>Match all the symbol pairs to win!</p>
        
        {/* Authentication status */}
        {!isAuthenticated && (
          <div className={styles.authNotice}>
            <p>⚠️ Sign in to save your scores permanently</p>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className={styles.errorMessage}>
            <p>❌ {error}</p>
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className={styles.loadingMessage}>
            <p>💾 Saving score...</p>
          </div>
        )}
        
        {/* Best Score Display */}
        {bestScore !== null && (
          <div className={styles.bestScoreDisplay}>
            <span className={styles.bestScoreLabel}>🏆 Best Score: </span>
            <span className={styles.bestScoreValue}>{bestScore} turns</span>
            {isAuthenticated && gamesPlayed > 0 && (
              <span className={styles.gamesPlayedLabel}> ({gamesPlayed} games played)</span>
            )}
          </div>
        )}
      </div>

      {gameCompleted ? (
        <div className={styles.congratulations}>
          <div className={styles.trophy}>
            {isNewRecord ? '🥇' : '🏆'}
          </div>
          <h2 className={styles.congTitle}>
            {isNewRecord ? 'New Record!' : 'Congratulations!'}
          </h2>
          <p className={styles.congMessage}>
            You completed the game in <span className={styles.highlight}>{turns}</span> turns!
          </p>
          
          {isNewRecord && (
            <p className={styles.newRecordMessage}>
              🎉 This is your best score yet!
              {isAuthenticated && <span> Score saved to your profile!</span>}
            </p>
          )}
          
          {bestScore !== null && !isNewRecord && (
            <p className={styles.scoreDifference}>
              Your best is still <span className={styles.highlight}>{bestScore}</span> turns
              {turns > bestScore && (
                <span className={styles.improvement}>
                  {` (${turns - bestScore} more than your best)`}
                </span>
              )}
            </p>
          )}

          {!isAuthenticated && (
            <p className={styles.authPrompt}>
              🔐 Sign in to save your scores and compete with others!
            </p>
          )}
          
          <button 
            className={styles.playAgainBtn}
            onClick={shuffleCards}
          >
            🎮 Play Again
          </button>
        </div>
      ) : (
        <>
          <div className={styles.gameStats}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Turns</span>
              <span className={styles.statValue}>{turns}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Matched</span>
              <span className={styles.statValue}>
                {cards.filter(card => card.matched).length / 2} / 8
              </span>
            </div>
            {bestScore !== null && (
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Best</span>
                <span className={styles.statValue}>{bestScore}</span>
              </div>
            )}
            {isAuthenticated && gamesPlayed > 0 && (
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Games</span>
                <span className={styles.statValue}>{gamesPlayed}</span>
              </div>
            )}
          </div>

          <div className={styles.board}>
            {cards.map(card => (
              <Card
                key={card.id}
                card={card}
                flipped={card === choiceOne || card === choiceTwo || card.matched}
                handleChoice={handleChoice}
                disabled={disabled}
              />
            ))}
          </div>

          <div className={styles.gameControls}>
            <button 
              className={styles.newGameBtn}
              onClick={shuffleCards}
            >
              🔄 New Game
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default MemoryGame;