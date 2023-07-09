const QRCode = require('qrcode');

// Dados para o QR Code
const dados = 'Exemplo de dados';

await QRCode.toDataURL(dados, async (err, qrCodeUrl) => {
    if (err) {
      console.error(err);
      return;
    }
  });