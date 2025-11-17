import { tool } from '@repo/internal-langchain';
import { getLogger } from '@repo/pino-log';
import { z } from 'zod';

const getWeatherByCity = async (
  params: z.infer<typeof gaodeWeatherToolSchema>,
) => {
  const logger = getLogger();

  const { city } = params;
  logger.info('Get weather information by city: %s', city);

  const gaodeApiKey = process.env.GAODE_API_KEY;
  const apiBaseUrl = process.env.GAODE_BASE_URL;
  if (!gaodeApiKey) {
    return 'Please configure the API key for the Gaode map';
  }
  if (!apiBaseUrl) {
    return 'Please configure the API base URL for the Gaode map';
  }

  try {
    const cityResponse = await fetch(
      `${apiBaseUrl}/config/district?keywords=${city}&subdistrict=0&key=${gaodeApiKey}`,
    );
    if (!cityResponse.ok) {
      throw new Error(
        `Failed to get city information, status: ${cityResponse.status}`,
      );
    }
    const cityData = await cityResponse.json();
    if (cityData.info !== 'OK') {
      throw new Error(
        `Failed to get city information, data info: ${cityData.info}`,
      );
    }
    const cityAdcode = cityData.districts[0].adcode;
    logger.info(
      'Get city information by city: %s, city adcode: %s',
      city,
      cityAdcode,
    );

    const weatherResponse = await fetch(
      `${apiBaseUrl}/weather/weatherInfo?city=${cityAdcode}&extensions=all&key=${gaodeApiKey}`,
    );
    if (!weatherResponse.ok) {
      throw new Error(
        `Failed to get weather information, status: ${weatherResponse.status}`,
      );
    }
    const weatherData = await weatherResponse.json();
    if (weatherData.info !== 'OK') {
      throw new Error(
        `Failed to get weather information, data info: ${weatherData.info}`,
      );
    }
    logger.info(
      'Get weather information by city: %s, weather information: %o',
      city,
      weatherData,
    );
    return JSON.stringify(weatherData);
  } catch (error) {
    logger.error(error, 'Failed to get weather information by city: %s', city);
    return `Failed to get weather information of ${city}`;
  }
};

const cityParamDescription = 'The name of the city to query, e.g. Beijing';

export const gaodeWeatherToolDefination = {
  name: 'gaode_weather',
  description: 'A tool to get weather information by city',
  inputs: [
    {
      name: 'city',
      description: cityParamDescription,
      required: true,
      type: 'string' as const,
    },
  ],
  label: 'Get weather information by city',
  params: [],
  createdAt: 1722498386,
};

const gaodeWeatherToolSchema = z.object({
  city: z.string().describe(cityParamDescription),
});

export const createGaodeWeatherTool = () => {
  return tool(getWeatherByCity, {
    name: gaodeWeatherToolDefination.name,
    description: gaodeWeatherToolDefination.description,
    schema: gaodeWeatherToolSchema,
  });
};
