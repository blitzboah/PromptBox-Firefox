import React from 'react';

function LayoutAnalysis({ data }) {
  return (
    <div>
      <h2>Layout Analysis</h2>
      <p>Content to Whitespace Ratio: {data.contentToWhitespaceRatio}</p>
      <p>Element Balance Score: {data.elementBalanceScore}</p>
    </div>
  );
}

export default LayoutAnalysis;