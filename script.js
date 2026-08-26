/**
 * Atmosphere — Modern Real-Time Weather Application
 * Features: 24h Hourly Forecast, 3-Day Forecast, AQI, UV, Geolocation,
 * Dynamic Weather Background Particle System, Unit Switching, Favorites.
 */

const API_KEY = "708c2fc2df3b47e48c4182250261607";
const DEFAULT_CITY = "London";

// App State
let currentUnit = "C"; // 'C' or 'F'
let currentWeatherData = null;
let favoriteCities = JSON.parse(localStorage.getItem("atmosphere_favorites")) || ["London", "New York", "Tokyo", "Paris"];
let clockInterval = null;

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
    initCanvas();
    renderFavorites();
    initEventListeners();
    
    // Load last viewed city or default
    const lastCity = localStorage.getItem("atmosphere_last_city") || DEFAULT_CITY;
    fetchWeatherData(lastCity);
});

// Event Listeners Initialization
function initEventListeners() {
    const cityInput = document.getElementById("city-input");
    const clearBtn = document.getElementById("clear-btn");

    cityInput.addEventListener("input", (e) => {
        if (e.target.value.trim().length > 0) {
            clearBtn.classList.remove("hide");
        } else {
            clearBtn.classList.add("hide");
        }
    });

    window.addEventListener("resize", () => {
        resizeCanvas();
    });
}

function clearSearchInput() {
    const cityInput = document.getElementById("city-input");
    cityInput.value = "";
    document.getElementById("clear-btn").classList.add("hide");
    cityInput.focus();
}

function handleSearch() {
    const cityInput = document.getElementById("city-input");
    const query = cityInput.value.trim();
    if (query) {
        fetchWeatherData(query);
    }
}

// Geolocation Integration
function getUserLocation() {
    if (!navigator.geolocation) {
        showError("Geolocation is not supported by your browser.");
        return;
    }

    showSkeleton(true);
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const query = `${position.coords.latitude},${position.coords.longitude}`;
            fetchWeatherData(query);
        },
        (err) => {
            showSkeleton(false);
            showError("Unable to retrieve your location. Please search manually.");
        },
        { timeout: 10000 }
    );
}

// Unit Switching (°C <-> °F)
function setUnit(unit) {
    if (currentUnit === unit) return;
    currentUnit = unit;

    document.getElementById("unit-c").classList.toggle("active", unit === "C");
    document.getElementById("unit-f").classList.toggle("active", unit === "F");

    if (currentWeatherData) {
        renderDashboard(currentWeatherData);
    }
}

// Fetch Weather Data from WeatherAPI
async function fetchWeatherData(query) {
    showSkeleton(true);
    dismissError();

    const url = `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${encodeURIComponent(query)}&days=3&aqi=yes&alerts=no`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            showError(data.error.message || "City not found. Please check spelling.");
            showSkeleton(false);
            return;
        }

        currentWeatherData = data;
        localStorage.setItem("atmosphere_last_city", data.location.name);
        
        renderDashboard(data);
        updateDynamicTheme(data);
        updateFavoriteButtonState(data.location.name);
        showSkeleton(false);

    } catch (error) {
        console.error("Fetch Error:", error);
        showError("Network error. Please check your internet connection.");
        showSkeleton(false);
    }
}

// Render Complete Weather Dashboard
function renderDashboard(data) {
    const isCelsius = currentUnit === "C";
    const { location, current, forecast } = data;

    // 1. Location & Local Time
    document.getElementById("loc-name").textContent = location.name;
    document.getElementById("loc-region-country").textContent = `${location.region ? location.region + ', ' : ''}${location.country}`;
    startLocalClock(location.localtime);

    // 2. Hero Weather Info
    const tempVal = isCelsius ? Math.round(current.temp_c) : Math.round(current.temp_f);
    document.getElementById("hero-temp").textContent = `${tempVal}°`;
    document.getElementById("condition-text").textContent = current.condition.text;
    
    // High-res Icon
    const iconUrl = current.condition.icon.replace("//", "https://").replace("64x64", "128x128");
    document.getElementById("hero-weather-icon").src = iconUrl;
    document.getElementById("hero-weather-icon").alt = current.condition.text;

    // High & Low of the day
    const todayForecast = forecast.forecastday[0].day;
    const highTemp = isCelsius ? Math.round(todayForecast.maxtemp_c) : Math.round(todayForecast.maxtemp_f);
    const lowTemp = isCelsius ? Math.round(todayForecast.mintemp_c) : Math.round(todayForecast.mintemp_f);
    const feelsLikeTemp = isCelsius ? Math.round(current.feelslike_c) : Math.round(current.feelslike_f);

    document.getElementById("temp-high").textContent = `H: ${highTemp}°`;
    document.getElementById("temp-low").textContent = `L: ${lowTemp}°`;
    document.getElementById("feels-like").textContent = `Feels like ${feelsLikeTemp}°`;

    // Hero Stats Pills
    document.getElementById("hero-rain-chance").textContent = `${todayForecast.daily_chance_of_rain || 0}%`;
    document.getElementById("hero-wind").textContent = isCelsius ? `${current.wind_kph} km/h` : `${current.wind_mph} mph`;
    document.getElementById("hero-humidity").textContent = `${current.humidity}%`;

    // 3. Render 24-Hour Hourly Forecast
    renderHourlyForecast(forecast, location.localtime, isCelsius);

    // 4. Render 3-Day Forecast
    renderDailyForecast(forecast.forecastday, isCelsius);

    // 5. Render Environmental Metrics
    renderMetrics(current, forecast.forecastday[0], isCelsius);
}

// 24-Hour Hourly Forecast Carousel
function renderHourlyForecast(forecast, localTimeStr, isCelsius) {
    const hourlyList = document.getElementById("hourly-list");
    hourlyList.innerHTML = "";

    // Combine hourly data from Day 1 and Day 2 to get full upcoming 24 hours
    const day1Hours = forecast.forecastday[0]?.hour || [];
    const day2Hours = forecast.forecastday[1]?.hour || [];
    const allHours = [...day1Hours, ...day2Hours];

    const currentHourIndex = parseInt(localTimeStr.split(" ")[1].split(":")[0], 10);
    const next24Hours = allHours.slice(currentHourIndex, currentHourIndex + 24);

    next24Hours.forEach((hourData, index) => {
        const item = document.createElement("div");
        item.className = `hourly-item ${index === 0 ? 'active-now' : ''}`;

        const timeParts = hourData.time.split(" ")[1]; // "HH:MM"
        const formattedTime = index === 0 ? "Now" : formatTime12h(timeParts);
        const temp = isCelsius ? Math.round(hourData.temp_c) : Math.round(hourData.temp_f);
        const rainChance = hourData.chance_of_rain || 0;

        item.innerHTML = `
            <span class="hourly-time">${formattedTime}</span>
            <img class="hourly-icon" src="https:${hourData.condition.icon}" alt="${hourData.condition.text}" loading="lazy">
            <span class="hourly-temp">${temp}°</span>
            <span class="hourly-pop">
                <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
                ${rainChance}%
            </span>
        `;
        hourlyList.appendChild(item);
    });
}

// 3-Day Daily Forecast List
function renderDailyForecast(forecastDays, isCelsius) {
    const dailyList = document.getElementById("daily-list");
    dailyList.innerHTML = "";

    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    forecastDays.forEach((dayItem, index) => {
        const dateObj = new Date(dayItem.date + "T00:00:00");
        let dayTitle = index === 0 ? "Today" : (index === 1 ? "Tomorrow" : daysOfWeek[dateObj.getDay()]);
        const dateFormatted = `${months[dateObj.getMonth()]} ${dateObj.getDate()}`;

        const minTemp = isCelsius ? Math.round(dayItem.day.mintemp_c) : Math.round(dayItem.day.mintemp_f);
        const maxTemp = isCelsius ? Math.round(dayItem.day.maxtemp_c) : Math.round(dayItem.day.maxtemp_f);
        const rainChance = dayItem.day.daily_chance_of_rain || 0;

        const row = document.createElement("div");
        row.className = "daily-row";
        row.innerHTML = `
            <div class="daily-day-info">
                <div class="day-name">${dayTitle}</div>
                <div class="day-date">${dateFormatted}</div>
            </div>
            <div class="daily-weather-meta">
                <img src="https:${dayItem.day.condition.icon}" alt="${dayItem.day.condition.text}" loading="lazy">
                <span class="daily-condition">${dayItem.day.condition.text} (${rainChance}% rain)</span>
            </div>
            <div class="daily-temp-bar-wrap">
                <span class="daily-min">${minTemp}°</span>
                <div class="daily-temp-bar">
                    <div class="daily-temp-fill"></div>
                </div>
                <span class="daily-max">${maxTemp}°</span>
            </div>
        `;
        dailyList.appendChild(row);
    });
}

// Environmental Metrics (AQI, UV, Wind, Humidity, Sunrise/Sunset, Pressure/Visibility)
function renderMetrics(current, todayForecast, isCelsius) {
    // 1. Air Quality Index (US-EPA)
    const aqiData = current.air_quality || {};
    const epaIndex = aqiData["us-epa-index"] || 1;
    const aqiDetails = getAqiInfo(epaIndex);

    const aqiBadge = document.getElementById("aqi-badge");
    aqiBadge.textContent = aqiDetails.status;
    aqiBadge.className = `badge ${aqiDetails.className}`;

    document.getElementById("aqi-epa-index").textContent = epaIndex;
    document.getElementById("aqi-description").textContent = aqiDetails.description;
    document.getElementById("aqi-pm25").textContent = aqiData.pm2_5 ? aqiData.pm2_5.toFixed(1) : "--";
    document.getElementById("aqi-pm10").textContent = aqiData.pm10 ? aqiData.pm10.toFixed(1) : "--";
    document.getElementById("aqi-o3").textContent = aqiData.o3 ? aqiData.o3.toFixed(1) : "--";
    document.getElementById("aqi-no2").textContent = aqiData.no2 ? aqiData.no2.toFixed(1) : "--";

    // 2. UV Index
    const uvVal = current.uv || 0;
    const uvInfo = getUvInfo(uvVal);
    document.getElementById("uv-val").textContent = uvVal;
    document.getElementById("uv-badge").textContent = uvInfo.status;
    document.getElementById("uv-bar-fill").style.width = `${Math.min((uvVal / 11) * 100, 100)}%`;
    document.getElementById("uv-advice").textContent = uvInfo.advice;

    // 3. Wind & Gusts
    const windSpeed = isCelsius ? current.wind_kph : current.wind_mph;
    const gustSpeed = isCelsius ? current.gust_kph : current.gust_mph;
    const windUnit = isCelsius ? "km/h" : "mph";

    document.getElementById("wind-speed-val").innerHTML = `${windSpeed} <small>${windUnit}</small>`;
    document.getElementById("wind-dir-badge").textContent = current.wind_dir;
    document.getElementById("wind-deg-val").textContent = `${current.wind_degree}° (${current.wind_dir})`;
    document.getElementById("wind-gust-val").textContent = gustSpeed ? `${gustSpeed} ${windUnit}` : `-- ${windUnit}`;

    // 4. Humidity & Comfort
    document.getElementById("humidity-val").textContent = `${current.humidity}%`;
    const dewPoint = isCelsius ? Math.round(current.dewpoint_c || current.temp_c - ((100 - current.humidity) / 5)) 
                               : Math.round(current.dewpoint_f || current.temp_f - ((100 - current.humidity) / 5 * 1.8));
    document.getElementById("dewpoint-val").textContent = `${dewPoint}°`;
    document.getElementById("comfort-val").textContent = current.humidity > 70 ? "Humid" : (current.humidity < 30 ? "Dry" : "Comfortable");

    // 5. Sun & Daylight
    const astro = todayForecast.astro || {};
    document.getElementById("sunrise-time").textContent = astro.sunrise || "06:00 AM";
    document.getElementById("sunset-time").textContent = astro.sunset || "08:00 PM";
    document.getElementById("daylight-duration").textContent = calculateDaylight(astro.sunrise, astro.sunset);

    // 6. Visibility & Pressure
    const vis = isCelsius ? `${current.vis_km} km` : `${current.vis_miles} mi`;
    const pressure = isCelsius ? `${current.pressure_mb} mb` : `${current.pressure_in} in`;
    document.getElementById("visibility-val").textContent = `${vis} (${current.vis_km >= 10 ? 'Clear' : 'Moderate'})`;
    document.getElementById("pressure-val").textContent = pressure;
}

// AQI Status Info
function getAqiInfo(index) {
    switch (index) {
        case 1:
            return { status: "Good", className: "aqi-good", description: "Air quality is satisfactory and poses little or no health risk." };
        case 2:
            return { status: "Moderate", className: "aqi-moderate", description: "Air quality is acceptable; however, sensitive groups may experience minor effects." };
        case 3:
            return { status: "Unhealthy for Sensitive", className: "aqi-unhealthy-sens", description: "Members of sensitive groups may experience health effects." };
        case 4:
            return { status: "Unhealthy", className: "aqi-unhealthy", description: "Everyone may begin to experience health effects; sensitive groups more seriously." };
        case 5:
            return { status: "Very Unhealthy", className: "aqi-very-unhealthy", description: "Health alert: The risk of health effects is increased for everyone." };
        case 6:
            return { status: "Hazardous", className: "aqi-hazardous", description: "Health warning of emergency conditions: Everyone is likely to be affected." };
        default:
            return { status: "Good", className: "aqi-good", description: "Air quality is satisfactory." };
    }
}

// UV Status Info
function getUvInfo(uv) {
    if (uv <= 2) return { status: "Low", advice: "Low danger for the average person. Safe to stay outside." };
    if (uv <= 5) return { status: "Moderate", advice: "Moderate protection required. Wear sunglasses and SPF 30+." };
    if (uv <= 7) return { status: "High", advice: "High risk of harm. Seek shade during midday hours." };
    if (uv <= 10) return { status: "Very High", advice: "Very high risk. Minimise sun exposure between 10am and 4pm." };
    return { status: "Extreme", advice: "Extreme risk. Take full precautions; skin can burn in minutes." };
}

// Calculate Daylight Hours
function calculateDaylight(sunrise, sunset) {
    if (!sunrise || !sunset) return "Daylight info available";
    try {
        const parseTime = (timeStr) => {
            const [time, modifier] = timeStr.split(" ");
            let [hours, minutes] = time.split(":").map(Number);
            if (modifier === "PM" && hours < 12) hours += 12;
            if (modifier === "AM" && hours === 12) hours = 0;
            return hours * 60 + minutes;
        };
        const diff = parseTime(sunset) - parseTime(sunrise);
        if (diff <= 0) return "Daylight: ~12h";
        const h = Math.floor(diff / 60);
        const m = diff % 60;
        return `Daylight: ~${h}h ${m}m`;
    } catch {
        return "Daylight info available";
    }
}

// Local Clock Ticker
function startLocalClock(localtimeStr) {
    if (clockInterval) clearInterval(clockInterval);

    let localDate = new Date(localtimeStr.replace(" ", "T"));
    const updateTimeDisplay = () => {
        const hours = String(localDate.getHours()).padStart(2, '0');
        const minutes = String(localDate.getMinutes()).padStart(2, '0');
        const options = { weekday: 'short', month: 'short', day: 'numeric' };
        const dateFormatted = localDate.toLocaleDateString('en-US', options);
        document.getElementById("local-time").textContent = `${dateFormatted}, ${hours}:${minutes}`;
        localDate.setMinutes(localDate.getMinutes() + 1);
    };

    updateTimeDisplay();
    clockInterval = setInterval(updateTimeDisplay, 60000);
}

// Helper: Format 24h to 12h AM/PM
function formatTime12h(timeStr) {
    let [hours, minutes] = timeStr.split(":").map(Number);
    const suffix = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${hours} ${suffix}`;
}

// Favorites Management
function renderFavorites() {
    const favList = document.getElementById("favorites-list");
    favList.innerHTML = "";

    favoriteCities.forEach((city) => {
        const chip = document.createElement("div");
        chip.className = "fav-chip";
        chip.innerHTML = `
            <span>${city}</span>
            <span class="remove-fav" onclick="removeFavorite(event, '${city}')">✕</span>
        `;
        chip.onclick = () => fetchWeatherData(city);
        favList.appendChild(chip);
    });
}

function toggleFavoriteCurrent() {
    if (!currentWeatherData) return;
    const cityName = currentWeatherData.location.name;
    const index = favoriteCities.indexOf(cityName);

    if (index > -1) {
        favoriteCities.splice(index, 1);
    } else {
        favoriteCities.push(cityName);
    }

    localStorage.setItem("atmosphere_favorites", JSON.stringify(favoriteCities));
    renderFavorites();
    updateFavoriteButtonState(cityName);
}

function removeFavorite(event, city) {
    event.stopPropagation();
    favoriteCities = favoriteCities.filter(c => c !== city);
    localStorage.setItem("atmosphere_favorites", JSON.stringify(favoriteCities));
    renderFavorites();
    if (currentWeatherData) {
        updateFavoriteButtonState(currentWeatherData.location.name);
    }
}

function updateFavoriteButtonState(cityName) {
    const isFav = favoriteCities.includes(cityName);
    const favBtn = document.getElementById("favorite-btn");
    const favIcon = document.getElementById("favorite-icon");

    if (isFav) {
        favBtn.classList.add("active");
        favIcon.setAttribute("fill", "currentColor");
    } else {
        favBtn.classList.remove("active");
        favIcon.setAttribute("fill", "none");
    }
}

// Skeletons & Error Handling
function showSkeleton(show) {
    const skeleton = document.getElementById("loading-skeleton");
    const dashboard = document.getElementById("weather-dashboard");

    if (show) {
        skeleton.classList.remove("hide");
        dashboard.classList.add("hide");
    } else {
        skeleton.classList.add("hide");
        dashboard.classList.remove("hide");
    }
}

function showError(message) {
    const banner = document.getElementById("error-banner");
    document.getElementById("error-message").textContent = message;
    banner.classList.remove("hide");
}

function dismissError() {
    document.getElementById("error-banner").classList.add("hide");
}

/* ========================================================
   Dynamic Particle Canvas & Ambient Theme Controller
   ======================================================== */

let canvas, ctx;
let particles = [];
let animationFrameId = null;
let currentEffect = "clear-day"; // 'clear-day', 'clear-night', 'rain', 'snow', 'clouds', 'thunder'

function initCanvas() {
    canvas = document.getElementById("weather-canvas");
    if (!canvas) return;
    ctx = canvas.getContext("2d");
    resizeCanvas();
    startParticleLoop();
}

function resizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    createParticles(currentEffect);
}

function updateDynamicTheme(data) {
    const isDay = data.current.is_day === 1;
    const condition = data.current.condition.text.toLowerCase();
    const code = data.current.condition.code;
    const root = document.documentElement;

    let theme = {
        grad1: "#0f2027",
        grad2: "#203a43",
        grad3: "#2c5364",
        accent: "rgba(0, 198, 255, 0.35)",
        effect: isDay ? "clear-day" : "clear-night"
    };

    // Thunderstorm
    if (condition.includes("thunder") || [1087, 1273, 1276, 1279, 1282].includes(code)) {
        theme.grad1 = "#090a0f";
        theme.grad2 = "#1b1d28";
        theme.grad3 = "#2c2a4a";
        theme.accent = "rgba(168, 85, 247, 0.4)";
        theme.effect = "thunder";
    }
    // Rain / Drizzle / Shower
    else if (condition.includes("rain") || condition.includes("drizzle") || condition.includes("shower") || [1063, 1150, 1153, 1180, 1183, 1186, 1189, 1192, 1195, 1240, 1243, 1246].includes(code)) {
        theme.grad1 = "#1a2a3a";
        theme.grad2 = "#223b52";
        theme.grad3 = "#2b4c68";
        theme.accent = "rgba(0, 210, 255, 0.35)";
        theme.effect = "rain";
    }
    // Snow / Ice / Sleet
    else if (condition.includes("snow") || condition.includes("ice") || condition.includes("blizzard") || [1066, 1114, 1117, 1210, 1213, 1216, 1219, 1222, 1225].includes(code)) {
        theme.grad1 = "#203342";
        theme.grad2 = "#3a5166";
        theme.grad3 = "#546e7a";
        theme.accent = "rgba(224, 242, 254, 0.4)";
        theme.effect = "snow";
    }
    // Cloudy / Overcast / Mist / Fog
    else if (condition.includes("cloud") || condition.includes("overcast") || condition.includes("mist") || condition.includes("fog") || [1003, 1006, 1009, 1030, 1135, 1147].includes(code)) {
        if (isDay) {
            theme.grad1 = "#2c3e50";
            theme.grad2 = "#3f5872";
            theme.grad3 = "#4b6584";
            theme.accent = "rgba(148, 163, 184, 0.35)";
        } else {
            theme.grad1 = "#0c141f";
            theme.grad2 = "#172331";
            theme.grad3 = "#1f3042";
            theme.accent = "rgba(99, 102, 241, 0.35)";
        }
        theme.effect = "clouds";
    }
    // Sunny / Clear Day
    else if (isDay) {
        theme.grad1 = "#0f3e6d";
        theme.grad2 = "#1e6292";
        theme.grad3 = "#3a8bc8";
        theme.accent = "rgba(255, 183, 3, 0.35)";
        theme.effect = "clear-day";
    }
    // Clear Night
    else {
        theme.grad1 = "#050b14";
        theme.grad2 = "#0d1b2a";
        theme.grad3 = "#1b263b";
        theme.accent = "rgba(129, 140, 248, 0.35)";
        theme.effect = "clear-night";
    }

    // Apply CSS Variables
    root.style.setProperty("--bg-grad-1", theme.grad1);
    root.style.setProperty("--bg-grad-2", theme.grad2);
    root.style.setProperty("--bg-grad-3", theme.grad3);
    root.style.setProperty("--accent-glow", theme.accent);

    if (currentEffect !== theme.effect) {
        currentEffect = theme.effect;
        createParticles(currentEffect);
    }
}

function createParticles(effect) {
    if (!canvas) return;
    particles = [];
    const count = window.innerWidth < 768 ? 40 : 80;

    for (let i = 0; i < count; i++) {
        if (effect === "rain" || effect === "thunder") {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                length: Math.random() * 20 + 10,
                speedY: Math.random() * 10 + 12,
                speedX: -2,
                opacity: Math.random() * 0.4 + 0.2
            });
        } else if (effect === "snow") {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: Math.random() * 3 + 1,
                speedY: Math.random() * 1.5 + 0.5,
                speedX: Math.sin(Math.random() * 3) * 0.8,
                opacity: Math.random() * 0.6 + 0.3
            });
        } else if (effect === "clear-night") {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: Math.random() * 1.5 + 0.5,
                opacity: Math.random(),
                pulseSpeed: Math.random() * 0.02 + 0.005
            });
        } else {
            // Sunny / Clouds floaters
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: Math.random() * 40 + 20,
                speedX: Math.random() * 0.4 - 0.2,
                speedY: Math.random() * 0.4 - 0.2,
                opacity: Math.random() * 0.05 + 0.02
            });
        }
    }
}

function startParticleLoop() {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);

    function loop() {
        if (!ctx || !canvas) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach((p) => {
            if (currentEffect === "rain" || currentEffect === "thunder") {
                ctx.beginPath();
                ctx.strokeStyle = `rgba(180, 220, 255, ${p.opacity})`;
                ctx.lineWidth = 1.5;
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x + p.speedX, p.y + p.length);
                ctx.stroke();

                p.y += p.speedY;
                p.x += p.speedX;
                if (p.y > canvas.height) {
                    p.y = -p.length;
                    p.x = Math.random() * canvas.width;
                }
            } else if (currentEffect === "snow") {
                ctx.beginPath();
                ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();

                p.y += p.speedY;
                p.x += p.speedX;
                if (p.y > canvas.height) {
                    p.y = -p.radius;
                    p.x = Math.random() * canvas.width;
                }
            } else if (currentEffect === "clear-night") {
                p.opacity += p.pulseSpeed;
                if (p.opacity > 1 || p.opacity < 0.1) p.pulseSpeed = -p.pulseSpeed;

                ctx.beginPath();
                ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(p.opacity)})`;
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Ambient floating glow orbs
                ctx.beginPath();
                ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();

                p.x += p.speedX;
                p.y += p.speedY;
                if (p.x < -p.radius) p.x = canvas.width + p.radius;
                if (p.x > canvas.width + p.radius) p.x = -p.radius;
                if (p.y < -p.radius) p.y = canvas.height + p.radius;
                if (p.y > canvas.height + p.radius) p.y = -p.radius;
            }
        });

        animationFrameId = requestAnimationFrame(loop);
    }

    loop();
}