const socket = io();
document.getElementById("searchbtn").addEventListener("click", () => {
    const query = document.getElementById('searchInput').value.trim();

    const userIcon = L.icon({
        iconUrl:"",  // Path to user icon in public folder
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });
    
    const poiIcon = L.icon({
        iconUrl: 'path_to_poi_icon.png',  // Path to POI icon in public folder
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            let { latitude, longitude } = position.coords;

            if (query === "my-location") {
                socket.emit("send-location", { latitude, longitude });
            } else {
                fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`)
                    .then(response => response.json())
                    .then(data => {
                        if (data.length > 0) {
                            const { lat, lon } = data[0];
                            latitude = parseFloat(lat);
                            longitude = parseFloat(lon);
                            socket.emit("send-location", { latitude, longitude });
                            map.setView([latitude, longitude], 14);
                            L.marker([latitude, longitude], { icon: userIcon })
                                .bindTooltip(`Location: ${query}`, { permanent: true })
                                .addTo(map);
                            fetchPOIs(latitude, longitude);
                        } else {
                            alert('Location not found');
                        }
                    })
                    .catch(error => console.error('Error fetching location:', error));
            }
        }, (error) => {
            console.error(error);
        }, {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 5000
        });
    }
});


const map = L.map("map").setView([28.38,77.12 ], 10);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

var poiMarkers = L.layerGroup().addTo(map);
const markers = {};



function fetchPOIs(lat, lng) {
    const overpassUrl = `https://overpass-api.de/api/interpreter?data=[out:json];node(around:1000,${lat},${lng});out;`;
    fetch(overpassUrl)
        .then(response => response.json())
        .then(data => {
            poiMarkers.clearLayers();
            data.elements.forEach(element => {
                if (element.tags && element.tags.name) {
                    const tooltipContent = `
                        <b>${element.tags.name}</b><br>
                        ${element.tags.amenity ? 'Amenity: ' + element.tags.amenity + '<br>' : ''}
                        ${element.tags.shop ? 'Shop: ' + element.tags.shop + '<br>' : ''}
                        ${element.tags.cuisine ? 'Cuisine: ' + element.tags.cuisine + '<br>' : ''}
                        ${element.tags.website ? '<a href="' + element.tags.website + '" target="_blank">Website</a>' : ''}
                    `;
                    L.marker([element.lat, element.lon])
                        .bindPopup(tooltipContent)
                        .addTo(poiMarkers);
                        
                }
            });
        })
        .catch(error => console.error('Error fetching POIs:', error));
}

socket.on("receive-location", (data) => {
    const { id, latitude, longitude } = data;
    // console.log(data);
    map.setView([latitude, longitude], 16);
    if (markers[id]) {
        markers[id].setLatLng([latitude, longitude]);
    } else {
        markers[id] = L.marker([latitude, longitude])
            .bindTooltip("My location", { permanent: true })
            .addTo(map);
    }
    fetchPOIs(latitude, longitude);
});

socket.on("user-disconnected", (id) => {
    if (markers[id]) {
        map.removeLayer(markers[id]);
        delete markers[id];
    }
});
