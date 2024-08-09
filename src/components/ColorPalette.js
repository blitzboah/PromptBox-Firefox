import React from 'react';

function ColorPalette({ colors }) {
  return (
    <div>
      <h2>Color Palette</h2>
      <div style={{ display: 'flex' }}>
        {colors.map((color, index) => (
          <div 
            key={index} 
            style={{
              backgroundColor: color,
              width: '50px',
              height: '50px',
              margin: '5px'
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default ColorPalette;