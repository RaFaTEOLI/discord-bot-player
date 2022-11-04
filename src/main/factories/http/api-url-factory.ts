export const makeApiUrl = (path: string): string => {
  let apiUrl = process.env.API_URL;
  if (!apiUrl) {
    apiUrl = 'http://localhost';
  }
  if (path.startsWith('/')) {
    return `${apiUrl}${path}`;
  }
  return `${apiUrl}/${path}`;
};
