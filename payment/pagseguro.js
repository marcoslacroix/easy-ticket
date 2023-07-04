const axios = require('axios');

async function createOrder(data) {

    try {
      const response = await axios.request(
        {
          method: 'POST',
          url: `${process.env.PAGSEGURO_URL}/orders`,
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

async function getOrder(orderId) {
  try {
    const response = await axios.request(
      {
        method: 'GET',
        url: `${process.env.PAGSEGURO_URL}/orders/${orderId}`,
        headers: {
          accept: 'application/json',
          Authorization: '9E1C9D672C9F41B79D40476AC03759E7',
          'content-type': 'application/json'
        }
      }
    );

    return response;
  } catch (error) {
    throw error;
  }
}

async function payOrder(orderId, data) {
  try {
    const response = await axios.request(
      {
        method: 'POST',
        url: `${process.env.PAGSEGURO_URL}/orders/${orderId}/pay`,
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
    createOrder,
    payOrder,
    getOrder
}