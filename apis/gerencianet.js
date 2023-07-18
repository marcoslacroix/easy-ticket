const axios = require('axios');
const fs = require('fs');
const path = require('path');
const https = require('https');

console.log(__dirname);
const cert = fs.readFileSync(
  path.resolve(__dirname, `../certs/${process.env.GN_CERT}`)
);

const agent = new https.Agent({
  pfx: cert,
  passphrase: ''
});

const authenticate = ({ clientID, clientSecret }) => {
  const credentials = Buffer.from(
    `${clientID}:${clientSecret}`
  ).toString('base64');

  return axios({
    method: 'POST',
    url: `${process.env.GN_ENDPOINT}/oauth/token`,
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/json'
    },
    httpsAgent: agent,
    data: {
      grant_type: 'client_credentials'
    }
  });
};

let accessToken = null; // Variable to store the access token
let authenticated = false; // Flag to track authentication status

const GNRequest = async (credentials) => {
  if (!authenticated || !accessToken) {
    const authResponse = await authenticate(credentials);
    console.log("Autenticação realizada com sucesso!");
    accessToken = authResponse.data?.access_token;
    authenticated = true; // Set the authenticated flag to true
  }

  const axiosInstance = axios.create({
    baseURL: process.env.GN_ENDPOINT,
    httpsAgent: agent,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  axiosInstance.interceptors.request.use((config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  });

  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response && error.response.status === 401) {
        console.log("Não estava conctado, error lançado");
        // Token has expired, reauthenticate and retry the request
        accessToken = null; // Clear the access token
        authenticated = false; // Reset the authenticated flag
        return GNRequest(credentials).request(error.config);
      }
      throw error;
    }
  );

  return axiosInstance;
};


module.exports = GNRequest;