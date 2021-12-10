//Width and height
var w = 750;
var h = 450;
var padding = 40;
var min_dot_size = 3;
var max_dot_size = 15;
var offset_text_y = 20;
var offset_axis_y = 0.2;

var original_dataset, xScale, yScale;  //Empty, for now

const available_years = [2015, 2016, 2017, 2018];

//Function for converting CSV values from strings to Dates and numbers
var rowConverter = function (d) {
    return {
        conso: parseFloat(d.conso),
        price: parseFloat(d.price),
        year: parseFloat(d.year),
        pop: parseFloat(d.pop),
        country: d.country,
    };
}

//Load in the data
loadData = Promise.all([d3.csv("./data/prices_per_conso_small.csv", rowConverter)]).then(function(loadData) {

    //Copy data into global dataset
    original_dataset = loadData[0];
    var index_of_year = 0
    dataset = original_dataset.filter(function (d) { return d.year == available_years[index_of_year] });

    //Create scale functions
    xScale = d3.scaleLinear()
        .domain([
            d3.min(dataset, function (d) { return d.conso; }),
            d3.max(dataset, function (d) { return d.conso; })
        ])
        .range([padding, w - padding]);

    yScale = d3.scaleLinear()
        .domain([
            d3.min(dataset, function (d) { return d.price; }) - offset_axis_y,
            d3.max(dataset, function (d) { return d.price; })
        ])
        .range([h - padding, padding]);

    colorScale2 = d3.scaleOrdinal()
        .range(d3.schemeSet2);

    popScale = d3.scaleLinear()
        .domain([
            d3.min(dataset, function (d) { return d.pop; }),
            d3.max(dataset, function (d) { return d.pop; })
        ])
        .range([min_dot_size, max_dot_size]);

    //Create SVG element
    var svg = d3.select("#price-conso")
        .append("svg")
        .attr("width", w)
        .attr("height", h);

    //Generate circles last, so they appear in front
    svg.selectAll("circle")
        .data(dataset)
        .enter()
        .append("circle")
        .attr("cx", function (d) {
            return xScale(d.conso);
        })
        .attr("cy", function (d) {
            return yScale(d.price);
        })
        .attr("r", function (d) { return popScale(d.pop); })
        .attr("fill", d => colorScale2(d.country))
        .on("mouseover", function (event, d) {
            var xPosition = parseFloat(d3.select(this).attr("cx"));
            var yPosition = parseFloat(d3.select(this).attr("cy") - offset_text_y);

            svg.append("text")
                .attr("class", "tooltip")
                .attr("x", xPosition)
                .attr("y", yPosition)
                .attr("text-anchor", "middle")
                .attr('font-family', 'COPPERPLATE')
                .attr("font-size", "11px")
                .attr("font-weight", "bold")
                .attr("fill", "black")
                .text(d.country);
        })
        .on("mouseleave", function (event) {

            //Remove the tooltip
            d3.select("text.tooltip").remove();

        });

    svg.append("text")
        .attr("class", "Title")
        .attr("x", w * 0.9)
        .attr("y", h * 0.9)
        .attr("text-anchor", "middle")
        .attr('font-family', 'COPPERPLATE')
        .attr("font-size", "30px")
        .attr("fill", "black")
        .text(available_years[index_of_year]);

    svg.append("text")
        .attr("class", "x label")
        .attr("x", w * 0.9)
        .attr("y", h * 0.98)
        .attr("text-anchor", "end")
        .attr("font-family", "sans-serif")
        .attr("font-size", "11px")
        .attr("fill", "grey")
        .text("Consumption per capita (kg) →")

    svg.append("text")
        .attr("class", "y label")
        .attr("x", 0)
        .attr("y", padding * 0.7)
        .attr("text-anchor", "start")
        .attr("font-family", "sans-serif")
        .attr("font-size", "11px")
        .attr("fill", "grey")
        .text("↑ Unitary Price per kg (USD)")

    //Define X axis
    var xAxis = d3.axisBottom()
        .scale(xScale);

    //Define Y axis
    var yAxis = d3.axisLeft()
        .scale(yScale)
        .ticks(5);

    //Create X axis
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + (h - padding) + ")")
        .call(xAxis);

    //Create Y axis
    svg.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(" + 1.5 * padding / 2 + ",0)")
        .call(yAxis);



    //On click, update with new data			
    d3.select("pbutton")
        .on("mouseover", function (event, d) {
            d3.select(this).style('cursor', 'pointer');
        })
        .on("click", function () {

            if (index_of_year < 3) {
                index_of_year = index_of_year + 1
            }
            else {
                index_of_year = 0
            }


            filtered_dataset = original_dataset.filter(function (d) { return d.year == available_years[index_of_year] });

            //Update scale domains
            xScale.domain([0, d3.max(filtered_dataset, function (d) { return d.conso; })]);
            yScale.domain([d3.min(filtered_dataset, function (d) { return d.price - offset_axis_y; }), d3.max(filtered_dataset, function (d) { return d.price; })]);

            svg.selectAll("circle")
                .data(filtered_dataset)
                .transition()
                .duration(1000)
                .ease(d3.easeLinear)
                .attr("cx", function (d) {
                    return xScale(d.conso);
                })
                .attr("cy", function (d) {
                    return yScale(d.price);
                });

            //Update X axis
            svg.select(".x.axis")
                .transition()
                .duration(1000)
                .call(xAxis);

            //Update Y axis
            svg.select(".y.axis")
                .transition()
                .duration(1000)
                .call(yAxis);

            svg.select(".Title")
                .transition()
                .duration(2000)
                .text(available_years[index_of_year])

        });


});
