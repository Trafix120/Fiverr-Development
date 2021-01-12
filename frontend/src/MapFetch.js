import React, { useRef, useEffect } from 'react'

const GoogleMap = ({ customerData }) => {
  const googleMapRef = useRef();
  const placeName = "New York"
  let googleMap;

  //Load Google Map script
  useEffect(() => {
    const googleMapScript = document.createElement("script");
    googleMapScript.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_API_KEY}&libraries=places`;
    googleMapScript.async = true;
    window.document.body.appendChild(googleMapScript);

    googleMapScript.addEventListener("load", () => {
      //getLatLng();
      createGoogleMap();
    });
  }, []);

  const createGoogleMap = () => {
    googleMap = new window.google.maps.Map(googleMapRef.current, {
      zoom: 4,
      center: {
        lat: 0,
        lng: 0,
      },
      disableDefaultUI: true,
    });
  }

  const showUserMarkers = () => {
    createGoogleMap()
    console.log(customerData);
    /*
    for (let i = 0; i < customerData.length; i++) {
      new window.google.maps.Marker({
        position: {
          lat: customerData[i].coordinates.lat,
          lng: customerData[i].coordinates.lng,
        },
        map: googleMap,
        animation: window.google.maps.Animation.DROP,
        title: "TESTING",
      })
    }*/
  }

  const getLatLng = () => {
    let lat, lng, placeId;
    new window.google.maps.Geocoder().geocode(
      { address: `${placeName}` },
      function (results, status) {
        if (status === window.google.maps.GeocoderStatus.OK) {
          placeId = results[0].place_id;
          createGoogleMap(results[0].geometry.location);
          lat = results[0].geometry.location.lat();
          lng = results[0].geometry.location.lng();

          console.log({ lat, lng })

          // Test Marker
          new window.google.maps.Marker({
            position: { lat, lng },
            map: googleMap,
            animation: window.google.maps.Animation.DROP,
            title: `${placeName}`,
          });
        } else {
          alert(
            "Geocode was not successful for the following reason: " + status
          );
        }
      }
    );
  };
  return (
    <div
      id="google-map"
      ref={googleMapRef}
      style={{ width: "400px", height: "300px" }}
    />
  );
};

export default GoogleMap;