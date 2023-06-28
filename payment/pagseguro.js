const axios = require('axios');

async function createOrder(data) {

    try {
      const response = await axios.request(
        {
          method: 'POST',
          url: 'https://sandbox.api.pagseguro.com/orders',
          headers: {
            accept: 'application/json',
            Authorization: '9E1C9D672C9F41B79D40476AC03759E7',
            'content-type': 'application/json'
          },
          data: data
        }
      );

      return response;
    } catch (error) {
      throw error;
    }
}

module.exports = {
    createOrder
}