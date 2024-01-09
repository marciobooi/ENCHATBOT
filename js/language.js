const getLanguageForWord = (word) => {
    return wordLanguageMapping[word] || 'undetermined'; // Default to 'undetermined' if not found in mappings
};

const detectLanguage = (text) => {
    try {
        // Check the mapping first
        const mappedLanguage = getLanguageForWord(text);
        if (mappedLanguage !== 'undetermined') {
            language = mappedLanguage;
            return;
        }

        // If not found in the mapping, use statistical detection
        const detectedLanguages = franc.all(text, { whitelist: ['eng', 'deu', 'fra'] });
       
        if (detectedLanguages.length > 0) {
            // Get the most probable language
            detectedLanguage = detectedLanguages[0];
            if (detectedLanguage[0] === "und") {
                // If still undetermined, use the default mapping
                detectedLanguage = getLanguageForWord(text);
            }
            language = detectedLanguage;
        } else {
            // If no language is detected, default to English
            language = "eng";
        }
    } catch (error) {
        console.error('Error detecting language:', error);
    }
};
