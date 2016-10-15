var scrapy = require('node-scrapy'),
    json2csv = require('json2csv'),
    fs = require('fs');

// Global variables
var productListURL = 'http://www.shirts4mike.com/shirts.php';



/**
 * Scrapes a list of all available T-shirt and generates an
 * array of all URLs to those products
 * @param   {String} productListURL - Entry point to product index page
 * @returns {String|Array|Promise} - List of URLs to all individual products
 */

function getProductList(productListURL) {
  // Product list scraper data model
  var model = {urls : {selector : '.products > li > a',
                get : 'href',
                prefix : 'http://www.shirts4mike.com/'}};

  // Scrap url about all available products
  return new Promise(function(resolve, reject) {
    scrapy.scrape(productListURL, model, function(err, data) {
        // Log scrapping errors if any
        if (err) {
          reject(err);
        // Otherwise, return an array of URLs for all available products
        } else {
          resolve(data.urls);
        }
    });
  });
}



/**
 * Scrapes T-Shirt details from a product specific URL
 * @param {String} productURL - List of URLs to a product pages
 * @returns {Object|Promise} - Product data object holding title, price,
 *                             url, image, and date time scrapped (UTC)
 */
function getProductDetails(productURL) {
  // Product scraper data model
  var model = {Title : 'title',
               Price : '.price',
               ImageURL : {selector : '.shirt-picture img',
                       get : 'src',
                       prefix : 'http://www.shirts4mike.com/'}};

  // Scrap details about a specific product
  return new Promise(function(resolve, reject) {
    scrapy.scrape(productURL, model, function(err, data) {
        // Log scrapping errors if any
        if (err) {
          reject(err);
        // Add URL and date time stamp to the data object and resolve
        // the promise
        } else {
          data.URL = productURL;
          data.Time = new Date().toISOString().replace('T', ' ').substr(0, 19);
          resolve(data);
        }
    });
  });
}



/**
 * Scrap details for all products in the provided URL list
 * @param {String|Array} productList - List of all URLs to all product pages
 * @returns {Object|Array|Promise} - An array of product objects
 */
function getAllDetails(productList) {
  return new Promise(function(resolve) {
    // Create a queue of promisse calls for fetching
    // all product details from each of the URLs in the list
    var queue = productList.map(function(productURL) {
      return getProductDetails(productURL);
    });
    // Once all the promises in the queue have resolved,
    // generate a complete list of products and return it
    Promise.all(queue).then(function(data) {
      resolve(data);
    });
  });
}



/**
 * Export scraped data to CSV File
 * @param {Object|Array} products - List of product objects
 */
function exportCSV(products) {
  var fileDir = './data',
      fileName = new Date().toISOString().substr(0,10) + '.csv',
      fields = ['Title', 'Price', 'ImageURL', 'URL', 'Time'];

  json2csv({data: products, fields: fields}, function(err, csv) {
    // Log any CSV generation errors
    if (err) {
      logError(err);
    } else {
      // Check if the folder exists and create one if it doesn't
      if (!fs.existsSync(fileDir)) {
        fs.mkdirSync(fileDir);
      }
      // Write the CSV file and log any errors
      fs.writeFile(fileDir + '/' + fileName, csv, function(err) {
        if (err) {
          logError(err);
        }
      });
    }
  });
}



/**
* Log any error messages to external file
* @param {Error} - Generic error object
*/
function logError(err) {
  var errMsg = '[' + new Date().toString() + '] ' + err.message + '\n';

  // Show the error message on stdOut
  console.log(errMsg);

  // Write the error to file
  fs.appendFile('scraper-error.log', errMsg, function(err) {
    if (err) {
      console.log(err);
    }
  });
}



/**
 * Main function call
 */
getProductList(productListURL)
  .then(getAllDetails)
  .then(exportCSV)
  .catch(logError);
