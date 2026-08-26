# 🌦️ Atmosphere — Modern Real-Time Weather Application

A modern, responsive, and glassmorphic Weather Application built with HTML5, modern CSS3, and JavaScript (ES6+). It provides real-time meteorological conditions, 24-hour hourly projections, 3-day forecasts, Air Quality Index (AQI), UV Index, and dynamic animated weather backgrounds.

---

## ✨ Features

- 🔍 **Live Search**: Instant city, state, or country meteorological lookup with Enter-key submit.
- 📍 **GPS Geolocation**: Detect and load weather for your exact current location with a single tap.
- 🌡️ **Unit Switcher**: Seamless instant toggle between Celsius (°C) and Fahrenheit (°F).
- 🕒 **24-Hour Hourly Forecast**: Smooth horizontal carousel showing hourly temperatures and precipitation probabilities.
- 📅 **3-Day Multi-Day Forecast**: Daily breakdown including high/low temperature bars, condition icons, and rain chances.
- 🍃 **Air Quality Index (AQI)**: Detailed US-EPA index ratings with pollutant metrics (PM2.5, PM10, Ozone, NO₂).
- ☀️ **UV Index & Sun Tracking**: UV rating with safety recommendations, plus accurate Sunrise and Sunset daylight timers.
- 💨 **Atmospheric Conditions**: Wind speed, wind gusts, compass direction, humidity, dew point, pressure, and visibility.
- 🎨 **Dynamic Weather Canvas**: Real-time particle background animations (Rain streaks, Snowfall, Night stars, Sunny aura, Thunderstorms) with adaptive theme gradients.
- ⭐ **Saved Favorites**: Bookmark your favorite cities in local storage for quick one-click switching.
- 📱 **Ultra-Responsive Glassmorphism**: Tailored for mobile phones, tablets, and desktop displays with smooth loading skeletons.

---

## 🛠️ Technologies Used

- **HTML5**: Semantic tags, accessible attributes, and responsive layout structures.
- **CSS3**: CSS Grid, Flexbox, CSS Variables, Backdrop-filters (`backdrop-filter: blur()`), and keyframe animations.
- **JavaScript (ES6+)**: Async/Await Fetch API, HTML5 Canvas Particle Engine, Geolocation API, and LocalStorage.
- **WeatherAPI**: Real-time forecast, astronomy, and air quality meteorological feeds.

---

## 🚀 Getting Started

### 1. Clone or Download
```bash
git clone https://github.com/your-username/Weather-app_01.git
```

### 2. Run the Application
Open `index.html` directly in any modern web browser, or serve it using a local development server:
```bash
# Using Python
python -m http.server 8000

# Using Node / npx
npx serve .
```

---

## 📁 Project Structure

```
Weather-app_01/
├── index.html       # Semantic HTML5 layout and glassmorphic components
├── style.css        # CSS Grid/Flexbox, Glassmorphism, animations & themes
├── script.js        # API fetching, particle canvas engine, unit switching & storage
└── README.md        # Comprehensive documentation
```

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
