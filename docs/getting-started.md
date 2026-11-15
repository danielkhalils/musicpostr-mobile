# 🚀 Guia de Início Rápido — Musicpostr Mobile

Este guia contém todos os passos necessários para configurar o ambiente de desenvolvimento, instalar as dependências e executar o aplicativo **Musicpostr Mobile**.

---

## 📋 Pré-requisitos de Sistema

Antes de começar, certifique-se de ter instalado em sua máquina:

1. **Node.js**: Versão `>= 18.0.0` (recomendado Node 20 LTS ou 22 LTS).
   ```bash
   node --version
   ```
2. **Gerenciador de Pacotes**: `npm`, `yarn`, `pnpm` ou `bun`.
3. **Expo Go (Dispositivo Móvel)**:
   - Para **Android**: baixe na [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent).
   - Para **iOS**: baixe na [Apple App Store](https://apps.apple.com/app/expo-go/id982107779).
4. **Emuladores Opcionais**:
   - **Android**: Android Studio com Android SDK e um AVD (Android Virtual Device) configurado.
   - **iOS (macOS)**: Xcode com simuladores iOS instalados.

---

## 📥 Instalação do Projeto

1. Clone o repositório ou acesse a pasta raiz do projeto:
   ```bash
   cd musicpostr-mobile
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

> [!IMPORTANT]
> **Adicionando novas dependências**: Sempre utilize `npx expo install <pacote>` em vez de `npm install <pacote>` bare. Isso garante que o pacote instalado seja 100% compatível com a versão do Expo SDK em uso (SDK 58).

---

## 🏃 Executando a Aplicação

Inicie o servidor de desenvolvimento do Metro Bundler:

```bash
npx expo start
```

Após iniciar, o terminal exibirá um **QR Code interativo** e um menu de atalhos rápidos.

### Opções de Execução:

| Plataforma | Como Abrir |
| :--- | :--- |
| 📱 **Celular Físico (Expo Go)** | Abra o app Expo Go no Android e escaneie o QR Code; no iOS, aponte a câmera nativa para o QR Code. Certifique-se de que o celular e o computador estejam na **mesma rede Wi-Fi**. |
| 🤖 **Emulador Android** | Pressione `a` no terminal onde o Expo está rodando ou execute: `npm run android` |
| 🍎 **Simulador iOS (macOS)** | Pressione `i` no terminal ou execute: `npm run ios` |
| 🌐 **Navegador Web** | Pressione `w` no terminal ou execute: `npm run web` |

### Limpando o Cache do Metro Bundler

Se ocorrer algum comportamento inesperado de compilação ou arquivos estáticos:

```bash
npx expo start -c
```

---

## 🧪 Scripts Disponíveis

Os comandos abaixo estão configurados no `package.json`:

| Comando | Descrição |
| :--- | :--- |
| `npm run start` | Inicia o servidor de desenvolvimento do Expo (`expo start`). |
| `npm run android` | Inicia o aplicativo diretamente no emulador ou dispositivo Android conectado (`expo start --android`). |
| `npm run ios` | Inicia o aplicativo no simulador iOS (`expo start --ios`). |
| `npm run web` | Inicia a versão Web do app no navegador padrão (`expo start --web`). |
| `npm run lint` | Executa a verificação estática do linter com regras do Expo (`expo lint`). |
| `npx tsc --noEmit` | Valida todos os tipos estáticos com o TypeScript sem gerar arquivos compilados. |
| `npx expo-doctor` | Inspeciona dependências e configurações para detectar versões conflitantes com o Expo SDK. |
| `npx expo install --fix` | Corrige automaticamente versões de dependências incompatíveis com o SDK 58. |

---

## ⚠️ Resolução de Problemas Frequentes

### 1. "Unable to connect to Metro" no dispositivo móvel
- Verifique se o smartphone e o computador estão na mesma rede Wi-Fi.
- Se a rede bloquear tráfego interno (roteadores corporativos), execute com o túnel do Expo:
  ```bash
  npx expo start --tunnel
  ```

### 2. Erro de versão do React Native / Expo
- Execute o diagnóstico oficial:
  ```bash
  npx expo-doctor
  npx expo install --fix
  ```

### 3. Falha de estilo do NativeWind
- Limpe o cache de compilação com `npx expo start -c`.
