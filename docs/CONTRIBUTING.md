# Documentação do Projeto

## Estrutura do Projeto
* `src/`: Onde reside todo o código-fonte da aplicação.
* `src/app/`: Rotas, páginas e layout da aplicação utilizando Expo Router (ex.: `(tabs)`, `_layout.tsx`, `login.tsx`).
* `src/components/`: Componentes visuais e reutilizáveis de interface.
* `src/services/`: Lógica de comunicação com APIs externas e serviços.
* `src/context/`: Provedores de contexto React para gerenciamento de estado global (ex.: autenticação).
* `src/hooks/`: Hooks customizados React.
* `src/constants/`: Constantes e configurações globais (ex.: cores, estilos).
* `src/global.css`: Estilização global com Tailwind CSS / NativeWind.
* `app.json`: Arquivo de configuração do Expo e metadados do aplicativo nativo.
* `package.json`: Gerenciador de dependências, configurações e scripts do projeto.

## Guia da CLI
Para acelerar e padronizar o desenvolvimento no Expo / React Native, utilize os seguintes comandos integrados:

| Ação | Comando |
| :--- | :--- |
| Iniciar Servidor de Desenvolvimento | `npx expo start` |
| Iniciar no Android | `npx expo start --android` |
| Iniciar no iOS | `npx expo start --ios` |
| Iniciar na Web | `npx expo start --web` |
| Executar Linter | `npx expo lint` |
| Checagem de Tipos (TypeScript) | `npx tsc --noEmit` |
| Diagnosticar Dependências e Configurações | `npx expo doctor` |
| Corrigir Dependências Incompatíveis | `npx expo install --fix` |

## Primeiros Passos
1. Execute `npm install` para instalar as dependências do projeto.
2. Utilize `npx expo start` (ou `npm run start`) para iniciar o servidor de desenvolvimento Expo.
3. Leia o QR Code gerado usando o app **Expo Go** no seu dispositivo móvel ou pressione `a` / `i` / `w` no terminal para abrir no emulador Android, simulador iOS ou navegador Web.

## Instalar Dependências e Extensões
Sempre dê preferência ao comando `npx expo install` para garantir a compatibilidade de versões com o Expo SDK:

```bash
# Adicionar bibliotecas compatíveis com o Expo SDK
npx expo install <nome-do-pacote>

# Exemplo de bibliotecas comuns e ícones
npx expo install lucide-react-native react-native-svg
```

## Padrão de Commits

Os commits devem seguir o padrão com o prefixo da ação e a identificação da tarefa (ex.: `MPOSTR-XXXX`):

```text
feat:   feature/MPOSTR-0001_Commit_Inicial
fix:    fix/MPOSTR-0001_Commit_Inicial
```

> **Exemplos:**
> - `feat: feature/MPOSTR-0001_Criacao_Tela_Login`
> - `fix: fix/MPOSTR-0002_Ajuste_Validacao_Formulario`
