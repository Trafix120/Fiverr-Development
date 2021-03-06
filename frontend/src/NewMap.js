import React, { useRef, useEffect} from 'react'
import './App.css'

const NewMap = () => {
  const googleMapRef = useRef();
  var googleMap = {};

  //Load Google Map script
  useEffect(() => {
    const googleMapScript = document.createElement("script");
    googleMapScript.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_API_KEY}&libraries=places`;
    googleMapScript.async = true;
    window.document.body.appendChild(googleMapScript);

    googleMapScript.addEventListener("load", () => {
      createGoogleMap();
      callBluefolderApi();
    });
  }, []);

  const createGoogleMap = () => {
    console.log(googleMap);
    googleMap = new window.google.maps.Map(googleMapRef.current, {
      zoom: 11,
      center: {
        lat: 29.749907,
        lng: -95.358421,
      },
      disableDefaultUI: false,
    });
  }
  const callBluefolderApi = async () => {
    try {
      let url = process.env.REACT_APP_DEVELOPER_MODE == "true" ? "http://localhost:9000/api/serviceRequests" : "/api/serviceRequests";
      console.log(`URL: ${url}`);
      let res = await fetch(url);
      let customerData = await res.json();
      showUserMarkers(customerData);
    }
    catch (e) {
      console.log(e);
    }
  }

  const showUserMarkers = (customerData) => {
    if (customerData[0] == null){
      return;
    }
    
    console.log(customerData);
    customerData.forEach((customer) => {
      const {coordinates, customerName} = customer;
      if (coordinates == null){
        return
      }
      var marker = new window.google.maps.Marker({
        position: {
          lat: coordinates.lat,
          lng: coordinates.lng,
        },
        map: googleMap,
        animation: window.google.maps.Animation.DROP,
        label: {
          color: 'black',
          fontWeight: 'bold',
          fontSize: '13px',
          text: customerName,
        },
        icon: {
          path: `M13.04,41.77c-0.11-1.29-0.35-3.2-0.99-5.42c-0.91-3.17-4.74-9.54-5.49-10.79c-3.64-6.1-5.46-9.21-5.45-12.07
              c0.03-4.57,2.77-7.72,3.21-8.22c0.52-0.58,4.12-4.47,9.8-4.17c4.73,0.24,7.67,3.23,8.45,4.07c0.47,0.51,3.22,3.61,3.31,8.11
              c0.06,3.01-1.89,6.26-5.78,12.77c-0.18,0.3-4.15,6.95-5.1,10.26c-0.64,2.24-0.89,4.17-1,5.48C13.68,41.78,13.36,41.78,13.04,41.77z
              `,
          fillColor: '#FF0000',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 1,
          anchor: new window.google.maps.Point(14, 43),
          labelOrigin: new window.google.maps.Point(13.5, 50)
        },
      })
    })
      
      
    

  }

  return (
    <div className="Map" 
      ref={googleMapRef}
    />
  );
};

export default NewMap;