import { useEffect } from 'react';
import './App.css';

function App() {
  useEffect(() => {
    // The SDK creates a div with id="ad-container" (see backend/routes/sdk.js),
    // so that's the id we need to check for, not "adcontainer".
    const existingAd = document.getElementById('ad-container');
    if (existingAd) return;

    const { REACT_APP_USERNAME, REACT_APP_APPID, REACT_APP_APIKEY, REACT_APP_ADTYPE } = process.env;
    if (!REACT_APP_USERNAME || !REACT_APP_APPID || !REACT_APP_APIKEY) {
      console.error(
        'LocalAds: missing REACT_APP_USERNAME / REACT_APP_APPID / REACT_APP_APIKEY in .env — the SDK cannot authenticate without these.'
      );
      return;
    }

    const script = document.createElement('script');
    script.src = 'http://localhost:5000/sdk';
    script.async = true;

    // add custom attributes
    script.setAttribute('username', REACT_APP_USERNAME);
    script.setAttribute('appid', REACT_APP_APPID);
    script.setAttribute('apikey', REACT_APP_APIKEY);
    script.setAttribute('adtype', REACT_APP_ADTYPE || 'image');
    // No hardcoded pincode: the SDK will ask for browser geolocation and
    // resolve the pincode from lat/long instead. Make sure to allow the
    // location permission prompt when the page loads.
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script); // cleanup on unmount
    };
  }, []);

  return (
    <div className="App">
      
      <p>The adbox is Above this</p>
    </div>
  );
}

export default App;