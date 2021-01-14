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
      zoom: 10,
      center: {
        lat: 29.749907,
        lng: -95.358421,
      },
      disableDefaultUI: false,
    });
  }
  const callBluefolderApi = async () => {
    try {
      let res = await fetch("/api/servicerequests");
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
    for (let i = 0; i < customerData.length; i++) {
      if (customerData[i].coordinates == null){
        continue;
      }
      //console.log(customerData[i]);
      new window.google.maps.Marker({
        position: {
          lat: customerData[i].coordinates.lat,
          lng: customerData[i].coordinates.lng,
        },
        map: googleMap,
        animation: window.google.maps.Animation.DROP,
        title: customerData[i].customerName,
      })
      
    }

  }

  return (
    <div className="Map" 
      ref={googleMapRef}
    />
  );
};

export default NewMap;