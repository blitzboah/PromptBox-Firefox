browser.runtime.onInstalled.addListener(async () => {
  try {
    const defaultPrompts = {
      global: [
        { id: 'g1', text: "Could you explain this in simple terms?", type: 'global' },
        { id: 'g2', text: "What are the pros and cons of this approach?", type: 'global' },
        { id: 'g3', text: "Can you provide an example?", type: 'global' }
      ],
      local: [
        { id: 'l1', text: "What does this code do?", type: 'local' },
        { id: 'l2', text: "How can I improve this?", type: 'local' }
      ]
    };

    await browser.storage.sync.set({
      prompts: defaultPrompts,
      position: { x: 800, y: 20 }, // Set default position instead of using window.innerWidth
      isExpanded: false,
      activeTab: 'local'
    });
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
});