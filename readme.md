# GPX Splitter

Reads a collection of GPX files, combines them then splits them into smaller
files by date and by number of points per file. Created to make it easy to
take a collection of GPX files, and create a custom trip map on
[Google My Maps](https://www.google.com/maps/d/), for example,
[My Trip to Antarctica](https://drive.google.com/open?id=1cfu2TLgLhMZqVT-rOclOa47CLeg)

**Features:**

* Split GPX files into multiple files by maximum # of points per file
* Split GPX files into multiple files by date
* Filter GPX files to remove duplicate points (distance moved < 1m)
* Filter GPX files to remove points where
  [HDOP](https://en.m.wikipedia.org/wiki/Dilution_of_precision_(navigation)#Meaning_of_DOP_Values)
  is > 5

Note: **gpx-split** will simplify the GPX files, and the generated files will
not contain anything other than GPS position, time, elevation and hdop. Any
other attributes will be dropped from the generated file.

## Setup

1. Clone the repo
2. Run `npm install`

## Usage

1. Drop `.gpx` files into `source` directory
2. Determine the time zone offset for the trip. For example: New York City in
   the summer is _GMT-04_, so the timezone offset is _-4_.
3. Run the script, eg: `./split --tz_offset -4`

If you do not provide a `--tz_offset`, the script will run but provide a warning
that nothing was provided.

### Options

* `--source <path>` Source folder for the GPX files (`source/`)
* `--dest <path>` Destination folder for the generated files (`result/`)
* `--max <number>` Maximum number of GPX points per file (`30,000`)
* `--tz-offset <number>` Timezone offset
* `--hdop-max <number>` Maximum HDOP to include (`5`)
* `--min-move <value>` Minimum movement in meters between points (`1.25m`)
* `--prefix <string>` Prefix to add to generated files
* `--no-filter` Disable the filter
* `--drop-unsorted` Drops unsorted items from the list
