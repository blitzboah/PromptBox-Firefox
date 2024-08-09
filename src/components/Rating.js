import React from 'react';

function Rating({ colorScore, layoutScore }) {
  const overallScore = (colorScore + layoutScore) / 2;

  return (
    <div>
      <h2>Overall Rating</h2>
      <p>Score: {overallScore.toFixed(2)} / 10</p>
    </div>
  );
}

export default Rating;