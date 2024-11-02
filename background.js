chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get('prompts', (data) => {
    if (!data.prompts) {
      chrome.storage.sync.set({
        prompts: [
          { id: 1, text: "Could you explain this in simple terms?" },
          { id: 2, text: "What are the pros and cons of this approach?" },
          { id: 3, text: "Can you provide an example?" }
        ],
        isVisible: true,
        position: { x: 20, y: 20 }
      });
    }
  });
});