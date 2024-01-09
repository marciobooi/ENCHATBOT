function displayChatHelp() {
    const helpMessage = "You can interact with this chatbot by typing keywords or questions about energy sources, such as 'renewable energy' or 'coal'. " +
        "If you need assistance or have questions, feel free to ask. You can also use the 'help' or 'history' command to get this message.";
    chatbox.appendChild(createChatLi(helpMessage, "incoming"));

    chatbox.scrollTo(0, chatbox.scrollHeight);
}
