# Guia de Início Rápido

Este guia fornece instruções passo a passo para começar a usar o Mutation Test Action em seu projeto.

## Pré-requisitos

- Um projeto com testes unitários configurados (Jest, Mocha, etc.)
- Um arquivo de configuração do Stryker (`stryker.conf.js` ou `stryker.conf.json`)

## Passos Básicos

### 1. Adicione o Stryker ao seu projeto

Se você ainda não tem o Stryker configurado:

```bash
# Instale o Stryker
npm install --save-dev @stryker-mutator/core

# Instale o runner para seu framework de teste (exemplo para Jest)
npm install --save-dev @stryker-mutator/jest-runner

# Inicialize a configuração do Stryker
npx stryker init
```

### 2. Crie um workflow do GitHub Actions

Crie um arquivo `.github/workflows/mutation.yml` no seu repositório:

```yaml
name: Mutation Testing

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  mutation-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run Mutation Tests
        uses: menoncello/mutation-test@v1
        id: mutation
        
      - name: Print Mutation Score
        run: echo "Mutation Score: ${{ fromJson(steps.mutation.outputs.mutation_metrics).mutationScore }}%"
```

### 3. Personalize a configuração (opcional)

Você pode personalizar a configuração do Stryker no arquivo `stryker.conf.js`:

```javascript
module.exports = {
  packageManager: "npm",
  reporters: ["json", "html", "progress"],
  testRunner: "jest",
  coverageAnalysis: "perTest",
  jest: {
    projectType: "custom",
    configFile: "jest.config.js"
  },
  mutate: [
    "src/**/*.js",
    "!src/**/*.test.js"
  ],
  thresholds: {
    high: 80,
    low: 60,
    break: 50
  }
};
```

### 4. Execute o workflow

Faça push das alterações para o seu repositório e o workflow será executado automaticamente.

## Exemplos de Uso Avançado

### Definir um limite mínimo de pontuação de mutação

```yaml
steps:
  - uses: actions/checkout@v4
  
  - name: Run Mutation Tests
    id: mutation
    uses: menoncello/mutation-test@v1
    
  - name: Check Mutation Score
    run: |
      SCORE=$(echo '${{ steps.mutation.outputs.mutation_metrics }}' | jq -r '.mutationScore')
      if (( $(echo "$SCORE < 80" | bc -l) )); then
        echo "Mutation score is below 80%: $SCORE%"
        exit 1
      fi
```

### Adicionar badge de pontuação de mutação ao README

1. Crie um workflow que gera um badge:

```yaml
steps:
  - uses: actions/checkout@v4
  
  - name: Run Mutation Tests
    id: mutation
    uses: menoncello/mutation-test@v1
    
  - name: Generate Badge
    uses: emibcn/badge-action@v1
    with:
      label: 'mutation score'
      status: ${{ fromJson(steps.mutation.outputs.mutation_metrics).mutationScore }}%
      color: ${{ fromJson(steps.mutation.outputs.mutation_metrics).mutationScore >= 80 && 'green' || fromJson(steps.mutation.outputs.mutation_metrics).mutationScore >= 60 && 'yellow' || 'red' }}
      path: ./mutation-score.svg
      
  - name: Upload Badge
    uses: actions/upload-artifact@v3
    with:
      name: mutation-score-badge
      path: ./mutation-score.svg
```

2. Adicione o badge ao seu README:

```markdown
![Mutation Score](https://github.com/username/repo/actions/workflows/mutation.yml/badge.svg)
```

## Solução de Problemas

### Testes de mutação muito lentos

Se os testes de mutação estiverem demorando muito:

1. Limite o escopo dos arquivos a serem testados:

```javascript
// stryker.conf.js
module.exports = {
  // ...
  mutate: [
    "src/core/**/*.js",  // Teste apenas o código principal
    "!src/**/*.test.js"
  ],
  // ...
};
```

2. Aumente o paralelismo:

```javascript
// stryker.conf.js
module.exports = {
  // ...
  concurrency: 6,  // Ajuste com base nos recursos disponíveis
  // ...
};
```

### Erros de timeout

Se você estiver enfrentando erros de timeout:

```javascript
// stryker.conf.js
module.exports = {
  // ...
  timeoutMS: 60000,  // Aumente o timeout para 60 segundos
  // ...
};
```

## Próximos Passos

- Consulte a [documentação técnica completa](TECHNICAL.md) para mais detalhes sobre o funcionamento interno da action.
- Veja o [guia de contribuição](../CONTRIBUTING.md) se quiser contribuir para o projeto.
- Explore a [documentação do Stryker](https://stryker-mutator.io/docs/stryker-js/introduction/) para aprender mais sobre testes de mutação.
