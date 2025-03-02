/**
 * Exemplo de configuração do Stryker Mutator para uso com o Mutation Test Action
 * 
 * Este arquivo serve como um exemplo de como configurar o Stryker Mutator
 * para uso com o Mutation Test Action. Você pode copiar este arquivo para
 * o seu projeto e ajustá-lo conforme necessário.
 */
module.exports = {
  // Gerenciador de pacotes a ser usado
  packageManager: "npm",
  
  // Reporters para gerar saídas em diferentes formatos
  reporters: [
    "html",     // Gera um relatório HTML detalhado
    "json",     // Gera um relatório JSON (necessário para o Mutation Test Action)
    "progress", // Mostra o progresso no console
    "clear-text" // Mostra um resumo no console
  ],
  
  // Framework de teste a ser usado
  testRunner: "jest",
  
  // Como analisar a cobertura de código
  coverageAnalysis: "perTest",
  
  // Configuração específica para o Jest
  jest: {
    // Tipo de projeto (custom, create-react-app, etc.)
    projectType: "custom",
    // Caminho para o arquivo de configuração do Jest
    configFile: "jest.config.js"
  },
  
  // Arquivos a serem mutados
  mutate: [
    "src/**/*.ts",       // Incluir todos os arquivos TypeScript em src
    "!src/**/*.test.ts", // Excluir arquivos de teste
    "!src/**/*.spec.ts", // Excluir arquivos de teste
    "!src/types/**/*.ts" // Excluir arquivos de tipos
  ],
  
  // Limites para classificação da pontuação de mutação
  thresholds: {
    high: 80,  // Pontuação acima de 80% é considerada alta
    low: 60,   // Pontuação abaixo de 60% é considerada baixa
    break: 50  // Falha se a pontuação for menor que 50%
  },
  
  // Número máximo de processos paralelos
  concurrency: 4,
  
  // Tempo limite em milissegundos para cada teste
  timeoutMS: 30000,
  
  // Plugins a serem carregados
  plugins: [
    "@stryker-mutator/typescript-checker", // Verifica se as mutações são válidas em TypeScript
    "@stryker-mutator/jest-runner"         // Runner para Jest
  ],
  
  // Configuração específica para TypeScript
  tsconfigFile: "tsconfig.json",
  
  // Ignorar padrões de arquivos (além dos especificados em mutate)
  ignorePatterns: [
    "node_modules",
    "dist",
    "coverage"
  ],
  
  // Configuração de mutadores específicos
  mutator: {
    // Quais mutadores usar
    plugins: [
      "typescript" // Usar mutadores específicos para TypeScript
    ],
    // Excluir mutadores específicos
    excludedMutations: [
      // "StringLiteral" // Exemplo: não mutar strings literais
    ]
  }
};
