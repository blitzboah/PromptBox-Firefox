import ColorThief from 'colorthief';

export async function analyzeColors(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // Extract colors from CSS and images
  const cssColors = extractColorsFromCSS(doc);
  const imageColors = await extractColorsFromImages(doc);
  
  // Combine and remove duplicates
  const allColors = [...new Set([...cssColors, ...imageColors])];
  
  // Convert to LAB color space for better perceptual analysis
  const labColors = allColors.map(hexToLab);
  
  // Analyze color relationships
  const harmonyScore = analyzeColorHarmony(labColors);
  const gradientScore = analyzeColorGradient(labColors);
  
  // Calculate final score
  const score = (harmonyScore * 0.6 + gradientScore * 0.4) * 10;
  
  return {
    palette: allColors,
    score: Math.round(score * 10) / 10 // Round to one decimal place
  };
}

function extractColorsFromCSS(doc) {

       const styles = doc.getElementsByTagName('style');
    const inlineStyles = doc.getElementsByTagName('*');
    let cssText = '';
  
    // Extract styles from <style> tags
    for (let style of styles) {
      cssText += style.textContent;
    }
  
    // Extract inline styles
    for (let element of inlineStyles) {
      if (element.style.cssText) {
        cssText += element.style.cssText;
      }
    }
  
    // Regular expression to match color values
    const colorRegex = /#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}|rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)|rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)/g;
  
    // Extract unique colors
    const colors = [...new Set(cssText.match(colorRegex) || [])];
  
    // Convert all colors to hex format
    return colors.map(color => {
      if (color.startsWith('#')) {
        return color.length === 4 ? 
          `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}` : color;
      } else if (color.startsWith('rgb')) {
        return rgbToHex(color);
      }
      return null; // Return null for any unrecognized color format
    }).filter(color => color !== null); // Filter out null values



}

async function extractColorsFromImages(doc) {
  const images = Array.from(doc.getElementsByTagName('img'));
  const colorThief = new ColorThief();
  const imageColors = await Promise.all(
    images.map(async (img) => {
      if (img.complete) {
        return colorThief.getColor(img);
      }
      return new Promise((resolve) => {
        img.addEventListener('load', () => {
          resolve(colorThief.getColor(img));
        });
      });
    })
  );
  return imageColors.map(rgbToHex);
}

function hexToLab(hex) {
  // Convert hex to RGB
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
  
  // Convert RGB to XYZ
  r = (r > 0.04045) ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = (g > 0.04045) ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = (b > 0.04045) ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
  
  let x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  let y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000;
  let z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  
  x = (x > 0.008856) ? Math.pow(x, 1/3) : (7.787 * x) + 16/116;
  y = (y > 0.008856) ? Math.pow(y, 1/3) : (7.787 * y) + 16/116;
  z = (z > 0.008856) ? Math.pow(z, 1/3) : (7.787 * z) + 16/116;
  
  return [(116 * y) - 16, 500 * (x - y), 200 * (y - z)];
}

function analyzeColorHarmony(labColors) {
  let totalDifference = 0;
  let pairs = 0;
  
  for (let i = 0; i < labColors.length; i++) {
    for (let j = i + 1; j < labColors.length; j++) {
      const difference = deltaE(labColors[i], labColors[j]);
      totalDifference += difference;
      pairs++;
    }
  }
  
  const averageDifference = totalDifference / pairs;
  
  // Score based on average difference
  // We want some difference, but not too much
  return 1 - Math.abs(averageDifference - 30) / 30;
}

function analyzeColorGradient(labColors) {
  // Sort colors by lightness (L value in LAB)
  const sortedColors = labColors.sort((a, b) => a[0] - b[0]);
  
  let gradientScore = 0;
  for (let i = 1; i < sortedColors.length; i++) {
    const difference = deltaE(sortedColors[i-1], sortedColors[i]);
    // We want consistent, small differences for a good gradient
    gradientScore += 1 - Math.min(difference / 20, 1);
  }
  
  return gradientScore / (sortedColors.length - 1);
}

function deltaE(lab1, lab2) {
  const deltaL = lab1[0] - lab2[0];
  const deltaA = lab1[1] - lab2[1];
  const deltaB = lab1[2] - lab2[2];
  return Math.sqrt(deltaL*deltaL + deltaA*deltaA + deltaB*deltaB);
}

function rgbToHex(rgb) {
  return "#" + rgb.map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }).join('');
}









 