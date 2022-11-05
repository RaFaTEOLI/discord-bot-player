import { HttpRequest, HttpResponse, HttpClient } from '@/data/protocols/http';
import axios, { AxiosResponse } from 'axios';

export class AxiosHttpClient implements HttpClient {
  async request(data: HttpRequest): Promise<HttpResponse> {
    let axiosResponse: AxiosResponse;
    try {
      axiosResponse = await axios.request({
        url: data.url,
        method: data.method,
        data: data.body,
        headers: data.headers,
        params: data.params
      });
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.error('Unable to connect to API Server');
        return {
          statusCode: 500,
          body: {
            error: 'Unable to connect to API Server'
          }
        };
      }
      axiosResponse = error.response;
    }
    return {
      statusCode: axiosResponse.status,
      body: axiosResponse.data
    };
  }
}
