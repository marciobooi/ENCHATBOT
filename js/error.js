function handleErrors(errorType) {
    let errorMessage = "";
    
    switch (errorType) {
        case "notFind":
            errorMessage = "I'm sorry, but I couldn't understand your input. Please try again.";
            break;
        case "dataFetching":
            errorMessage = "I encountered an issue while fetching data. Please try again later.";
            break;
        case "chartRendering":
            errorMessage = "There was an error while rendering the chart. Please try again.";
            break;
        default:
            errorMessage = "Oops! Something went wrong. Please try again.";
            break;
    }

    generateResponse(errorMessage, "error");
}