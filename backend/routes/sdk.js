const express = require("express");
const router = express.Router();

// const db = require("../utils/data");
// const {authenticateuser} = require('../utils/authentication');

router.get('/', async (req, res) => {

    res.setHeader("Content-Type", "application/javascript");
    // add logic for setting height width and posistion as per user request;
    //will also need to add UI logic in My APPs where user can select height width and position and script tag should be created accordingly
    const sdkScript = `
    (function() {
        const currentScript = document.currentScript;
        const username = currentScript.getAttribute("username");
        const appid = currentScript.getAttribute("appid");
        const apikey = currentScript.getAttribute("apikey");
        const adtype = currentScript.getAttribute("adtype") || "image";
        const height = currentScript.getAttribute("height") || "150px";
        const width = currentScript.getAttribute("width") || "500px";
        const position = currentScript.getAttribute("position") || "top";

        // Detect device info
        const deviceInfo = {
          userAgent: navigator.userAgent,
          language: navigator.language,
          platform: navigator.platform,
          screen: {
            width: screen.width,
            height: screen.height
          }
        };

        // Detect location (via browser geolocation API)
        function getLocation() {
            return new Promise((resolve) => {
                if (!navigator.geolocation) 
                    return resolve(null);

                navigator.geolocation.getCurrentPosition(
                    (pos) => resolve(pos.coords),
                    () => resolve(null),
                    { enableHighAccuracy: true, timeout: 5000 }
                );
            });
        }

        async function fetchAd() {
            let location = await getLocation();

            const payload = { username, appid, apikey, adtype, deviceInfo, location };
            const response = await fetch("http://localhost:5000/ad/getad", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload)
            })
            const ad = await response.json();
	
	        // consider taking an input for the position and size of the ad or atleast having default options
            if (ad.id) {
                // Create ad container
                let adContainer = document.getElementById('ad-container'); 
		        if (!adContainer) {
                    adContainer = document.createElement('div'); 
                    adContainer.id = 'ad-container'; 

     // Position right aligned, bottom
                adContainer.style.position = 'fixed';
                adContainer.style.bottom = '20px';
                adContainer.style.right = '20px';

                  // Position bottom-right
                adContainer.style.position = 'fixed';
                adContainer.style.bottom = '20px';
                adContainer.style.right = '20px';

                // Fixed height, width auto to content
                adContainer.style.height = '15vh';
                adContainer.style.display = 'inline-block';
                adContainer.style.maxWidth = '100vw'; // prevent overflow

                // Styling
                adContainer.style.backgroundColor = '#fff';
                adContainer.style.border = '1px solid #ddd';
                adContainer.style.borderRadius = '8px';
                adContainer.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                adContainer.style.overflow = 'hidden';
                adContainer.style.zIndex = '1000';
                adContainer.style.cursor = 'pointer';
                adContainer.style.animation = 'fadeInAd 0.5s ease';

                document.body.appendChild(adContainer); 

                const style = document.createElement('style');
                style.innerHTML = \`
                  @keyframes fadeInAd {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                  }
                  #ad-container img {
                    height: 100%;       /* match container height */
                    width: auto;        /* keep aspect ratio */
                    max-width: 100vw;   /* don't overflow screen */
                    display: block;
                  }
                  #ad-container a {
                    display: inline-block;
                    height: 100%;
                  }
                \`;
                document.head.appendChild(style);
		        }

                //anchor href should be the link where we want to redirect the adclick
                //the href should be an api call to our server which will increment the click count of that add and then return the link to the details page of the ad// or maybe its just better to have an onclick function for clicks
                //consider how other type of ads will be handled and add type-wise logic. 
                //put the innerhtml content in quotes // should display style be inline block? //also think of giving some margin to the ad element to separate from website content
                adContainer.innerHTML = \`
				<a href="\${ad.landing_url}" id="adid1100\${ad.id}" target="_blank"> 
					<img 
						src="\${ad.ad_url}"
						alt="\${ad.title}"
						// width="500px" 
						// height="150px" 
						style="display: block; margin: auto;"
					/>
				</a>\`;
 
	            document.getElementById(\`adid1100\${ad.id}\`).addEventListener('click', function(event) {
                    event.preventDefault();
		            navigator.sendBeacon("http://localhost:5000/ad/click", JSON.stringify({ id: ad.id, appid, pincode:ad.pincode }));
                    window.open(ad.landing_url, "_blank");
                })
  
            }
            
        }
 
        fetchAd();
    })();
    `
  ;

    res.send(sdkScript);
})


module.exports = router;
