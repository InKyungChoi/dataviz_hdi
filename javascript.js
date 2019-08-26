function js() {
        
    // DATA
    var data_region = [ {region: "Africa", color: "#E1514B"}, 
    {region: "Asia", color: "#FB9F59"},
    {region: "Europe", color: "#FAE38C"}, 
    {region: "Latin America & Caribbean", color: "#6CC4A4"}, 
    {region: "North America", color: "#4D9DB4"},  
    {region: "Oceania", color: "#5E4EA1"} ];

    mapdata_raw.features.forEach(function(d){
        var temp = hdidata_raw.filter(function(d2){ return d2.iso3 == d.properties.ISO3});
        if (temp.length == 0){
            d.properties.data = { hdi2014: "not in dataset"};
        } else {
            temp = temp[0];
            d.properties.data = {region: temp.Region_UN, 
                hdi2014:temp.hdi[34],                
                color: data_region.filter(function(d4){ return d4.region == temp.Region_UN })[0].color  
            };
        }
    });

    hdidata_raw.forEach(function(d){ return d.color = data_region.filter(function(d2){ return d2.region == d.Region_UN})[0].color});


    // MAP CHART

    // MAP CHART: SET UP MAP SPEC PARAMETERS
    var map_spec = { width: 1100, height: 450, margin: 5, stroke_width: 0.1 };
    map_spec.map_width = map_spec.width - map_spec.margin*2;
    map_spec.map_height = map_spec.height - map_spec.margin*2;

    // MAP CHART: APPEND SVG TO HTML ELEMENT
  var map = d3.selectAll("#Map")
      .append("svg")
      .attr("width", map_spec.width)
      .attr("height", map_spec.height)
            .append("g")
            .attr("transform", "translate(" + map_spec.margin + "," + map_spec.margin + ")");


    // MAP CHART: SET UP SCALE FUNCTION FOR HDI
  var ft_hdi = d3.scale.linear()
      .domain([0.3, 0.95])
      .range([0, 1]);

var ft_projection = d3.geo.equirectangular()
  .scale( 170)
  .center( [0, 16] )
  .translate( [map_spec.map_width/2,map_spec.map_height/2] );

var ft_geoPath = d3.geo.path()
    .projection( ft_projection );

map.selectAll("path")
    .data(mapdata_raw.features)
  .enter().append("path")
  .attr("class", "geom")
  .attr("id", function(d){ return d.properties.ISO3 + "_map"})
    .attr("d", ft_geoPath)
    .attr("stroke", "black").attr("stroke-width", map_spec.stroke_width)
    .attr("fill", function(d){ 
        if (d.properties.data.hdi2014 == "not in dataset"){
            return "black"
        } else {
            return (d.properties.data.hdi2014 == "NA")? "grey":d.properties.data.color
        }
    })  
    .attr("fill-opacity", function(d){
         return ft_hdi(d.properties.data.hdi2014);
     })


    data_region.forEach(function(d,i){ 
        d.text_x = 74;
        d.text_y = (map_spec.height - 70) + 10*i;
        d.rect = [];
        for (var j = 0; j<70; j++){
            d.rect.push({
                color: d.color, 
                opacity: ft_hdi(0.3 + j*0.01),
                x: j, 
                y: (map_spec.height - 78) + 10*i 
            })
        }
    });
        

    map.selectAll("map_legend_text")
        .data(data_region).enter()
        .append("text")
        .attr("x", function(d){ return d.text_x})
        .attr("y", function(d){ return d.text_y})
        .text(function(d){ return d.region })
        .attr("fill", "#e6e6e6")
        .attr("font-size", 10)
        .attr("text-anchor", "left");


    map.selectAll("map_legend")
        .data(data_region[0].rect.concat(data_region[1].rect, data_region[2].rect, data_region[3].rect, data_region[4].rect,  data_region[5].rect))
        .enter()
        .append("rect")
        .attr("width", 1)
        .attr("height", 9)
        .attr("x", function(d){ return d.x })
        .attr("y", function(d){ return d.y })
        .attr("fill", function(d){ return d.color })
        .attr("opacity", function(d){ return d.opacity });


    var map_legend_label = [{text: "HDI value", x: 10, y: (map_spec.height - 90)},
                            {text: "0.3", x: 0, y: (map_spec.height - 80)},
                            {text: "1.0", x: 55, y: (map_spec.height - 80)}];

    map.selectAll("map_legend_label")
        .data(map_legend_label).enter()
        .append("text")
        .attr("x", function(d){ return d.x })
        .attr("y", function(d){ return d.y })
        .text(function(d){  return d.text })
        .attr("fill", "#e6e6e6")
        .attr("font-size", 10)
        .attr("text-anchor", "center");




    // LINE CHART
    // LINE CHART: SET UP LINE CHART SPEC PARAMETERS
    var lg_spec = { width: 250, height: map_spec.height/2, 
        margin_top: 30, margin_bottom: 20, margin_left: 30, margin_right: 20, 
        stroke_width: 0.35, opacity: 1};  
    lg_spec.chart_width = lg_spec.width - lg_spec.margin_left - lg_spec.margin_right;
    lg_spec.chart_height = lg_spec.height - lg_spec.margin_top - lg_spec.margin_bottom;
    var lgd = { n: 194, t: 34 };

    // LINE CHART: SET UP X-AXIS (YEAR) SCALE FUNCTIONS 
    var ft_lg_time = d3.scale.linear()
        .domain([1980, 2014])
        .range([0, lg_spec.chart_width]);

    var ft_lg_time_axis = d3.svg.axis()
        .scale(ft_lg_time)
        .orient("bottom")
        .ticks(4)
        .tickFormat(d3.format(".0f"));


var draw_lg = function(html_id, data_lg){ 
    
    var ft_lg_y = d3.scale.linear()
        .domain([data_lg.min, data_lg.max])
        .range([lg_spec.chart_height , 0]);

    var ft_lg_y_axis = d3.svg.axis()
        .scale(ft_lg_y).orient("left").ticks(4);

    var ft_line = d3.svg.line().x(function(d, i) { return ft_lg_time(i+1980) })
      .y(function(d) { return ft_lg_y(d) })
      .interpolate("linear")
      .defined(function(d) { return d != "NA" });


    // APPEND SVG 
    var lg = d3.select(html_id)
        .append("svg")
        .attr("width", lg_spec.width)
        .attr("height", lg_spec.height)
        .append("g")
        .attr("transform", "translate(" + lg_spec.margin_left + "," + lg_spec.margin_top + ")");

    // APPEND PATH ELEMENTS TO SVG
    lg.selectAll("path")
        .data(data_lg.data).enter()
        .append("path")
        .attr("class", "geom")
        .attr("id", function(d){ return d.iso3 + "_line"})
        .attr("d", function(d){ return ft_line(d.values) })
        .attr("fill", "none")
        .attr("stroke", function(d){  return data_region.filter(function(d2){ return d2.region == d.Region_UN})[0].color})
        .attr("stroke-width", lg_spec.stroke_width)
        .attr("opacity", lg_spec.opacity);

    // APPEND AXIS AND TITLE ELEMENTS TO SVG
    lg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + (lg_spec.chart_height) + ")")
        .call(ft_lg_time_axis);

    lg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0,0)")
        .call(ft_lg_y_axis);

    lg.append("text")
        .attr("x", (lg_spec.chart_width/2))   
        .attr("y", -(lg_spec.margin_top/2))       
        .attr("text-anchor", "middle")  
        .text(data_lg.chart_title);
}


draw_lg("#graph1", { 
    min: 0.1, 
    max: 0.95, 
    data: hdidata_raw.map(function(d){ return {name: d.name, iso3: d.iso3, Region_UN: d.Region_UN, values: d["hdi"]}}),
    chart_title: "HDI"
});


draw_lg("#graph2", { 
    min: d3.min(hdidata_raw, function(d){ return d3.min(d.gni.map(function(d2){ return d2/10000 })) }), 
    max: d3.max(hdidata_raw, function(d){ return d3.max(d.gni.map(function(d2){ return d2/10000 })) }), 
    data: hdidata_raw.map(function(d){ return {name: d.name, iso3: d.iso3, Region_UN: d.Region_UN, values: d["gni"].map(function(d2){ return (d2!="NA")? d2/10000:"NA" })}}),
    chart_title: "GNI per capita (unit: $10,000)"
});


draw_lg("#graph3", { 
    min: 25, 
    max: d3.max(hdidata_raw, function(d){ return d3.max(d.life) }), 
    data: hdidata_raw.map(function(d){ return {name: d.name, iso3: d.iso3, Region_UN: d.Region_UN, values: d["life"]}}),
    chart_title: "Life expectancy (years)"
});

draw_lg("#graph4", { 
    min: d3.min(hdidata_raw, function(d){ return d3.min(d.eys) }), 
    max: d3.max(hdidata_raw, function(d){ return d3.max(d.eys) }), 
    data: hdidata_raw.map(function(d){ return {name: d.name, iso3: d.iso3, Region_UN: d.Region_UN, values: d["eys"]}}),
    chart_title: "Expected years of schooling"
});



    
    // DOT CHART

    // DOT CHART: SET UP DOT CHART SPEC PARAMETERS
    var dotchart_spec = {unit: 5000000, cell_width: 10, cell_height: 20, stroke_width: map_spec.stroke_width };
    dotchart_spec.width = dotchart_spec.cell_width*(2+1+144+14+3);
    dotchart_spec.height = dotchart_spec.cell_height*(10+2);


    // DOT CHART: APPEND SVG TO HTML ELEMENT
    var dotchart = d3.select("#DotChart")
        .append("svg")
        .attr("width", dotchart_spec.width)
        .attr("height",dotchart_spec.height);
    

    // DOT CHART: CALCULATE COORDINATES OF ELEMENTS BASED ON SPEC PARAMETERS
    // CAUTION: DATA NEEDS TO BE SORTED IN INCREASING ORDER OF HDI2014 FIRST
    var dotdata = [];
    for (var i = 0; i<hdidata_raw.length; i++){
        var temp = Math.floor(hdidata_raw[i].P2014/dotchart_spec.unit);
        for (var j = 0; j<(temp+1); j++){ 
            dotdata.push({iso3: hdidata_raw[i].iso3, pop: hdidata_raw[i].P2014, region: hdidata_raw[i].Region_UN, color: hdidata_raw[i].color,
                hdi2014: hdidata_raw[i].hdi[34], category: hdidata_raw[i].category_2014});
        }   
    };

    var cmy = 0, col_n = 0;
    var cmy_na = 0, col_n_na = 0;
    var category = "low";

    for (var i=0; i<dotdata.length; i++){
        if (dotdata[i].hdi2014 == "NA"){
            if ((cmy_na + dotchart_spec.cell_height) <= (dotchart_spec.height-2*dotchart_spec.cell_height) ){
                dotdata[i].y= cmy_na;
                dotdata[i].x= col_n_na*dotchart_spec.cell_width;
                cmy_na = cmy_na + dotchart_spec.cell_height;
            } else {
                col_n_na = col_n_na + 1;
                cmy_na = 0;        
                dotdata[i].y= cmy_na;
                dotdata[i].x= col_n_na*dotchart_spec.cell_width;
                cmy_na = cmy_na + dotchart_spec.cell_height;
            }
        } else {
            var temp = (col_n>143)? (8*dotchart_spec.cell_height):(10*dotchart_spec.cell_height);
            if ((cmy + dotchart_spec.cell_height <= temp)&&(category==dotdata[i].category)){
                dotdata[i].y= cmy;
                dotdata[i].x= dotchart_spec.cell_width*3 + col_n*dotchart_spec.cell_width;
                cmy = cmy + dotchart_spec.cell_height;
                category = dotdata[i].category;
            } else {
                col_n = col_n + 1;
                cmy = 0;        
                category = dotdata[i].category;
                dotdata[i].y= cmy;
                dotdata[i].x= dotchart_spec.cell_width*3 + col_n*dotchart_spec.cell_width;
                cmy = cmy + dotchart_spec.cell_height;
            }
        }
    };


    // DOT CHART: APPEND PATH ELEMENTS TO SVG
    dotchart.selectAll("circle")
        .data(dotdata).enter()
        .append("g")
        .append("circle")
        .attr("class", "geom")
        .attr("id", function(d){     return d.iso3+ "_dotchart";    })
        .attr("transform",function(d){
            return "translate(" + d.x + "," + d.y + ")";
        })
        .attr("cx", dotchart_spec.cell_width/2)
        .attr("cy", dotchart_spec.cell_width/4)
        .attr("r", dotchart_spec.cell_width/4)
        .attr("stroke", "black")
        .attr("stroke-width", dotchart_spec.stroke_width)
        .attr("fill", function(d){
            return (d.hdi2014 == "NA")? "grey":d.color;
        });

    dotchart.selectAll("path")
        .data(dotdata).enter()
        .append("g")
        .append("path")
        .attr("class", "geom")
        .attr("id", function(d){       return d.iso3+ "_dotchart";    })
        .attr("transform",function(d){
            return "translate(" + d.x + "," + d.y + ")";
        })
        .attr("d", "M0.5,5 L9.5,5 L9.5,12.5 L7.5,12.5 L7.5,19 L5.5,19 L5.5,15 L4.5,15 L4.5,19 L2.5,19 L2.5,12.5 L0.5,12.5 Z")
        .attr("stroke", "black")
        .attr("stroke-width", dotchart_spec.stroke_width)
        .attr("fill", function(d){
            return (d.hdi2014 == "NA")? "grey":d.color;
        });

    dotchart.append("text")
        .attr("id", "pop_number")
        .attr("x", dotchart_spec.cell_width*(3+144+14))
        .attr("y", 10*dotchart_spec.cell_height-10)
        .attr("fill", "white")
        .attr("font-size", 20)
        .attr("text-anchor", "end")  
        .text("7,266 million");


    // DOT CHART: APPEND AXIS TO SVG
    dotchart_hdicategory = [{category: "Low", start: (3)*10, end: (3+27)*10},
                        {category: "Medium", start: (3+27)*10, end: (3+27+49)*10},
                        {category: "High", start: (3+27+49)*10, end: (3+27+49+54)*10},
                        {category: "Very High", start: (3+27+49+54)*10, end: (3+27+49+54+30)*10}];

    dotchart.selectAll("pop_axis")
        .data(dotchart_hdicategory).enter()
        .append("path")
        .attr("d", function(d){
            return "M" + (d.start+5) + ",201 L"  + (d.start+1) + ",205 L" + (d.start+5) + ",209 Z" +
             "M" + (d.start+1) + ",205 L" + (d.end-1) + ",205 L" + (d.end-5) + ",201 L" + (d.end-5) + ",209 L" + (d.end-1) + ",205 Z";
        })
        .attr("stroke", "white")
        .attr("stroke-width", 1)
        .attr("fill", "none");

    dotchart.selectAll("pop_axis_label")
        .data(dotchart_hdicategory).enter()
        .append("text")
        .attr("x", function(d){
            return (d.start + d.end)/2;
        })
        .attr("y", 220)
        .text(function(d){
            return  d.category;
        })
        .attr("fill", "white");

    dotchart.append("text")
        .attr("x", 690)
        .attr("y", 230)
        .text("Human Development Classification (2014)")
        .attr("fill", "white");




    // TOOLTIP
    var tip = d3.tip()
        .attr("class", "d3-tip")
        .offset([0, 0])
        .html(function(d) {
            return "<strong>Country:</strong> <span style='color:red'>" + d.name +  " </span> <br>" + "<strong>HDI (2014):</strong> <span style='color:red'>" + d.hdi[34] +  " </span> <br> <strong>Inequality adjusted index (2014):</strong> <br> <strong> &nbsp; &nbsp; HDI:</strong> <span style='color:red'>" + d.IHDI2014 +  " </span> <br> <strong> &nbsp; &nbsp; Education:</strong> <span style='color:red'>" + d.ieq_edu_idx_2014 +  " </span> <br>  <strong> &nbsp; &nbsp; Income:</strong> <span style='color:red'>" + d.ieq_income_idx_2014 +  " </span> <br> <strong> &nbsp; &nbsp; Life expectancy:</strong> <span style='color:red'>" + d.ieq_lex_idx_2014 +  " </span> <br> " ;
        });


    // TOOLTIP: APPEND TOOLTIP
    d3.selectAll(".geom")
        .on("mouseover", function(){ 
            var current = d3.select(this).attr("id").split("_");
            
            d3.selectAll("#" + current[0] + "_line").attr("stroke-width", 7).classed("active",true);
            d3.selectAll("#" + current[0] + "_map").attr("stroke", "#e6e6e6").attr("stroke-width", 3).classed("active",true);
            d3.selectAll("#" + current[0] + "_dotchart").attr("stroke", "#e6e6e6").attr("stroke-width", 2.5).classed("active",true);
                        
            var temp = hdidata_raw.filter(function(d){ return d.iso3 == current[0]})[0]
            map.call(tip.show(temp));

            var temp_pop2014 = (Math.round(temp.P2014/1000000)<1)? (d3.format(",f")(Math.round(temp.P2014/1000))+" thousand"):(d3.format(",f")(Math.round(temp.P2014/1000000))+" million");
            d3.select("#pop_number").text(temp_pop2014);
        }) 
        .on("mouseout", function(){
            var current = d3.select(this).attr("id").split("_");

            d3.selectAll("#" + current[0] + "_line").classed("active",false).attr("stroke-width", lg_spec.stroke_width);
            d3.selectAll("#" + current[0] + "_map").classed("active",false).attr("stroke-width", map_spec.stroke_width).attr("stroke", "black");
            d3.selectAll("#" + current[0] + "_dotchart").classed("active",false).attr("stroke-width", dotchart_spec.stroke_width).attr("stroke", "black");
                        
            var temp = hdidata_raw.filter(function(d){ return d.iso3 == current[0]})[0]
            map.call(tip.hide(temp));

            d3.select("#pop_number").text("7,266 million")
        });


    map.call(tip);

}



function history() {

    // DATA
    var data_region = [ {region: "Africa", color: "#E1514B"}, 
    {region: "Asia", color: "#FB9F59"},
    {region: "Europe", color: "#FAE38C"}, 
    {region: "Latin America & Caribbean", color: "#6CC4A4"}, 
    {region: "North America", color: "#4D9DB4"},  
    {region: "Oceania", color: "#5E4EA1"} ];

    hdidata_raw.forEach(function(d){ return d.color = data_region.filter(function(d2){ return d2.region == d.Region_UN})[0].color});


    // SET UP LINE CHART SPEC PARAMETERS
    var lg_spec = { width: 500, height: 450, 
        margin_top: 30, margin_bottom: 20, margin_left: 50, margin_right: 20, 
        stroke_width: 1, opacity: 1,
        circle_r: 3};  
    lg_spec.chart_width = lg_spec.width - lg_spec.margin_left - lg_spec.margin_right;
    lg_spec.chart_height = lg_spec.height - lg_spec.margin_top - lg_spec.margin_bottom;
    var lgd = { n: 194, t: 34 };


    // SET UP X-AXIS (YEAR) SCALE FUNCTIONS 
    var ft_time = d3.scale.linear()
        .domain([1980, 2014])
        .range([0, lg_spec.chart_width]);

    var ft_time_axis = d3.svg.axis()
        .scale(ft_time)
        .orient("bottom")
        .ticks(4)
        .tickFormat(d3.format(".0f"));



    var first_selection = "AFG"

    // DRAW LINE CHART
    var data = hdidata_raw.filter(function(d){ return d.iso3 == first_selection}).map(function(d){ return {name: d.name, iso3: d.iso3, Region_UN: d.Region_UN, values: d["hdi"]}});
    var data_history = hdidata_raw.filter(function(d){ return d.iso3 == first_selection}).map(function(d){ return {name: d.name, iso3: d.iso3, Region_UN: d.Region_UN, 
        values: d["history"], years: [1990,2000,2010,2011,2012,2013,2014]}})[0];

    var ft_y = d3.scale.linear().domain([0.1, 0.95]).range([lg_spec.chart_height , 0]);
    var ft_y_axis = d3.svg.axis().scale(ft_y).orient("left").ticks(4);

    var ft_line = d3.svg.line().x(function(d, i) { return ft_time(i+1980) }).y(function(d) { return ft_y(d) })
              .interpolate("linear").defined(function(d) { return d != "NA" });

    var svg = d3.select("#graph1").append("svg").attr("width", lg_spec.width).attr("height", lg_spec.height)
                .append("g").attr("transform", "translate(" + lg_spec.margin_left + "," + lg_spec.margin_top + ")");

    svg.append("path").attr("id", "linechart")
                .attr("d", function(d){ return ft_line(data[0].values) }).attr("stroke", data_region.filter(function(d){ return d.region == data[0].Region_UN})[0].color )
                .attr("fill", "none").attr("stroke-width", lg_spec.stroke_width).attr("opacity", lg_spec.opacity);

    svg.selectAll("circle").data(data_history.values).enter()
        .append("circle").attr("id", "circles").attr("r", lg_spec.circle_r)
        .attr("cx", function(d,i){ return ft_time(data_history.years[i])})
        .attr("cy", function(d){ return (d=="NA")? ft_y(0):ft_y(d)})
        .attr("fill", data_region.filter(function(d){ return d.region == data[0].Region_UN})[0].color )

    svg.append("g").attr("class", "axis").attr("transform", "translate(0," + (lg_spec.chart_height) + ")").call(ft_time_axis);
    svg.append("g").attr("class", "axis").attr("transform", "translate(0,0)").call(ft_y_axis);
    svg.append("text").attr("x", (lg_spec.chart_width/2)).attr("y", -(lg_spec.margin_top/2)).attr("text-anchor", "middle").text("HDI");
              


    var update = function(selection){

    var data_selected = hdidata_raw.filter(function(d){ return d.iso3 == selection}).map(function(d){ return {name: d.name, iso3: d.iso3, Region_UN: d.Region_UN, values: d["hdi"]}})[0];
    var data_history_selected = hdidata_raw.filter(function(d){ return d.iso3 == selection}).map(function(d){ return {name: d.name, iso3: d.iso3, Region_UN: d.Region_UN, 
        values: d["history"], years: [1990,2000,2010,2011,2012,2013,2014]}})[0];
    d3.select("#linechart").attr("d", function(d){ return ft_line(data_selected.values) }).attr("stroke", data_region.filter(function(d){ return d.region == data_selected.Region_UN})[0].color );
    var xx = d3.selectAll("#circles").data(data_history_selected.values);
    xx.enter().append("circle");
    xx.attr("cy", function(d){ return (d=="NA")? ft_y(0):ft_y(d) }).attr("fill", data_region.filter(function(d){ return d.region == data_selected.Region_UN})[0].color );

    }


    d3.select('#SelectCountry')
        .on('change', function() {     update(d3.select(this).property('value').trim());   });

}