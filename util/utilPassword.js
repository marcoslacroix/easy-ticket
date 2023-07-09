const UtilToken = require("../util/utilToken");

function isStrongPassword(password) {
    if (password.length < 8) {
      return {
        isValid: false,
        messageError: "A senha deve ter no mínimo 8 caracteres."
      };
    }
    
    const criteria = [
      { regex: /[A-Z]/, message: 'A senha deve conter pelo menos uma letra maiúscula.' },
      { regex: /[a-z]/, message: 'A senha deve conter pelo menos uma letra minúscula.' },
      { regex: /[0-9]/, message: 'A senha deve conter pelo menos um número.' },
      { regex: /[^A-Za-z0-9]/, message: 'A senha deve conter pelo menos um caractere especial.' }
    ];
  
    for (const criterion of criteria) {
      if (!criterion.regex.test(password)) {
        return {
            isValid: false,
            messageError: criterion.message
        };
      }
    }
  
    return {
        isValid: true,
        messageError: ""
    };
  }
async function validateOldPassword(value, userPassword) {
  const isPasswordMatch = await UtilToken.isPasswordMatch(value.oldPassword, userPassword);
  const isSameOldAndNewPassword = await UtilToken.isPasswordMatch(value.newPassword, userPassword);
  if (isSameOldAndNewPassword) {
    throw new Error("Nova senha deve ser diferente da sua senha antiga");
  }
  
  if (!isPasswordMatch) {
    throw new Error("Senha antiga invalida");
  }
}

function validateNewPasswordWithConfirmPassword(newPassword, confirmPassword) {
  if (newPassword != confirmPassword) {
    throw new Error("As senhas devem ser iguais.");
  }
}

module.exports = {
  isStrongPassword,
  validateNewPasswordWithConfirmPassword,
  validateOldPassword
}