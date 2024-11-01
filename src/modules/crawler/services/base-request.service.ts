import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import UserAgent from 'user-agents';
export abstract class BaseRequestService {
  protected _apiKey?: string;
  protected _apiHost?: string;
  protected _scraperApiKey?: string;
  protected axiosInstance: AxiosInstance;

  constructor(apiHost: string, apiKey?: string) {
    this._apiKey = apiKey;
    this._apiHost = apiHost;
    this._scraperApiKey = process.env.SCRAPER_API_KEY;
    // Call child class's _buildHeader if it exists
    // const childHeader = (this as any)._buildHeader
    //   ? (this as any)._buildHeader()
    //   : this._buildHeader();

    this.axiosInstance = axios.create({
      baseURL: this._apiHost, // Set the base URL
      // headers: childHeader, // Set initial headers
    });
  }

  // Provide a default implementation for _buildHeader
  protected _buildHeader(): Record<string, string> {
    const userAgent = new UserAgent();
    return {
      'user-agent': userAgent.toString(),
    };
  }

  _buildScraperProxy() {
    return {
      timeout: 30000,
      proxy: {
        protocol: 'http',
        host: 'proxy-server.scraperapi.com',
        port: 8001,
        auth: {
          username:
            'scraperapi.device_type=desktop.premium=true.country_code=us',
          password: this._scraperApiKey,
        },
      },
    };
  }

  protected async sendRequest(
    options: AxiosRequestConfig,
    isScraperProxy: boolean = false,
  ) {
    // Validate that options.url does not contain a host or domain
    // if (!options.url || /^(http|https):\/\//.test(options.url)) {
    //   throw new Error(
    //     'Invalid URL: options.url must not contain a host or domain.',
    //   );
    // }
    // // Extract the sub-routing from options.url
    // const subRouting = options.url.replace(/^\//, ''); // Remove leading slash if present
    // // Concatenate _apiHost with the sub-routing
    // options.url = `${this._apiHost}/${subRouting}`;
    try {
      if (isScraperProxy)
        options = { ...this._buildScraperProxy(), ...options };
      const response = await this.axiosInstance.request(options);
      return response.data;
    } catch (error) {
      const functionName = this.getFunctionName(); // Get the function name dynamically
      let errorMessage = `An error occurred in ${this.constructor.name} - ${functionName}: `;
      if (axios.isAxiosError(error)) {
        errorMessage += error.response?.data?.message || error.message;
        console.error('Request config:', error.config);
      } else if (error instanceof Error) {
        errorMessage += error.message;
      }
      //   const stackTrace = this.formatStackTrace(new Error().stack);
      console.error(errorMessage);
      //   console.error(stackTrace);
      throw error;
    }
  }

  private getFunctionName(): string {
    const stack = new Error().stack; // Capture the stack trace
    if (stack) {
      const stackLines = stack.split('\n');
      // The function name is usually in the second line of the stack trace
      const match = stackLines[2].match(/at (\w+)/);
      return match ? match[1] : 'unknown function';
    }
    return 'unknown function';
  }

  private formatStackTrace(stack?: string): string {
    if (!stack) return 'No stack trace available.';
    return stack
      .split('\n')
      .map((line) => line.trim())
      .slice(1) // Skip the first line (the error message)
      .join('\n'); // Join the remaining lines for a clean output
  }
}
