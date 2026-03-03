const axios = require("axios");

const toDateString = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString().slice(0, 10);
};

const getRainAlert = async (city, targetDate) => {
  const dateString = toDateString(targetDate);
  if (!dateString) {
    return { rain: null, summary: "Invalid date" };
  }

  const provider = (process.env.WEATHER_PROVIDER || "openweather").toLowerCase();

  if (provider === "weatherapi") {
    const apiKey = process.env.WEATHERAPI_KEY;
    if (!apiKey) {
      return { rain: null, summary: "Weather API not configured" };
    }

    const response = await axios.get(
      "http://api.weatherapi.com/v1/forecast.json",
      {
        params: {
          key: apiKey,
          q: city,
          days: 5,
          lang: "pt",
        },
        timeout: 8000,
      }
    );

    const forecastDays = response.data.forecast?.forecastday || [];
    const match = forecastDays.find((day) => day.date === dateString);

    if (!match) {
      return { rain: null, summary: "No forecast for date" };
    }

    const willRain = Boolean(match.day?.daily_will_it_rain);
    const summary = match.day?.condition?.text || "";
    return { rain: willRain, summary };
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return { rain: null, summary: "Weather API not configured" };
  }

  const response = await axios.get(
    "https://api.openweathermap.org/data/2.5/forecast",
    {
      params: {
        q: city,
        appid: apiKey,
        units: "metric",
        lang: "pt",
      },
      timeout: 8000,
    }
  );

  const list = response.data.list || [];
  const sameDay = list.filter((item) =>
    (item.dt_txt || "").startsWith(dateString)
  );

  if (!sameDay.length) {
    return { rain: null, summary: "No forecast for date" };
  }

  const rainSlot = sameDay.find(
    (item) => item.weather?.[0]?.main === "Rain" || item.rain
  );
  const summary = rainSlot?.weather?.[0]?.description || "";

  return { rain: Boolean(rainSlot), summary };
};

module.exports = {
  getRainAlert,
};
