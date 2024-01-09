const highchartsChart  = (containerId, type, title, xAxis, yAxis, series, tooltip, plotOptions) => { 

    const chartContainer = createChartContainer(chatbox, containerId);

    Highcharts.chart(containerId, {
        chart: {
            type: type,
        },
        title: {
            text: title,
        },
        xAxis: {
            categories: xAxis,       
        },
        yAxis: {
            title: {
                text: yAxis,
            }
        }, 
        tooltip: tooltip,
        tooltip: {
            enabled: true,
            style: {
                background: '#fff',
                color: '#333',
                fontSize: '12px',
                padding: '10px',
                borderRadius: '5px'
            }
        },
        legend: {
            enabled: false  // Set to false to hide the legend
        },
        credits: {
            enabled: false  // Set to false to hide the credits
        },
        series: [series],
        plotOptions: plotOptions
    })

}

// Function to generate a simple line chart
const generateLineChart = (containerId, data) => {   

    highchartsChart(
        containerId,  
        'line',
        "European Union (27 countries) - Gross available energy - " + fuelCode,
        data.categories,      
        'ktones',    
        { name: fuelCode, data: data.values },
        {formatter: function () {
            return `<b>${this.x}</b><br/>${Highcharts.numberFormat(this.y, 2)} KTOE`;
        }},
        {}
    ); 
  
};
const generateBarChart = (containerId, data) => {    
    
    const labels = data.map(entry => entry[0]);
    const values = data.map(entry => entry[1]);

    highchartsChart(
        containerId,  
        'column',
        "Gross available energy - " + fuelCode + " - 2021",
        labels,      
        'KTOE',    
        { name: 'Energy Consumption', data: values },
        {formatter: function () {
            return `<b>${this.x}</b><br/>${Highcharts.numberFormat(this.y, 2)} KTOE`;
        }},
        {}
    ); 

};
const generatePieChart = (containerId, data) => {    

    highchartsChart(
        containerId,  
        'pie',
        'Top 10 Energy Consumption Categories',
        {},      
        'KTOE',    
        {   allowPointSelect: true,
            keys: ['name', 'y', 'selected', 'sliced'],
            name: 'Quota',
            data: data.slice(1), // Exclude the TOTAL entry         
           },
        {pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>',  style: {
            background: '#fff',
            color: '#333',
            fontSize: '12px',
            padding: '10px',
            borderRadius: '5px'
          }},
        { pie: {
            innerSize: '60%',
            outerSize: '100%',
            label: {
              enabled: true,
              distance: -35,
              textShadow: {
                color: '#fff',
                blur: 1,
                offset: '2px 2px'
              }
            }
            }
          },
    ); 

};


const createChartContainer = (parentElement, containerId) => {
    const chartContainer = document.createElement('div');
    chartContainer.id = containerId;
    parentElement.appendChild(chartContainer);
    return chartContainer;
};
