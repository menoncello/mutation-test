# Contribuindo para o Mutation Test Action

Obrigado pelo seu interesse em contribuir para o Mutation Test Action! Este documento fornece informações detalhadas sobre como o projeto está estruturado e como você pode contribuir efetivamente.

## Arquitetura do Projeto

O Mutation Test Action é uma GitHub Action baseada em Node.js que executa testes de mutação em projetos e fornece métricas detalhadas sobre a qualidade dos testes.

### Estrutura de Diretórios

```
mutation-test/
├── .github/             # Configurações do GitHub e workflows
├── __tests__/           # Testes unitários
├── dist/                # Código compilado (gerado)
├── src/                 # Código fonte
│   ├── runners/         # Implementações de runners
│   ├── services/        # Serviços de negócio
│   ├── index.ts         # Ponto de entrada
│   └── main.ts          # Lógica principal
├── action.yml           # Definição da GitHub Action
├── package.json         # Dependências e scripts
└── rollup.config.js     # Configuração de empacotamento
```

### Fluxo de Execução

1. O ponto de entrada da action é o arquivo `src/index.ts`, que importa e executa a função `run()` do arquivo `src/main.ts`.
2. A função `run()` configura a versão do Node.js e inicializa os serviços necessários.
3. O `MutationService` é responsável por executar o Stryker Mutator e analisar os resultados.
4. O `MutationRunner` coordena a execução dos testes de mutação e processa os resultados.
5. Os resultados são formatados e disponibilizados como saída da action.

## Desenvolvimento Local

### Configuração do Ambiente

1. Clone o repositório:
   ```bash
   git clone https://github.com/menoncello/mutation-test.git
   cd mutation-test
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Compile o código:
   ```bash
   npm run package
   ```

### Executando Testes

```bash
npm run test
```

Para executar os testes de mutação no próprio projeto:

```bash
npm run test:mutation
```

### Testando a Action Localmente

Você pode testar a action localmente usando a ferramenta `@github/local-action`:

```bash
npm run local-action
```

## Diretrizes de Contribuição

### Fluxo de Trabalho Git

1. Faça um fork do repositório
2. Clone seu fork: `git clone https://github.com/SEU-USUARIO/mutation-test.git`
3. Crie uma branch para sua feature: `git checkout -b feature/nome-da-feature`
4. Faça suas alterações
5. Execute os testes: `npm run test`
6. Verifique o estilo de código: `npm run lint`
7. Formate o código: `npm run format:write`
8. Commit suas alterações: `git commit -m "feat: adiciona nova funcionalidade"`
9. Push para o seu fork: `git push origin feature/nome-da-feature`
10. Abra um Pull Request

### Convenções de Commit

Este projeto segue as [Conventional Commits](https://www.conventionalcommits.org/):

- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Alterações na documentação
- `style`: Alterações que não afetam o significado do código (espaços em branco, formatação, etc.)
- `refactor`: Alteração de código que não corrige um bug nem adiciona uma funcionalidade
- `perf`: Alteração de código que melhora o desempenho
- `test`: Adição ou correção de testes
- `build`: Alterações que afetam o sistema de build ou dependências externas
- `ci`: Alterações nos arquivos de configuração de CI
- `chore`: Outras alterações que não modificam arquivos de src ou test

### Padrões de Código

- Use TypeScript para todo o código
- Mantenha 100% de cobertura de testes
- Siga o estilo de código definido pelo ESLint e Prettier
- Documente todas as funções e classes públicas

## Detalhes Técnicos

### Dependências Principais

- `@actions/core`: API principal do GitHub Actions
- `@actions/exec`: Execução de comandos shell
- `@stryker-mutator/typescript-checker`: Verificador de tipos TypeScript para o Stryker
- `fs-extra`: Utilitários de sistema de arquivos

### Empacotamento

O projeto usa Rollup para empacotar o código TypeScript em um único arquivo JavaScript que pode ser executado pelo GitHub Actions. A configuração está definida em `rollup.config.js`.

### Testes

Os testes são escritos usando Jest e estão localizados no diretório `__tests__/`. A configuração do Jest está definida no arquivo `jest.config.js`.

## Resolução de Problemas

### Erros Comuns

1. **ERR_MODULE_NOT_FOUND**: Certifique-se de que todas as dependências necessárias estejam listadas corretamente em `dependencies` no `package.json` e que os módulos externos estejam configurados corretamente em `rollup.config.js`.

2. **Falhas nos Testes**: Verifique se você está usando a versão correta do Node.js (20+) e se todas as dependências estão instaladas.

3. **Problemas de Empacotamento**: Se o empacotamento falhar, verifique a configuração do Rollup e certifique-se de que todos os imports estão corretos.

## Recursos Adicionais

- [Documentação do GitHub Actions](https://docs.github.com/en/actions)
- [Documentação do Stryker Mutator](https://stryker-mutator.io/docs/stryker-js/introduction/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
