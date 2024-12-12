module.exports = {
    root: true,
    env: {
      node: true,
    },
    extends: [
      'plugin:vue/vue3-essential',
      'eslint:recommended',
    ],
    parserOptions: {
      parser: '@babel/eslint-parser',
      requireConfigFile: false, // Desativa a obrigatoriedade do arquivo de configuração do Babel
      ecmaVersion: 2020,
      sourceType: 'module',
    },
    rules: {
      // Suas regras personalizadas aqui
    },
  };
  