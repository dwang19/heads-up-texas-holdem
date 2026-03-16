// Test change for GitHub push capability - added by AI assistant
import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import Card from './components/Card';
import PlayerArea from './components/PlayerArea';
import { Deck, createDeck } from './game/deck';
import { Card as CardType, Player, GameState, PokerHand } from './game/types';
import { getAIDecision, AIPersonality } from './game/ai';
import { evaluateHand, compareHands, getDescriptionWithKicker, getTieBreakingDescriptions } from './game/pokerLogic';
import {
  validateFoldAction as _validateFoldAction,
  validateCallAction as _validateCallAction,
  validateRaiseAction as _validateRaiseAction,
  verifyChipAccounting as _verifyChipAccounting,
  isBettingRoundComplete as _isBettingRoundComplete,
  getFirstPlayerIndex as _getFirstPlayerIndex,
  getNextActivePlayerIndex as _getNextActivePlayerIndex,
} from './game/betting';
import './App.css';

function App() {
  // Game initialization state
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [humanPlayerName, setHumanPlayerName] = useState<string>('Player1');
  const [humanIsBigBlindFirst, setHumanIsBigBlindFirst] = useState<boolean>(true);

  // Round-based game state
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [overallWinner, setOverallWinner] = useState<Player | null>(null);

  // Initialize players with starting chips ($100 each)
  const getInitialPlayers = (humanName: string, humanIsBigBlind: boolean) => [
    {
      id: 'human',
      name: humanName,
      cards: [],
      chips: 100,
      isHuman: true,
      isSmallBlind: !humanIsBigBlind,
      isBigBlind: humanIsBigBlind,
      currentBet: 0,
      hasFolded: false,
      hasActedThisRound: false,
    },
    {
      id: 'ai',
      name: 'AI Player',
      cards: [],
      chips: 100,
      isHuman: false,
      isSmallBlind: humanIsBigBlind,
      isBigBlind: !humanIsBigBlind,
      currentBet: 0,
      hasFolded: false,
      hasActedThisRound: false,
    },
  ];

  const [players, setPlayers] = useState<Player[]>(getInitialPlayers('Player1', true));
  const [deck, setDeck] = useState<Deck>(createDeck());
  const [communityCards, setCommunityCards] = useState<CardType[]>([]);
  const [burnedCards, setBurnedCards] = useState<CardType[]>([]);
  const [pot, setPot] = useState<number>(0);
  const [potDelta, setPotDelta] = useState<number | null>(null);
  const prevPotRef = useRef<number>(0);
  const [currentBet, setCurrentBet] = useState<number>(0);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState<number>(-1);
  const [gamePhase, setGamePhase] = useState<'waiting' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown'>('waiting');
  const [raiseAmount, setRaiseAmount] = useState<string>('');
  const [aiPersonality] = useState<AIPersonality>('balanced'); // Hardcoded to balanced
  const [aiRaisedPreflop, setAiRaisedPreflop] = useState(false);
  const [winner, setWinner] = useState<Player | null>(null);
  const [handComplete, setHandComplete] = useState<boolean>(false);
  const [showdownData, setShowdownData] = useState<{
    hands: { player: Player; pokerHand: PokerHand; isWinner: boolean }[];
    communityCardsUsed: CardType[];
    potAmount: number;
    isTie?: boolean;
  } | null>(null);
  const [isDealing, setIsDealing] = useState<boolean>(false);
  const [animatingCardIndices, setAnimatingCardIndices] = useState<number[]>([]);
  const [burnAnimatingIndex, setBurnAnimatingIndex] = useState<number | null>(null);
  const [holeCardAnimating, setHoleCardAnimating] = useState<boolean>(false);
  const [aiActionDisplay, setAiActionDisplay] = useState<{action: string, amount?: number, isThinking: boolean} | null>(null);
  const [phaseAnnouncement, setPhaseAnnouncement] = useState<string | null>(null);
  const [playerLastActions, setPlayerLastActions] = useState<Record<string, string>>({});
  const [gameLog, setGameLog] = useState<Array<{timestamp: Date, message: string}>>([{ timestamp: new Date(), message: 'Game started! Player1 vs AI Player' }]);
  const [aiCardsFlipping, setAiCardsFlipping] = useState<boolean>(false);
  const [lastPotWon, setLastPotWon] = useState<number>(0);
  const logEntriesRef = useRef<HTMLDivElement>(null);
  const scalerRef = useRef<HTMLDivElement>(null);
  const [hoveredPlayerHand, setHoveredPlayerHand] = useState<'human' | 'ai' | null>(null);
  const [showMobileLog, setShowMobileLog] = useState<boolean>(false);

  // Derived display values
  const phaseDisplayName = gamePhase === 'waiting' ? 'Preflop' : gamePhase.charAt(0).toUpperCase() + gamePhase.slice(1);

  // Chip accounting verification function - helps catch bugs early
  // Total chips + pot should always equal $200 (starting chips for 2 players)
  const verifyChipAccounting = (playersToCheck: Player[], potToCheck: number, context: string) => {
    const result = _verifyChipAccounting(playersToCheck, potToCheck, context);
    if (!result.valid) {
      console.error(`CHIP ACCOUNTING ERROR at ${context}!`);
      console.error(`Total: $${result.total}, Expected: $${result.expected}, Difference: $${result.total - result.expected}`);
      console.error('Players:', playersToCheck.map(p => ({ name: p.name, chips: p.chips, currentBet: p.currentBet })));
      console.error('Pot:', potToCheck);
    } else {
      console.log(`DEBUG: Chip accounting verified at ${context} - Total: $${result.total}`);
    }
  };

  // Auto-scroll to bottom when new log entries are added
  useEffect(() => {
    if (logEntriesRef.current) {
      logEntriesRef.current.scrollTop = logEntriesRef.current.scrollHeight;
    }
  }, [gameLog]);

  // Track pot changes and show "+$X" delta animation
  useEffect(() => {
    if (pot > prevPotRef.current) {
      setPotDelta(pot - prevPotRef.current);
      const timer = setTimeout(() => setPotDelta(null), 1800);
      prevPotRef.current = pot;
      return () => clearTimeout(timer);
    }
    prevPotRef.current = pot;
  }, [pot]);

  const lastOuterRef = useRef({ w: window.outerWidth, h: window.outerHeight });

  const applyScale = useCallback(() => {
    const el = scalerRef.current;
    if (!el) return;
    // On mobile (portrait or landscape), let responsive CSS handle the layout instead of zoom scaling
    if (window.innerWidth <= 899 || (window.innerHeight <= 500 && window.innerWidth <= 900)) {
      el.style.removeProperty('zoom');
      return;
    }
    // Reset zoom before measuring natural height
    el.style.setProperty('zoom', '1');
    const naturalHeight = el.scrollHeight;
    const viewportHeight = window.innerHeight;
    const scale = Math.min(1, viewportHeight / naturalHeight);
    el.style.setProperty('zoom', String(scale));
    lastOuterRef.current = { w: window.outerWidth, h: window.outerHeight };
  }, []);

  useLayoutEffect(() => {
    applyScale();
  }, [applyScale, gameStarted]);

  useEffect(() => {
    const handleResize = () => {
      const isGenuineResize =
        window.outerHeight !== lastOuterRef.current.h ||
        window.outerWidth !== lastOuterRef.current.w;
      if (isGenuineResize) {
        applyScale();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [applyScale]);

  // Auto-trigger AI action when it becomes AI's turn
  useEffect(() => {
    // Only act during betting phases
    const bettingPhases = ['preflop', 'flop', 'turn', 'river'];
    if (!bettingPhases.includes(gamePhase)) return;
    
    // Don't act while dealing or during hole card animation
    if (isDealing || holeCardAnimating) return;
    
    // Check if current player is AI and hasn't acted
    if (currentPlayerIndex === -1 || currentPlayerIndex >= players.length) return;
    
    const currentPlayer = players[currentPlayerIndex];
    if (!currentPlayer || currentPlayer.isHuman || currentPlayer.hasFolded) return;
    
    // Prevent triggering if AI already acted this round or if AI action is already in progress
    if (currentPlayer.hasActedThisRound || aiActionDisplay) return;
    
    // Debug: log the state being passed to AI
    console.log('DEBUG: useEffect triggering AI action', {
      currentPlayerIndex,
      phase: gamePhase,
      pot,
      currentBet,
      aiCurrentBet: currentPlayer.currentBet,
      aiChips: currentPlayer.chips,
      callAmount: currentBet - currentPlayer.currentBet
    });
    
    // Trigger AI action
    triggerAiActionIfNeeded(currentPlayerIndex, players, pot, currentBet, gamePhase as 'preflop' | 'flop' | 'turn' | 'river');
    
  }, [currentPlayerIndex, gamePhase, isDealing, holeCardAnimating, players, pot, currentBet, aiActionDisplay]);

  // Reactively update player names and blind positions on the landing page
  useEffect(() => {
    if (!gameStarted) {
      setPlayers(prev => prev.map(player =>
        player.isHuman
          ? { ...player, name: humanPlayerName, isSmallBlind: !humanIsBigBlindFirst, isBigBlind: humanIsBigBlindFirst }
          : { ...player, isSmallBlind: humanIsBigBlindFirst, isBigBlind: !humanIsBigBlindFirst }
      ));
      setGameLog([{ timestamp: new Date(), message: `Game started! ${humanPlayerName} vs AI Player` }]);
    }
  }, [humanPlayerName, humanIsBigBlindFirst, gameStarted]);

  // Start the game with initialization parameters
  const startGame = () => {
    console.log('DEBUG: startGame called');
    console.log('DEBUG: humanIsBigBlindFirst =', humanIsBigBlindFirst);
    const initialPlayers = getInitialPlayers(humanPlayerName, humanIsBigBlindFirst);

    // Step 1: Dismiss overlay and reset state
    setGameStarted(true);
    setRoundNumber(1);
    setGameOver(false);
    setOverallWinner(null);
    setPlayers(initialPlayers);
    setCommunityCards([]);
    setBurnedCards([]);
    setPot(0);
    setCurrentBet(0);
    setCurrentPlayerIndex(-1);
    setRaiseAmount('');
    setWinner(null);
    setHandComplete(false);
    setPlayerLastActions({});
    setShowdownData(null);
    setAiCardsFlipping(false);
    setLastPotWon(0);
    setAiRaisedPreflop(false);
    setGameLog([{ timestamp: new Date(), message: `Game started! ${humanPlayerName} vs AI Player` }]);

    // Step 2: After overlay fades, post blinds with animation
    setTimeout(() => {
      const SMALL_BLIND = 5;
      const BIG_BLIND = 10;
      const newDeck = createDeck();
      setDeck(newDeck);

      const sbPlayer = initialPlayers.find(p => p.isSmallBlind)!;
      const bbPlayer = initialPlayers.find(p => p.isBigBlind)!;

      const playersWithBlinds = initialPlayers.map(player => {
        if (player.isSmallBlind) {
          return { ...player, chips: player.chips - SMALL_BLIND, currentBet: SMALL_BLIND };
        } else if (player.isBigBlind) {
          return { ...player, chips: player.chips - BIG_BLIND, currentBet: BIG_BLIND };
        }
        return player;
      });

      setPlayers(playersWithBlinds);
      setPot(SMALL_BLIND + BIG_BLIND);
      setCurrentBet(BIG_BLIND);

      verifyChipAccounting(playersWithBlinds, SMALL_BLIND + BIG_BLIND, 'startGame (after blinds posted)');

      setGameLog(prev => [
        ...prev,
        { timestamp: new Date(), message: `Round 1 - New hand dealt` },
        { timestamp: new Date(), message: `${sbPlayer.name} posts small blind $${SMALL_BLIND}` },
        { timestamp: new Date(), message: `${bbPlayer.name} posts big blind $${BIG_BLIND}` }
      ]);

      // Step 3: Deal hole cards (BB receives first card, SB receives last)
      setTimeout(() => {
        setGamePhase('preflop');

        const humanHand = newDeck.dealCards(2);
        const aiHand = newDeck.dealCards(2);

        const bbIsHuman = playersWithBlinds.find(p => p.isBigBlind)?.isHuman;
        const bbHand = bbIsHuman ? humanHand : aiHand;
        const sbHand = bbIsHuman ? aiHand : humanHand;

        const firstPlayerIndex = getFirstPlayerIndex(playersWithBlinds, 'preflop');

        setHoleCardAnimating(true);
        // Card 1 -> BB
        setTimeout(() => {
          setPlayers(prev => prev.map(player => ({
            ...player,
            cards: player.isBigBlind ? [bbHand[0]] : player.cards
          })));

          // Card 2 -> SB
          setTimeout(() => {
            setPlayers(prev => prev.map(player => ({
              ...player,
              cards: player.isSmallBlind ? [sbHand[0]] : player.cards
            })));

            // Card 3 -> BB
            setTimeout(() => {
              setPlayers(prev => prev.map(player => ({
                ...player,
                cards: player.isBigBlind ? bbHand : player.cards
              })));

              // Card 4 -> SB (last card dealt)
              setTimeout(() => {
                setPlayers(prev => prev.map(player => ({
                  ...player,
                  cards: player.isSmallBlind ? sbHand : player.cards
                })));

                setTimeout(() => {
                  setHoleCardAnimating(false);
                  setCurrentPlayerIndex(firstPlayerIndex);
                  // AI action will be triggered by the useEffect that watches for AI's turn
                }, 600);
              }, 300);
            }, 300);
          }, 300);
        }, 200);
      }, 500);
    }, 300);
  };

  // Reset game to initial state
  const resetGame = () => {
    console.log('DEBUG: resetGame called');
    setGameStarted(false);
    setGameOver(false);
    setOverallWinner(null);
    setRoundNumber(1);
    setGamePhase('waiting');
    setWinner(null);
    setHandComplete(false);
    setCommunityCards([]);
    setBurnedCards([]);
    setPot(0);
    setCurrentBet(0);
    setCurrentPlayerIndex(-1);
    setPlayers(getInitialPlayers(humanPlayerName, humanIsBigBlindFirst));
    setDeck(createDeck());
    setGameLog([{ timestamp: new Date(), message: `Game started! ${humanPlayerName} vs AI Player` }]);
    setPlayerLastActions({});
    setShowdownData(null);
    setAiCardsFlipping(false);
    setLastPotWon(0);
    setAiRaisedPreflop(false);
  };

  // Handle fold win - when someone folds, award pot immediately without revealing cards
  const handleFoldWin = (remainingPlayer: Player) => {
    console.log('DEBUG: handleFoldWin called for', remainingPlayer.name);
    console.log('DEBUG: handleFoldWin - current pot:', pot);
    console.log('DEBUG: handleFoldWin - current players:', players.map(p => ({ name: p.name, chips: p.chips, hasFolded: p.hasFolded })));
    
    const potAmount = pot;
    handleFoldWinWithPot(remainingPlayer, potAmount, players);
  };

  // Helper function that accepts pot and players as parameters to avoid stale closure issues
  const handleFoldWinWithPot = (remainingPlayer: Player, potAmount: number, currentPlayers: Player[]) => {
    console.log('DEBUG: handleFoldWinWithPot called for', remainingPlayer.name);
    console.log('DEBUG: handleFoldWinWithPot - potAmount:', potAmount);
    console.log('DEBUG: handleFoldWinWithPot - current players:', currentPlayers.map(p => ({ name: p.name, chips: p.chips, hasFolded: p.hasFolded })));

    // Log the pot value when someone folds and wins
    setGameLog(prev => [...prev, {
      timestamp: new Date(),
      message: `Betting round complete - Pot: $${potAmount} (opponent folded)`
    }]);

    const updatedPlayers = currentPlayers.map(player =>
      player.id === remainingPlayer.id
        ? { ...player, chips: player.chips + potAmount }
        : player
    );

    console.log('DEBUG: handleFoldWinWithPot - updated players:', updatedPlayers.map(p => ({ name: p.name, chips: p.chips })));
    console.log('DEBUG: handleFoldWinWithPot - setting handComplete to true');
    
    // Verify chip accounting - pot has been awarded so pot should now be 0
    verifyChipAccounting(updatedPlayers, 0, 'handleFoldWinWithPot (after pot awarded)');
    
    setPlayers(updatedPlayers);
    setWinner(remainingPlayer);
    setLastPotWon(potAmount); // Store pot amount for winner announcement
    setPot(0);
    setHandComplete(true);
    // DON'T set gamePhase to 'showdown' on fold - that would reveal AI cards
    // Keep the current phase so cards stay hidden
    setCurrentPlayerIndex(-1); // Ensure currentPlayerIndex is -1 to disable action buttons
    
    // Don't set showdown data - no need to show hands when someone folds
    setShowdownData(null);
    
    // Add simple message to game log
    setGameLog(prev => [...prev, { 
      timestamp: new Date(), 
      message: `${remainingPlayer.name} wins $${potAmount} - opponent folded` 
    }]);

    // Check for bust condition - player cannot afford big blind ($10)
    const bustedPlayers = updatedPlayers.filter(p => p.chips < 10);
    if (bustedPlayers.length > 0) {
      const remainingPlayers = updatedPlayers.filter(p => p.chips >= 10);
      const gameWinner = remainingPlayers[0];
      setOverallWinner(gameWinner);
      setGameOver(true);
      console.log('DEBUG: handleFoldWinWithPot - game over, winner:', gameWinner.name);
    } else {
      console.log('DEBUG: handleFoldWinWithPot - hand complete, waiting for next round button');
    }
  };

  const determineWinner = (potOverride?: number, playersOverride?: Player[], communityCardsOverride?: CardType[]) => {
    // FIX: Use overrides if provided to avoid stale React state closure issues
    const currentPlayers = playersOverride || players;
    const currentCommunityCards = communityCardsOverride || communityCards;
    console.log('DEBUG: determineWinner called with potOverride:', potOverride, 'playersOverride:', !!playersOverride, 'communityCardsOverride:', !!communityCardsOverride);

    const activePlayers = currentPlayers.filter(p => !p.hasFolded);

    let updatedPlayers = [...currentPlayers];
    let winningPlayer: Player | null = null;
    let showdownHands: { player: Player; pokerHand: PokerHand; isWinner: boolean }[] = [];
    let communityCardsUsed: CardType[] = [];
    let isTie = false;
    
    // CRITICAL FIX: Use potOverride if provided (to avoid stale state issues),
    // otherwise use the pot state variable which contains the accumulated pot from ALL betting rounds.
    // currentBet values only contain the CURRENT betting round's bets (they get reset each phase).
    const calculatedPotAmount = currentPlayers.reduce((sum, player) => sum + player.currentBet, 0);
    
    // Priority: 1) potOverride (passed directly to avoid stale state), 2) pot state, 3) calculated from currentBet
    let potAmount: number;
    if (potOverride !== undefined && potOverride > 0) {
      potAmount = potOverride;
      console.log('DEBUG: determineWinner - using potOverride:', potOverride);
    } else if (pot > 0) {
      potAmount = pot;
      console.log('DEBUG: determineWinner - using pot state:', pot);
    } else {
      potAmount = calculatedPotAmount;
      console.log('DEBUG: determineWinner - using calculated pot:', calculatedPotAmount);
    }
    
    console.log('DEBUG: determineWinner - pot state:', pot, 'potOverride:', potOverride, 'calculated from currentBet:', calculatedPotAmount, 'FINAL potAmount:', potAmount);
    console.log('DEBUG: determineWinner - player chips before award:', currentPlayers.map(p => ({ name: p.name, chips: p.chips, currentBet: p.currentBet })));

    if (activePlayers.length === 1) {
      // Only one player left, they win by default
      winningPlayer = activePlayers[0];
      updatedPlayers = updatedPlayers.map(player =>
        player.id === winningPlayer!.id
          ? { ...player, chips: player.chips + potAmount }
          : player
      );

      // For showdown display, still evaluate the hand
      const playerHand = evaluateHand(winningPlayer.cards, currentCommunityCards);
      showdownHands = [{
        player: winningPlayer,
        pokerHand: playerHand,
        isWinner: true
      }];
      communityCardsUsed = playerHand.cards.filter(card =>
        currentCommunityCards.some(commCard => commCard.rank === card.rank && commCard.suit === card.suit)
      );
    } else {
      // Multiple players still active, evaluate hands
      const playerHands: { player: Player; hand: PokerHand }[] = activePlayers.map(player => ({
        player,
        hand: evaluateHand(player.cards, currentCommunityCards)
      }));

      // Find the best hand and check for ties
      let bestHandIndex = 0;
      for (let i = 1; i < playerHands.length; i++) {
        const comparison = compareHands(playerHands[i].hand, playerHands[bestHandIndex].hand);
        if (comparison > 0) {
          bestHandIndex = i;
        }
      }

      // Check if there's a tie (for 2-player game)
      if (playerHands.length === 2) {
        const comparison = compareHands(playerHands[0].hand, playerHands[1].hand);
        if (comparison === 0) {
          isTie = true;
        }
      }

      if (isTie) {
        // Split pot between tied players
        const splitAmount = Math.floor(potAmount / 2);
        updatedPlayers = updatedPlayers.map(player => {
          if (activePlayers.some(ap => ap.id === player.id)) {
            return { ...player, chips: player.chips + splitAmount };
          }
          return player;
        });
        
        // Both players are "winners" in a tie
        showdownHands = playerHands.map(ph => ({
          player: ph.player,
          pokerHand: ph.hand,
          isWinner: true
        }));
        
        // Use first player for the winner reference (both actually won)
        winningPlayer = playerHands[0].player;
      } else {
        winningPlayer = playerHands[bestHandIndex].player;

        // Award the pot to the winner
        updatedPlayers = updatedPlayers.map(player =>
          player.id === winningPlayer!.id
            ? { ...player, chips: player.chips + potAmount }
            : player
        );

        // Prepare showdown data for all active players
        showdownHands = playerHands.map((ph, index) => ({
          player: ph.player,
          pokerHand: ph.hand,
          isWinner: index === bestHandIndex
        }));
      }

      // Get community cards used in the winning hand (or first player's hand in case of tie)
      communityCardsUsed = playerHands[bestHandIndex].hand.cards.filter(card =>
        currentCommunityCards.some(commCard => commCard.rank === card.rank && commCard.suit === card.suit)
      );
    }

    // Set showdown data for display
    setShowdownData({
      hands: showdownHands,
      communityCardsUsed,
      potAmount: potAmount,
      isTie: isTie
    });

    console.log('DEBUG: determineWinner - player chips AFTER award:', updatedPlayers.map(p => ({ name: p.name, chips: p.chips })));
    console.log('DEBUG: determineWinner - awarding potAmount:', potAmount, 'to winner:', winningPlayer?.name);
    
    // Verify chip accounting - pot has been awarded so pot should now be 0
    verifyChipAccounting(updatedPlayers, 0, 'determineWinner (after pot awarded)');
    
    setPlayers(updatedPlayers);
    setWinner(winningPlayer);
    setLastPotWon(potAmount); // Store pot amount for winner announcement
    
    // Reset pot to 0 after awarding it to the winner
    console.log('DEBUG: determineWinner - resetting pot from', pot, 'to 0');
    setPot(0);
    console.log('DEBUG: Setting handComplete to true in determineWinner');
    setHandComplete(true);
    
    // Add to game log with detailed hand comparison
    const winningHandDesc = showdownHands.find(h => h.isWinner)?.pokerHand.description || 'best hand';
    if (isTie && showdownHands.length > 1) {
      // Tie - split pot
      const splitAmount = Math.floor(potAmount / 2);
      setGameLog(prev => [...prev, { 
        timestamp: new Date(), 
        message: `Split pot! Both players have ${winningHandDesc} - each receives $${splitAmount}` 
      }]);
    } else if (showdownHands.length > 1) {
      // Show comparison in game log
      const losingHand = showdownHands.find(h => !h.isWinner);
      const losingHandDesc = losingHand?.pokerHand.description || 'unknown hand';
      setGameLog(prev => [...prev, { 
        timestamp: new Date(), 
        message: `${winningPlayer!.name} wins $${potAmount} with ${winningHandDesc} (beats ${losingHand?.player.name}'s ${losingHandDesc})` 
      }]);
    } else {
      setGameLog(prev => [...prev, { timestamp: new Date(), message: `${winningPlayer!.name} wins $${potAmount} with ${winningHandDesc}` }]);
    }

    // Check for bust condition (player cannot afford big blind $10) - happens in both cases
    const bustedPlayers = updatedPlayers.filter(p => p.chips < 10);
    if (bustedPlayers.length > 0) {
      // Game over - one player has gone bust
      const remainingPlayers = updatedPlayers.filter(p => p.chips >= 10);
      const gameWinner = remainingPlayers[0]; // Should only be one remaining player
      setOverallWinner(gameWinner);
      setGameOver(true);
    }
  };

  const dealNewHand = (playersToUse?: Player[]) => {
    // Use provided players or fall back to current state
    const currentPlayers = playersToUse || players;
    
    // Verify chip accounting at start of new hand - pot should be 0 from previous round
    verifyChipAccounting(currentPlayers, 0, 'dealNewHand (start of new hand)');
    
    console.log('DEBUG: dealNewHand called with playersToUse?', !!playersToUse);
    console.log('DEBUG: dealNewHand - currentPlayers[0] (human):', 
      'name=' + currentPlayers[0].name,
      'isSmallBlind=' + currentPlayers[0].isSmallBlind,
      'isBigBlind=' + currentPlayers[0].isBigBlind
    );
    console.log('DEBUG: dealNewHand - currentPlayers[1] (ai):', 
      'name=' + currentPlayers[1].name,
      'isSmallBlind=' + currentPlayers[1].isSmallBlind,
      'isBigBlind=' + currentPlayers[1].isBigBlind
    );
    setGameLog(prev => [...prev, { timestamp: new Date(), message: `Round ${roundNumber} - New hand dealt` }]);
    const newDeck = createDeck();

    // Deal hole cards to players
    const humanHand = newDeck.dealCards(2);
    const aiHand = newDeck.dealCards(2);

    // Reset player states for new hand
    const resetPlayers = currentPlayers.map(player => ({
      ...player,
      cards: [], // Start with no cards visible
      currentBet: 0,
      hasFolded: false,
      hasActedThisRound: false, // Reset for new betting round
    }));

    // Post blinds ($5 small blind, $10 big blind)
    const SMALL_BLIND = 5;
    const BIG_BLIND = 10;

    const playersWithBlinds = resetPlayers.map(player => {
      if (player.isSmallBlind) {
        return { ...player, chips: Math.max(0, player.chips - SMALL_BLIND), currentBet: SMALL_BLIND };
      } else if (player.isBigBlind) {
        return { ...player, chips: Math.max(0, player.chips - BIG_BLIND), currentBet: BIG_BLIND };
      }
      return player;
    });

    // Verify chip accounting after blinds posted - pot will be $15
    verifyChipAccounting(playersWithBlinds, SMALL_BLIND + BIG_BLIND, 'dealNewHand (after blinds posted)');

    setDeck(newDeck);
    setPlayers(playersWithBlinds);
    setCommunityCards([]); // Start with no community cards visible
    setBurnedCards([]); // Reset burned cards for new hand
    setPot(SMALL_BLIND + BIG_BLIND);
    setCurrentBet(BIG_BLIND);
    // Pre-flop: Small blind acts first (after blinds are posted)
    console.log('DEBUG: dealNewHand - playersWithBlinds[0]:', 
      'name=' + playersWithBlinds[0].name,
      'isSmallBlind=' + playersWithBlinds[0].isSmallBlind,
      'isBigBlind=' + playersWithBlinds[0].isBigBlind
    );
    console.log('DEBUG: dealNewHand - playersWithBlinds[1]:', 
      'name=' + playersWithBlinds[1].name,
      'isSmallBlind=' + playersWithBlinds[1].isSmallBlind,
      'isBigBlind=' + playersWithBlinds[1].isBigBlind
    );
    const firstPlayerIndex = getFirstPlayerIndex(playersWithBlinds, 'preflop');
    console.log('DEBUG: dealNewHand - firstPlayerIndex:', firstPlayerIndex);
    setCurrentPlayerIndex(firstPlayerIndex);
    setGamePhase('preflop');
    setRaiseAmount('');
    setWinner(null);
    console.log('DEBUG: Setting handComplete to false in dealNewHand');
    setHandComplete(false);
    setPlayerLastActions({}); // Reset last actions for new hand
    setShowdownData(null); // Clear showdown data
    setAiCardsFlipping(false); // Reset flip animation state
    setLastPotWon(0); // Reset last pot won
    setAiRaisedPreflop(false); // Reset preflop aggressor tracking

    // Determine deal order based on blinds: BB gets first card, SB gets last
    const bbIsHuman = playersWithBlinds.find(p => p.isBigBlind)?.isHuman;
    const bbHand = bbIsHuman ? humanHand : aiHand;
    const sbHand = bbIsHuman ? aiHand : humanHand;

    // Animate hole card dealing (BB first, SB last)
    setHoleCardAnimating(true);
    setTimeout(() => {
      // Card 1 -> BB
      setPlayers(prev => prev.map(player => ({
        ...player,
        cards: player.isBigBlind ? [bbHand[0]] : player.cards
      })));

      setTimeout(() => {
        // Card 2 -> SB
        setPlayers(prev => prev.map(player => ({
          ...player,
          cards: player.isSmallBlind ? [sbHand[0]] : player.cards
        })));

        setTimeout(() => {
          // Card 3 -> BB
          setPlayers(prev => prev.map(player => ({
            ...player,
            cards: player.isBigBlind ? bbHand : player.cards
          })));

          setTimeout(() => {
            // Card 4 -> SB (last card dealt)
            setPlayers(prev => prev.map(player => ({
              ...player,
              cards: player.isSmallBlind ? sbHand : player.cards
            })));

            setTimeout(() => {
              setHoleCardAnimating(false);
              // AI action will be triggered by the useEffect that watches for AI's turn
            }, 600); // Animation duration
          }, 300); // Delay between cards
        }, 300);
      }, 300);
    }, 200); // Initial delay
  };

  // Start next round with blind rotation (chips persist across hands)
  const startNextRound = () => {
    console.log('DEBUG: startNextRound called, current players chips:', players.map(p => ({ name: p.name, chips: p.chips })));
    
    // Verify chip accounting at start of next round - pot should be 0
    verifyChipAccounting(players, 0, 'startNextRound (before blind rotation)');
    
    // Rotate blind positions - chips persist across hands
    const nextRoundPlayers = players.map(player => ({
      ...player,
      // chips persist - do not reset
      isSmallBlind: !player.isSmallBlind,  // Swap small blind
      isBigBlind: !player.isBigBlind,       // Swap big blind
    }));

    setPlayers(nextRoundPlayers);
    setRoundNumber(roundNumber + 1);
    setWinner(null);
    console.log('DEBUG: Setting handComplete to false in startNextRound');
    setHandComplete(false);
    setShowdownData(null); // Clear showdown data
    setAiCardsFlipping(false); // Reset flip animation state
    setLastPotWon(0); // Reset last pot won
    setAiRaisedPreflop(false); // Reset preflop aggressor tracking

    // Start new hand after a brief delay - pass rotated players directly to avoid stale closure
    setTimeout(() => {
      dealNewHand(nextRoundPlayers);
    }, 500);
  };

  // Handler for closing showdown modal and starting next round
  const handleShowdownModalClose = () => {
    if (handComplete && !gameOver) {
      startNextRound();
    }
  };

  // Helper function to get indices of community cards used in a player's best hand
  const getUsedCommunityCardIndices = (pokerHand: PokerHand | undefined, commCards: CardType[]): number[] => {
    if (!pokerHand) return [];
    return commCards
      .map((cc, idx) =>
        pokerHand.cards.some(hc => hc.rank === cc.rank && hc.suit === cc.suit) ? idx : -1
      )
      .filter(idx => idx !== -1);
  };

  // Helper function to get indices of hole cards used in a player's best hand
  const getUsedHoleCardIndices = (pokerHand: PokerHand | undefined, holeCards: CardType[]): number[] => {
    if (!pokerHand) return [];
    return holeCards
      .map((hc, idx) =>
        pokerHand.cards.some(pc => pc.rank === hc.rank && pc.suit === hc.suit) ? idx : -1
      )
      .filter(idx => idx !== -1);
  };

  // Function to deal remaining community cards when all players are all-in, then go to showdown
  const dealRemainingCommunityCards = (currentDeck: Deck, currentPhase: string, potToLog: number, currentPlayers: Player[]) => {
    // Determine which cards still need to be dealt based on current phase
    type PhaseDeal = { burn: boolean; cards: number; phaseName: string };
    const remainingPhases: PhaseDeal[] = [];

    if (currentPhase === 'preflop' || currentPhase === 'waiting') {
      remainingPhases.push({ burn: true, cards: 3, phaseName: 'flop' });   // flop: burn 1, deal 3
      remainingPhases.push({ burn: true, cards: 1, phaseName: 'turn' });   // turn: burn 1, deal 1
      remainingPhases.push({ burn: true, cards: 1, phaseName: 'river' });  // river: burn 1, deal 1
    } else if (currentPhase === 'flop') {
      remainingPhases.push({ burn: true, cards: 1, phaseName: 'turn' });
      remainingPhases.push({ burn: true, cards: 1, phaseName: 'river' });
    } else if (currentPhase === 'turn') {
      remainingPhases.push({ burn: true, cards: 1, phaseName: 'river' });
    }
    // If already at river or showdown, nothing to deal

    if (remainingPhases.length === 0) {
      // Already at river/showdown - just determine winner
      setGamePhase('showdown');
      setCurrentPlayerIndex(-1);
      setAiCardsFlipping(true);
      setTimeout(() => {
        determineWinner(potToLog, currentPlayers, communityCards);
        setTimeout(() => setAiCardsFlipping(false), 1000);
      }, 1000);
      return;
    }

    setIsDealing(true);

    // Flip AI cards face-up first so user can watch the runout
    setAiCardsFlipping(true);

    // Pre-deal all cards from deck upfront (avoids timing issues with mutable deck in setTimeout)
    const preDealtCards: { type: 'burn' | 'community'; card: CardType; phaseIndex: number }[] = [];
    remainingPhases.forEach((phase, phaseIndex) => {
      if (phase.burn) {
        preDealtCards.push({ type: 'burn', card: currentDeck.dealCard()!, phaseIndex });
      }
      for (let i = 0; i < phase.cards; i++) {
        preDealtCards.push({ type: 'community', card: currentDeck.dealCard()!, phaseIndex });
      }
    });

    // Build final community cards array (for passing to determineWinner later)
    const finalCommunityCards: CardType[] = [
      ...communityCards,
      ...preDealtCards.filter(c => c.type === 'community').map(c => c.card)
    ];

    // Animate dealing with staggered timing
    let totalDelay = 600; // initial delay for AI card flip
    let currentBurnIndex = burnedCards.length;
    let currentCommunityIndex = communityCards.length;

    let burnCardCounter = 0;
    let communityCardCounter = 0;

    remainingPhases.forEach((phase, phaseIndex) => {
      // Burn card animation
      if (phase.burn) {
        const burnCard = preDealtCards.filter(c => c.type === 'burn')[burnCardCounter].card;
        burnCardCounter++;
        const burnIdx = currentBurnIndex;
        currentBurnIndex++;
        const burnDelay = totalDelay;
        setTimeout(() => {
          setBurnAnimatingIndex(burnIdx);
          setBurnedCards(prev => [...prev, burnCard]);
          setTimeout(() => setBurnAnimatingIndex(null), 500);
        }, burnDelay);
        totalDelay += 700;
      }

      // Deal community cards for this phase
      const cardsForPhase = phase.cards;
      for (let i = 0; i < cardsForPhase; i++) {
        const card = preDealtCards.filter(c => c.type === 'community')[communityCardCounter].card;
        communityCardCounter++;
        const cardIdx = currentCommunityIndex;
        currentCommunityIndex++;
        const cardDelay = totalDelay;
        setTimeout(() => {
          setCommunityCards(prev => [...prev, card]);
          setAnimatingCardIndices([cardIdx]);
          setTimeout(() => setAnimatingCardIndices([]), 400);
        }, cardDelay);
        totalDelay += 600;
      }

      // Update the displayed phase name as we deal
      const phaseNameDelay = totalDelay - 200;
      const phaseName = phase.phaseName;
      setTimeout(() => {
        setGamePhase(phaseName as typeof gamePhase);
        setGameLog(prev => [...prev, {
          timestamp: new Date(),
          message: `${phaseName.charAt(0).toUpperCase() + phaseName.slice(1)} dealt`
        }]);
      }, phaseNameDelay);

      totalDelay += 400; // pause between phases
    });

    // After all cards dealt, go to showdown and determine winner
    const showdownDelay = totalDelay;
    setTimeout(() => {
      setGamePhase('showdown');
      setCurrentPlayerIndex(-1);
      setIsDealing(false);
      setAnimatingCardIndices([]);

      // After flip animation completes, switch to normal render (which includes highlight glow)
      setTimeout(() => {
        setAiCardsFlipping(false);
      }, 1000);

      // Pass the pre-computed finalCommunityCards directly to avoid stale closure
      setTimeout(() => {
        determineWinner(potToLog, currentPlayers, finalCommunityCards);
      }, 1200);
    }, showdownDelay);
  };

  // Function to transition to the next game phase
  const advanceGamePhase = (potValue?: number, playersOverride?: Player[]) => {
    // FIX: Use playersOverride if provided to avoid stale React state issues
    const currentPlayers = playersOverride || players;
    console.log('DEBUG: advanceGamePhase called, players at start:', currentPlayers.map(p => ({ name: p.name, chips: p.chips })));

    // Use provided potValue or get latest from state to avoid stale closure
    const potToLog = potValue !== undefined ? potValue : pot;

    const activePlayers = currentPlayers.filter(p => !p.hasFolded);

    // If only one player remains (someone folded), award pot immediately
    if (activePlayers.length <= 1) {
      console.log('DEBUG: advanceGamePhase - only one active player, awarding pot');
      setCurrentPlayerIndex(-1);
      
      // FIX: Use values already computed at function call time instead of nested state updates
      // The nested setPot/setPlayers pattern was causing race conditions where the outer
      // functional updates would overwrite the changes made by handleFoldWinWithPot
      const potToAward = potToLog; // Use the pot value computed at function start
      const remainingPlayer = activePlayers[0];
      
      if (remainingPlayer) {
        setTimeout(() => {
          // Pass the captured values directly - handleFoldWinWithPot will properly
          // update state without being overwritten by outer functional updates
          handleFoldWinWithPot(remainingPlayer, potToAward, currentPlayers);
        }, 500);
      }
      return;
    }

    // Check if any active player is all-in (has 0 chips) - in a 2-player game,
    // once one player is all-in and betting round is complete, deal remaining cards automatically
    const anyPlayerAllIn = activePlayers.some(player => player.chips === 0);
    if (anyPlayerAllIn) {
      console.log('At least one player is all-in, dealing remaining community cards');
      console.log('DEBUG: advanceGamePhase all-in - potToLog:', potToLog);

      // Log the pot value when all players go all-in
      setGameLog(prev => [...prev, {
        timestamp: new Date(),
        message: `Betting round complete - Pot: $${potToLog} (all players all-in)`
      }]);

      // Deal remaining community cards with animation before going to showdown
      setCurrentPlayerIndex(-1);
      dealRemainingCommunityCards(deck, gamePhase, potToLog, currentPlayers);
      return;
    }

    // Log the betting pot value at the end of each betting round (normal completion)
    setGameLog(prev => [...prev, {
      timestamp: new Date(),
      message: `Betting round complete - Pot: $${potToLog}`
    }]);

    setIsDealing(true);

    let newCommunityCards = [...communityCards];
    let newBurnedCards = [...burnedCards];
    let cardsToDeal: CardType[] = [];
    let newPhase: typeof gamePhase;

    switch (gamePhase) {
      case 'preflop':
        // Burn 1 card, then deal flop (3 community cards)
        setGameLog(prev => [...prev, { timestamp: new Date(), message: 'Flop dealt - 3 community cards revealed' }]);
        newBurnedCards.push(deck.dealCard()!);
        cardsToDeal = deck.dealCards(3);
        newCommunityCards = cardsToDeal;
        newPhase = 'flop';
        break;
      case 'flop':
        // Burn 1 card, then deal turn (1 more community card)
        setGameLog(prev => [...prev, { timestamp: new Date(), message: 'Turn dealt - 4th community card revealed' }]);
        newBurnedCards.push(deck.dealCard()!);
        cardsToDeal = deck.dealCards(1);
        newCommunityCards = [...communityCards, ...cardsToDeal];
        newPhase = 'turn';
        break;
      case 'turn':
        // Burn 1 card, then deal river (1 more community card)
        setGameLog(prev => [...prev, { timestamp: new Date(), message: 'River dealt - 5th community card revealed' }]);
        newBurnedCards.push(deck.dealCard()!);
        cardsToDeal = deck.dealCards(1);
        newCommunityCards = [...communityCards, ...cardsToDeal];
        newPhase = 'river';
        break;
      case 'river':
        // Move to showdown
        setGameLog(prev => [...prev, { timestamp: new Date(), message: 'Showdown! Revealing all hands' }]);
        newPhase = 'showdown';
        setCurrentPlayerIndex(-1);
        setGamePhase('showdown'); // Set phase immediately so flip animation can work
        console.log('DEBUG: River to Showdown - potToLog:', potToLog);
        
        // Check if both players are still active (showdown scenario)
        const activePlayersAtShowdown = currentPlayers.filter(p => !p.hasFolded);
        console.log('DEBUG: River to Showdown - activePlayersAtShowdown:', activePlayersAtShowdown.length);
        if (activePlayersAtShowdown.length > 1) {
          // Trigger flip animation for AI cards
          console.log('DEBUG: Triggering AI card flip animation');
          setAiCardsFlipping(true);
          // After flip animation completes, determine winner
          setTimeout(() => {
            determineWinner(potToLog, currentPlayers);
            setIsDealing(false);
            // Reset flip animation state after animation completes
            setTimeout(() => {
              setAiCardsFlipping(false);
            }, 1000); // Match animation duration
          }, 1000); // Wait for flip animation
        } else {
          // Only one player left, no flip needed
          console.log('DEBUG: Only one player active, skipping flip animation');
          setTimeout(() => {
            determineWinner(potToLog, currentPlayers);
            setIsDealing(false);
          }, 500);
        }
        break;
      default:
        setIsDealing(false);
        return; // Don't advance from other phases
    }

    if (gamePhase !== 'river') {
      // First animate the burn card
      setBurnAnimatingIndex(burnedCards.length);

      setTimeout(() => {
        setBurnedCards(newBurnedCards);
        setBurnAnimatingIndex(null);

        // For flop, implement staggered card reveals
        if (gamePhase === 'preflop') {
          // Flop: Deal 3 cards with staggered timing
          const flopCards = cardsToDeal;
          let currentCardIndex = 0;

          const dealNextFlopCard = () => {
            if (currentCardIndex < flopCards.length) {
              // Add one card at a time using functional update to get current length
              const cardToAdd = flopCards[currentCardIndex];
              
              setCommunityCards(prev => {
                const newCards = [...prev, cardToAdd];
                const cardIndex = prev.length;
                // Set animation index after cards are added
                setTimeout(() => {
                  setAnimatingCardIndices([cardIndex]);
                }, 10);
                return newCards;
              });

              currentCardIndex++;

              // Schedule next card after animation delay
              setTimeout(() => {
                setAnimatingCardIndices([]); // Clear animation for previous card
                dealNextFlopCard(); // Deal next card
              }, 900); // 900ms delay to allow animation to complete
            } else {
              // All flop cards dealt, complete the phase transition
              setTimeout(() => {
                setGamePhase(newPhase);
                setDeck(deck);
                setIsDealing(false);

                // Reset current bets for new betting round using functional update to get latest state
                setPlayers(prevPlayers => {
                  console.log('DEBUG: Flop phase transition - players before reset:', prevPlayers.map(p => ({ name: p.name, chips: p.chips })));
                  const resetBetPlayers = prevPlayers.map(player => ({
                    ...player,
                    currentBet: 0,
                    hasActedThisRound: false, // Reset for new betting round
                  }));
                  console.log('DEBUG: Flop phase transition - players after reset:', resetBetPlayers.map(p => ({ name: p.name, chips: p.chips })));
                  
                  // Post-flop: Big blind acts first (newPhase is 'flop' in this context)
                  const firstActivePlayerIndex = getFirstPlayerIndex(resetBetPlayers, newPhase as 'flop' | 'turn' | 'river');
                  setCurrentPlayerIndex(firstActivePlayerIndex);
                  
                  return resetBetPlayers;
                });
                setCurrentBet(0);

                // Clear phase announcement after animation
                setTimeout(() => {
                  setPhaseAnnouncement(null);
                }, 2500);
              }, 400); // Brief pause after last card
            }
          };

          // Start dealing the first flop card
          setTimeout(dealNextFlopCard, 300);
        } else {
          // Turn/River: Deal single card with animation
          // Use functional update to get the correct index
          setCommunityCards(prev => {
            const cardIndex = prev.length;
            // Set animation index after card is added
            setTimeout(() => {
              setAnimatingCardIndices([cardIndex]);
            }, 10);
            return newCommunityCards;
          });

          // Complete the phase transition after animation
          setTimeout(() => {
            setGamePhase(newPhase);
            setDeck(deck);
            setAnimatingCardIndices([]);
            setIsDealing(false);

            // Reset current bets for new betting round using functional update to get latest state
            setPlayers(prevPlayers => {
              console.log('DEBUG: Phase transition - players before reset:', prevPlayers.map(p => ({ name: p.name, chips: p.chips })));
              const resetBetPlayers = prevPlayers.map(player => ({
                ...player,
                currentBet: 0,
                hasActedThisRound: false, // Reset for new betting round
              }));
              console.log('DEBUG: Phase transition - players after reset:', resetBetPlayers.map(p => ({ name: p.name, chips: p.chips })));
              
              // Post-flop: Big blind acts first (newPhase is 'turn' or 'river' in this context)
              const firstActivePlayerIndex = getFirstPlayerIndex(resetBetPlayers, newPhase as 'flop' | 'turn' | 'river');
              setCurrentPlayerIndex(firstActivePlayerIndex);
              
              return resetBetPlayers;
            });
            setCurrentBet(0);

            // Clear phase announcement after animation
            setTimeout(() => {
              setPhaseAnnouncement(null);
            }, 2500);
          }, 1200); // Wait for single card dealing animation
        }
      }, 1000); // Wait for burn animation
    }
  };

  // Function to trigger AI action if it's AI's turn to act
  const triggerAiActionIfNeeded = (playerIndex: number, currentPlayers: Player[], currentPotAmount: number, currentBetAmount: number, phase: typeof gamePhase) => {
    if (playerIndex === -1) return;
    
    const currentPlayer = currentPlayers[playerIndex];
    if (!currentPlayer || currentPlayer.isHuman || currentPlayer.hasFolded) return;
    
    console.log('DEBUG: triggerAiActionIfNeeded called', {
      playerIndex,
      aiCurrentBet: currentPlayer.currentBet,
      aiChips: currentPlayer.chips,
      currentPotAmount,
      currentBetAmount,
      callAmount: currentBetAmount - currentPlayer.currentBet,
      phase
    });
    
    // Show AI thinking animation
    setAiActionDisplay({ action: '', isThinking: true });
    
    setTimeout(() => {
      const aiPlayer = currentPlayers[playerIndex];
      const activePlayersCount = currentPlayers.filter(p => !p.hasFolded).length;
      
      console.log('DEBUG: Calling getAIDecision with', {
        aiCurrentBet: aiPlayer.currentBet,
        aiChips: aiPlayer.chips,
        currentBetAmount,
        currentPotAmount,
        communityCardsCount: communityCards.length,
        phase: phase
      });
      
      // Find opponent (human player) for position/stack-depth awareness
      const humanPlayer = currentPlayers.find(p => p.isHuman);
      // In heads-up: SB acts first preflop (OOP), but last postflop (IP)
      const isAiInPosition = phase === 'preflop' ? !aiPlayer.isSmallBlind : aiPlayer.isSmallBlind;

      const aiDecision = getAIDecision(
        aiPlayer,
        communityCards,
        currentBetAmount,
        currentPotAmount,
        phase,
        activePlayersCount,
        aiPersonality,
        humanPlayer?.chips,
        isAiInPosition,
        aiRaisedPreflop
      );
      
      console.log('DEBUG: AI decision:', aiDecision);
      
      let aiBetAmount = 0;
      let updatedPlayers = [...currentPlayers];
      let updatedPot = currentPotAmount;
      let updatedCurrentBet = currentBetAmount;
      let aiActionText = '';
      
      switch (aiDecision.action) {
        case 'fold':
          updatedPlayers[playerIndex] = {
            ...aiPlayer,
            hasFolded: true,
            hasActedThisRound: true,
          };
          setAiActionDisplay({ action: 'folds', isThinking: false });
          aiActionText = 'Fold';
          break;
          
        case 'call':
          aiBetAmount = Math.max(0, updatedCurrentBet - aiPlayer.currentBet);
          if (aiPlayer.chips >= aiBetAmount) {
            updatedPlayers[playerIndex] = {
              ...aiPlayer,
              chips: Math.max(0, aiPlayer.chips - aiBetAmount),
              currentBet: aiPlayer.currentBet + aiBetAmount,
              hasActedThisRound: true,
            };
            updatedPot += aiBetAmount;
            setAiActionDisplay({ action: aiBetAmount === 0 ? 'checks' : 'calls', amount: aiBetAmount, isThinking: false });
            aiActionText = aiBetAmount === 0 ? 'Check' : `Call $${aiBetAmount}`;
          }
          break;
          
        case 'raise':
          const raiseAmount = aiDecision.amount || 0;
          const callAmount = Math.max(0, updatedCurrentBet - aiPlayer.currentBet);
          const totalRaiseAmount = callAmount + raiseAmount;
          
          if (aiPlayer.chips >= totalRaiseAmount) {
            updatedPlayers[playerIndex] = {
              ...aiPlayer,
              chips: Math.max(0, aiPlayer.chips - totalRaiseAmount),
              currentBet: aiPlayer.currentBet + totalRaiseAmount,
              hasActedThisRound: true,
            };
            updatedPlayers = updatedPlayers.map((player, index) => ({
              ...player,
              hasActedThisRound: index === playerIndex ? true : false,
            }));
            updatedPot += totalRaiseAmount;
            updatedCurrentBet = aiPlayer.currentBet + totalRaiseAmount;
            setAiActionDisplay({ action: 'raises', amount: totalRaiseAmount, isThinking: false });
            aiActionText = `Raise $${totalRaiseAmount}`;
            // Track if AI raised preflop (for c-bet accuracy)
            if (phase === 'preflop') setAiRaisedPreflop(true);
          } else {
            // Fallback to call
            const fallbackCallAmount = Math.max(0, updatedCurrentBet - aiPlayer.currentBet);
            if (aiPlayer.chips >= fallbackCallAmount) {
              updatedPlayers[playerIndex] = {
                ...aiPlayer,
                chips: Math.max(0, aiPlayer.chips - fallbackCallAmount),
                currentBet: aiPlayer.currentBet + fallbackCallAmount,
                hasActedThisRound: true,
              };
              updatedPot += fallbackCallAmount;
              setAiActionDisplay({ action: 'calls', amount: fallbackCallAmount, isThinking: false });
              aiActionText = `Call $${fallbackCallAmount}`;
            }
          }
          break;
      }
      
      // Update last action for AI player
      setPlayerLastActions(prev => ({
        ...prev,
        [aiPlayer.id]: aiActionText
      }));
      
      // Add to game log
      setGameLog(prev => [...prev, { timestamp: new Date(), message: `AI Player ${aiActionText.toLowerCase()}` }]);
      
      console.log('DEBUG: AI action - setting pot to:', updatedPot, '(was:', currentPotAmount, ')');
      setPot(updatedPot);
      setCurrentBet(updatedCurrentBet);
      setPlayers(updatedPlayers);
      
      // Clear AI action display after a delay
      setTimeout(() => {
        setAiActionDisplay(null);
      }, 2500);
      
      // Check if betting round is complete or if AI folded
      const aiActivePlayers = updatedPlayers.filter(p => !p.hasFolded);

      if (aiDecision.action === 'fold' && aiActivePlayers.length === 1) {
        console.log('DEBUG: AI folded, awarding pot to remaining player');
        setCurrentPlayerIndex(-1);
        setTimeout(() => {
          handleFoldWinWithPot(aiActivePlayers[0], updatedPot, updatedPlayers);
        }, 500);
        return;
      }

      // Check if betting round is complete after AI action
      const aiBettingRoundComplete = isBettingRoundComplete(updatedPlayers, updatedCurrentBet);

      if (aiBettingRoundComplete) {
        // Advance to next phase
        console.log('DEBUG: AI action completed betting round, advancing to next phase');
        advanceGamePhase(updatedPot, updatedPlayers);
        return;
      }

      // Move to next player (human)
      const nextPlayerIndex = getNextActivePlayerIndex(updatedPlayers, playerIndex);
      setCurrentPlayerIndex(nextPlayerIndex);
      
    }, 1500);
  };

  // Function to check if betting round is complete
  const isBettingRoundComplete = (players: Player[], currentBet: number): boolean => {
    return _isBettingRoundComplete(players, currentBet);
  };

  // Get the index of the player who should act first in the current betting round
  const getFirstPlayerIndex = (players: Player[], phase: 'preflop' | 'flop' | 'turn' | 'river'): number => {
    return _getFirstPlayerIndex(players, phase);
  };

  const getNextActivePlayerIndex = (players: Player[], currentIndex: number): number => {
    return _getNextActivePlayerIndex(players, currentIndex);
  };

  // Validation functions for betting actions
  const validateFoldAction = (player: Player, gamePhase: string) => {
    return _validateFoldAction(player, gamePhase);
  };

  const validateCallAction = (player: Player, currentBet: number, gamePhase: string) => {
    return _validateCallAction(player, currentBet, gamePhase);
  };

  const validateRaiseAction = (player: Player, currentBet: number, raiseAmountStr: string, gamePhase: string) => {
    return _validateRaiseAction(player, currentBet, raiseAmountStr, gamePhase, players);
  };

  const handleBettingAction = (action: 'fold' | 'call' | 'raise') => {
    const currentPlayer = players[currentPlayerIndex];

    // Basic validation - only human player can trigger actions and only when it's their turn
    if (!currentPlayer || !currentPlayer.isHuman) {
      console.warn('Invalid action: Only human player can perform actions');
      return;
    }

    // Ensure it's actually the human player's turn
    if (currentPlayerIndex < 0 || currentPlayerIndex >= players.length) {
      console.warn('Invalid action: No active player turn');
      return;
    }

    // Ensure the player hasn't already acted this round (additional safety check)
    if (currentPlayer.hasActedThisRound) {
      console.warn('Invalid action: Player has already acted this round');
      return;
    }

    // Action-specific validation
    let validationResult;
    switch (action) {
      case 'fold':
        validationResult = validateFoldAction(currentPlayer, gamePhase);
        break;
      case 'call':
        validationResult = validateCallAction(currentPlayer, currentBet, gamePhase);
        break;
      case 'raise':
        validationResult = validateRaiseAction(currentPlayer, currentBet, raiseAmount === '' ? '5' : raiseAmount, gamePhase);
        break;
    }

    // If validation fails, show error and return
    if (!validationResult?.valid) {
      console.warn('Invalid action:', validationResult?.reason);
      alert(validationResult?.reason || 'Invalid action');
      return;
    }

    // Execute the validated action
    console.log('DEBUG: Betting action - action:', action, 'players before:', players.map(p => ({ name: p.name, chips: p.chips, currentBet: p.currentBet })));
    let newPlayers = [...players];
    let newPot = pot;
    let newCurrentBet = currentBet;

    // Track the action being taken
    let actionText = '';
    switch (action) {
      case 'fold':
        newPlayers[currentPlayerIndex] = {
          ...currentPlayer,
          hasFolded: true,
          hasActedThisRound: true,
        };
        actionText = 'Fold';
        break;

      case 'call':
        const callValidation = validationResult as { valid: boolean; reason?: string; callAmount?: number };
        const callAmount = callValidation.callAmount!;
        newPlayers[currentPlayerIndex] = {
          ...currentPlayer,
          chips: Math.max(0, currentPlayer.chips - callAmount),
          currentBet: currentPlayer.currentBet + callAmount,
          hasActedThisRound: true,
        };
        newPot += callAmount;
        actionText = callAmount === 0 ? 'Check' : `Call $${callAmount}`;
        break;

      case 'raise':
        const raiseValidation = validationResult as { valid: boolean; reason?: string; totalRaiseAmount?: number; minRaise?: number };
        const totalRaiseAmount = raiseValidation.totalRaiseAmount!;
        newPlayers[currentPlayerIndex] = {
          ...currentPlayer,
          chips: Math.max(0, currentPlayer.chips - totalRaiseAmount),
          currentBet: currentPlayer.currentBet + totalRaiseAmount,
          hasActedThisRound: true,
        };
        // When someone raises, it starts a new betting round - reset hasActedThisRound for all other players
        newPlayers = newPlayers.map((player, index) => ({
          ...player,
          hasActedThisRound: index === currentPlayerIndex ? true : false, // Only the raiser has acted
        }));
        newPot += totalRaiseAmount;
        newCurrentBet = currentPlayer.currentBet + totalRaiseAmount;
        setRaiseAmount(''); // Clear the input
        actionText = `Raise $${totalRaiseAmount}`;
        break;
    }

    // Update last action for this player
    setPlayerLastActions(prev => ({
      ...prev,
      [currentPlayer.id]: actionText
    }));

    // Add to game log
    setGameLog(prev => [...prev, { timestamp: new Date(), message: `${currentPlayer.name} ${actionText.toLowerCase()}` }]);

    console.log('DEBUG: Betting action - players after:', newPlayers.map(p => ({ name: p.name, chips: p.chips, currentBet: p.currentBet })));
    console.log('DEBUG: Betting action - setting pot to:', newPot, '(was:', pot, ')');
    setPlayers(newPlayers);
    setPot(newPot);
    setCurrentBet(newCurrentBet);

    // Check if betting round is complete
    const bettingRoundComplete = isBettingRoundComplete(newPlayers, newCurrentBet);
    const activePlayers = newPlayers.filter(p => !p.hasFolded);

    // If someone folded and only one player remains, award pot immediately (no showdown, no card reveal)
    if (action === 'fold' && activePlayers.length === 1) {
      console.log('DEBUG: Player folded, awarding pot to remaining player');
      console.log('DEBUG: Fold action - activePlayers:', activePlayers.map(p => ({ name: p.name, chips: p.chips })));
      console.log('DEBUG: Fold action - newPlayers:', newPlayers.map(p => ({ name: p.name, hasFolded: p.hasFolded })));
      console.log('DEBUG: Fold action - current pot:', newPot);
      
      // Update state first
      setPlayers(newPlayers);
      setPot(newPot);
      setCurrentBet(newCurrentBet);
      setCurrentPlayerIndex(-1);
      
      // Then handle fold win with the values we already have (avoid stale closure)
      const remainingPlayer = activePlayers[0];
      const potToAward = newPot;
      setTimeout(() => {
        console.log('DEBUG: Fold setTimeout - calling handleFoldWinWithPot');
        handleFoldWinWithPot(remainingPlayer, potToAward, newPlayers);
      }, 500);
      return;
    }

    // Check if any active player is all-in (has 0 chips)
    const anyPlayerAllIn = activePlayers.some(player => player.chips === 0);

    // If only one player left (edge case, not from fold)
    if (activePlayers.length <= 1) {
      console.log('DEBUG: handleBettingAction - only one player left');
      setCurrentPlayerIndex(-1);
      if (activePlayers.length === 1) {
        setTimeout(() => {
          handleFoldWinWithPot(activePlayers[0], newPot, newPlayers);
        }, 500);
      }
      return;
    }

    // If at least one player is all-in AND betting round is complete, deal remaining cards
    if (bettingRoundComplete && anyPlayerAllIn) {
      console.log('Ending hand - at least one player all-in, betting complete');
      console.log('DEBUG: handleBettingAction all-in - newPot:', newPot);

      setCurrentPlayerIndex(-1);

      // Log the pot value
      setGameLog(prev => [...prev, {
        timestamp: new Date(),
        message: `Betting round complete - Pot: $${newPot} (all-in)`
      }]);

      // Deal remaining community cards with animation before going to showdown
      dealRemainingCommunityCards(deck, gamePhase, newPot, newPlayers);
      return;
    }

    if (bettingRoundComplete) {
      // Advance to next phase
      console.log('DEBUG: About to call advanceGamePhase, updated players:', newPlayers.map(p => ({ name: p.name, chips: p.chips })));
      advanceGamePhase(newPot, newPlayers);
      return;
    }

    // Continue betting round - move to next player
    const nextPlayerIndex = getNextActivePlayerIndex(newPlayers, currentPlayerIndex);
    setCurrentPlayerIndex(nextPlayerIndex);
  };

  // Handler for Enter key on initial screen
  const handleInitialScreenKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && humanPlayerName.trim()) {
      startGame();
    }
  };

  // Restart game - reset to Round 1 with same player name and blind assignment
  const restartGame = () => {
    console.log('DEBUG: restartGame called');
    const initialPlayers = getInitialPlayers(humanPlayerName, humanIsBigBlindFirst);
    setPlayers(initialPlayers);
    setRoundNumber(1);
    setGameOver(false);
    setOverallWinner(null);
    setGamePhase('waiting');
    setWinner(null);
    setHandComplete(false);
    setCommunityCards([]);
    setBurnedCards([]);
    setPot(0);
    setCurrentBet(0);
    setCurrentPlayerIndex(0);
    setDeck(createDeck());
    setGameLog([{ timestamp: new Date(), message: `Game restarted! ${humanPlayerName} vs AI Player` }]);
    
    // Start new hand after a brief delay
    setTimeout(() => {
      dealNewHand(initialPlayers);
    }, 100);
  };

  // Handler for quitting the game - returns to initial screen
  const handleQuitGame = () => {
    resetGame();
  };

  return (
    <div className="App">
      {/* Init form overlay - shown on top of game board when game hasn't started */}
      {!gameStarted && (
        <div className="game-init-overlay">
          <div className="game-init-screen">
            <h2>Welcome to Texas Hold'em!</h2>
            <div className="init-form" onKeyPress={handleInitialScreenKeyPress}>
              <div className="form-group">
                <label htmlFor="player-name">Your Name:</label>
                <input
                  id="player-name"
                  type="text"
                  value={humanPlayerName}
                  onChange={(e) => setHumanPlayerName(e.target.value)}
                  placeholder="Enter your name"
                  maxLength={20}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>Your starting position:</label>
                <div className="dealer-choice">
                  <label>
                    <input
                      type="radio"
                      name="blind"
                      checked={humanIsBigBlindFirst}
                      onChange={() => setHumanIsBigBlindFirst(true)}
                    />
                    Big Blind ($10)
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="blind"
                      checked={!humanIsBigBlindFirst}
                      onChange={() => setHumanIsBigBlindFirst(false)}
                    />
                    Small Blind ($5)
                  </label>
                </div>
              </div>

              <div className="game-rules">
                <h3>Game Rules:</h3>
                <ul>
                  <li>Each player starts with $100</li>
                  <li>Blind positions alternate each round</li>
                  <li>Play continues until one player cannot afford the big blind ($10)</li>
                </ul>
              </div>

              <button
                className="start-game-button"
                onClick={startGame}
                disabled={!humanPlayerName.trim()}
              >
                Start Game
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="viewport-scaler" ref={scalerRef}>
      <header className="App-header">
        <h1>Texas Hold'em Poker</h1>
      </header>

      <main className={`game-container ${gamePhase === 'showdown' ? 'showdown-active' : ''}`}>
        {/* Main Layout */}
        <div className="main-game-layout">
          {/* Center Section: Game Info + AI Player, Cards Row, Human Player */}
          <div className="center-section">
            {/* Mobile Info Bar - compact replacement for game-info-box on mobile */}
            <div className="mobile-info-bar">
              <span>R{roundNumber}</span>
              <span className="mobile-phase">{phaseDisplayName}</span>
              <span>Bet: ${currentBet}</span>
            </div>

            {/* Game Info Box - Grid Area: game-info */}
            <div className="game-info-box">
              <h3>Game Info</h3>
              <div className="game-info-static">
                <div className="info-item">
                  <span className="info-label">Round:</span>
                  <span className="info-value">{roundNumber}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Phase:</span>
                  <span className="info-value">{phaseDisplayName}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Current Bet:</span>
                  <span className="info-value">${currentBet}</span>
                </div>
              </div>
            </div>

            {/* Top Row: AI Player - Grid Area: top-row */}
            <div className="top-row-container">
              <div className="ai-player-section">
                {players.filter(p => !p.isHuman).map((player, index) => {
                  const playerIndex = players.findIndex(p => p.id === player.id);
                  const aiHandData = showdownData?.hands.find(h => !h.player.isHuman);
                  const aiUsedHoleCardIndices = getUsedHoleCardIndices(aiHandData?.pokerHand, player.cards);
                  return (
                    <PlayerArea
                      key={player.id}
                      player={player}
                      isCurrentPlayer={playerIndex === currentPlayerIndex}
                      gamePhase={gamePhase}
                      holeCardAnimating={holeCardAnimating}
                      aiCardsFlipping={aiCardsFlipping}
                      isShowdown={gamePhase === 'showdown'}
                      onHandHover={() => setHoveredPlayerHand('ai')}
                      onHandLeave={() => setHoveredPlayerHand(null)}
                      usedHoleCardIndices={aiUsedHoleCardIndices}
                      isHovered={hoveredPlayerHand === 'ai'}
                      currentBet={player.currentBet}
                    />
                  );
                })}
              </div>
            </div>

            {/* Mobile Log Toggle Button */}
            <button
              className="mobile-log-toggle"
              onClick={() => setShowMobileLog(!showMobileLog)}
            >
              {showMobileLog ? '✕ Log' : '📋 Log'}
            </button>

            {/* Game Log Box - Grid Area: game-log */}
            <div className={`game-log-box top-row-log ${showMobileLog ? 'mobile-visible' : ''}`}>
              <h3>Game Log</h3>
              <div className="log-entries" ref={logEntriesRef}>
                {gameLog.length === 0 ? (
                  <div className="log-entry">Game started. Waiting for actions...</div>
                ) : (
                  gameLog.map((entry, index) => (
                    <div key={index} className="log-entry">
                      <span className="log-time">{entry.timestamp.toLocaleTimeString()}</span>
                      <span className="log-message">{entry.message}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Cards Row: Pot, Community Cards, Deck, and Burn Cards - All Same Height */}
            <div className="cards-row-container">
              {/* Mobile Pot Indicator - inline with community cards on mobile */}
              <div className="mobile-pot-indicator">
                Pot: ${pot}
                {potDelta && <span className="pot-delta">+${potDelta}</span>}
              </div>

              {/* Pot Display - Left of Community Cards */}
              <div className="pot-display">
                <h3>Betting Pot</h3>
                <div className="pot-amount">${pot}</div>
                {potDelta && <div className="pot-delta">+${potDelta}</div>}
              </div>

              {/* Community Cards */}
              <div className="community-cards">
                <h3>Community Cards</h3>
                <div className="cards-row">
                  {(() => {
                    // Determine how many cards should be visible based on phase
                    // During dealing (isDealing=true), show all cards currently in communityCards array
                    const maxCardsForPhase = 
                      isDealing ? communityCards.length :
                      gamePhase === 'preflop' ? 0 :
                      gamePhase === 'flop' ? 3 :
                      gamePhase === 'turn' ? 4 :
                      gamePhase === 'river' ? 5 :
                      gamePhase === 'showdown' ? 5 : 0;

                    // Always show exactly 5 card slots (max community cards)
                    const totalSlots = 5;
                    const cardsToRender = [];

                    // Get the used community card indices for the hovered player
                    const hoveredHandData = hoveredPlayerHand 
                      ? showdownData?.hands.find(h => h.player.isHuman === (hoveredPlayerHand === 'human'))
                      : null;
                    const hoveredUsedCommunityIndices = hoveredHandData 
                      ? getUsedCommunityCardIndices(hoveredHandData.pokerHand, communityCards)
                      : [];

                    // Render actual cards up to the phase limit (or all cards if dealing)
                    for (let i = 0; i < Math.min(communityCards.length, maxCardsForPhase); i++) {
                      const isHighlightedByHover = gamePhase === 'showdown' && hoveredPlayerHand && hoveredUsedCommunityIndices.includes(i);
                      const shouldRaise = isHighlightedByHover;
                      
                      cardsToRender.push(
                        <Card
                          key={`community-${i}`}
                          card={communityCards[i]}
                          isDealing={animatingCardIndices.includes(i)}
                          isHighlighted={isHighlightedByHover || false}
                          highlightColor={hoveredPlayerHand === 'human' ? 'green' : 'blue'}
                          className={shouldRaise ? 'card--raised' : ''}
                        />
                      );
                    }

                    // Render placeholder cards for remaining slots
                    const remainingSlots = totalSlots - cardsToRender.length;
                    for (let i = 0; i < remainingSlots; i++) {
                      cardsToRender.push(
                        <Card
                          key={`placeholder-${i}`}
                          card={null}
                        />
                      );
                    }

                    return cardsToRender;
                  })()}
                </div>
              </div>

              {/* Deck Visual */}
              <div className="deck-visual">
                <h3>Deck</h3>
                <div className="deck-cards">
                  <Card card={null} isDeck={true} />
                </div>
              </div>

              {/* Burned Cards - Fixed dimensions, always shows space for 3 cards */}
              <div className="burned-cards">
                <h3>Burn Cards</h3>
                <div className="cards-row">
                  {/* Always render 3 card slots, show actual cards or empty slots */}
                  {[0, 1, 2].map((index) => {
                    const card = burnedCards[index];
                    return (
                      <Card
                        key={`burned-${index}`}
                        card={card || null}
                        isBurned={true}
                        isBurnAnimating={burnAnimatingIndex === index}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Human Player - Grid Area: human-player */}
            <div className="human-player-section">
              {players.filter(p => p.isHuman).map((player, index) => {
                const playerIndex = players.findIndex(p => p.id === player.id);
                const humanHandData = showdownData?.hands.find(h => h.player.isHuman);
                const humanUsedHoleCardIndices = getUsedHoleCardIndices(humanHandData?.pokerHand, player.cards);
                return (
                  <PlayerArea
                    key={player.id}
                    player={player}
                    isCurrentPlayer={playerIndex === currentPlayerIndex}
                    gamePhase={gamePhase}
                    holeCardAnimating={holeCardAnimating}
                    isShowdown={gamePhase === 'showdown'}
                    onHandHover={() => setHoveredPlayerHand('human')}
                    onHandLeave={() => setHoveredPlayerHand(null)}
                    usedHoleCardIndices={humanUsedHoleCardIndices}
                    isHovered={hoveredPlayerHand === 'human'}
                    currentBet={player.currentBet}
                  />
                );
              })}
            </div>

            {/* Action Buttons - Grid Area: actions */}
            <div className="action-buttons-section">
              <h3>Actions</h3>
              {/* Betting Controls - Always rendered to maintain layout, disabled when not player's turn */}
              {(() => {
                const humanPlayer = players.find(p => p.isHuman);
                const isPlayerTurn = players[currentPlayerIndex]?.isHuman && gamePhase !== 'waiting' && gamePhase !== 'showdown' && !isDealing && !holeCardAnimating;
                // Use 'preflop' as display phase for validation when in 'waiting' or 'showdown' (buttons will be disabled anyway)
                const displayPhase = (gamePhase === 'waiting' || gamePhase === 'showdown') ? 'preflop' : gamePhase;
                const callValidation = humanPlayer ? validateCallAction(humanPlayer, currentBet, displayPhase) : { valid: false, callAmount: 0 };

                if (!humanPlayer) return null;

                // Compute max raise once — considers opponent's ability to call
                const opponent = players.find(p => !p.hasFolded && !p.isHuman);
                const maxRaiseByOpponent = opponent ? opponent.chips - (currentBet - opponent.currentBet) : humanPlayer.chips;
                const maxRaise = Math.max(5, Math.min(humanPlayer.chips, maxRaiseByOpponent));
                const currentRaiseValue = raiseAmount === '' ? 5 : parseInt(raiseAmount, 10);
                const raiseValidation = validateRaiseAction(humanPlayer, currentBet, raiseAmount === '' ? '5' : raiseAmount, displayPhase);

                return (
                  <div className={`betting-controls ${!isPlayerTurn ? 'disabled' : ''}`}>
                    <button
                      className="bet-button fold-button"
                      onClick={() => handleBettingAction('fold')}
                      disabled={!isPlayerTurn || !validateFoldAction(humanPlayer, displayPhase).valid}
                    >
                      Fold
                    </button>
                    <button
                      className="bet-button call-button"
                      onClick={() => handleBettingAction('call')}
                      disabled={!isPlayerTurn || !callValidation.valid}
                      title={!callValidation.valid ? callValidation.reason : undefined}
                    >
                      {callValidation.callAmount === 0 ? 'Check' : `Call $${callValidation.callAmount}`}
                    </button>
                    <div className="raise-section">
                      <div className="raise-input-wrapper">
                        <span className="dollar-sign">$</span>
                        <input
                          type="number"
                          value={raiseAmount === '' ? '5' : raiseAmount}
                          onChange={(e) => setRaiseAmount(e.target.value)}
                          className="raise-input"
                          min="5"
                          readOnly
                          disabled={!isPlayerTurn || (raiseAmount !== '' && !raiseValidation.valid) || humanPlayer.chips === 0}
                        />
                        <div className="raise-controls">
                          <button
                            type="button"
                            className="raise-arrow raise-up"
                            onClick={() => {
                              const newValue = Math.min(currentRaiseValue + 5, maxRaise);
                              setRaiseAmount(newValue.toString());
                            }}
                            disabled={!isPlayerTurn || humanPlayer.chips === 0 || currentRaiseValue >= maxRaise}
                            title="Increase raise amount"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            className="raise-arrow raise-down"
                            onClick={() => {
                              const newValue = Math.max(currentRaiseValue - 5, 5);
                              setRaiseAmount(newValue.toString());
                            }}
                            disabled={!isPlayerTurn || humanPlayer.chips === 0 || currentRaiseValue <= 5}
                            title="Decrease raise amount"
                          >
                            ▼
                          </button>
                        </div>
                      </div>
                      <button
                        className="bet-button raise-button"
                        onClick={() => handleBettingAction('raise')}
                        disabled={!isPlayerTurn || !raiseValidation.valid || humanPlayer.chips === 0}
                        title={!raiseValidation.valid ? raiseValidation.reason :
                          humanPlayer.chips === 0 ? 'No funds remaining' :
                          undefined}
                      >
                        Raise
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>

          </div>
        </div>


        {/* Status Slot - fixed-height reservation prevents CLS when content grows/shrinks */}
        <div className="status-slot">
        {/* Status Container - Shows AI actions during play, showdown/fold results when hand is complete */}
        <div className={`status-container ${gameOver ? 'game-over-active' : ''} ${aiActionDisplay || gamePhase === 'showdown' || (handComplete && winner) || gameOver ? 'visible' : 'hidden'}`}>
          {gameOver && overallWinner ? (
            <div className="showdown-status-content game-over-content">
              <div className="showdown-winner-info">
                <span className="winner-crown">{overallWinner.isHuman ? '🎉' : '💔'}</span>
                <span className="winner-name game-over-title">
                  {overallWinner.isHuman ? 'Victory!' : 'Defeat'}
                </span>
              </div>
              <div className="showdown-comparison">
                <span className="comparison-text game-over-message">
                  {(() => {
                    // Find the losing player
                    const loser = players.find(p => p.id !== overallWinner.id);
                    const loserHasChips = loser && loser.chips > 0;
                    
                    if (overallWinner.isHuman) {
                      if (loserHasChips) {
                        return `Congratulations ${overallWinner.name}! You won - opponent cannot afford the big blind!`;
                      } else {
                        return `Congratulations ${overallWinner.name}! You won all the chips!`;
                      }
                    } else {
                      if (loserHasChips) {
                        return `${overallWinner.name} won - you cannot afford the big blind. Better luck next time!`;
                      } else {
                        return `${overallWinner.name} won all the chips. Better luck next time!`;
                      }
                    }
                  })()}
                </span>
              </div>
              {showdownData && showdownData.hands.length > 1 && (
                <div className="showdown-comparison">
                  {(() => {
                    if (showdownData.isTie) {
                      const hand1 = showdownData.hands[0];
                      const hand2 = showdownData.hands[1];
                      return (
                        <span className="comparison-text">
                          <span className={hand1.player.isHuman ? 'human-text' : 'ai-text'}>
                            {getDescriptionWithKicker(hand1.pokerHand)}
                          </span>
                          {' ties '}
                          <span className={hand2.player.isHuman ? 'human-text' : 'ai-text'}>
                            {getDescriptionWithKicker(hand2.pokerHand)}
                          </span>
                        </span>
                      );
                    }
                    const winnerHand = showdownData.hands.find(h => h.isWinner);
                    const loserHand = showdownData.hands.find(h => !h.isWinner);
                    if (winnerHand && loserHand) {
                      const sameType = winnerHand.pokerHand.type === loserHand.pokerHand.type;
                      const [winnerDesc, loserDesc] = sameType
                        ? getTieBreakingDescriptions(winnerHand.pokerHand, loserHand.pokerHand)
                        : [winnerHand.pokerHand.description, loserHand.pokerHand.description];
                      return (
                        <span className="comparison-text">
                          <span className={winnerHand.player.isHuman ? 'human-text' : 'ai-text'}>
                            {winnerDesc}
                          </span>
                          {' beats '}
                          <span className={loserHand.player.isHuman ? 'human-text' : 'ai-text'}>
                            {loserDesc}
                          </span>
                        </span>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}
              <div className="game-over-buttons">
                <button
                  onClick={restartGame}
                  className="next-round-btn restart-btn"
                >
                  Restart
                </button>
                <button
                  onClick={handleQuitGame}
                  className="next-round-btn quit-btn"
                >
                  Quit
                </button>
              </div>
            </div>
          ) : (gamePhase === 'showdown' || (handComplete && winner)) && winner ? (
            <div className="showdown-status-content">
              <div className="showdown-winner-info">
                <span className="winner-crown">{showdownData?.isTie ? '🤝' : '👑'}</span>
                <span className="winner-name">{showdownData?.isTie ? 'Split Pot!' : `${winner.name} wins!`}</span>
                <span className="winner-amount">
                  {showdownData?.isTie 
                    ? `$${Math.floor((showdownData?.potAmount || lastPotWon) / 2)} each`
                    : `$${showdownData?.potAmount || lastPotWon}`
                  }
                </span>
              </div>
              {showdownData && showdownData.hands.length > 1 ? (
                <div className="showdown-comparison">
                  {(() => {
                    if (showdownData.isTie) {
                      // Both players have the same hand - show with kicker info
                      const hand1 = showdownData.hands[0];
                      const hand2 = showdownData.hands[1];
                      return (
                        <span className="comparison-text">
                          <span className={hand1.player.isHuman ? 'human-text' : 'ai-text'}>
                            {getDescriptionWithKicker(hand1.pokerHand)}
                          </span>
                          {' ties '}
                          <span className={hand2.player.isHuman ? 'human-text' : 'ai-text'}>
                            {getDescriptionWithKicker(hand2.pokerHand)}
                          </span>
                        </span>
                      );
                    }
                    
                    const winnerHand = showdownData.hands.find(h => h.isWinner);
                    const loserHand = showdownData.hands.find(h => !h.isWinner);
                    if (winnerHand && loserHand) {
                      // Check if both hands are the same type - if so, show tie-breaking kicker
                      const sameType = winnerHand.pokerHand.type === loserHand.pokerHand.type;
                      let winnerDesc: string;
                      let loserDesc: string;
                      
                      if (sameType) {
                        // Use tie-breaking descriptions to show the actual kicker that won
                        [winnerDesc, loserDesc] = getTieBreakingDescriptions(
                          winnerHand.pokerHand,
                          loserHand.pokerHand
                        );
                      } else {
                        winnerDesc = winnerHand.pokerHand.description;
                        loserDesc = loserHand.pokerHand.description;
                      }
                      
                      return (
                        <span className="comparison-text">
                          <span className={winnerHand.player.isHuman ? 'human-text' : 'ai-text'}>
                            {winnerDesc}
                          </span>
                          {' beats '}
                          <span className={loserHand.player.isHuman ? 'human-text' : 'ai-text'}>
                            {loserDesc}
                          </span>
                        </span>
                      );
                    }
                    return null;
                  })()}
                </div>
              ) : (
                <div className="showdown-comparison">
                  <span className="comparison-text">
                    {(() => {
                      // Find the player who folded
                      const foldedPlayer = players.find(p => p.hasFolded);
                      return foldedPlayer ? `${foldedPlayer.name} folded` : 'Opponent folded';
                    })()}
                  </span>
                </div>
              )}
              {handComplete && !gameOver && (
                <button
                  onClick={handleShowdownModalClose}
                  className="next-round-btn"
                >
                  Next Round
                </button>
              )}
            </div>
          ) : aiActionDisplay ? (
            <div className="ai-action-content">
              <div className="ai-avatar">🤖</div>
              <div className="ai-action-text">
                {aiActionDisplay.isThinking ? (
                  <>
                    <div className="thinking-text">AI is thinking...</div>
                    <div className="thinking-dots">
                      <span>.</span><span>.</span><span>.</span>
                    </div>
                  </>
                ) : (
                  <div className="action-text">
                    AI {aiActionDisplay.action}
                    {aiActionDisplay.amount !== undefined && aiActionDisplay.amount > 0 && (
                      <span className="action-amount"> ${aiActionDisplay.amount}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
        </div>{/* end status-slot */}


      </main>
      </div>{/* end viewport-scaler */}

    </div>
  );
}

export default App;
