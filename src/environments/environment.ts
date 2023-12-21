const url = 'https://api.healing.tube';
const webUrl = 'https://healing.tube/';
const tubeUrl = 'https://video.healing.tube/'
// const url = 'http://localhost:8080';
// const webUrl = 'http://localhost:4200/';

export const environment = {
  production: false,
  hmr: false,
  serverUrl: `${url}/api/v1/`,
  socketUrl: `${url}/`,
  webUrl: webUrl,
  tubeUrl: tubeUrl,
  domain: '.healing.tube'
};
