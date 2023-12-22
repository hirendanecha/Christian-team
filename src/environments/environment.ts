const url = 'https://api.christian.team';
const webUrl = 'https://christian.team/';
const tubeUrl = 'https://tube.christian.team/'
// const url = 'http://localhost:8080';
// const webUrl = 'http://localhost:4200/';

export const environment = {
  production: false,
  hmr: false,
  serverUrl: `${url}/api/v1/`,
  socketUrl: `${url}/`,
  webUrl: webUrl,
  tubeUrl: tubeUrl,
  domain: '.christian.team'
};
