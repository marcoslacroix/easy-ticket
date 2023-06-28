function isStrongPassword(password) {
    if (password.length < 8) {
      return {
        isValid: false,
        messageError: "A senha deve ter no mínimo 8 caracteres."
      };
    }
    
    if (password.length > 12) {
        return {
            isValid: false,
            messageError: "A senha deve ter no máximo 12 caracteres."
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

module.exports = {isStrongPassword}