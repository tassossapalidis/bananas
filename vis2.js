var plotVariables = (
    {
      fmt: d3.format(",.2f"),
      marginTop: 20, 
      marginRight: 50, 
      marginBottom: 30, 
      marginLeft: 70, 
      width: 960 - 20 - 50,
      height: 500 - 20 - 30,
      legendVertSpacing: 30
  
    }
  );

// reconcile country names between datasets
var rename_2 = new Map([
    ["Antigua and Barbuda", "Antigua and Barb."],
    ["Bolivia (Plurinational State of)", "Bolivia"],
    ["Bosnia and Herzegovina", "Bosnia and Herz."],
    ["Brunei Darussalam", "Brunei"],
    ["Cabo Verde", "Cape Verde"],
    ["Central African Republic", "Central African Rep."],
    ["Czechia", "Czech Rep."],
    ["Democratic Republic of the Congo", "Dem. Rep. Congo"],
    ["Equatorial Guinea", "Eq. Guinea"],
    ["Eswatini", "Swaziland"],
    ["Iran (Islamic Republic of)", "Iran"],
    ["Lao People's Democratic Republic", "Laos"],
    ["Micronesia (Federated States of)", "Micronesia"],
    ["Democratic People's Republic of Korea", "Dem. Rep. Korea"],
    ["North Macedonia", "Macedonia"],
    ["Republic of Korea", "Korea"],
    ["Republic of Moldova", "Moldova"],
    ["Russian Federation", "Russia"],
    ["Saint Kitts and Nevis", "St. Kitts and Nevis"],
    ["Saint Vincent and the Grenadines", "St. Vin. and Gren."],
    ["Sao Tome and Principe", "São Tomé and Principe"],
    ["Solomon Islands", "Solomon Is."],
    ["Syrian Arab Republic", "Syria"],
    ["United Kingdom of Great Britain and Northern Ireland", "United Kingdom"],
    ["United Republic of Tanzania", "Tanzania"],
    ["United States of America", "United States"],
    ["Venezuela (Bolivarian Republic of)", "Venezuela"],
    ["Viet Nam", "Vietnam"]
]);

loadData = Promise.all([
    d3.csv("https://raw.githubusercontent.com/tassossapalidis/bananas/main/data/sup_small1.csv"),
    d3.csv("https://raw.githubusercontent.com/tassossapalidis/bananas/main/data/banana_con.csv"),
    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson")
]).then(function (loadData) {
    // load data 
    var data1 = loadData[0];
    var datafull = loadData[1];
    var topo = loadData[2];
    var defaultdata = datafull
        .filter(d => d.Year == 2018 && d.Consumption == 'Food Supply')
        .slice(0, 5);

    //var categories = data1.columns.slice(1);
    var categories = ["Food Supply", "Export Quantity" , "Loss", "Processed", "Feed"];
    var years = d3.map(data1, d => d.Year); 

    // Setting up the base svg
    var svg = d3.select('#supply').append("svg")
        .attr("width", plotVariables.width + plotVariables.marginLeft + plotVariables.marginRight)
        .attr("height", plotVariables.height + plotVariables.marginTop + plotVariables.marginBottom);

    // Setting up the base map
    // Map and projection
    var path = d3.geoPath();
    var projection = d3.geoMercator()
        .scale(70)
        .center([0,20])
        .translate([plotVariables.width - 150, plotVariables.height / 2 + 150]);

    // Draw the map with default data 
    var maptop = svg.append("g")
        .selectAll("path")
        .data(topo.features)
        .enter()
        .append("path")
            // draw each country
            .attr("d", d3.geoPath()
            .projection(projection)
            )
            // set the color of each country
            .attr("fill", function (d) {
                for (let i = 0; i < 5; i++) {
                    let country = rename_2.get(defaultdata[i].Country) || defaultdata[i].Country;
                    if (country == d.properties.name) {
                        return 'blue';
                    }
                }
                return '#D3D3D3';
            });

    // Adding top 5 info
    var top5info = svg.append('g')
    .attr('transform',`translate(${plotVariables.width*1/2},${plotVariables.marginTop})`);

    // Adding the legend to top 5 info
    top5info.selectAll('text.top')
        .data(defaultdata)
        .join('text')
        .attr('class', 'top')
        .attr('x', 100)
        .attr('y', 20)
        .attr('fill', 'black')
        .attr('font-family', 'COPPERPLATE')
        .attr('font-size', '18px')
        .text(`${defaultdata[0].Year} \xa0 | \xa0 ${defaultdata[0].Consumption} (in tonnes/1k population)`);

    // Adding the top 5 list
    top5info.selectAll('text.top5')
        .data(defaultdata)
        .join('text')
        .attr('class', 'top5')
        .attr('font-family', 'COPPERPLATE')
        .attr('font-size', '16px')
        .attr('x', 100)
        .attr('y', function(d, i) {
            return plotVariables.marginTop * 3 + 20*i
        })
        .text(function (d, i) {
            return `${i+1}. ${d.Country}: ${plotVariables.fmt(d.ValuePerCapita)}`
        })
    // Also, set up a group to plot the stacked bar chart, so can move the whole thing together. Shift it left by the leftMargin and down by the topMargin
    var barGroup = svg.append('g')
        .attr('transform',`translate(${plotVariables.marginLeft + 40},${plotVariables.marginTop})`);

    // Step 2: Create the x axis
    //    First, set up an x scale that maps the bins (years) to the range in pixels (0 to width)
    var x = d3.scaleBand()
        .domain(years)
        .rangeRound([0, plotVariables.width / 3])
        .padding(0.1);

    //    Then, add the bottom axis by adding a group to the barGroup, shifting it down by the height of the image (since we want it to be at the bottom of the image), and calling the x scale
    barGroup.append('g').attr('transform',`translate(${0}, ${plotVariables.height})`)
        .call(d3.axisBottom(x));
    barGroup.append('text')
        .attr('text-anchor', "end")
        .attr('x', plotVariables.width/5 - 10)
        .attr('y', plotVariables.height + 30)
        .attr('font-family', 'COPPERPLATE')
        .text('Year');

    // Step 3: Create the y axis
    //    First, set up a y-scale that maps the domain of the data (0 to max value) to the range in pixels (0 to height)
    var y = d3.scaleLinear()
        .domain([0, 130000000]) 
        .rangeRound([plotVariables.height, 0]);

    //    Then, add the vertical axis by adding a group to the barGroup and calling the y scale
    barGroup.append('g').call(d3.axisLeft(y));
    barGroup.append('text')
        .attr('text-anchor', "end")
        .attr('transform', `translate(${-80}, ${plotVariables.height/4}) rotate(-90)`)
        .attr('font-family', 'COPPERPLATE')
        .text('Net Consumption (tonnes)')

    // Step 4: Select a color palette with one color per group for stacking
    var color = d3.scaleOrdinal()
        .domain(categories)
        .range(d3.schemeRdYlBu[5])

    // Step 5: Stack the data into a new data structure using "stack"
    var stackedData = d3.stack().keys(categories)(data1);
    // Step 6: Show the bars (copied from example code)
    barGroup.append('g')
        .selectAll('g')
        .data(stackedData)
        .enter()
        .append('g')
        .attr('fill', function (d) {return color(d.key);})
        .attr('category',d => d.key)
        .selectAll('rect')
        .data(d => d)
        .enter()
        .append('rect')
            .attr('x', function(d) { return x(d.data.Year)})
            .attr('y', function(d) { return y(d[1]) })
            .attr('height',d => y(d[0]) - y(d[1]))
            .attr('width', x.bandwidth())
            .attr('year',d => d.data.Year)
            .on('mouseover', function(event, d) {
                d3.select(this).style('cursor', 'pointer');
            })
            .on('click',function(d) {
            var year = this.getAttribute('year');
            var category = this.parentNode.getAttribute('category');
            var top5 = datafull
            .filter(d => d.Year === year & d.Consumption === category)
            .slice(0,5);
            
            // Updating the map highlights
            maptop.attr("fill", function (d) {
                for (let i = 0; i < 5; i++) {
                    let country = rename_2.get(top5[i].Country) || top5[i].Country;
                    if (country == d.properties.name) {
                        return 'blue';
                    }
                }
                return '#D3D3D3';
            })

            // Updating the title to top 5 info
            top5info.selectAll('text.top')
                .data(top5)
                .join('text')
                .attr('class', 'top')
                .attr('x', 100)
                .attr('y', 20)
                .attr('fill', 'black')
                .attr('font-family', 'COPPERPLATE')
                .attr('font-size', '18px')
                .text(`${top5[0].Year} \xa0 | \xa0 ${top5[0].Consumption} (tonnes/1k population)`);

        // Adding the top 5 list
            top5info.selectAll('text.top5')
                .data(top5)
                .join("text")   
                .attr('class', 'top5')
                .attr('font-family', 'COPPERPLATE')
                .attr('font-size', '16px')
                .attr('x', 100)
                .attr('y', function(d, i) {
                    return plotVariables.marginTop * 3 + 20*i
                })
                .text(function (d, i) {
                    return `${i+1}. ${d.Country}: ${plotVariables.fmt(d.ValuePerCapita)}`
                });

            });


    var legendSpaceData = [
        {'category': 'Export Quantity', 'color': 'red', 'index': 0},
        {'category': 'Feed', 'color': 'orange', 'index': 1},
        {'category': 'Food supply', 'color': 'yellow', 'index': 2},
        {'category': 'Loss','color': 'green', 'index': 3},
        {'category': 'Processed', 'color': 'purple', 'index': 4}
    ];

    // Adding a legend (not from the example code just me)
    var legendGroup = svg.append('g')
        .attr('transform',`translate(${plotVariables.width/2 - 30}, ${plotVariables.marginTop + 50})`);
        
    legendGroup.selectAll('legend-circle')
        .data(legendSpaceData)
        .enter()
        .append('circle')
        .attr('r',5)
        .attr('cx',0)
        .attr('cy', d => plotVariables.legendVertSpacing * d.index)
        .attr('fill', d => color(d.category));

    legendGroup.selectAll('text.legend')
        .data(legendSpaceData)
        .enter()
        .append('text')
        .attr('x',10)
        .attr('y', d => plotVariables.legendVertSpacing * d.index + 4)
        .text(function(d) { return d.category})
        .attr('font-family', 'Copperplate')
        .attr('font-size','12px');

    return svg.node();

})