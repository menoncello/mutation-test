# Mutation Test Action

[![Continuous Integration](https://github.com/menoncello/mutation-test/actions/workflows/ci.yml/badge.svg)](https://github.com/menoncello/mutation-test/actions/workflows/ci.yml)

Uma GitHub Action que executa testes de mutação no seu código e garante que a pontuação de mutação atenda aos padrões de qualidade definidos.

## Documentação

- [Guia de Início Rápido](docs/QUICK-START.md)
- [Conceitos de Testes de Mutação](docs/MUTATION-TESTING-CONCEPTS.md)
- [Documentação Técnica](docs/TECHNICAL.md)
- [Guia de Contribuição](CONTRIBUTING.md)

## O que são Testes de Mutação?

Testes de mutação são uma técnica de teste de software que avalia a qualidade dos seus testes ao introduzir pequenas alterações (mutações) no código-fonte e verificar se os testes existentes detectam essas alterações. Isso ajuda a identificar partes do código que não estão sendo adequadamente testadas.

Alguns exemplos de mutações incluem:
- Substituir operadores aritméticos (`+` por `-`, `*` por `/`, etc.)
- Modificar operadores de comparação (`>` por `>=`, `==` por `!=`, etc.)
- Remover instruções
- Alterar valores booleanos (`true` por `false`)

## Como esta Action funciona

1. A action executa o Stryker Mutator no seu código
2. Analisa os resultados dos testes de mutação
3. Verifica se a pontuação de mutação atende ao limite configurado
4. Fornece métricas detalhadas como saída da action

## Uso

### Configuração Básica

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
      
      - name: Run Mutation Tests
        uses: menoncello/mutation-test@v1
        with:
          node-version: '20'
```

### Inputs

| Nome | Descrição | Obrigatório | Padrão |
|------|-----------|-------------|--------|
| `node-version` | Versão do Node.js a ser usada para executar os testes de mutação | Não | `20` |

### Outputs

| Nome | Descrição |
|------|-----------|
| `mutation_metrics` | Objeto JSON contendo métricas detalhadas de testes de mutação, incluindo pontuação, mutantes mortos/sobreviventes e cobertura de testes |

## Exemplos

### Verificar pontuação de mutação mínima

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

### Publicar resultados como comentário em PR

```yaml
steps:
  - uses: actions/checkout@v4
  
  - name: Run Mutation Tests
    id: mutation
    uses: menoncello/mutation-test@v1
    
  - name: Comment on PR
    uses: actions/github-script@v6
    if: github.event_name == 'pull_request'
    with:
      github-token: ${{ secrets.GITHUB_TOKEN }}
      script: |
        const metrics = JSON.parse('${{ steps.mutation.outputs.mutation_metrics }}');
        const comment = `## Mutation Test Results
        - Score: ${metrics.mutationScore}%
        - Killed: ${metrics.killed}
        - Survived: ${metrics.survived}
        - Total: ${metrics.total}`;
        
        github.rest.issues.createComment({
          issue_number: context.issue.number,
          owner: context.repo.owner,
          repo: context.repo.repo,
          body: comment
        })
```

## Desenvolvimento

### Pré-requisitos

- Node.js 20+
- npm

### Instalação

```bash
git clone https://github.com/menoncello/mutation-test.git
cd mutation-test
npm install
```

### Scripts disponíveis

- `npm run test` - Executa os testes
- `npm run lint` - Verifica o código com ESLint
- `npm run format:write` - Formata o código com Prettier
- `npm run package` - Compila o código TypeScript e cria o pacote
- `npm run all` - Executa todas as verificações (format, lint, test, package)

### Testar localmente

Você pode testar esta action localmente usando a ferramenta @github/local-action:

```bash
npm run local-action
```

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## Contribuição

Contribuições são bem-vindas! Por favor, sinta-se à vontade para enviar um Pull Request.

1. Faça um fork do projeto
2. Crie sua branch de feature (`git checkout -b feature/amazing-feature`)
3. Commit suas mudanças (`git commit -m 'Add some amazing feature'`)
4. Push para a branch (`git push origin feature/amazing-feature`)
5. Abra um Pull Request
