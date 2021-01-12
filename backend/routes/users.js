var express = require("express");
var router = express.Router();
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var parser = require('fast-xml-parser');
var db = require("dotenv")
var NodeGeocoder = require('node-geocoder');
const Datastore = require("nedb");
const fs = require('fs');
const compare = require('compare-obj');

// Takes User Information and Writes to Database
function writeDatabase(database, newCustomerList, coordinates, numCustomer) {

  for (let i = 0; i < numCustomer; i++) {
    database.insert({
      "_id": newCustomerList[i].customerId,
      "customerName": newCustomerList[i].billToCustomerName,
      "addressName": newCustomerList[i].billToAddressName,
      "coordinates": coordinates[i]
    });
    database.update({ _id: newCustomerList[i].customerId }, {
      "customerName": newCustomerList[i].billToCustomerName,
      "addressName": newCustomerList[i].billToAddressName,
      "coordinates": coordinates[i]
    });
  }
}

// Calls geocoder API 
async function getCoordinates(addressList, numCustomer) {
  // Configure Geocoder options
  const geocoderOptions = {
    provide: "google",
    apiKey: process.env.GOOGLE_API_KEY
  }

  const geocoder = NodeGeocoder(geocoderOptions);

  // Split addresses
  const splitNum = Math.ceil(numCustomer / 15);
  const chunkInterval = Math.floor(numCustomer / splitNum);
  const addressChunks = [];
  for (let i = 0; i < numCustomer; i += chunkInterval) {
    let chunk = addressList.slice(i, i + chunkInterval);
    addressChunks.push(chunk);
  }

  // Finding Coordinates
  let coordinates = [];
  for (let h = 0; h < splitNum; h++) {
    coordinates = await findChunkCoordinate(h, coordinates, addressChunks, chunkInterval);
    console.log(`Chunk: ${h} has finished finding its coordinates`);
  }

  // Find Cordinate for each function
  function findChunkCoordinate(h, coordinates, addressChunks, chunkInterval) {
    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        const res = await geocoder.batchGeocode(addressChunks[h]);

        for (let i = 0; i < addressChunks[h].length; i++) {
          if (res[i].value == null || res[i].value[0] == null) {
            console.log(`Index: ${i + chunkInterval * h} has failed, Address: ${addressChunks[h][i]}`)
            //console.log(res[i])
            continue;
          }
          let locationData = res[i].value[0];
          coordinates[i + chunkInterval * h] = {
            lat: locationData.latitude,
            lng: locationData.longitude
          }
        }

        resolve(coordinates);
      }, 500);
    })
  }

  return coordinates
}



// Sends API Request to Blufolder
router.get("/", (req, res, next) => {
  // Reading User Database and Sending it
  const database = new Datastore('users.db');
  database.loadDatabase();

  database.find({}, async (err, data) => {
    if (err) {
      res.send(err);
    }
    res.send(data);

    // Making Bluefolder API request
    const url = "https://app.bluefolder.com/api/2.0/customers/list.aspx";
    var xhr = new XMLHttpRequest();

    // Setting up authentication
    xhr.open("POST", url);
    xhr.setRequestHeader("Authorization", "Basic OWNkMWJjYjEtOTYzZS00MWMzLTg5MTgtYzg3MWYyNDI5OGE3OmFzZGY=");
    xhr.setRequestHeader("Content-Type", "application/xml");

    // Data Package
    var package = `<request>
    <customerList>
        <listType>full</listType>
    </customerList>
  </request>`;

    // Credentials code
    if ("withCredentials" in xhr) {
      console.log("Browser supports")
      xhr.send(package);
    }
    else {
      console.log("Browser does not support request");
    }

    // Once Complete
    xhr.onreadystatechange = async () => {
      if (xhr.readyState === 4) {
        console.log(xhr.status)
        console.log("UPDATING DATABASE NOW....");
        try {
          // Converst xml to js object
          let jsonData = parser.parse(xhr.responseText, {}, true);

          // Obtains the list of customers
          let customers = jsonData.response.customer;

          // Make new javascript object only with certain keys
          var newCustomerList = []
          var addressList = []
          var numCustomer = Object.keys(customers).length
          for (let i = 0; i < numCustomer; i++) {
            newCustomerList.push({
              customerName: customers[i].billToCustomerName,
              addressName: customers[i].billToAddressName,
              _id: customers[i].customerId,
            }
            )
            addressList[i] = customers[i].billToAddressName
          }

          for (let i = 0; i < Object.keys(data).length; i++) {
            data[i] = {
              customerName: data[i].customerName,
              addressName: data[i].addressName,
              _id: data[i]._id
            }
          }

          // Check if old data is same as new data
          if (Object.keys(compare(newCustomerList, data)).length != 0) {
            // Update coordinates and database
            console.log("DATABASE DOES NEED UPDATING");
            let coordinates = await getCoordinates(addressList, numCustomer)
            writeDatabase(database, customers, coordinates, numCustomer, numCustomer);
          }
          else {
            console.log("DATBASE DOES NOT NEED UPDATING");
          }

        }
        catch (e) {
          console.log(e);
        }
        console.log("UPDATING DATABASE FINISHED");
      }
    }
  })




});

module.exports = router;

/* TODO
 - Use only one try catch block
 - implement database


*/