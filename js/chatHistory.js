let chatHistory = [];

const updateChatHistory = (message, type) => {
    chatHistory.push({ message, type });
};

const displayChatHistory = () => {
    chatbox.innerHTML = ''; // Clear the chatbox

    if (chatHistory.length > 0) {
        const botInit = createChatLi("Here's the history of our conversation:", "incoming");
        chatbox.appendChild(botInit);
        for (const chatEntry of chatHistory) {
            const chatLi = createChatLi(chatEntry.message, chatEntry.type);
            chatbox.appendChild(chatLi);
        }
    } else {
        const chatLi = createChatLi("Our conversation history is empty.", "incoming");
        chatbox.appendChild(chatLi);
    }
    
    chatbox.scrollTo(0, chatbox.scrollHeight);

    const chatHistoryItems = document.querySelectorAll(".chatbox .outgoing");
    chatHistoryItems.forEach(item => {
        item.style.cursor = "pointer"; 
        item.addEventListener("click", () => simulateTypingAndSubmit(item.textContent));
    });
};

const simulateTypingAndSubmit = (textToType) => {
    // Trigger the submission of the chat message only if it's not coming from a click on the current input
    if (chatInput.value !== textToType) {
        chatInput.value = textToType;
        submitChatMessage();
    }
};

const submitChatMessage = () => {
    const userMessage = chatInput.value.trim();   
    handleUserInput(userMessage);
    chatInput.value = "";
};