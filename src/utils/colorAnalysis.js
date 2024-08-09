export function analyzeColors(html) {
    // Parse the HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
  
    // Extract colors from CSS
    const colors = extractColorsFromCSS(doc);
  
    // If no colors found, use a default color
    if (colors.length === 0) {
      colors.push('#000000'); // Default to black
    }
  
    // Simple scoring logic based on number of colors
    let score = 0;
    if (colors.length >= 3 && colors.length <= 5) {
      score = 8; // Good range of colors
    } else if (colors.length > 5) {
      score = 6; // Too many colors
    } else {
      score = 4; // Too few colors
    }
  
    // Check for color harmony (simplified)
    if (checkColorHarmony(colors)) {
      score += 2;
    }
  
    // Ensure score is not above 10
    score = Math.min(10, score);
  
    return { palette: colors, score };
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
  
  function rgbToHex(rgb) {
    // Convert rgb(a) to hex
    const rgbArray = rgb.match(/\d+/g).map(Number);
    return `#${rgbArray.slice(0, 3).map(x => x.toString(16).padStart(2, '0')).join('')}`;
  }
  
  function checkColorHarmony(colors) {
    // Convert hex colors to HSL
    const hslColors = colors.map(hexToHSL);
  
    // Check for complementary colors (simplified)
    for (let i = 0; i < hslColors.length; i++) {
      for (let j = i + 1; j < hslColors.length; j++) {
        if (Math.abs(hslColors[i][0] - hslColors[j][0]) > 150) {
          return true;
        }
      }
    }
  
    return false;
  }
  
  function hexToHSL(hex) {
    let r = parseInt(hex.slice(1, 3), 16) / 255;
    let g = parseInt(hex.slice(3, 5), 16) / 255;
    let b = parseInt(hex.slice(5, 7), 16) / 255;
  
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
  
    if (max === min) {
      h = s = 0; // achromatic
    } else {
      let d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
        default: h = 0; // Default case added to satisfy eslint
      }
      h /= 6;
    }
  
    return [h * 360, s * 100, l * 100];
  }