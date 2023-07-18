var JSEncrypt = require('node-jsencrypt');
var require = require('request');

async function getPaymentToken(pay_token, card, isDebug) {
    var cardData = { 
        brand: card.brand,
        number: card.number,
        cvv: card.cvv, 
        expiration_month: card.expiration_month, 
        expiration_year: card.expiration_year,
        reuse: false
      };
    const getSalt = (pay_token) => {
        return new Promise((resolve, reject) => {
            let options = {
                method: 'get',
                url: 'https://tokenizer.gerencianet.com.br/salt', // Rota para homologação é a mesma
                headers: {
                    'account-code': pay_token
                }
            };

            return require(options, function (error, response, body) {
                if (error) return reject(error);

                try {
                    resolve(body);
                } catch (e) {
                    reject(e);
                }
            });
        });
    }

    const getPublicKey = (pay_token) => {

        return new Promise((resolve, reject) => {

            let options = {
                'method': 'GET',
                'url': isDebug ? 'https://sandbox.gerencianet.com.br/v1/pubkey?code=' + pay_token : 'https://api.gerencianet.com.br/v1/pubkey?code=' + pay_token  // Rota para produção
            };

            return require(options, function (error, response, body) {
                if (error) return reject(error);

                try {
                    resolve(body);
                } catch (e) {
                    reject(e);
                }
            });
        });
    }


    const saveCardData = (pay_token, saltTokenizer, publicKey, cardData) => {


        return new Promise(async (resolve, reject) => {


            cardData.salt = saltTokenizer;

            let crypt = await new JSEncrypt();

            try {
                await crypt.setPublicKey(publicKey);
                var encryptedCardData = await crypt.encrypt(JSON.stringify(cardData));
            } catch (e) {
                reject(e);
            }

            let options = {
                'method': 'POST',
                'url': isDebug ? 'https://sandbox.gerencianet.com.br/v1/card' : 'https://tokenizer.gerencianet.com.br/card',
                //'url': 'https://tokenizer.gerencianet.com.br/card', // Rota para produção
                'headers': {
                    'account-code': pay_token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ "data": encryptedCardData })
            };

            return require(options, function (error, response, body) {
                if (error) return reject(error);

                try {
                    resolve(body);
                } catch (e) {
                    reject(e);
                }
            });
        });
    }

    var saltTokenizer = await getSalt(pay_token);
    saltTokenizer = JSON.parse(saltTokenizer);
    //console.log("saltTokenizer: " + saltTokenizer.data);

    //console.log("");

    var publicKey = await getPublicKey(pay_token);
    publicKey = JSON.parse(publicKey);
    //console.log("publicKey: " + publicKey.data);

    //console.log("");

    const savedCardData = await saveCardData(pay_token, saltTokenizer.data, publicKey.data, cardData);
    //console.log("cardData: " + savedCardData);

    return JSON.parse(savedCardData);
}

module.exports = {
    getPaymentToken
}
 
