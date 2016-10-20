==============================================
Treehouse Full Stack JavaScript
Project 6 - Build a Content Scraper
==============================================

Brief
=====
Imagine you worked at a price comparison website. You’ve been given the task to create a Node.js command line application that goes to an ecommerce site to gets the latest prices and saves them to a spreadsheet (CSV format).

This spreadsheet will be used by another application to populate a database. This applications you build will be run once every day.

You should use npm modules to assist you in the project. You have to research and use npm packages that will help you scrape a website and create a CSV file.

node-scrapy
===========
https://www.npmjs.com/package/node-scrapy
This scraper module is fairly mature, being developed in 2014, still in active development with a fair share of updates, some quite recent. It is also reasonably popular with about 150+ downloads a month. I chose it because of it's simplicity, after trying a couple other scrapers. The syntax is very straightforward using CSS selector like and it returns the data already formatted for insertion into CSV so it was perfect for my project. It is also well documented with plenty of examples and many options for customisation if necessary.

json2csv
========
https://www.npmjs.com/package/json2csv
This is a ver popular CSV module which seemed perfectly fitted to complement the scraper module. It has close to 100,000+ downloads a month, is already at version 3 and in active development with almost 300+ commits and 50 releases with many contributors. Also very well documented with plenty examples and use cased. One particular feature made it attractive, the ability to define the order and labels of each column which was particularly useful in this case.
