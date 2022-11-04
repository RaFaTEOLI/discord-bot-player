import { HttpClient, HttpRequest, HttpResponse } from '@/data/protocols/http';
import 'dotenv/config';

export class AuthorizeHttpClientDecorator implements HttpClient {
  constructor(private readonly httpClient: HttpClient) {}

  async request(data: HttpRequest): Promise<HttpResponse> {
    const accessToken = process.env.BOT_API_TOKEN;
    if (accessToken) {
      Object.assign(data, {
        headers: Object.assign(data.headers || {}, {
          'x-access-token': accessToken
        })
      });
    }
    const httpResponse = await this.httpClient.request(data);
    return httpResponse;
  }
}
