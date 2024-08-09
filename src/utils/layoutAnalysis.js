export function analyzeLayout(html) {
    // Parse the HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
  
    // Analyze content to whitespace ratio
    const contentToWhitespaceRatio = calculateContentToWhitespaceRatio(doc);
  
    // Analyze element balance
    const elementBalanceScore = calculateElementBalance(doc);
  
    // Analyze symmetry
    const symmetryScore = calculateSymmetry(doc);
  
    // Analyze use of grid or flexbox
    const modernLayoutScore = checkModernLayout(doc);
  
    // Analyze responsive design
    const responsiveDesignScore = checkResponsiveDesign(doc);
  
    // Calculate overall score
    const score = calculateOverallScore(
      contentToWhitespaceRatio,
      elementBalanceScore,
      symmetryScore,
      modernLayoutScore,
      responsiveDesignScore
    );
  
    return {
      contentToWhitespaceRatio,
      elementBalanceScore,
      symmetryScore,
      modernLayoutScore,
      responsiveDesignScore,
      score
    };
  }
  
  function calculateContentToWhitespaceRatio(doc) {
    const textNodes = [];
    const treeWalker = document.createTreeWalker(
      doc.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
  
    while (treeWalker.nextNode()) {
      textNodes.push(treeWalker.currentNode);
    }
  
    const textContent = textNodes.reduce((acc, node) => acc + node.textContent.trim(), '');
    const totalArea = doc.body.offsetWidth * doc.body.offsetHeight;
    const textArea = textContent.length * 10; // Rough estimate
  
    return textArea / totalArea;
  }
  
  function calculateElementBalance(doc) {
    const elements = doc.body.getElementsByTagName('*');
    const leftHalf = [];
    const rightHalf = [];
  
    for (let element of elements) {
      const rect = element.getBoundingClientRect();
      if (rect.left < window.innerWidth / 2) {
        leftHalf.push(element);
      } else {
        rightHalf.push(element);
      }
    }
  
    const balance = Math.min(leftHalf.length, rightHalf.length) / Math.max(leftHalf.length, rightHalf.length);
    return balance * 10; // Scale to 0-10
  }
  
  function calculateSymmetry(doc) {
    // This is a simplified symmetry check
    const leftElements = doc.querySelectorAll('body > *:first-child > *');
    const rightElements = doc.querySelectorAll('body > *:last-child > *');
    
    const symmetryRatio = Math.min(leftElements.length, rightElements.length) / 
                          Math.max(leftElements.length, rightElements.length);
    
    return symmetryRatio * 10; // Scale to 0-10
  }
  
  function checkModernLayout(doc) {
    const styles = window.getComputedStyle(doc.body);
    const usesGrid = styles.display === 'grid';
    const usesFlexbox = styles.display === 'flex';
    
    return (usesGrid || usesFlexbox) ? 10 : 5;
  }
  
  function checkResponsiveDesign(doc) {
    const metaViewport = doc.querySelector('meta[name="viewport"]');
    const hasMediaQueries = !!doc.querySelector('style');
    
    if (metaViewport && hasMediaQueries) {
      return 10;
    } else if (metaViewport || hasMediaQueries) {
      return 5;
    } else {
      return 0;
    }
  }
  
  function calculateOverallScore(...scores) {
    const weights = [0.2, 0.2, 0.2, 0.2, 0.2]; // Equal weights for simplicity
    return scores.reduce((acc, score, index) => acc + score * weights[index], 0);
  }