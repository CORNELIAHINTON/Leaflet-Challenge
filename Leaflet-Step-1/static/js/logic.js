//create a title layer
var defaultMap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
	maxZoom: 17,
	attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
});

//grayscale layer
var grayscale = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}{r}.{ext}', {
	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	subdomains: 'abcd',
	minZoom: 0,
	maxZoom: 20,
	ext: 'png'
});

//watercolor layer
var watercolor =  L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.{ext}', {
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: 'abcd',
    minZoom: 1,
    maxZoom: 16,
    ext: 'jpg'
});

//satellite layer
var satellite =L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
});

let basemaps = {
    Default: defaultMap,
    "Gray Scale": grayscale,
    "Water Color": watercolor,
    Satellite: satellite

};
// create a map object
var myMap = L.map("map", {
    center: [36.7783, -119.4179],
    zoom: 3, 
    layers: [defaultMap, grayscale, watercolor, satellite]
});

//add default map to map
defaultMap.addTo(myMap);




//grab the data for the tectonic plates and draw on map
//variable to hold the tectonic plates
let tectonicplates = new L.layerGroup();

// call the tectonic plates API
d3.json("https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json")
.then(function(plateData){
    // test to make sure data loaded console.log(plateData);
    
    
    // load data using geoJson and add to tectonic plates layer group
    L.geoJson(plateData,{
        //add styling to make lines visible
        color:"yellow",
        weight: 1
    }).addTo(tectonicplates);
});

//add the tectonic plates to the map
tectonicplates.addTo(myMap);

//variable to hold the earthquake data layer
let earthquakes = new L.layerGroup();

//get data for earthquakes and populate the layergroup
//store earthquake API 
let queryURL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson"
// Perform a GET request to the query URL/
d3.json(queryURL).then(function (earthquakedata) {
    // test to make sure data loaded 
    console.log(earthquakedata);
    //plot circles, where the radius is dependent on the magnitude 
    // and the color is dependent on the depth

    //function that chooses the color of the data point
    function dataColor(depth){
        if (depth > 90)
            return "red";
        else if (depth > 70)
            return "#f57b42"
        else if (depth > 50)
            return "#f59342"
        else if (depth > 30)
            return "#f5b642"
        else if (depth > 10)
            return "#cef542"
        else 
            return "green";
    }

    // make a function that detmines the size of the radius
    function radiusSize(mag){
        if (mag == 0)
            return 1; //makes sure that a 0 mag earthquake appears
        else
            return mag * 5; //makes sure that the circle is visible
    }

    //add on the style for each data point
    function dataStyle(feature){
        return {
            opacity: 0.5,
            fillOpacity: 0.5,
            fillColor: dataColor(feature.geometry.coordinates[2]),
            color: "000000",
            radius: radiusSize(feature.properties.mag),
            weight: 0.5,
            stroke: true
        }
    }
    
    //add the GEOJson Data to the earthquake layer group
    L.geoJson(earthquakedata,{
        //make each feature a marker that is on the map, each marker is a circle
        pointToLayer: function(feature,latLng){
            return L.circleMarker(latLng);
        },
        //set style for eact marker
        style: dataStyle, //calls the data style function and passes in the earthquake data
        // add popups
        onEachFeature: function(feature, layer){
            layer.bindPopup(`Magnitude:<b> ${feature.properties.mag}</b> <br>
                            Depth: <b>${feature.geometry.coordinates[2]}</b><br>
                            Location: <b>${feature.properties.place}</b>`)
        }
    }).addTo(earthquakes);

  
  });

// add earthquake layer to the map
earthquakes.addTo(myMap);

//add overlay for tectonic plates and earthquakes
let overlays = {
    "Tectonic Plates":tectonicplates,
    "Earthquake Data": earthquakes
};

// add the layer control
L.control
    .layers(basemaps, overlays)
    .addTo(myMap)

// add legend
let legend = L.control({
    position: 'bottomright'
});

//add the properties for the legend
legend.onAdd = function (){
    //div for the legend to appear in the page
    let div = L.DomUtil.create("div","info legend");

    //set up intervals
    let intervals = [-10,10,30,50,70,90];

    //set colors for the intervals
    let colors = [
        "green",
        "#cef542",
        "#f5b642",
        "#f59342",
        "#f57b42",
        "red"
    ];

    //loop through the intervals and the colors and generate a label
    //with a colored square for each interval
    for (var i = 0; i < intervals.length; i++)
    {
        //inner html that sets the square for each interval and label
        div.innerHTML += "<i style='background: "
            + colors[i]
            +"'></i> "
            + intervals[i]
            + (intervals[i + 1] ? "km &ndash;" + intervals[i + 1] + "km<br>" : "+");
    }

    return div;
};

//add legend to the map
legend.addTo(myMap);
