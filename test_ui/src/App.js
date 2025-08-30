import { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [coords, setCoords] = useState(null);
  const [geoError, setGeoError] = useState(null);
  
 useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log("User allowed location:", latitude, longitude);
          setCoords({ latitude, longitude });
        },
        (error) => {
          console.error("Geolocation error:", error);
          setGeoError(error.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      console.error("Geolocation not supported");
      setGeoError("Geolocation not supported");
    }
  }, []);

  useEffect(() => {
    console.log(coords)
    if (!coords) return;

    // Build API URL with latitude & longitude
    const script = document.createElement('script');
    script.src = `http://localhost:5000/ad/getad?lat=${coords.latitude}&long=${coords.longitude}&username=mkhan6390&apikey=6147b71dad25c4fdc61c0fe32f37ece3&appid=915f89f1-84e1-11f0-bfe2-c85b7660b47d`;
    script.async = true;

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [coords]);

  return (
    <div className="App">
      <p>The adbox is below this</p>
      <div id="ad-container"></div>
    </div>
  );
}

export default App;
