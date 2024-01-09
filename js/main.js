
    const chatInput = document.querySelector(".chat-input textarea");
    const chatbox = document.querySelector(".chatbox");    
    let language = "eng"
    let fuelCode = ""

    
const getSimilarityScore = (word1, word2) => {
    const set1 = new Set(word1.split(''));
    const set2 = new Set(word2.split(''));

    const intersectionSize = [...set1].filter(char => set2.has(char)).length;
    const unionSize = set1.size + set2.size - intersectionSize;

    const jaccardIndex = intersectionSize / unionSize;

    // Prioritize exact matches (return 1 for exact match)
    return jaccardIndex === 1 ? 1 : jaccardIndex;
};

    const createChatLi = (message, className) => {
        const chatLi = document.createElement("li");
        chatLi.classList.add("chat", className);
        chatLi.innerHTML = className === "outgoing"
            ? `<p>${message}</p>`
            : `<i class="bi bi-robot"></i><p>${message}</p>`;
        return chatLi;
    };

    const generateResponse = (responseMessage) => {
        chatbox.appendChild(createChatLi(responseMessage, "incoming"));
        chatbox.scrollTo(0, chatbox.scrollHeight);
    };
    
    const handleUserInput = (userMessage) => {
        let lowerCaseUserMessage = userMessage.toLowerCase();

        let fuel = ""



    
        let dictionary;
        let stopwords;
    
        if (language === 'fra') {
            dictionary = energyDictionaryFR;
            stopwords = stopwordsFR;
        } else {
            dictionary = energyDictionaryEN;
            stopwords = stopwordsEN;
        }
    
        if (lowerCaseUserMessage === "help") {
            displayChatHelp();
            return;
        }

        if (lowerCaseUserMessage === "history") {
            displayChatHistory();
            return;
        }
    
        const stopWordsRegex = new RegExp('\\b(' + stopwords.join('|') + ')\\b', 'gi');
        lowerCaseUserMessage = lowerCaseUserMessage.replace(stopWordsRegex, '').trim();   

        // function to search by fuel codes and convert to names
        let transformedMessage = lowerCaseUserMessage.toUpperCase();
        if (fuelsDictionary[transformedMessage]) {
            fuelInfo = fuelsDictionary[transformedMessage];
            fuel = transformedMessage;
            lowerCaseUserMessage = fuelInfo.name;  // Assuming the name property is present in the fuelInfo object
        } else {
            // If the fuel code is not found, try to convert the name to fuel code
            const fuelCode = Object.keys(fuelsDictionary).find(key => fuelsDictionary[key].name.toLowerCase() === lowerCaseUserMessage.toLowerCase());
        
            if (fuelCode) {
                fuelInfo = fuelsDictionary[fuelCode];
                fuel = fuelCode;
            }
        }

        console.log(lowerCaseUserMessage)

            // Check for exact matches first
        if (dictionary[lowerCaseUserMessage]) {
            const concatenatedResponse = dictionary[lowerCaseUserMessage].join('<br>');
            generateResponse(concatenatedResponse);  
            
            if (fuel) {

                fuelCode = fuel

                getData();

                const buttonsHtml =  `<button class="btn btn-primary response-btn" onClick="minMax('${fuel}')">Do you want to know more?</button>`;;
                const messageHtml = `${buttonsHtml}`;
                generateResponse(messageHtml);

            }

            updateChatHistory(userMessage, "outgoing");
            return;
        }  
       
        let partialMatches = [];
        for (const keyword in dictionary) {
            const lowerCaseKeyword = keyword.toLowerCase();
            const similarityScore = getSimilarityScore(lowerCaseUserMessage, lowerCaseKeyword);
    
            if (similarityScore >= 0.5) {
                partialMatches.push(keyword);
            }
        }
    
        if (partialMatches.length > 0) {
            // If there are multiple partial matches, create clickable buttons
            const buttonsHtml = partialMatches.map(match => `<button class="btn btn-primary response-btn" data-key="${match}">${match}</button>`).join('<br>');
            const messageHtml = `Multiple matches found. Click on a keyword: ${buttonsHtml}`;
            generateResponse(messageHtml);
    
            // Attach click event listeners to the generated buttons
            const responseButtons = document.querySelectorAll('.response-btn');
            responseButtons.forEach(button => {
                button.addEventListener('click', () => handleButtonClick(button.dataset.key));
            });
        } else {
            handleErrors("notFind");
        }
    
        updateChatHistory(userMessage, "outgoing");
    };
    
    



    const handleChat = () => {
        const userMessage = chatInput.value.trim();

        detectLanguage(userMessage);

        if (!userMessage) return;

        chatInput.value = "";

        chatbox.appendChild(createChatLi(userMessage, "outgoing"));
        chatbox.scrollTo(0, chatbox.scrollHeight);

        handleUserInput(userMessage);
    };

    chatInput.addEventListener("keydown", (e) => {
        if (!chatInput) return;

        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleChat();
        }
    });


    const sendChatBtn = document.getElementById("send-btn");
    if (sendChatBtn) {
        sendChatBtn.addEventListener("click", handleChat);
    }
    
    const handleButtonClick = (selectedKey) => {

        if (language === 'fra') {
            dictionary = energyDictionaryFR;
            stopwords = stopwordsFR;
        } else {
            dictionary = energyDictionaryEN;
            stopwords = stopwordsEN;
        }

        if (dictionary[selectedKey]) {     
    
            const concatenatedResponse = dictionary[selectedKey].join('<br>');
            generateResponse(concatenatedResponse);

            getData(); 
    
            const buttonsHtml =  `<button class="btn btn-primary response-btn" onClick="minMax('${selectedKey}')">Do you want to know more?</button>`;;
            const messageHtml = `${buttonsHtml}`;
            generateResponse(messageHtml);
    
            updateChatHistory(selectedKey, "outgoing");
            return;
        }
    };


