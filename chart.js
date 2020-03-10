// Second, a map of the fires over time within Australia

const MINI_HEIGHT = 100;

const HEIGHT = 600; // Height for display plot
const WIDTH = 800; // Width for display plot
const MARGIN = 20; // Margin for display plot

const LEGEND_WIDTH = 200; // Width of display plot legend
const LEGEND_SPACING = 16; // Spacing unit for display plot legend
const LEGEND_TITLE_FONT_HEIGHT = 16; // Text height for display plot legend titles
const LEGEND_FONT_HEIGHT = 14; // Text height for display plot legend

let miniSvg, svg, map, locations, legend, data, entriesByDate, projection, dates, expIntensityScale, intensityScale, frpScale, intervalPlayer, densityScalePow, densityScaleColor;
const arr = [];
let mouseDown = false;

// Create display SVG
function setupDisplaySvg() {
  svg = d3.select('.display')
    .append('svg')
    .attr('width', WIDTH + 3 * MARGIN + LEGEND_WIDTH)
    .attr('height', HEIGHT + 2 * MARGIN);

  map = svg.append('g').attr('transform', `translate(${MARGIN}, ${MARGIN})`);
  map.append('text').attr('id', 'date-display-svg');
  locations = svg.append('g').attr('transform', `translate(${MARGIN}, ${MARGIN})`);
  legend = svg.append('g').attr('transform', `translate(${WIDTH + 2 * MARGIN}, ${MARGIN})`);
}

// Create selector/minihistogram SVG
function setupSelectorSvg() {
  const miniWidth = document.getElementById('date-selection').clientWidth;
  miniSvg = d3.select('.selector-svg')
    .append('svg')
    .attr('width', miniWidth)
    .attr('height', MINI_HEIGHT);
  
  entriesByDate = dates.map(d => data[d].length);

  const yScale = d3.scaleLinear()
    .domain(d3.extent(entriesByDate, d => +d))
    .range([0, MINI_HEIGHT]);
  
  const barWidth = Math.round(miniWidth / entriesByDate.length);

  const selection = miniSvg.selectAll('.date-bar')
    .data(entriesByDate)
    .enter();

  selection.append('rect')
    .attr('class', 'date-bar')
    .attr('id', (d, i) => `date-bar-${i}`)
    .attr('x', (d, i) => (i + 1) * barWidth)
    .attr('y', d => MINI_HEIGHT - yScale(d))
    .attr('height', d => yScale(d))
    .attr('width', barWidth)
    .attr('fill', '#dee2e6')
    .on('mouseup', getInteractiveListener('mouseup'))
    .on('mouseover', getInteractiveListener('mouseover'))
    .on('mousedown', getInteractiveListener('mousedown'));

  selection.append('rect')
    .attr('class', 'date-bar-alt')
    .attr('id', (d, i) => `date-bar-alt-${i}`)
    .attr('x', (d, i) => (i + 1) * barWidth)
    .attr('y', 0)
    .attr('height', d => MINI_HEIGHT - yScale(d))
    .attr('width', barWidth)
    .attr('fill', '#343a40')
    .on('mouseup', getInteractiveListener('mouseup'))
    .on('mouseover', getInteractiveListener('mouseover'))
    .on('mousedown', getInteractiveListener('mousedown'));
}

// Update the selector/minihistogram svg
function updateSelectorSvg() {
  const currentDateIndex = getCurrentDateIndex() - 1;
  miniSvg.selectAll('.date-bar').attr('fill', '#dee2e6');
  miniSvg.selectAll('.date-bar-alt').attr('fill', '#343a40');
  miniSvg.select(`#date-bar-${currentDateIndex}`).attr('fill', '#007bff')
  miniSvg.select(`#date-bar-alt-${currentDateIndex}`).attr('fill', '#515961')
}

// Get a listener for the selector/minihistogram interactivity
function getInteractiveListener(event) {
  return (d, i) => {
    if(event == 'mousedown') {
      mouseDown = true;
    }
    if(event == 'mouseup') {
      mouseDown = false;
    }
    
    if(event != 'mouseover' || (event == 'mouseover' && mouseDown)) {
      stopPlaying()
      let value = i + 1;
      d3.select('#date-selection').property('value', value);
      plotFiresForDate(dates[value], data);
    }
  }
}

// Create legend
function createLegend() {
  // Legend title
  legend.append('text')
    .attr('transform', `translate(${LEGEND_SPACING}, ${LEGEND_SPACING})`)
    .attr('class', 'title')
    .text('Legend')
    .attr('fill', '#fff');
  
  // Brightness subtitle
  legend.append('text')
    .attr('transform', `translate(${LEGEND_SPACING}, ${LEGEND_TITLE_FONT_HEIGHT + 2 * LEGEND_SPACING})`)
    .attr('class', 'subtitle')
    .text('Brightness')
    .attr('fill', '#fff');
  
  // Color Scale
  const minColor = expIntensityScale.domain()[0];
  const maxColor = expIntensityScale.domain()[1];
  const numElements = 6;
  let i = 0;

  for(i = 0; i <= numElements; i++) {
    const value = minColor + i * Math.ceil((maxColor - minColor) / numElements);
    legend.append('rect')
      .attr('transform', `translate(${1.5 * LEGEND_SPACING}, ${LEGEND_TITLE_FONT_HEIGHT + (2.5 + i) * LEGEND_SPACING + LEGEND_FONT_HEIGHT})`)
      .attr('width', LEGEND_SPACING)
      .attr('height', LEGEND_SPACING)
      .attr('fill', intensityScale(value));

    legend.append('text')
      .attr('transform', `translate(${3 * LEGEND_SPACING}, ${LEGEND_TITLE_FONT_HEIGHT + (2.5 + i) * LEGEND_SPACING + LEGEND_FONT_HEIGHT})`)
      .text(value)
      .attr('fill', '#fff');
  }

  // FRP subtitle
  legend.append('text')
    .attr('transform', `translate(${LEGEND_SPACING}, ${LEGEND_TITLE_FONT_HEIGHT + (3.5 + i) * LEGEND_SPACING + LEGEND_FONT_HEIGHT})`)
    .attr('class', 'subtitle')
    .text('Fire Radiative Power (FRP)')
    .attr('fill', '#fff');

  let j = 0;

  const minSize = frpScale.domain()[0];
  const maxSize = frpScale.domain()[1];
  const numSizeElements = 3;
  for(j = 0; j <= numSizeElements; j++) {
    const value = minSize + j * Math.ceil((maxSize - minSize) / numElements);

    legend.append('circle')
      .attr('transform', `translate(${2 * LEGEND_SPACING}, ${LEGEND_TITLE_FONT_HEIGHT + (4.5 + i + j) * LEGEND_SPACING + 2 * LEGEND_FONT_HEIGHT})`)
      .attr('r', frpScale(value))
      .attr('fill', '#fff');
    
    legend.append('text')
      .attr('transform', `translate(${3 * LEGEND_SPACING}, ${LEGEND_TITLE_FONT_HEIGHT + (4 + i + j) * LEGEND_SPACING + 2 * LEGEND_FONT_HEIGHT})`)
      .text(value)
      .attr('fill', '#fff');
  }
  
  // Legend background
  legend.append('rect')
    .attr('width', LEGEND_WIDTH)
    .attr('height', LEGEND_TITLE_FONT_HEIGHT + (5 + i + j) * LEGEND_SPACING + 2 * LEGEND_FONT_HEIGHT)
    .attr('fill', '#111')
    .lower()
}

// After data is loaded, set up data, scales, and listeners
function onDataLoad(geojson, data_) {
  data = data_;

  // Get unique dates:
  dates = Object.keys(data).filter((x, i, a) => a.indexOf(x) == i).sort();
  for(let key in data) {
    data[key] = data[key].map(d => ({ ...d, brightness: parseInt(d.brightness) || 0, coords: [d.longitude, d.latitude] }))
  }

  d3.select('#date-selection')
    .attr('min', 0)
    .attr('max', dates.length - 1)
    .on('input', function() {
      stopPlaying();
      plotFiresForDate(dates[+this.value], data);
    });

  d3.select('#autoadvance-btn').on('click', togglePlaying);
  d3.selectAll('input[type="checkbox"]').on('change', () => plotFiresForDate(dates[getCurrentDateIndex()], data));

  projection = d3.geoMercator()
    .fitSize([WIDTH, HEIGHT], geojson);
  
  expIntensityScale = d3.scalePow()
    .exponent(5)
    .domain([300, 507])
    .range([0, 1]);
  intensityScale = d3.scaleSequential(d => d3.interpolate('#F8F558', '#E0380A')(expIntensityScale(d)));

  frpScale = d3.scaleLinear()
    .domain([0, 11200])
    .range([3, 8]);
  
  const geoPath = d3.geoPath()
    .projection(projection);
  
  map.selectAll('path')
    .data(geojson.features)
    .enter()
    .append('path')
    .attr('class', 'geography')
    .attr('d', geoPath);

  createLegend()
  setupSelectorSvg();
  startPlaying();
}

// Get index of current date
function getCurrentDateIndex() {
  const dateSelection = d3.select('#date-selection');
  return parseInt(dateSelection.property('value')) + 1;
}

// Toggle dates autoadvancing
function togglePlaying() {
  if(!intervalPlayer) {
    startPlaying();
  }
  else {
    stopPlaying();
  }
}

// Start dates autoadvancing
function startPlaying() {
  intervalPlayer = setInterval(() => {
    let value = getCurrentDateIndex() + 1;

    if(value >= dates.length) {
      value = 0;
    }

    d3.select('#date-selection').property('value', value);
    plotFiresForDate(dates[value], data);
  }, 250);
}

// Stop dates autoadvancing
function stopPlaying() {
  clearInterval(intervalPlayer);
  intervalPlayer = false;
}

// Given a date and a dataset, show geographic scatterplot with applied filters.
function plotFiresForDate(date, data) {
  d3.select('#current-date').text(date);
  d3.select('#date-display-svg').text(date);
  updateSelectorSvg();

  const satelliteFilter = [...document.getElementsByName('satellites')].map(e => e.checked ? e.value : '').filter(d => !!d);
  const timeFilter = [...document.getElementsByName('time')].map(e => e.checked ? e.value : '').filter(d => !!d);

  scatterPlot = document.getElementById('scatterplot-enabled').checked;
  densityPlot = document.getElementById('cdplot-enabled').checked;

  const plotData = data[date].filter(d => satelliteFilter.includes(d.satellite) && timeFilter.includes(d.daynight));

  drawScatterPlot(plotData, scatterPlot);
  drawDensityPlot(plotData, densityPlot);
}

// Draw scatter plot or clear it according to arguments
function drawScatterPlot(plotData, shouldDraw) {
  if(shouldDraw) {
    const selection = locations.selectAll('.marker')
      .data(plotData);
    selection.exit().remove();
    selection.enter()
      .append('circle')
      .attr('class', 'marker')
      .attr('opacity', 1)
      .attr('r', d => frpScale(d.frp))
      .attr('fill', d => intensityScale(d.brightness))
      .attr('cx', d => projection(d.coords)[0])
      .attr('cy', d => projection(d.coords)[1]);
  }
  else {
    locations.selectAll('.marker').remove();
  }
}

// Draw density plot or clear it according to arguments
function drawDensityPlot(plotData, shouldDraw) {
  if(shouldDraw) {
    const densityData = d3.contourDensity()
      .x(d => projection(d.coords)[0])
      .y(d => projection(d.coords)[1])
      .weight(d => d.brightness)
      .size([WIDTH, HEIGHT])(plotData);

    if(!densityScalePow) {
      densityScalePow = d3.scalePow()
        .exponent(5)
        .domain([0, 75])
        .range([0, 1]);
      densityScaleColor = d3.interpolate('#ecf0f1', '#3498db')
    }

    const selection = locations.selectAll('.density')
      .data(densityData);

    selection.enter()
      .append('path')
      .attr('class', 'density')
      .merge(selection)
      .attr('d', d3.geoPath())
      .attr('fill', d => console.log(arr.push(d.value)) || densityScaleColor(densityScalePow(d.value)));

    selection.exit().remove()
  }
  else {
    locations.selectAll('.density').remove();
  }
}

setupDisplaySvg();

d3.queue()
  .defer(d3.json, 'data/australian-states.json')
  .defer(d3.json, 'data/data.json')
  .awaitAll((err, results) => {
    d3.select('#loading').remove();
    const display = d3.select('.display');
    display.attr('class', display.attr('class') + ' centered');
    onDataLoad(results[0], results[1]);
  });

