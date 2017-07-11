/* jshint strict: true, node:true, browser:false, esnext:true */

'use strict';

const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');
const moment = require('moment');
const xmlParser = new xml2js.Parser();

const MAX_POINTS = 30000;
const OUTPUT_DIR = 'split';
const FILE_PREFIX = 'africa';
const TIME_ZONE_OFFSET = 3;
const FILTER_POINTS = true;
const MIN_DIFF = 0.000010;

function getGPXFileList(dir) {
  dir = dir || '.';
  let gpxFiles = [];
  const allFiles = fs.readdirSync(dir);
  allFiles.forEach((fileName) => {
    if (fileName.endsWith('.gpx')) {
      gpxFiles.push(path.join(dir, fileName));
    }
  });
  gpxFiles = gpxFiles.sort();
  return gpxFiles;
}

function isDiffEnough(curLat, curLon, prevLat, prevLon) {
  const diffLat = Math.abs(parseFloat(curLat) - parseFloat(prevLat));
  const diffLon = Math.abs(parseFloat(curLon) - parseFloat(prevLon));
  if (diffLat > MIN_DIFF || diffLon > MIN_DIFF) {
    return true;
  }
  return false;
}

function getPoints(parsedGPX) {
  const tracks = parsedGPX.gpx.trk;
  let results = [];
  tracks.forEach((track) => {
    const trackSegments = track.trkseg;
    trackSegments.forEach((segment) => {
      const points = segment.trkpt;
      points.forEach((pt) => {
        const point = {
          lat: pt.$.lat,
          lon: pt.$.lon,
          time: pt.time[0],
          ele: pt.ele[0]
        };
        results.push(point);
      });
    });
  });
  return results;
}

function readGPXFiles(files) {
  console.log('Reading source GPX files...');
  let points = [];
  files.forEach((fileName) => {
    console.log(` Parsing file: ${fileName}`);
    const gpx = fs.readFileSync(fileName);
    xmlParser.parseString(gpx, function(err, result) {
      const pointsInFile = getPoints(result);
      points = points.concat(pointsInFile);
    });
  });
  console.log(` Found ${points.length} points`);
  return points;
}

function saveGPXFile(points, fileName) {
  let count = 0;
  let lines = [];
  lines.push('<?xml version="1.0" encoding="UTF-8" standalone="no" ?>');
  lines.push('<gpx xmlns="http://www.topografix.com/GPX/1/1" version="1.1" creator="petele">');
  lines.push('  <trk>');
  lines.push(`    <name>${fileName}</name>`);
  lines.push('    <trkseg>');
  points.forEach((point) => {
    lines.push(`      <trkpt lat="${point.lat}" lon="${point.lon}">`);
    lines.push(`        <ele>${point.ele}</ele>`);
    lines.push(`        <time>${point.time}</time>`);
    lines.push(`      </trkpt>`);
    count++;
  });
  lines.push('    </trkseg>');
  lines.push('  </trk>');
  lines.push('</gpx>');
  fileName = path.join(OUTPUT_DIR, `${fileName}.gpx`);
  console.log(` Saving ${count} points to ${fileName}`);
  fs.writeFileSync(fileName, lines.join('\n'));
}

function filterPoints(points) {
  let results = [];
  let lastLat = 1000;
  let lastLon = 1000;
  console.log('Filtering points...');
  points.forEach((point) => {
    if (isDiffEnough(point.lat, point.lon, lastLat, lastLon)) {
      results.push(point);
      lastLat = point.lat;
      lastLon = point.lon;
    }
  });
  console.log(` Kept ${results.length} of ${points.length}`);
  return results;
}

function sortPoints(points) {
  function compareByTime(a, b) {
    var aTime = moment(a.time).valueOf();
    var bTime = moment(b.time).valueOf();
    if (aTime < bTime) {
      return -1;
    } else if (aTime > bTime) {
      return 1;
    } else {
      return 0;
    }
  }
  console.log(`Sorting ${points.length} points by time...`);
  points.sort(compareByTime);
  return points;
}

function verifySorted(points) {
  console.log('Verifying list is sorted...');
  let isSorted = true;
  let lastTime = 0;
  points.forEach((point) => {
    let curTime = moment(point.time).valueOf();
    if (curTime <= lastTime) {
      isSorted = false;
    }
  });
  if (isSorted === false) {
    console.log(' Warning, list is not sorted.');
  } else {
    console.log(' OK');
  }
  return isSorted;
}

function splitBySize(points) {
  console.log(`Splitting by size (${MAX_POINTS})...`);
  let fileIndex = 1;
  while (points.length > 0) {
    let paddedFileIndex = fileIndex++;
    if (paddedFileIndex < 10) {
      paddedFileIndex = '0' + paddedFileIndex;
    }
    const fileName = `${FILE_PREFIX}-${paddedFileIndex}`;
    let chunk = points.splice(0, MAX_POINTS);
    saveGPXFile(chunk, fileName);
  }
}

function splitByDate(points) {
  console.log(`Splitting by date...`);
  let dt = moment.utc(points[0].time).add(TIME_ZONE_OFFSET, 'h');
  let day = dt.format('DD');
  let fileName = FILE_PREFIX + '-' + dt.format('YYYY-MM-DD');
  let pointsForDay = [];
  points.forEach((point) => {
    dt = moment.utc(point.time).add(TIME_ZONE_OFFSET, 'h');
    if (day !== dt.format('DD')) {
      saveGPXFile(pointsForDay, fileName);
      day = dt.format('DD');
      fileName = FILE_PREFIX + '-' + dt.format('YYYY-MM-DD');
      pointsForDay = [];
    }
    pointsForDay.push(point);
  });
  saveGPXFile(pointsForDay, fileName);
}

function main() {
  const files = getGPXFileList('gpx');
  let points = readGPXFiles(files);
  const isSorted = verifySorted(points);
  if (isSorted === false) {
    points = sortPoints(points);
  }
  if (FILTER_POINTS === true) {
    points = filterPoints(points);
  }
  splitByDate(points);
  splitBySize(points);
}

main();

