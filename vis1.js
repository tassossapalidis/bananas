// define plot variables
plotVars = (
    {
      dataLink: './data/import_export.csv',
      // map setup
      mapWidth: 1000,
      mapHeight: 750,
      mapFile: './data/custom.geo.json',
      mapScale: 150,
      mapCenter: [0, 20],
      // map coloring
      mapColorThresholds: [-1000000, -100000, -10000, -1000, 1000, 10000, 100000, 1000000],
      mapColors: d3.schemeRdYlBu[9],
      // legend
      legendTitle: "Net Exports (in tonnes)",
      legendTickSize: 4,
      legendHeight: 45,
      legendWidth: 400,
      legendMarginLeft: -100,
      legendMarginRight: 50,
      legendMarginTop: 0,
      legendMarginBottom: 40,
      legendTickFormat: ",.0f"
    }
);

// define colors for filling in countries
var colorScale = d3.scaleThreshold()
  .domain(plotVars.mapColorThresholds)
  .range(plotVars.mapColors);

// get color list for legend
var color = d3.scaleThreshold(plotVars.mapColorThresholds, plotVars.mapColors);

// define map projection
var projection = d3.geoMercator()
    .scale(plotVars.mapScale)
    .center(plotVars.mapCenter)
    .translate([plotVars.mapWidth / 2, plotVars.mapHeight / 2]);

// reconcile country names between datasets
rename = new Map([
    ["Antigua and Barbuda", "Antigua and Barb."],
    ["Bolivia (Plurinational State of)", "Bolivia"],
    ["Bosnia and Herzegovina", "Bosnia and Herz."],
    ["Brunei Darussalam", "Brunei"],
    ["Cabo Verde", "Cape Verde"],
    ["Central African Republic", "Central African Rep."],
    ["Czechia", "Czech Rep."],
    ["Democratic Republic of the Congo", "Dem. Rep. Congo"],
    ["Dominican Republic", "Dominican Rep."],
    ["Equatorial Guinea", "Eq. Guinea"],
    ["Eswatini", "Swaziland"],
    ["Iran (Islamic Republic of)", "Iran"],
    ["Lao People's Democratic Republic", "Lao PDR"],
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

// define the legend
var leg = legend({
    color,
    title: plotVars.legendTitle,
    tickFormat: plotVars.legendTickFormat,
    tickSize: plotVars.legendTickSize,
    height: plotVars.legendHeight,
    width: plotVars.legendWidth,
    marginLeft: plotVars.legendMarginLeft,
    marginRight: plotVars.legendMarginRight,
    marginTop: plotVars.legendMarginTop,
    marginBottom: plotVars.legendMarginBottom
});

loadData = Promise.all([
    d3.json(plotVars.mapFile),
    d3.csv(plotVars.dataLink, function(d) {
        if (d.Value == "") {
            d.Value = -1;
        } 
        if (d.Value == "0") {
            d.Value = 0;
        } else {
            if (d.Value != -1) {
                if (d.Element == "Import Quantity") {
                    d.Value = +d.Value * -1;
                }
                if (d.Element == "Export Quantity") {
                    d.Value = +d.Value;
                }
            }
        }

        d.Year = +d.Year;
        d.Area = rename.get(d.Area) || d.Area;
        return {
            Area: d.Area,
            Year: +d.Year,
            Value: +d.Value
        };
    })]).then(function(loadData) {
        // data wrangling
        let topo = loadData[0];
        let expos = d3.rollup(loadData[1],
            v => d3.sum(v, d => +d.Value),
            d => d.Area,
            d => d.Year
        );
        
        // keep variable display_year current with slider
        // update year text next to slider
        var display_year = 2019
        d3.select("#display_year-value").text(display_year);
        d3.select("#display_year").property("value", display_year);
        d3.select("#display_year").on("input", function() {
            display_year = +this.value;
            d3.select("#display_year-value").text(this.value);
            d3.select("#display_year").property("value", +this.value);
            d3.selectAll(".country")
                .attr('fill', function (d) {
                    let val = expos.get(d.properties.name)?.get(display_year) || -1
                    return (val == -1 ? 'grey' : colorScale(val));
                });
        });

        // create svg element
        var map = d3.select('#map-area').append('svg')
            .attr('width', plotVars.mapWidth)
            .attr('height', plotVars.mapHeight);

        // append group representing the country outlines
        map.append("g")
            .selectAll("path.country")
            .data(topo.features)
            .join("path")
            // draw the borders
            .attr("d", d3.geoPath()
                .projection(projection)
            )
            // fill the countries according to net export value
            .attr("fill", function (d) {
                let val = expos.get(d.properties.name)?.get(display_year) || -1
                return (val == -1 ? 'grey' : colorScale(val));
            })
            .attr("class", "country")
            // highlight country on mouseover
            // display country name and export info
            .on("mouseover", function(event, d) {
                d3.select(this)
                    .style('cursor', 'pointer');
                d3.selectAll(".country")
                    .transition()
                    .duration(200)
                    .style("stroke", "transparent");
                d3.select(this)
                    .transition()
                    .duration(200)
                    .style("stroke", "black")
                map.append('text')
                    .attr('class', 'name')
                    .attr('x', 50)
                    .attr('y', 50)
                    .text(d.properties.name);
                map.append('text')
                    .attr('class', 'export')
                    .attr('x', 50)
                    .attr('y', 70)
                    .text(function () {
                        let val = expos.get(d.properties.name)?.get(display_year) || -1
                        if (val == -1) {
                            return 'No Data'
                        } else {
                            return `${val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} tonnes`
                        }
                    });
            })
            // remove highlighting and info
            .on("mouseleave", function(event) {
                d3.selectAll(".Country")
                    .transition()
                    .duration(200)  
                    .style("opacity", 1)
                    .style("stroke", "transparent");
                d3.select(this)
                    .transition()
                    .duration(200)
                    .style("stroke", "transparent");
                d3.selectAll('text.name, text.export')
                    .remove();
            })
            // display line chart of exports over time on click
            .on("click", function (event, d) {
                map.selectAll(".tooltip")
                    .remove();

                // clean data for line chart
                let years = [];
                let values = [];
                let line_data = [];
                for (let i = 1961; i < 2020; i++) {
                    let country_try = expos.get(d.properties.name) || new Map();
                    let val = country_try.get(i) || -1;
                    if (val != -1 && val != -2) {
                        years.push(i);
                        values.push(val);
                        line_data.push({year: i, value: val});
                    }
                }
                
                // define x and y value scaling for display
                let x = d3.scaleLinear()
                    .domain(d3.extent(years))
                    .range([0, plotVars.mapWidth / 2.5]);
                let y = d3.scaleLinear()
                    .domain(d3.extent(values))
                    .range([plotVars.mapWidth / 4 - 20, 0]);

                // create the line path
                let line = d3.line()
                    .x(d => x(d.year))
                    .y(d => y(d.value))(line_data);

                // create a pop-up window
                tt = map.append('g');
                // create the main window
                tt.append("rect")
                    .attr('class', 'tooltip')
                    .attr('x', plotVars.mapWidth / 4)
                    .attr('y', plotVars.mapWidth / 4)
                    .attr('width', plotVars.mapWidth / 2 + 40)
                    .attr('height', plotVars.mapHeight / 2)
                    .attr('fill', 'white')
                    .attr('stroke', 'black')
                    .attr('opacity', .9);
                // add the country name
                tt.append("text")
                    .attr('class', 'tooltip')
                    .attr('x', plotVars.mapWidth / 4 + 15)
                    .attr('y', plotVars.mapWidth / 4 + 35)
                    .attr('font-size', 30)
                    .text(function () {
                        if (line_data.length > 1) {
                            return d.properties.name
                        } else {
                            return "No data to display"
                        }
                    });
                // add a close button
                tt.append('text')
                    .attr('class', 'closebutton')
                    .attr('x', plotVars.mapWidth / 4 * 3 + 25)
                    .attr('y', plotVars.mapWidth / 4 + 15)
                    .attr('fill', 'red')
                    .text('X')
                    .on('mouseover', function (){
                        d3.select(this)
                            .style('cursor', 'pointer');
                    })
                    // close pop-up window when clicked
                    .on('click', function () {
                        map.selectAll('.tooltip, .closebutton')
                            .remove();
                    });

                    // create the line graph if data is avaliable
                    if (line_data.length > 1) {
                        // add the x axis
                        tt.append('g')
                            .attr('class', 'tooltip')
                            .attr('transform', `translate(${plotVars.mapWidth / 16 * 5 + 40}, ${plotVars.mapHeight / 4 * 3})`)
                            .call(d3.axisBottom(x.nice()).tickFormat(d3.format("d")));
                        tt.append("text")
                            .attr("class", "tooltip")
                            .attr("text-anchor", "end")
                            .attr("x", plotVars.mapWidth / 2 + 50)
                            .attr("y", plotVars.mapHeight / 4 * 3 + 35)
                            .text("Year");
                        // add the y axis
                        tt.append('g')
                            .attr('class', 'tooltip')
                            .attr('transform', `translate(${plotVars.mapWidth / 16 * 5 + 40}, ${plotVars.mapHeight / 2 - 42})`)
                            .call(d3.axisLeft(y.nice()));
                        tt.append("text")
                            .attr("class", "tooltip")
                            .attr("text-anchor", "end")
                            .attr("transform", `translate(${plotVars.mapWidth / 16 * 4 + 40}, ${plotVars.mapHeight / 2}) rotate(-90)`)
                            .text("Net Exports (tonnes)");
                        // add the title
                        tt.append("text")
                            .attr("class", "tooltip")
                            .attr("text-anchor", "end")
                            .attr("x", plotVars.mapWidth / 2 + 115)
                            .attr("y", plotVars.mapHeight / 3 + 65)
                            .attr('font-size', 20)
                            .text("Net Exports by Year");
                        // add the line path
                        line_path = tt.append('g')
                            .attr('class', 'tooltip')
                            .attr('transform', `translate(${plotVars.mapWidth / 16 * 5 + 40}, ${plotVars.mapHeight / 2 - 42})`)
                            .append('path')
                                .attr('class', 'tooltip')
                                .attr('fill', 'none')
                                .attr('stroke', 'black')
                                .attr('stroke-width', 1.5)
                                .attr('d', line);
                    }
            });
        
        // add the legend
        map.append("g")
            .attr("class", "legend")
            .attr("transform", "translate(610,20)")
            .append(() => leg);

        // add zoom functionality
        let zoom = d3.zoom()
        .scaleExtent([1, 8])
        .on('zoom', function(event) {
            map.selectAll('path.country')
            .attr('transform', event.transform);
        });

        map.call(zoom);

        // return the svg node
        return map.node();
});