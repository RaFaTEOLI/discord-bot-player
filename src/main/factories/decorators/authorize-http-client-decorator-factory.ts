import { HttpClient } from '@/data/protocols/http';
import { AuthorizeHttpClientDecorator } from '@/main/decorators';
import { makeAxiosHttpClient } from '@/main/factories/http/axios-http-client-factory';

export const makeAuthorizeHttpClientDecorator = (): HttpClient => {
  return new AuthorizeHttpClientDecorator(makeAxiosHttpClient());
};
