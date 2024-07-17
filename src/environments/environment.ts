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
  domain: '.christian.team',
  siteKey:'0x4AAAAAAAUwDv2sJ3UlZCEf',
  secretKey:'0x4AAAAAAAUwDilFmDq516h-owR9Q0Ew5hk',
  EncryptIV: 8625401029409790,
  EncryptKey: 8625401029409790,
  qrLink: `${webUrl}settings/edit-profile/`,
};
