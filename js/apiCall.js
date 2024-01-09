

function getData() {  

    const apiUrl = `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/nrg_bal_c?format=JSON&nrg_bal=GAE&unit=KTOE&geo=EU27_2020&siec=${fuelCode}`;

    d = JSONstat(apiUrl).Dataset(0);

    return indicator = d.Dimension("time").id.map((a, b) => {
      obj = {
        year: a,
        value: d.value[b],
      };
      return obj
    });
}


function minMax() {

    let min = Infinity;
    let max = -Infinity;
    let minYear, maxYear;

    for (var { year, value } of indicator) {
        if (value < min) {
            min = value;
            minYear = year;
        }
        if (value > max) {
            max = value;
            maxYear = year;
        }
    }

    const content = `Maximum value of ${fuelCode} found in ${minYear} - European Union (27 countries) ${min} KTOE.<br>Minimum value of ${fuelCode} found in ${maxYear} - European Union (27 countries) ${max} KTOE.`;

    generateResponse(content);

    const buttonsHtml =  `<button class="btn btn-primary response-btn" onClick="linedata()">Do you want to know more?</button>`;;
    const messageHtml = `${buttonsHtml}`;
    generateResponse(messageHtml);


}

function linedata(fuel) {

    const chartData = {
        categories: d.Dimension("time").id,
        values: d.value
    };

    // console.log(chartData)

    if (chatbox instanceof HTMLElement) {
        const randomChartContainerID = 'chartContainerID_' + Math.random().toString(36).substring(7);
        // Generate the line chart and get the chart container
        const chartContainer = generateLineChart(randomChartContainerID, chartData);

        // Append the chart as a new chat entry
        createChatLi(chartContainer, "incoming"); // Remove extra argument


        const buttonsHtml =  `<button class="btn btn-primary response-btn" onClick="bardata()">Do you want to know more?</button>`;;
        const messageHtml = `${buttonsHtml}`;
        generateResponse(messageHtml);


    }
    
}

const getFuelInfoByKey = (fuelKey) => {
    return fuelsDictionary[fuelKey];
};


function bardata() {

    const fuelObj = getFuelInfoByKey(fuelCode);

    const apiUrl = `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/nrg_bal_c?format=JSON&nrg_bal=${fuelObj.nrg_bal}&unit=KTOE&siec=${fuelObj.siec}&time=2021`;
    
    const d = JSONstat(apiUrl).Dataset(0);

    geos = d.Dimension("geo").id;

    chartData = geos.map((geo, gIdx) => {
      return [d.__tree__.dimension.geo.category.label[geo], d.value[gIdx]];
    }).sort((a, b) => b[1] - a[1]);

    if (chatbox instanceof HTMLElement) {
        const randomChartContainerID = 'chartContainerID_' + Math.random().toString(36).substring(7);
        // Generate the line chart and get the chart container
        const chartContainer = generateBarChart(randomChartContainerID, chartData);

        // Append the chart as a new chat entry
        createChatLi(chartContainer, "incoming"); // Remove extra argument
    }

    const buttonsHtml =  `<button class="btn btn-primary response-btn" onClick="piedata()">Do you want to know more?</button>`;;
    const messageHtml = `${buttonsHtml}`;
    generateResponse(messageHtml);
    
}


function piedata() {

    const fuelObj = getFuelInfoByKey(fuelCode);

    const apiUrl = `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/nrg_bal_c?format=JSON&time=2021&unit=KTOE&nrg_bal=${fuelObj.nrg_bal}&lang=en`

    const d = JSONstat(apiUrl).Dataset(0);

    const siec = d.Dimension("siec").id;

    const chartData = siec.map((siec, gIdx) => {
        return siec == fuelCode?  [siec, d.value[gIdx], true, true] : [siec, d.value[gIdx], false]        
      }).sort((a, b) => b[1] - a[1]);

    if (chatbox instanceof HTMLElement) {
        const randomChartContainerID = 'chartContainerID_' + Math.random().toString(36).substring(7);
        // Generate the line chart and get the chart container
        const chartContainer = generatePieChart(randomChartContainerID, chartData);

        // Append the chart as a new chat entry
        createChatLi(chartContainer, "incoming"); // Remove extra argument
    }

}


