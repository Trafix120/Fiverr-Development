var express = require("express");
var router = express.Router();
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var parser = require('fast-xml-parser');
var db = require("dotenv")
var NodeGeocoder = require('node-geocoder');
const Datastore = require("nedb");
const fs = require('fs');
const compare = require('compare-obj');

router.get("/", (req, res, next) => {
  // Reading User Database and Sending it
  const database = new Datastore('servicerequests.db');
  database.loadDatabase();


  // Making Bluefolder API request
  const url = "https://app.bluefolder.com/api/2.0/serviceRequests/list.aspx";
  var xhr = new XMLHttpRequest();

  // Setting up authentication
  xhr.open("POST", url);
  xhr.setRequestHeader("Authorization", "Basic OWNkMWJjYjEtOTYzZS00MWMzLTg5MTgtYzg3MWYyNDI5OGE3OmFzZGY=");
  xhr.setRequestHeader("Content-Type", "application/xml");

  // Data Package
  var package = `<request>
  <serviceRequestList>
  <listType>basic</listType>
  <status>open</status>
  </serviceRequestList>
  </request>`;

  // Credentials code
  if ("withCredentials" in xhr) {
    console.log("Browser supports")
    xhr.send(package);
  }
  else {
    console.log("Browser does not support request");
  }

  xhr.onreadystatechange = async () => {
    if (xhr.readyState === 4) {
      console.log(xhr.status)
      console.log("UPDATING DATABASE NOW....");

      try {
        // Converst xml to js object
        let jsonData = parser.parse(xhr.responseText, {}, true);
        

        // Obtains the list of customers
        let servReqs = jsonData.response.serviceRequestList.serviceRequest;

        // Make new javascript object only with certain keys
        var newServReqs = []
        var addressList = []
        var numRequests = Object.keys(servReqs).length
        for (let i = 0; i < numRequests; i++) {
          newServReqs.push({
            customerName: servReqs[i].customerName,
            addressName: servReqs[i].customerLocationStreetAddress,
            _id: servReqs[i].serviceRequestId,
          });
          addressList[i] = servReqs[i].customerLocationStreetAddress
        }
        let coordinates = await getCoordinates(addressList, numRequests)
        for (let i = 0; i < numRequests; i++){
          newServReqs[i].coordinates = coordinates[i];
        }
        res.send(newServReqs);
      }
      catch (e) {
        console.log(e);
      }
    }
  }
});

// Calls geocoder API 
async function getCoordinates(addressList, numRequests) {
  // Configure Geocoder options
  const geocoderOptions = {
    provide: "google",
    apiKey: process.env.GOOGLE_API_KEY
  }

  const geocoder = NodeGeocoder(geocoderOptions);

  // Split addresses
  const splitNum = Math.ceil(numRequests / 15);
  const chunkInterval = Math.floor(numRequests / splitNum);
  const addressChunks = [];
  for (let i = 0; i < numRequests; i += chunkInterval) {
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

module.exports = router;