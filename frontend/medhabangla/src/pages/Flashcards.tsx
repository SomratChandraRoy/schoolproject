import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Flashcards: React.FC = () => {
    const [decks, setDecks] = useState<any[]>([]);
    const [selectedDeck, setSelectedDeck] = useState<any>(null);
    const [generating, setGenerating] = useState(false);
    const [instruction, setInstruction] = useState('');
    const [deckTitle, setDeckTitle] = useState('');
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    useEffect(() => {
        fetchDecks();
    }, []);

    const fetchDecks = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/academics/flashcards/', {
                headers: { Authorization: `Token ${token}` }
            });
            setDecks(res.data);
        } catch (error) {
            console.error('Error fetching flashcard decks', error);
        }
    };

    const createAndGenerateDeck = async () => {
        if (!instruction.trim() || !deckTitle.trim()) return;
        setGenerating(true);
        try {
            const token = localStorage.getItem('token');
            // First, create the deck
            const deckRes = await axios.post('/api/academics/flashcards/', {
                title: deckTitle
            }, {
                headers: { Authorization: `Token ${token}` }
            });
            const newDeckId = deckRes.data.id;

            // Generate cards for the deck
            const generateRes = await axios.post('/api/academics/flashcards/' + newDeckId + '/generate_cards/', {
                instruction: instruction
            }, {
                headers: { Authorization: `Token ${token}` }
            });

            setDecks([generateRes.data, ...decks]);
            setSelectedDeck(generateRes.data);
            setDeckTitle('');
            setInstruction('');
            setCurrentCardIndex(0);
            setIsFlipped(false);
        } catch (error: any) {
            console.error('Error generating flashcards', error);
            alert('Failed to generate flashcards: ' + (error.response?.data?.error || error.message));
        } finally {
            setGenerating(false);
        }
    };

    const toggleKnown = async () => {
        if (!selectedDeck) return;
        try {
            const currentCard = selectedDeck.cards[currentCardIndex];
            const token = localStorage.getItem('token');
            const res = await axios.post(
                `/api/academics/flashcards/${selectedDeck.id}/cards/${currentCard.id}/toggle/`,
                {}, 
                { headers: { Authorization: `Token ${token}` } }
            );
            
            // Update local state
            const updatedCards = [...selectedDeck.cards];
            updatedCards[currentCardIndex].is_known = res.data.is_known;
            setSelectedDeck({ ...selectedDeck, cards: updatedCards });
            
            // Refresh Decks
            fetchDecks();
        } catch (error) {
            console.error('Toggle error', error);
        }
    };

    const nextCard = () => {
        if (currentCardIndex < selectedDeck.cards.length - 1) {
            setCurrentCardIndex(currentCardIndex + 1);
            setIsFlipped(false);
        }
    };

    const prevCard = () => {
        if (currentCardIndex > 0) {
            setCurrentCardIndex(currentCardIndex - 1);
            setIsFlipped(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6 md:flex gap-6 min-h-[85vh]">
            {/* Sidebar for Decks & Generator */}
            <div className="md:w-1/3 mb-6 md:mb-0 space-y-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 dark:text-white"><span>??</span> Create AI Flashcards</h2>
                    
                    <input 
                        type="text" 
                        placeholder="Deck Title (e.g. Physics Formulas)"
                        className="w-full mb-3 p-3 border rounded-lg bg-gray-50 dark:bg-gray-900 dark:border-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={deckTitle}
                        onChange={(e) => setDeckTitle(e.target.value)}
                    />
                    
                    <textarea 
                        className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-900 dark:border-gray-700 dark:text-white mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        rows={3}
                        placeholder="What should the cards be about? (e.g. key terms in biology)"
                        value={instruction}
                        onChange={(e) => setInstruction(e.target.value)}
                    ></textarea>
                    
                    <button 
                        onClick={createAndGenerateDeck}
                        disabled={generating || !deckTitle.trim()}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50 transition-colors"
                    >
                        {generating ? '? Generating...' : '? Generate Deck'}
                    </button>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex-1 overflow-y-auto max-h-96">
                    <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">My Decks</h3>
                    {decks.length === 0 ? (
                        <p className="text-sm text-gray-500 italic text-center py-4">No decks yet. Let AI generate one for you!</p>
                    ) : (
                        <ul className="space-y-3">
                            {decks.map(deck => (
                                <li 
                                    key={deck.id} 
                                    onClick={() => {
                                        setSelectedDeck(deck);
                                        setCurrentCardIndex(0);
                                        setIsFlipped(false);
                                    }}
                                    className="p-4 rounded-xl cursor-pointer transition-colors shadow-sm hover:shadow-md dark:hover:shadow-lg transition-shadow"
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-semibold text-gray-900 dark:text-white truncate block mr-2">{deck.title}</span>
                                        <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 px-2 py-1 rounded-full whitespace-nowrap">{deck.cards_count} cards</span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2">
                                        <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${Math.round((deck.cards.filter((c: any) => c.is_known).length / deck.cards_count) * 100)}%` }}></div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* Study Area */}
            <div className="md:w-2/3 bg-white dark:bg-gray-800 p-6 md:p-10 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col">
                {selectedDeck && selectedDeck.cards && selectedDeck.cards.length > 0 ? (
                    <div className="flex-1 flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold dark:text-white truncate pr-4">{selectedDeck.title}</h2>
                            <span className="text-gray-500 font-medium whitespace-nowrap">
                                Card {currentCardIndex + 1} of {selectedDeck.cards.length}
                            </span>
                        </div>

                        {/* The Flashcard */}
                        <div 
                            className="flex-1 min-h-[300px] perspective-1000 cursor-pointer"
                            onClick={() => setIsFlipped(!isFlipped)}
                        >
                            <div className="w-full h-full duration-500 preserve-3d relative">
                                {/* Front */}
                                <div className="absolute w-full h-full backface-hidden bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800 rounded-2xl shadow-md border-2 border-dashed border-blue-200 dark:border-gray-600 flex flex-col items-center justify-center p-8 text-center preserve-3d">
                                    <span className="absolute top-4 left-4 text-xs font-bold uppercase tracking-widest text-blue-400 dark:text-gray-500">Question</span>
                                    <p className="text-2xl md:text-3xl font-medium text-gray-800 dark:text-indigo-100">{selectedDeck.cards[currentCardIndex].front}</p>
                                    <span className="absolute bottom-4 text-sm text-gray-400 italic">Click to flip</span>
                                </div>
                                {/* Back */}
                                <div className="absolute w-full h-full backface-hidden bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-700 dark:to-gray-800 rounded-2xl shadow-md border-2 border-green-200 dark:border-gray-600 flex flex-col items-center justify-center p-8 text-center rotate-y-180 preserve-3d">
                                    <span className="absolute top-4 right-4 text-xs font-bold uppercase tracking-widest text-green-500 dark:text-gray-500">Answer</span>
                                    <p className="text-xl md:text-2xl font-medium text-gray-800 dark:text-emerald-100 whitespace-pre-wrap">{selectedDeck.cards[currentCardIndex].back}</p>
                                </div>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="mt-8 flex items-center justify-between">
                            <button 
                                onClick={prevCard}
                                disabled={currentCardIndex === 0}
                                className="px-5 py-2.5 rounded-lg bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-200 font-medium"
                            >
                                ? Prev
                            </button>
                            
                            <button 
                                onClick={toggleKnown}
                                className={selectedDeck.cards[currentCardIndex].is_known ? 
                                    "px-6 py-2.5 rounded-full font-bold transition-all shadow-sm bg-green-500 text-white hover:bg-green-600" : 
                                    "px-6 py-2.5 rounded-full font-bold transition-all shadow-sm bg-gray-200 text-gray-700 hover:bg-gray-300"
                                }
                            >
                                {selectedDeck.cards[currentCardIndex].is_known ? '✓ I know this' : '◌ Needs Review'}
                            </button>

                            <button 
                                onClick={nextCard}
                                disabled={currentCardIndex === selectedDeck.cards.length - 1}
                                className="px-5 py-2.5 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 hover:bg-blue-200 disabled:opacity-50 font-medium"
                            >
                                Next ?
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col justify-center items-center text-gray-400">
                        <span className="text-6xl mb-4">???</span>
                        <p className="text-xl font-medium">Select a deck to start studying</p>
                        <p className="text-sm mt-2 max-w-md text-center">Use the AI generator on the left to quickly build flashcards from any topic!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Flashcards;
