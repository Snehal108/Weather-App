const apiKey = "d76f22811edeb3a4e27906c9d07c906b"; // Replace with your API key

function displayWeather(data) {
  const weatherDiv = document.getElementById("weatherResult");

  if (data.cod !== 200) {
    weatherDiv.innerHTML = `<p class="text-red-300 font-semibold">${data.message}</p>`;
    // Clear care message if error
    const msgDiv = document.getElementById("careMessage");
    if (msgDiv) msgDiv.textContent = "";
    return;
  }

  const tempC = parseFloat((data.main.temp - 273.15).toFixed(1));
  const weatherMain = data.weather[0].main.toLowerCase();
  const weatherDesc = data.weather[0].description.toLowerCase();

  const weatherHtml = `
    <h2 class="text-xl font-bold">${data.name}, ${data.sys.country}</h2>
    <p class="capitalize text-lg">${data.weather[0].description}</p>
    <p class="text-4xl font-bold">${tempC}°C</p>
    <img class="mx-auto" src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="Weather icon">
  `;
  weatherDiv.innerHTML = weatherHtml;

  updateBackground(weatherMain, weatherDesc, tempC);
  showCareMessage(weatherMain, tempC);

  // Save sunrise and sunset times for icon update if you use it
  window.sunrise = data.sys.sunrise * 1000;
  window.sunset = data.sys.sunset * 1000;
}

function updateBackground(main, desc, tempC) {
  const body = document.body;

  const weatherClasses = [
    "default-bg", "clear-bg", "clouds-bg", "rain-bg", "thunder-bg",
    "snow-bg", "hot-bg", "cold-bg", "haze-bg"
  ];
  body.classList.remove(...weatherClasses);

  if (body.classList.contains("dark-bg")) return;

  let bgClass = "default-bg";

  if (main.includes("thunderstorm")) {
    bgClass = "thunder-bg";
  } else if (main.includes("rain") || main.includes("drizzle")) {
    bgClass = "rain-bg";
  } else if (main.includes("snow")) {
    bgClass = "snow-bg";
  } else if (main.includes("cloud")) {
    bgClass = "clouds-bg";
  } else if (main.includes("haze") || desc.includes("haze") || desc.includes("mist") || desc.includes("fog") || desc.includes("smoke")) {
    bgClass = "haze-bg";
  } else if (main.includes("clear")) {
    if (tempC <= 5) {
      bgClass = "cold-bg";
    } else if (tempC >= 21) {
      bgClass = "hot-bg";
    } else {
      bgClass = "clear-bg";
    }
  } else {
    if (tempC <= 5) {
      bgClass = "cold-bg";
    } else if (tempC >= 21) {
      bgClass = "hot-bg";
    } else {
      bgClass = "default-bg";
    }
  }

  body.classList.add(bgClass);
  window.currentWeatherClass = `min-h-screen flex items-center justify-center ${bgClass}`;
}

function showCareMessage(main, tempC) {
  const weatherMain = main.toLowerCase();
  let message = "Have a great day and stay safe!";

  if (weatherMain.includes("clear")) {
    if (tempC >= 11 && tempC <= 25) {
      message = "The weather is mild and comfortable. A perfect day to be outside!";
    } else if (tempC >= 26 && tempC <= 35) {
      message = "Warm day ahead! Keep cool and drink plenty of water.";
    } else if (tempC >= 36) {
      message = "Extreme heat alert! Stay indoors. Protect yourself from heatstroke.";
    } else if (tempC <= 10) {
      message = "Keep warm and protect yourself from the cold.";
    } else {
      message = "Enjoy the sunshine! Don't forget your sunglasses.";
    }
  } else if (weatherMain.includes("cloud")) {
    message = "It's a bit cloudy today. A light jacket might help.";
  } else if (weatherMain.includes("rain") || weatherMain.includes("drizzle")) {
    message = "Carry an umbrella to stay dry!";
  } else if (weatherMain.includes("thunderstorm")) {
    message = "Stay indoors and avoid open areas during storms.";
  } else if (weatherMain.includes("snow")) {
    message = "Dress warmly and watch out for slippery roads.";
  } else if (weatherMain.includes("haze") || weatherMain.includes("mist") || weatherMain.includes("fog")) {
    message = "Drive carefully — visibility is low.";
  }

  const msgDiv = document.getElementById("careMessage");
  if (!msgDiv) return;

  msgDiv.innerHTML = `
    <span>${message}</span>
    <button id="speakButton" title="Toggle speech" style="margin-left: 10px; cursor: pointer;">🔊</button>
  `;

  const speakBtn = document.getElementById("speakButton");
  let isSpeaking = false;
  let utterance = null;

  speakBtn.addEventListener("click", () => {
    if (isSpeaking) {
      // If currently speaking, cancel it and update icon
      speechSynthesis.cancel();
      isSpeaking = false;
      speakBtn.textContent = '🔇'; // Show mute after stopping
    } else {
      // Cancel any queued utterance
      speechSynthesis.cancel();

      // Create and speak message
      utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = 'en-US';

      utterance.onstart = () => {
        isSpeaking = true;
        speakBtn.textContent = '🔊'; // Show speaker icon while speaking
      };

      utterance.onend = () => {
        isSpeaking = false;
        speakBtn.textContent = '🔇'; // Show mute icon after finishing
      };

      utterance.onerror = () => {
        isSpeaking = false;
        speakBtn.textContent = '🔇'; // Also mute icon if error
      };

      speechSynthesis.speak(utterance);
    }
  });
}

function getWeatherByCity() {
  const city = document.getElementById("cityInput").value.trim();
  if (!city) {
    alert("Please enter a city name.");
    return;
  }

  fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`)
    .then((response) => response.json())
    .then((data) => {
      displayWeather(data);

      // Save city to localStorage after successful fetch
      if (data.cod === 200) {
        localStorage.setItem("lastCity", city);
      }
    })
    .catch((err) => {
      console.error("Error fetching weather:", err);
      alert("Failed to fetch weather data.");
    });
}


function getWeatherByGeolocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}`)
          .then((response) => response.json())
          .then(displayWeather)
          .catch((err) => {
            console.error("Error fetching weather by location:", err);
            alert("Failed to fetch weather data.");
          });
      },
      (error) => {
        alert("Geolocation error: " + error.message);
      }
    );
  } else {
    alert("Geolocation is not supported by your browser.");
  }
}

// Event listeners
document.getElementById("getCityWeather").addEventListener("click", getWeatherByCity);
document.getElementById("getGeoWeather").addEventListener("click", getWeatherByGeolocation);


function updateDateTime() {
  const now = new Date();

  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  };

  const formatted = now.toLocaleString('en-US', options);
  const dateTimeElem = document.getElementById('dateTime');
  if (dateTimeElem) {
    dateTimeElem.textContent = formatted;
  }
}

// Call once immediately
updateDateTime();
// Update every second
setInterval(updateDateTime, 1000);


document.addEventListener("DOMContentLoaded", () => {
  const lastCity = localStorage.getItem("lastCity");
  if (lastCity) {
    document.getElementById("cityInput").value = lastCity;
    getWeatherByCity();
  }
});
