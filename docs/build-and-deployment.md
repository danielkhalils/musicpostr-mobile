# 📦 Compilação e Deploy (EAS Build) — Musicpostr Mobile

Este guia descreve os processos de empacotamento, assinatura de certificados e publicação do **Musicpostr Mobile** nas lojas oficiais (**Google Play Store** e **Apple App Store**) utilizando o **EAS (Expo Application Services)**.

---

## 🛠️ 1. Configuração do Projeto (`app.json` e `eas.json`)

O projeto está configurado com os seguintes identificadores nativos:

- **Nome da Aplicação**: `Musicpostr`
- **Slug**: `musicpostr-mobile`
- **Android Package**: `com.musicpostr.mobile`
- **iOS Bundle Identifier**: `com.musicpostr.mobile`
- **Esquema de Deep Linking**: `musicpostr`

### Perfis de Compilação (`eas.json`)

O arquivo `eas.json` define três fluxos principais de build:

```json
{
  "cli": {
    "version": ">= 12.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

- **`development`**: Gera um executável para testes nativos internos com o cliente de desenvolvimento Expo.
- **`preview`**: Gera um arquivo **APK** instalável diretamente em aparelhos Android sem necessidade da Google Play Store (ideal para testes com equipe ou QA).
- **`production`**: Gera um pacote **AAB (Android App Bundle)** para a Google Play Store e um arquivo **IPA** assinado para a Apple App Store / TestFlight.

---

## 🚀 2. Gerando Builds na Nuvem com o EAS

Não é obrigatório possuir uma máquina macOS ou Android Studio local para gerar os pacotes finais. Todo o processo de compilação e assinatura pode ser delegado aos servidores em nuvem do Expo:

### 1. Fazer Login no EAS
```bash
npx eas-cli@latest login
```

### 2. Configurar o Projeto (Executado uma única vez)
```bash
npx eas-cli@latest build:configure
```

### 3. Gerar APK de Teste Rápido (Android Preview)
```bash
npx eas-cli@latest build --profile preview --platform android
```
> Ao término do processo, a CLI fornecerá um link direto e um QR Code para download e instalação do APK no smartphone.

### 4. Gerar Build de Produção para Android (AAB)
```bash
npx eas-cli@latest build --profile production --platform android
```

### 5. Gerar Build de Produção para iOS (App Store)
```bash
npx eas-cli@latest build --profile production --platform ios
```

---

## 📲 3. Submissão Direta para as Lojas

Após a aprovação do build nos servidores do EAS, a submissão para as lojas pode ser feita diretamente pelo terminal:

```bash
# Submeter build recente para o Google Play Console
npx eas-cli@latest submit --platform android

# Submeter build recente para o App Store Connect / TestFlight
npx eas-cli@latest submit --platform ios

# Submeter para ambas as plataformas simultaneamente
npx eas-cli@latest submit --platform all
```

---

## 🔄 4. Atualizações Over-The-Air (EAS Update)

Para correções de bugs em JavaScript ou ajustes visuais que não alteram código nativo, é possível publicar atualizações instantâneas sem passar pelo ciclo de revisão das lojas:

```bash
npx eas-cli@latest update --branch production --message "Ajuste na tela de detalhes do álbum"
```
