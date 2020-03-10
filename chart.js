// Second, a map of the fires over time within Australia

const HEIGHT = 600;
const WIDTH = 800;
const MARGIN = 100;

let svg, map, locations, data, projection, dates, intensityScale, frpScale, intervalPlayer;

function setupSvg() {
  svg = d3.select('.display')
    .append('svg')
    .attr('width', WIDTH + 2 * MARGIN)
    .attr('height', HEIGHT + 2 * MARGIN);

  map = svg.append('g');
  locations = svg.append('g');
}

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
  
  const expScale = d3.scalePow()
    .exponent(5)
    .domain([300, 507])
    .range([0, 1])
  intensityScale = d3.scaleSequential(d => d3.interpolate('#F8F558', '#E0380A')(expScale(d)))
  frpScale = d3.scaleLinear()
    .domain([0, 11200])
    .range([3, 8])
  
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

function getCurrentDateIndex() {
  const dateSelection = d3.select('#date-selection');
  return parseInt(dateSelection.property('value')) + 1;
}

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

function stopPlaying() {
  clearInterval(intervalPlayer);
  intervalPlayer = false;
}

function plotFiresForDate(date, data) {
  d3.select('#current-date').text(date);

  const satelliteFilter = [...document.getElementsByName('satellites')].map(e => e.checked ? e.value : '').filter(d => !!d);;
  const timeFilter = [...document.getElementsByName('time')].map(e => e.checked ? e.value : '').filter(d => !!d);;

  const plotData = data[date].filter(d => satelliteFilter.includes(d.satellite) && timeFilter.includes(d.daynight));

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
    .attr('cy', d => projection(d.coords)[1])
}

setupSvg();

d3.queue()
  .defer(d3.json, 'data/australian-states.json')
  .defer(d3.json, 'data/data.json')
  .awaitAll((err, results) => {
    d3.select('#loading').remove();
    onDataLoad(results[0], results[1]);
  });

