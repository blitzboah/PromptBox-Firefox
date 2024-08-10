import React, { useState } from 'react';
import ColorPalette from './ColorPalette';
import LayoutAnalysis from './LayoutAnalysis';
import Rating from './Rating';
import { analyzeColors } from '../utils/colorAnalysis';
import { analyzeLayout } from '../utils/layoutAnalysis';

function WebsiteAnalyzer() {
  const [url, setUrl] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    setError(null);
    setAnalysis(null);
    try {
      console.log('Analyzing URL:', url);
      const response = await fetch(`https://cors-anywhere.herokuapp.com/${url}`);
      const html = await response.text();
      
      console.log('Fetched HTML:', html.substring(0, 100) + '...'); // Log first 100 chars
      
      const colorAnalysis = await analyzeColors(html);  // Wait for this to complete
      const layoutAnalysis = analyzeLayout(html);
      
      console.log('Color Analysis:', colorAnalysis);
      console.log('Layout Analysis:', layoutAnalysis);
      
      if (!colorAnalysis || !layoutAnalysis) {
        throw new Error('Analysis failed to return expected results');
      }
      
      setAnalysis({ colorAnalysis, layoutAnalysis });
    } catch (error) {
      console.error('Error analyzing website:', error);
      setError('Error analyzing website: ' + error.message);
    }
  };

  return (
    <div>
      <h1>Website Analyzer</h1>
      <input 
        type="text" 
        value={url} 
        onChange={(e) => setUrl(e.target.value)} 
        placeholder="Enter website URL"
      />
      <button onClick={handleAnalyze}>Analyze</button>
      
      {error && <p style={{color: 'red'}}>{error}</p>}
      
      {analysis && analysis.colorAnalysis && analysis.layoutAnalysis && (
        <div>
          <h2>Analysis Results:</h2>
          <ColorPalette colors={analysis.colorAnalysis.palette || []} />
          <LayoutAnalysis data={analysis.layoutAnalysis} />
          <Rating 
            colorScore={analysis.colorAnalysis.score || 0} 
            layoutScore={analysis.layoutAnalysis.score || 0} 
          />
        </div>
      )}

      {!analysis && !error && <p>Enter a URL and click Analyze to see results.</p>}
    </div>
  );
}

export default WebsiteAnalyzer;





























