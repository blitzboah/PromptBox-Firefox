class PromptAutocomplete {
    constructor() {
        this.currentSuggestions = [];
        this.suggestionsContainer = null;
        this.contentContainer = null;
        this.inputElement = null;
        this.lastContent = '';
        this.isDragging = false;
        this.currentX = 0;
        this.currentY = 0;
        this.initialX = 0;
        this.initialY = 0;
        this.xOffset = 0;
        this.yOffset = 0;
        
        // Initialize after constructor
        setTimeout(() => this.initialize(), 0);
    }

    initialize() {
        console.log('Initializing prompt autocomplete...');
        
        // Create suggestions container first
        this.createSuggestionsContainer();
        
        // Try to find the input element
        const inputElement = document.querySelector('.ProseMirror[contenteditable="true"]');
        if (inputElement) {
            console.log('Found input element immediately');
            this.setupAutocomplete(inputElement);
        }

        // Set up observer for dynamic loading
        const observer = new MutationObserver((mutations, obs) => {
            const inputElement = document.querySelector('.ProseMirror[contenteditable="true"]');
            if (inputElement && !this.inputElement) {
                console.log('Found input element via observer');
                this.setupAutocomplete(inputElement);
                this.positionBelowInput();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    createSuggestionsContainer() {
        try {
            // Remove existing container if any
            const existingContainer = document.querySelector('.prompt-suggestions');
            if (existingContainer) {
                existingContainer.remove();
            }

            // Create main container
            this.suggestionsContainer = document.createElement('div');
            this.suggestionsContainer.className = 'prompt-suggestions';

            // Create header
            const header = document.createElement('div');
            header.className = 'suggestions-header';
            header.textContent = 'Suggestions';

            // Create content container
            this.contentContainer = document.createElement('div');
            this.contentContainer.className = 'suggestions-content';

            // Add empty state
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.textContent = 'No suggestions available';

            // Build structure
            this.contentContainer.appendChild(emptyState);
            this.suggestionsContainer.appendChild(header);
            this.suggestionsContainer.appendChild(this.contentContainer);

            // Apply styles
            Object.assign(this.suggestionsContainer.style, {
                position: 'fixed',
                top: '100px',
                left: '100px',
                background: 'white',
                border: '1px solid #ddd',
                borderRadius: '4px',
                width: '300px',
                minHeight: '100px',
                maxHeight: '300px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                zIndex: '10000',
                display: 'block',
                fontSize: '14px',
                fontFamily: 'Arial, sans-serif',
                overflow: 'hidden'
            });

            Object.assign(header.style, {
                padding: '8px 12px',
                borderBottom: '1px solid #ddd',
                backgroundColor: '#f5f5f5',
                fontWeight: 'bold',
                cursor: 'move',
                userSelect: 'none'
            });

            Object.assign(this.contentContainer.style, {
                overflowY: 'auto',
                maxHeight: '250px',
                padding: '8px 0'
            });

            Object.assign(emptyState.style, {
                padding: '12px',
                color: '#666',
                textAlign: 'center',
                fontStyle: 'italic'
            });

            // Add to document
            document.body.appendChild(this.suggestionsContainer);

            // Setup dragging
            this.setupDragging(header);

            // Add click handler to document
            document.addEventListener('click', (e) => {
                if (this.suggestionsContainer && 
                    !this.suggestionsContainer.contains(e.target) && 
                    e.target !== this.inputElement) {
                    this.updateSuggestions();
                }
            });

        } catch (error) {
            console.error('Error creating suggestions container:', error);
        }
    }

    setupDragging(dragHandle) {
        const dragStart = (e) => {
            if (e.type === "touchstart") {
                this.initialX = e.touches[0].clientX - this.xOffset;
                this.initialY = e.touches[0].clientY - this.yOffset;
            } else {
                this.initialX = e.clientX - this.xOffset;
                this.initialY = e.clientY - this.yOffset;
            }
            
            if (e.target === dragHandle) {
                this.isDragging = true;
            }
        };

        const dragEnd = () => {
            this.isDragging = false;
        };

        const drag = (e) => {
            if (this.isDragging && this.suggestionsContainer) {
                e.preventDefault();
                
                if (e.type === "touchmove") {
                    this.currentX = e.touches[0].clientX - this.initialX;
                    this.currentY = e.touches[0].clientY - this.initialY;
                } else {
                    this.currentX = e.clientX - this.initialX;
                    this.currentY = e.clientY - this.initialY;
                }

                this.xOffset = this.currentX;
                this.yOffset = this.currentY;

                this.suggestionsContainer.style.transform = 
                    `translate(${this.currentX}px, ${this.currentY}px)`;
            }
        };

        dragHandle.addEventListener('touchstart', dragStart, false);
        dragHandle.addEventListener('mousedown', dragStart, false);
        document.addEventListener('touchend', dragEnd, false);
        document.addEventListener('mouseup', dragEnd, false);
        document.addEventListener('touchmove', drag, false);
        document.addEventListener('mousemove', drag, false);
    }

    positionBelowInput() {
        if (this.inputElement && this.suggestionsContainer) {
            const rect = this.inputElement.getBoundingClientRect();
            this.suggestionsContainer.style.top = `${rect.bottom + 5}px`;
            this.suggestionsContainer.style.left = `${rect.left}px`;
            // Reset transform when positioning below input
            this.suggestionsContainer.style.transform = 'none';
            this.xOffset = 0;
            this.yOffset = 0;
        }
    }

    setupAutocomplete(inputElement) {
        this.inputElement = inputElement;
        
        // Handle input events with debouncing
        let debounceTimeout;
        inputElement.addEventListener('input', async (e) => {
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(async () => {
                const content = e.target.textContent;
                
                if (content === this.lastContent) return;
                this.lastContent = content;

                try {
                    // Get suggestions from storage
                    const { prompts } = await chrome.storage.sync.get('prompts');
                    if (!prompts) {
                        console.log('No prompts found in storage');
                        this.currentSuggestions = [];
                        this.updateSuggestions();
                        return;
                    }

                    const allPrompts = [...(prompts.global || []), ...(prompts.local || [])];
                    
                    // Filter prompts based on current input
                    this.currentSuggestions = allPrompts.filter(prompt => 
                        prompt.text.toLowerCase().startsWith(content.toLowerCase())
                    );

                    console.log('Found suggestions:', this.currentSuggestions);
                    this.updateSuggestions();
                } catch (error) {
                    console.error('Error getting suggestions:', error);
                    this.currentSuggestions = [];
                    this.updateSuggestions();
                }
            }, 150);
        });

        // Handle keyboard navigation
        inputElement.addEventListener('keydown', (e) => {
            if (!this.currentSuggestions.length) return;
            
            switch(e.key) {
                case 'Tab':
                case 'Enter':
                    if (this.currentSuggestions.length > 0) {
                        e.preventDefault();
                        this.completeSuggestion(this.currentSuggestions[0]);
                    }
                    break;
                case 'Escape':
                    this.currentSuggestions = [];
                    this.updateSuggestions();
                    break;
            }
        });
    }

    updateSuggestions() {
        if (!this.contentContainer) return;
        
        this.contentContainer.innerHTML = '';

        if (this.currentSuggestions.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.textContent = 'No suggestions available';
            Object.assign(emptyState.style, {
                padding: '12px',
                color: '#666',
                textAlign: 'center',
                fontStyle: 'italic'
            });
            this.contentContainer.appendChild(emptyState);
            return;
        }

        this.currentSuggestions.forEach((suggestion) => {
            const div = document.createElement('div');
            Object.assign(div.style, {
                padding: '8px 12px',
                cursor: 'pointer',
                borderBottom: '1px solid #eee',
                backgroundColor: 'white',
                transition: 'background-color 0.2s'
            });
            
            const matchingPart = suggestion.text.substring(0, this.lastContent.length);
            const remainingPart = suggestion.text.substring(this.lastContent.length);
            div.innerHTML = `<strong>${matchingPart}</strong>${remainingPart}`;

            div.addEventListener('click', () => {
                this.completeSuggestion(suggestion);
            });

            div.addEventListener('mouseenter', () => {
                div.style.backgroundColor = '#f0f0f0';
            });
            div.addEventListener('mouseleave', () => {
                div.style.backgroundColor = 'white';
            });

            this.contentContainer.appendChild(div);
        });
    }

    completeSuggestion(suggestion) {
        if (!this.inputElement) return;
        
        console.log('Completing suggestion:', suggestion);
        
        // Insert the suggestion text with proper paragraph formatting
        this.inputElement.innerHTML = `<p>${suggestion.text}</p>`;
        
        // Move cursor to end
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(this.inputElement);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);

        // Clear suggestions but keep box visible
        this.currentSuggestions = [];
        this.updateSuggestions();
    }
}

// Initialize the autocomplete
const promptAutocomplete = new PromptAutocomplete();