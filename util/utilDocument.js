const UserDocument = require('../models/user_document')

async function validateByValue(value) {
    try { 
        const userDocument = await UserDocument.findOne({
          where: {
            value: value
          }
        });

        if (userDocument) {
          throw new Error(`Identificador: ${value} já registrado`);
        }
      
    } catch (error) {
        console.error('Error finding document:', error);
        throw error;
    }
}

async function findByUserId(userId) {
  try {
    return await UserDocument.findOne({
      where: {
        user_id: userId
      }
    })
  } catch (error) {
    console.error('Error finding document:', error);
    throw error;
  }
}

function validarCPF(cpf) {
  cpf = cpf.replace(/[^\d]+/g, ''); // Remove caracteres não numéricos

  if (cpf.length !== 11) {
    return false;
  }

  // Verifica se todos os dígitos são iguais (caso contrário, não é válido)
  if (/^(\d)\1+$/.test(cpf)) {
    return false;
  }

  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }

  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === parseInt(cpf.charAt(9))) {
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }

    remainder = (sum * 10) % 11;
    return remainder === 10 || remainder === parseInt(cpf.charAt(10));
  }

  return false;
}

function validarCNPJ(cnpj) {
  cnpj = cnpj.replace(/[^\d]+/g, ''); // Remove caracteres não numéricos

  if (cnpj.length !== 14) {
    return false;
  }

  // Verifica se todos os dígitos são iguais (caso contrário, não é válido)
  if (/^(\d)\1+$/.test(cnpj)) {
    return false;
  }

  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cnpj.charAt(i)) * (11 - i);
  }

  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === parseInt(cnpj.charAt(12))) {
    sum = 0;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cnpj.charAt(i)) * (12 - i);
    }

    remainder = (sum * 10) % 11;
    return remainder === 10 || remainder === parseInt(cnpj.charAt(13));
  }

  return false;
}


module.exports = {
    validateByValue,
    findByUserId,
    validarCNPJ,
    validarCPF
}