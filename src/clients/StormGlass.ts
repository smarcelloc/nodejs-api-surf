import config, { IConfig } from '@src/util/config';
import InternalError from '@src/util/errors/InternalError';
import * as HTTPUtil from '@src/util/request';
import { TimeUtil } from '@src/util/time';

interface StormGlassPointSource {
  [key: string]: number;
}

export interface StormGlassForecastResponse {
  hours: [
    {
      time: string;
      swellDirection: StormGlassPointSource;
      swellHeight: StormGlassPointSource;
      swellPeriod: StormGlassPointSource;
      waveDirection: StormGlassPointSource;
      waveHeight: StormGlassPointSource;
      windDirection: StormGlassPointSource;
      windSpeed: StormGlassPointSource;
    }
  ];
}

export interface ForecastPoint {
  swellDirection: number;
  swellHeight: number;
  swellPeriod: number;
  time: string;
  waveDirection: number;
  waveHeight: number;
  windDirection: number;
  windSpeed: number;
}

export interface StormGlassValidatePoint {
  time: string;
  swellDirection: StormGlassPointSource;
  swellHeight: StormGlassPointSource;
  swellPeriod: StormGlassPointSource;
  waveDirection: StormGlassPointSource;
  waveHeight: StormGlassPointSource;
  windDirection: StormGlassPointSource;
  windSpeed: StormGlassPointSource;
}

export class ClientRequestInternalError extends InternalError {
  constructor(message: string) {
    super(`Unexpected error when trying to communicate to StormGlass: ${message}`);
  }
}

export class StormGlassResponseInternalError extends InternalError {
  constructor(message: string) {
    super(`Unexpected error returned by the StormGlass service: ${message}`);
  }
}

const stormGlassConfig: IConfig = config.get('App.resources.StormGlass');

class StormGlass {
  readonly uri = stormGlassConfig.get<string>('apiUrl');
  readonly source = 'noaa';

  readonly params =
    'swellDirection,swellHeight,swellPeriod,waveDirection,waveHeight,windDirection,windSpeed';

  readonly key = stormGlassConfig.get<string>('apiToken');

  readonly requestConfig: HTTPUtil.RequestConfig = {
    headers: {
      Authorization: this.key,
    },
  };

  constructor(protected request = new HTTPUtil.Request()) {}

  public async fetchPoints(latitude: number, longitude: number): Promise<ForecastPoint[]> {
    const endTimestamp = TimeUtil.getUnixTimeForAFutureDay(1);

    try {
      const url = `${this.uri}/weather/point?lat=${latitude}&lng=${longitude}&params=${this.params}&source=${this.source}&end=${endTimestamp}`;
      const response = await this.request.get<StormGlassForecastResponse>(url, this.requestConfig);

      const responseNormalized = this.normalizeResponse(response.data);

      return Promise.resolve(responseNormalized);
    } catch (error: any) {
      if (HTTPUtil.Request.isRequestError(error)) {
        throw new StormGlassResponseInternalError(
          `Error: ${JSON.stringify(error.response.data)} Code: ${error.response.status}`
        );
      }

      throw new ClientRequestInternalError(error.message);
    }
  }

  private normalizeResponse(points: StormGlassForecastResponse): ForecastPoint[] {
    return points.hours.filter(this.isValidPoint.bind(this)).map((point) => ({
      time: point.time,
      swellDirection: point.swellDirection[this.source],
      swellHeight: point.swellHeight[this.source],
      swellPeriod: point.swellPeriod[this.source],
      waveDirection: point.waveDirection[this.source],
      waveHeight: point.waveHeight[this.source],
      windDirection: point.windDirection[this.source],
      windSpeed: point.windSpeed[this.source],
    }));
  }

  private isValidPoint(point: Partial<StormGlassValidatePoint>): boolean {
    return !!(
      point.time &&
      point.swellDirection?.[this.source] &&
      point.swellHeight?.[this.source] &&
      point.swellPeriod?.[this.source] &&
      point.waveDirection?.[this.source] &&
      point.waveHeight?.[this.source] &&
      point.windDirection?.[this.source] &&
      point.windSpeed?.[this.source]
    );
  }
}

export default StormGlass;
