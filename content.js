class PromptBox {
  constructor() {
    this.prompts = [];
    this.isVisible = true;
    this.position = { x: 20, y: 20 };
    this.createContainer();
    this.loadState().then(() => {
      this.render();
      this.setupToggleShortcut();
    });
    this.editingId = null;
  }

  createContainer() {
    this.container = document.createElement('div');
    this.container.className = 'ai-prompt-box';
    this.container.style.left = `${this.position.x}px`;
    this.container.style.top = `${this.position.y}px`;
    document.body.appendChild(this.container);
  }

  async loadState() {
    const data = await chrome.storage.sync.get(['prompts', 'isVisible', 'position']);
    this.prompts = data.prompts || [
      { id: 1, text: "Could you explain this in simple terms?" },
      { id: 2, text: "What are the pros and cons of this approach?" },
      { id: 3, text: "Can you provide an example?" }
    ];
    this.isVisible = data.isVisible !== undefined ? data.isVisible : true;
    this.position = data.position || { x: 20, y: 20 };
    
    this.updateVisibility();
  }

  updateVisibility() {
    if (this.isVisible) {
      this.container.classList.remove('hidden');
    } else {
      this.container.classList.add('hidden');
    }
  }

  setupToggleShortcut() {
    document.addEventListener('keydown', async (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        this.isVisible = !this.isVisible;
        await chrome.storage.sync.set({ isVisible: this.isVisible });
        this.updateVisibility();
      }
    });
  }

  setupDragging() {
    const handle = this.container.querySelector('.drag-handle');
    let isDragging = false;
    let startX, startY, startPosX, startPosY;

    handle.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startPosX = this.position.x;
      startPosY = this.position.y;
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;

      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      this.position = {
        x: startPosX + deltaX,
        y: startPosY + deltaY
      };

      this.container.style.left = `${this.position.x}px`;
      this.container.style.top = `${this.position.y}px`;
    });

    document.addEventListener('mouseup', async () => {
      if (isDragging) {
        isDragging = false;
        await chrome.storage.sync.set({ position: this.position });
      }
    });
  }

  async addPrompt(text) {
    if (!text.trim()) return;
    
    const newPrompt = {
      id: Math.max(0, ...this.prompts.map(p => p.id)) + 1,
      text: text.trim()
    };
    
    this.prompts.push(newPrompt);
    await chrome.storage.sync.set({ prompts: this.prompts });
    this.render();
  }

  truncateText(text, wordLimit = 10) {
    const words = text.split(' ');
    if (words.length > wordLimit) {
      return words.slice(0, wordLimit).join(' ') + '...';
    }
    return text;
  }

  async deletePrompt(id) {
    const confirmed = await new Promise(resolve => {
      const result = window.confirm('Are you sure you want to delete this prompt?');
      resolve(result);
    });
    
    if (confirmed) {
      this.prompts = this.prompts.filter(prompt => prompt.id !== id);
      await chrome.storage.sync.set({ prompts: this.prompts });
      this.render();
    }
  }


  async copyPrompt(id) {
    const prompt = this.prompts.find(p => p.id === id);
    if (prompt) {
      try {
        await navigator.clipboard.writeText(prompt.text);
        // Show brief visual feedback without blocking
        const copyBtn = this.container.querySelector(`.copy-btn[data-id="${id}"]`);
        if (copyBtn) {
          // Store the original SVG
          const originalSVG = copyBtn.innerHTML;
          
          // Show checkmark SVG
          copyBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          `;
          
          // Reset after brief animation without blocking further copies
          setTimeout(() => {
            copyBtn.innerHTML = originalSVG;
          }, 500);
        }
      } catch (err) {
        console.error('Failed to copy text:', err);
      }
    }
  } 

  async editPrompt(id, newText) {
    if (!newText.trim()) return;
    
    this.prompts = this.prompts.map(prompt => 
      prompt.id === id ? { ...prompt, text: newText.trim() } : prompt
    );
    
    await chrome.storage.sync.set({ prompts: this.prompts });
    this.editingId = null;
    this.render();
  }

  startEditing(id) {
    this.editingId = id;
    this.render();
  }

  cancelEditing() {
    this.editingId = null;
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="drag-handle">
        <span> PromptBox </span>
        <div class="handle-icon">⋮⋮</div>
      </div>
      
      <div class="prompt-content">
        <div class="add-prompt">
          <input type="text" placeholder="Add new prompt..." id="new-prompt-input">
          <button id="add-prompt-btn" class="action-btn add">+</button>
        </div>
        
        <div class="prompts-list">
          ${this.prompts.map((prompt, index) => {
            if (this.editingId === prompt.id) {
              return `
                <div class="prompt-item editing">
                  <span class="prompt-number">${index + 1}</span>
                  <div class="edit-container">
                    <input type="text" 
                      class="edit-input" 
                      value="${prompt.text}" 
                      data-id="${prompt.id}">
                    <div class="edit-actions">
                      <button class="save-btn action-btn" data-id="${prompt.id}">✓</button>
                      <button class="cancel-btn action-btn">✕</button>
                    </div>
                  </div>
                </div>
              `;
            }
            return `
              <div class="prompt-item">
                <div class="prompt-header">
                  <span class="prompt-number">${index + 1}</span>
                  <button class="copy-btn action-btn" data-id="${prompt.id}" title="Copy">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                  </button>
                </div>
                <p class="prompt-text" title="${prompt.text}">${this.truncateText(prompt.text)}</p>
                <div class="prompt-actions">
                  <button class="edit-btn action-btn" data-id="${prompt.id}" title="Edit">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                    </svg>
                  </button>
                  <button class="delete-btn action-btn" data-id="${prompt.id}" title="Delete">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M3 6h18"></path>
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    this.setupEventListeners();
    this.setupDragging();
  } 

  setupEventListeners() {
    const addInput = this.container.querySelector('#new-prompt-input');
    const addButton = this.container.querySelector('#add-prompt-btn');

    addInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.addPrompt(addInput.value);
        addInput.value = '';
      }
    });

    addButton.addEventListener('click', () => {
      this.addPrompt(addInput.value);
      addInput.value = '';
    });

    this.container.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.deletePrompt(parseInt(btn.dataset.id));
      });
    });

    this.container.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.copyPrompt(parseInt(btn.dataset.id));
      });
    });

    this.container.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.startEditing(parseInt(btn.dataset.id));
      });
    });

    this.container.querySelectorAll('.save-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id);
        const input = this.container.querySelector(`.edit-input[data-id="${id}"]`);
        this.editPrompt(id, input.value);
      });
    });

    this.container.querySelectorAll('.cancel-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.cancelEditing();
      });
    });

    this.container.querySelectorAll('.edit-input').forEach(input => {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          const id = parseInt(input.dataset.id);
          this.editPrompt(id, input.value);
        }
        if (e.key === 'Escape') {
          this.cancelEditing();
        }
      });
    });
  }
}

// Initialize directly without site check
if (document.readyState === 'loading') {
document.addEventListener('DOMContentLoaded', () => new PromptBox());
} else {
new PromptBox();
}