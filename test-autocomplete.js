// test-autocomplete.js
class TestAutocomplete {
    constructor() {
        this.initialize();
    }

    initialize() {
        // Log when the script starts
        console.log('Initializing autocomplete test...');

        // Try to find the input element immediately
        const inputElement = document.querySelector('.ProseMirror[contenteditable="true"]');
        if (inputElement) {
            console.log('Found input element immediately:', inputElement);
            this.setupListeners(inputElement);
        }

        // Also set up an observer in case the element loads later
        const observer = new MutationObserver((mutations, obs) => {
            const inputElement = document.querySelector('.ProseMirror[contenteditable="true"]');
            if (inputElement) {
                console.log('Found input element via observer:', inputElement);
                this.setupListeners(inputElement);
                obs.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    setupListeners(inputElement) {
        // Log any changes to the input
        inputElement.addEventListener('input', (e) => {
            console.log('Input event fired');
            console.log('Current content:', e.target.textContent);
        });

        // Test that we can modify the content
        inputElement.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                console.log('Tab pressed');
                
                // Try to insert some test content
                this.insertContent(inputElement, 'Test autocomplete content');
            }
        });
    }

    insertContent(element, text) {
        try {
            // Try different methods of inserting content
            console.log('Attempting to insert content...');
            
            // Method 1: Using innerHTML
            element.innerHTML = `<p>${text}</p>`;
            console.log('Method 1 completed');

            // Method 2: Using textContent
            // element.textContent = text;
            // console.log('Method 2 completed');

            // Method 3: Using execCommand
            // document.execCommand('insertText', false, text);
            // console.log('Method 3 completed');
        } catch (error) {
            console.error('Error inserting content:', error);
        }
    }
}

// Create test instance
const test = new TestAutocomplete();