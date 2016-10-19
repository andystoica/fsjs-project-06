var scrapy = require('node-scrapy'),
json2csv = require('json2csv'),
fs = require('fs');

// Global variables
var startURL = 'http://www.shirts4mike.com';



/**
 * Scrapes all the links for every page in the provided list of URLs and
 * returns a list of unique URLs within the current domain
 *
 * @param {String|Array} listOfURLs - List of relative URLs to scrap
 * @returns {String|Array|Promise} - Scrapped List of unique URLs
 */

function scrapeURLs(listOfURLs) {
    // Returns a promise when all URLs in the listOfURLs have been scrapped
    return new Promise(function(resolve) {
        // Scrape all URLs in the list into an array of promises
        queue = listOfURLs.map(function(url) {
            return new Promise(function(resolve, reject) {
                // Scrap all links on every page
                var model = {urls : {selector : 'a', get : 'href'}};
                scrapy.scrape(startURL + '/' + url, model, function(err, data) {
                    // Log scrapping errors if any
                    if (err) {
                        err.easy = 'An error occured while accessing '
                        + startURL + '/' + url;
                        reject(err);
                        // Otherwise, return an array of local URLs
                    } else {
                        scrappedURLs = data.urls.filter(function(url) {
                            // remove non local URLs
                            return (url.indexOf('http') < 0)
                            && (!url.includes('./'));
                        });
                        // return the list of scraped URLs
                        resolve(scrappedURLs);
                    }
                });
            });
        });

        // When all promises are fulfilled, combine all scrapped URLs
        Promise.all(queue)
        .then(function(data) {
            combinedURLs = []
            // Flatten the results
            .concat.apply([], data)
            // Remove duplicates
            .filter(function(url, index, self) {
                return index === self.indexOf(url);
            });
            resolve(combinedURLs);
        })
        .catch(logError);
    });
}



/**
 * Filter out only product pages, that containt id= in the URI
 *
 * @param {String|Array} listOfURLs - List of scrapped URLs
 * @returns {String|Array} - List of product URLs, complete with base URL
 */
function selectProductURLs(listOfURLs) {
    return listOfURLs
    .filter(function(url) {
        return url.indexOf('id=') !== -1;
    })
    .map(function(url) {
        return startURL + '/' + url;
    });
}



/**
 * Scrapes T-Shirt details from a product specific URL
 *
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
                err.easy = 'An error occured while scrapping '
                         + 'the product details.';
                reject(err);
                // Add URL and date time stamp to the data object and resolve
                // the promise
            } else {
                data.URL = productURL;
                data.Time = new Date()
                    .toISOString()
                    .replace('T', ' ')
                    .substr(0, 19);
                resolve(data);
            }
        });
    });
}



/**
* Scrap details for all products in the provided URL list
*
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
 *
 * @param {Object|Array} products - List of product objects
 * @returns {undefined}
 */
function exportCSV(products) {
    var fileDir = './data',
    fileName = new Date().toISOString().substr(0,10) + '.csv',
    fields = ['Title', 'Price', 'ImageURL', 'URL', 'Time'];

    json2csv({data: products, fields: fields}, function(err, csv) {
        // Log any CSV generation errors
        if (err) {
            err.easy = 'An error occured while writing the CSV file.';
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
*
* @param {Error} - Generic error object
* @returns {undefined}
*/
function logError(err) {
    var errMsg = '[' + new Date().toString() + '] ' + err.message + '\n';

    // Show the friendlier error message on stdOut
    console.log(err.easy);

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

scrapeURLs([''])                // Inital scrape of root page
    .then(scrapeURLs)           // Second scrape pass on every link discovered
    .then(selectProductURLs)    // Filter only the product pages
    .then(getAllDetails)        // Scrape all product details
    .then(exportCSV)            // Write CSV file
    .catch(logError);           // Catch and log any error messsages
