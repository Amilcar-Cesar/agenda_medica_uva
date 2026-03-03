const axios = require("axios");

const lookupCep = async (cep) => {
  const cleanCep = String(cep).replace(/\D/g, "");
  if (cleanCep.length !== 8) {
    throw new Error("Invalid CEP");
  }

  const response = await axios.get(
    `https://viacep.com.br/ws/${cleanCep}/json/`,
    { timeout: 8000 }
  );

  if (response.data.erro) {
    throw new Error("CEP not found");
  }

  return {
    cep: cleanCep,
    street: response.data.logradouro || "",
    neighborhood: response.data.bairro || "",
    city: response.data.localidade || "",
    state: response.data.uf || "",
  };
};

module.exports = {
  lookupCep,
};
