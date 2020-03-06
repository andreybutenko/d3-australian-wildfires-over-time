// Second, a map of the fires over time within Australia

const HEIGHT = 600;
const WIDTH = 800;
const MARGIN = 100;

let svg, map, locations, data, projection, dates, intensityScale, intervalPlayer;

function setupSvg() {
  svg = d3.select('.display')
    .append('svg')
    .attr('width', WIDTH + 2 * MARGIN)
    .attr('height', HEIGHT + 2 * MARGIN);

  map = svg.append('g');
  locations = svg.append('g');
}

function onDataLoad(geojson, data_) {
  data = data_.map(d => ({ ...d, brightness: parseInt(d.brightness) || 0, coords: [d.longitude, d.latitude] }));
  // Get unique dates:
  dates = data.map(d => d.acq_date).filter((x, i, a) => a.indexOf(x) == i).sort();

  d3.select('#date-selection')
    .attr('min', 0)
    .attr('max', dates.length - 1)
    .on('input', function() {
      stopPlaying();
      plotFiresForDate(dates[+this.value], data);
    });

  d3.select('#autoadvance-btn').on('click', togglePlaying);

  projection = d3.geoMercator()
    .fitSize([WIDTH, HEIGHT], geojson);
  
    // console.log(d3.extent(data, d => +d.brightness))
  intensityScale = d3.scaleSequential(d3.interpolateOranges)
    .domain(d3.extent(data, d => +d.brightness))
  
  const geoPath = d3.geoPath()
    .projection(projection);
  
  map.selectAll('path')
    .data(geojson.features)
    .enter()
    .append('path')
    .attr('class', 'geography')
    .attr('d', geoPath);

  startPlaying();
}

function togglePlaying() {
  if(!intervalPlayer) {
    startPlaying();
  }
  else {
    stopPlaying();
  }
}

function startPlaying() {
  intervalPlayer = setInterval(() => {
    const dateSelection = d3.select('#date-selection');
    let value = parseInt(dateSelection.property('value')) + 1;

    if(value >= dates.length) {
      value = 0;
    }

    dateSelection.property('value', value);
    plotFiresForDate(dates[value], data);
  }, 250);
}

function stopPlaying() {
  clearInterval(intervalPlayer);
  intervalPlayer = false;
}

function plotFiresForDate(date, data) {
  d3.select('#current-date').text(date);
  const plotData = data.filter(d => d.acq_date == date);
  const selection = locations.selectAll('.marker')
    .data(plotData);
  selection.exit().remove();
  selection.enter()
    .append('circle')
    .attr('class', 'marker')
    .attr('opacity', 1)
    .attr('r', 3)
    .attr('fill', d => intensityScale(d.brightness))
    .attr('cx', d => projection(d.coords)[0])
    .attr('cy', d => projection(d.coords)[1])
}

setupSvg();

d3.queue()
  .defer(d3.json, 'data/australian-states.json')
  .defer(d3.csv, 'data/fire_archive_M6_96619.csv')
  .defer(d3.csv, 'data/fire_archive_M6_96619.csv')
  .awaitAll((err, results) => {
    d3.select('#loading').remove();
    // onDataLoad(results[0], [...results[1]]);
    onDataLoad(results[0], [...results[1], ...results[2]]);
  });

