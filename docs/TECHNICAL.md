# Documentação Técnica do Mutation Test Action

Este documento fornece detalhes técnicos sobre o funcionamento interno do Mutation Test Action, incluindo como os testes de mutação são executados e como os resultados são processados.

## Visão Geral do Processo

O Mutation Test Action segue este fluxo de trabalho:

1. **Inicialização**: Configura o ambiente e carrega as entradas da action
2. **Execução do Stryker**: Executa o Stryker Mutator no projeto alvo
3. **Análise de Resultados**: Processa o relatório de mutação gerado pelo Stryker
4. **Geração de Métricas**: Calcula métricas relevantes com base nos resultados
5. **Saída**: Fornece os resultados como saída da action

## Componentes Principais

### MutationService

O `MutationService` é responsável por interagir com o Stryker Mutator e processar os resultados dos testes de mutação.

Principais responsabilidades:
- Executar o Stryker Mutator
- Ler e analisar o relatório de mutação
- Calcular métricas de qualidade de teste

### MutationRunner

O `MutationRunner` coordena o processo geral de teste de mutação.

Principais responsabilidades:
- Inicializar o ambiente de teste
- Coordenar a execução dos testes de mutação
- Processar e formatar os resultados
- Definir as saídas da action

## Formato do Relatório de Mutação

O Stryker Mutator gera um relatório de mutação no formato JSON que contém informações detalhadas sobre cada mutante testado. O relatório inclui:

- Mutantes testados, incluindo:
  - Localização no código (arquivo, linha, coluna)
  - Operador de mutação aplicado
  - Status (morto, sobrevivente, ignorado, etc.)
  - Detalhes do teste que matou o mutante (se aplicável)
- Métricas gerais, como pontuação de mutação e cobertura de teste

### Exemplo de Relatório

```json
{
  "schemaVersion": "1.0",
  "thresholds": {
    "high": 80,
    "low": 60
  },
  "files": {
    "src/example.js": {
      "language": "javascript",
      "source": "function add(a, b) {\n  return a + b;\n}\n",
      "mutants": [
        {
          "id": "1",
          "mutatorName": "ArithmeticOperator",
          "replacement": "-",
          "location": {
            "start": { "line": 2, "column": 12 },
            "end": { "line": 2, "column": 13 }
          },
          "status": "Killed",
          "testsRan": ["Add should correctly add two numbers"]
        }
      ]
    }
  }
}
```

## Processamento de Resultados

O `MutationService` processa o relatório de mutação para extrair métricas relevantes:

1. **Contagem de Mutantes**: Conta o número total de mutantes, bem como quantos foram mortos, sobreviveram, ou foram ignorados.

2. **Pontuação de Mutação**: Calcula a pontuação de mutação como a porcentagem de mutantes mortos em relação ao total de mutantes testados.

3. **Análise por Arquivo**: Agrupa os resultados por arquivo para identificar áreas do código com baixa cobertura de mutação.

4. **Análise por Operador**: Agrupa os resultados por operador de mutação para identificar tipos específicos de mutações que não são detectadas pelos testes.

## Saída da Action

A action fornece as seguintes saídas:

- `mutation_metrics`: Um objeto JSON contendo métricas detalhadas de testes de mutação, incluindo:
  - `mutationScore`: Pontuação geral de mutação (porcentagem)
  - `killed`: Número de mutantes mortos
  - `survived`: Número de mutantes sobreviventes
  - `timeout`: Número de mutantes que causaram timeout
  - `ignored`: Número de mutantes ignorados
  - `total`: Número total de mutantes
  - `fileResults`: Resultados detalhados por arquivo

### Exemplo de Saída

```json
{
  "mutationScore": 85.7,
  "killed": 12,
  "survived": 2,
  "timeout": 0,
  "ignored": 0,
  "total": 14,
  "fileResults": {
    "src/example.js": {
      "mutationScore": 85.7,
      "killed": 12,
      "survived": 2,
      "total": 14
    }
  }
}
```

## Configuração do Stryker

O Stryker Mutator é configurado através do arquivo `stryker.conf.js` no projeto alvo. A action respeita essa configuração, mas também pode fornecer configurações adicionais através das entradas da action.

Exemplo de configuração do Stryker:

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
  mutate: ["src/**/*.ts", "!src/**/*.test.ts"],
  thresholds: {
    high: 80,
    low: 60,
    break: 50
  }
};
```

## Integração com o GitHub Actions

A action é integrada ao GitHub Actions através do arquivo `action.yml`, que define:

- Entradas da action, como a versão do Node.js
- Saídas da action, como as métricas de mutação
- Configuração do runtime (Node.js 20)
- Ponto de entrada (dist/index.js)

## Considerações de Desempenho

Os testes de mutação podem ser computacionalmente intensivos, especialmente para bases de código grandes. Para otimizar o desempenho:

1. **Escopo Limitado**: Limite o escopo dos testes de mutação a áreas específicas do código.
2. **Paralelização**: Configure o Stryker para executar testes em paralelo.
3. **Timeout**: Configure timeouts adequados para evitar que mutantes problemáticos bloqueiem a execução.
4. **Cache**: Utilize o cache do GitHub Actions para reduzir o tempo de instalação de dependências.

## Resolução de Problemas

### Diagnóstico de Falhas

Se a action falhar, verifique:

1. **Logs de Execução**: Examine os logs detalhados da action para identificar o ponto de falha.
2. **Configuração do Stryker**: Verifique se a configuração do Stryker é válida e compatível com o projeto.
3. **Dependências**: Certifique-se de que todas as dependências necessárias estão instaladas.
4. **Versão do Node.js**: Confirme que a versão do Node.js especificada é compatível com o projeto.

### Problemas Comuns

1. **Timeout durante os testes**: Aumente o timeout configurado no Stryker ou limite o escopo dos testes.
2. **Falhas de memória**: Reduza o número de processos paralelos ou use um runner com mais memória.
3. **Incompatibilidades de versão**: Certifique-se de que as versões do Stryker e suas dependências são compatíveis.

## Referências

- [Documentação do Stryker Mutator](https://stryker-mutator.io/docs/stryker-js/introduction/)
- [GitHub Actions - Criando uma JavaScript Action](https://docs.github.com/en/actions/creating-actions/creating-a-javascript-action)
- [Testes de Mutação - Conceitos e Práticas](https://medium.com/javascript-in-plain-english/mutation-testing-in-javascript-with-stryker-4f3c6039d7cb)
