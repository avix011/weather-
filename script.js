const apiKey = "1a4daa16f30cec5ca24d55c41fe3e8e6";

const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");
const themeBtn = document.getElementById("themeBtn");
const cityInput = document.getElementById("city");
const weatherCard = document.getElementById("weather-card");
const loader = document.getElementById("loader");
const forecastBox = document.getElementById("forecast");

const iconMap = {
    Clouds: "wi-day-cloudy",
    Clear: "wi-day-sunny",
    Rain: "wi-rain",
    Snow: "wi-snow",
    Thunderstorm: "wi-thunderstorm",
    Drizzle: "wi-showers",
    Mist: "wi-fog"
};

const lightMapURL =
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

const darkMapURL =
    "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

let map, tileLayer;

/* ---------------------- Theme Load ---------------------- */
if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-theme");
}

/* ---------------------- Theme Toggle ---------------------- */
themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark-theme");

    if (document.body.classList.contains("dark-theme")) {
        localStorage.setItem("theme", "dark");
        updateMapTheme("dark");
    } else {
        localStorage.setItem("theme", "light");
        updateMapTheme("light");
    }
});

/* ---------------------- Weather Fetch ---------------------- */
function showLoader() { loader.classList.remove("hidden"); }
function hideLoader() { loader.classList.add("hidden"); }

async function getWeather() {
    const city = cityInput.value.trim();
    if (!city) return alert("Enter a city name!");

    fetchWeather(`q=${encodeURIComponent(city)}`);
}

async function getLocationWeather() {
    if (!navigator.geolocation) return alert("Location not supported");

    navigator.geolocation.getCurrentPosition(pos => {
        fetchWeather(`lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
    });
}

async function fetchWeather(query) {
    showLoader();

    const url =
      `https://api.openweathermap.org/data/2.5/weather?${query}&appid=${apiKey}&units=metric`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.cod !== 200) {
        alert("City not found");
        hideLoader();
        return;
    }

    displayWeather(data);
    loadForecast(data.coord.lat, data.coord.lon);
    loadMap(data.coord.lat, data.coord.lon);

    hideLoader();
}

function displayWeather(data) {
    weatherCard.classList.remove("hidden");

    document.getElementById("city-name").innerText = data.name;
    document.getElementById("temperature").innerText =
      `${Math.round(data.main.temp)}°C`;
    document.getElementById("description").innerText =
      data.weather[0].description;

    document.getElementById("humidity").innerText = data.main.humidity;
    document.getElementById("wind").innerText =
      (data.wind.speed * 3.6).toFixed(1);
    document.getElementById("pressure").innerText = data.main.pressure;

    document.getElementById("weather-icon").className =
      "wi " + (iconMap[data.weather[0].main] || "wi-na");
}

/* ---------------------- Forecast ---------------------- */
async function loadForecast(lat, lon) {
    forecastBox.innerHTML = "";

    const url =
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

    const res = await fetch(url);
    const data = await res.json();

    const daily = data.list.filter(item =>
        item.dt_txt.includes("12:00:00")
    );

    daily.forEach(day => {
        const card = document.createElement("div");
        card.className = "forecast-card";

        card.innerHTML = `
            <h4>${new Date(day.dt * 1000).toLocaleDateString("en-US", { weekday: "short" })}</h4>
            <i class="wi ${iconMap[day.weather[0].main] || "wi-na"}"></i>
            <p>${Math.round(day.main.temp)}°C</p>
        `;

        forecastBox.appendChild(card);
    });
}

/* ---------------------- Map ---------------------- */
function loadMap(lat, lon) {
    const isDark = document.body.classList.contains("dark-theme");

    if (!map) {
        map = L.map("map").setView([lat, lon], 10);

        tileLayer = L.tileLayer(isDark ? darkMapURL : lightMapURL);
        tileLayer.addTo(map);
    } else {
        map.setView([lat, lon], 10);
    }

    L.marker([lat, lon]).addTo(map);
}

function updateMapTheme(mode) {
    if (!tileLayer || !map) return;

    map.removeLayer(tileLayer);

    tileLayer = L.tileLayer(mode === "dark" ? darkMapURL : lightMapURL);

    tileLayer.addTo(map);
}

/* ---------------------- Events ---------------------- */
searchBtn.addEventListener("click", getWeather);
locationBtn.addEventListener("click", getLocationWeather);

cityInput.addEventListener("keydown", e => {
    if (e.key === "Enter") getWeather();
});
