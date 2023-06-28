const express = require('express');
const app = express();
const PagSeguro = require('./payment/PagSeguro')
const customer = {
  "name": "Jose da Silva",
  "email": "email@test.com",
  "tax_id": "12345678909",
  "phones": [
      {
          "country": "55",
          "area": "11",
          "number": "999999999",
          "type": "MOBILE"
      }
  ]
}
const items = [
  {
      "reference_id": "1",
      "name": "Item 01",
      "quantity": 1,
      "unit_amount": 100
  }
];

const data = {
  "reference_id": "ex-00001",
  "customer": customer,
  "items": items
}

  const chargers = [
    {
        "reference_id": "referencia da cobranca",
        "description": "descricao da cobranca",
        "amount": {
            "value": 100,
            "currency": "BRL"
        },
        "payment_method": {
            "type": "CREDIT_CARD",
            "installments": 1,
            "capture": true,
            "card": {
                "number": "4111111111111111",
                "exp_month": "12",
                "exp_year": "2026",
                "security_code": "123",
                "holder": {
                    "name": "Jose da Silva"
                },
                "store": false
            }
        },
    }
  ]



function createOrder() {
    PagSeguro.createOrder(data)
      .then(resp => {
        console.log(resp);
    });
}

function createAndPayOrder() {
  PagSeguro.createOrder(data)
    .then(resp => {
    console.log(resp);
  });
}