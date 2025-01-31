export class NGramPredictor {
    constructor(n = 2) {
        this.n = n;
        this.ngrams = new Map(); // { context => { total: number, words: Map<string, number> } }
        this.initialized = false;
        this.smoothingAlpha = 0.1; // Laplace smoothing factor
    }

    async initialize() {
        if (this.initialized) return;

        try {
            const { ngramData } = await chrome.storage.local.get('ngramData');
            
            if (ngramData) {
                this.ngrams = new Map(
                    Object.entries(ngramData.ngrams).map(([context, data]) => [
                        context,
                        {
                            total: data.total,
                            words: new Map(Object.entries(data.words))
                        }
                    ])
                );
            } else {
                await this.loadDefaultTrainingData();
            }
            
            this.initialized = true;
        } catch (error) {
            console.error('NGram init error:', error);
        }
    }

    async saveToStorage() {
        const storageData = {
            ngrams: Object.fromEntries(
                Array.from(this.ngrams.entries()).map(([context, data]) => [
                    context,
                    {
                        total: data.total,
                        words: Object.fromEntries(data.words.entries())
                    }
                ])
            ),
            lastUpdated: new Date().toISOString()
        };

        await chrome.storage.local.set({ ngramData: storageData });
    }

    train(text) {
        const words = this.tokenize(text);
        
        for (let i = 0; i <= words.length - this.n; i++) {
            const context = words.slice(i, i + this.n - 1).join(' ');
            const nextWord = words[i + this.n - 1];
            
            if (!this.ngrams.has(context)) {
                this.ngrams.set(context, {
                    total: 0,
                    words: new Map()
                });
            }
            
            const entry = this.ngrams.get(context);
            entry.words.set(nextWord, (entry.words.get(nextWord) || 0) + 1);
            entry.total++;
        }
    }

    predict(sequence, maxPredictions = 3) {
        if (!this.initialized) return [];
        
        const words = this.tokenize(sequence);
        const context = words.slice(-this.n + 1).join(' ');
        
        if (!this.ngrams.has(context)) {
            return this.handleUnknownContext(context);
        }

        const { total, words: nextWords } = this.ngrams.get(context);
        const vocabSize = nextWords.size;
        
        return Array.from(nextWords.entries())
            .map(([word, count]) => ({
                word,
                probability: (count + this.smoothingAlpha) / 
                           (total + this.smoothingAlpha * (vocabSize + 1)) // +1 for unknown words
            }))
            .sort((a, b) => b.probability - a.probability)
            .slice(0, maxPredictions)
            .map(p => ({
                text: `${sequence} ${p.word}`.trim(),
                probability: p.probability,
                type: 'ngram'
            }));
    }

    // Performance optimizations below
    tokenize(text) {
        return text.toLowerCase()
            .replace(/[^a-z0-9']/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 0);
    }

    handleUnknownContext(context) {
        // Fallback strategy: try shorter n-gram
        if (this.n > 1 && context.includes(' ')) {
            const shorterContext = context.split(' ').slice(1).join(' ');
            return this.predict(shorterContext, 1);
        }
        return [];
    }
}

const predictor = new NGramPredictor(3);
await predictor.initialize();

// Train with user input
predictor.train("quick brown fox jumps over the lazy dog");

// Get predictions
const predictions = predictor.predict("quick brown"); 
// Returns: [{ text: "quick brown fox", probability: 0.85 }, ...]