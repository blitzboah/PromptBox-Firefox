const predictor = new NGramPredictor(3);
await predictor.initialize();

// Train with user input
predictor.train("quick brown fox jumps over the lazy dog");

// Get predictions
const predictions = predictor.predict("quick brown");

print(predictions)
// Returns: [{ text: "quick brown fox", probability: 0.85 }, ...]