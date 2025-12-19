import { tool } from '@repo/internal-langchain';
import { getLogger } from '@repo/common';
import { z } from 'zod';

const getCityByIp = async (params: z.infer<typeof gaodeIpToolSchema>) => {
  const logger = getLogger();

  const { ip } = params;
  logger.info(`Get city information by IP: ${ip}`);

  const gaodeApiKey = process.env.GAODE_API_KEY;
  const apiBaseUrl = process.env.GAODE_BASE_URL;
  if (!gaodeApiKey) {
    return 'Please configure the API key for the Gaode map';
  }
  if (!apiBaseUrl) {
    return 'Please configure the API base URL for the Gaode map';
  }

  try {
    const response = await fetch(
      `${apiBaseUrl}/ip?ip=${ip}&key=${gaodeApiKey}`,
    );
    if (!response.ok) {
      throw new Error(
        `Failed to get city information, status: ${response.status}`,
      );
    }

    const data = (await response.json()) as {
      info: string;
      province: string;
      city: string;
    };
    if (data.info !== 'OK') {
      throw new Error(
        `Failed to get city information, data info: ${data.info}`,
      );
    }

    const province = data.province;
    const city = data.city;

    logger.info(
      `Get city information by IP: ${ip}, province: ${province}, city: ${city}`,
    );
    if (province === city) {
      return city;
    }

    return `${province}${city}`;
  } catch (error) {
    logger.error(`Failed to get city information by IP: ${ip}`, { error });
    return `Failed to get the location of ${ip}`;
  }
};

const ipParamDescription = 'The IP address to query, e.g. 114.247.50.2';

export const gaodeIpToolDefination = {
  name: 'gaode_ip',
  description: 'A tool to get city information by IP',
  inputs: [
    {
      name: 'ip',
      description: ipParamDescription,
      required: true,
      type: 'string' as const,
    },
  ],
  label: 'Get city information by IP',
  params: [],
  createdAt: 1722498386,
};

const gaodeIpToolSchema = z.object({
  ip: z.string().describe(ipParamDescription),
});

export const createGaodeIpTool = () => {
  return tool(getCityByIp, {
    name: gaodeIpToolDefination.name,
    description: gaodeIpToolDefination.description,
    schema: gaodeIpToolSchema,
  });
};
