# 📚 Documentação Técnica — Musicpostr Mobile

Bem-vindo à documentação técnica oficial do **Musicpostr Mobile**, aplicativo multiplataforma desenvolvido com **React Native**, **Expo SDK 58** e **Expo Router**.

Aqui você encontra a especificação completa da arquitetura, fluxo de dados, telas, componentes de interface, integrações com APIs externas, persistência e guia de execução.

---

## 🗺️ Mapa da Documentação

| Documento | Descrição |
| :--- | :--- |
| [🚀 Guia de Início Rápido](getting-started.md) | Pré-requisitos, instalação de dependências, execução em dispositivos físicos, emuladores e navegador Web. |
| [🏛️ Arquitetura do Sistema](architecture.md) | Estrutura de pastas, fluxo de dados unidirecional, Expo Router, Event Bus reativo e separação de camadas. |
| [📱 Telas e Rotas](routes-and-screens.md) | Detalhamento de todas as abas (`(tabs)`), rotas dinâmicas (`album/[id]`, `artist/[id]`, `user/[username]`, `list/[id]`) e telas stack. |
| [🧩 Componentes de Interface](components.md) | Catálogo de componentes reutilizáveis (`MobileHeader`, `CoverImage`, ícones SVG sociais e de streaming, elementos tipográficos). |
| [🌐 Serviços e APIs Externas](services-and-apis.md) | Integração com MusicBrainz, Cover Art Archive, Deezer API, pools de fallback e catálogo musical. |
| [💾 Persistência, Cache e Eventos](storage-and-events.md) | Abstração de armazenamento multiplataforma (`Storage`), chaves de cache, TTL e mensageria interna (`AppEvents`). |
| [🎨 Design System e Temas](styling-and-theming.md) | NativeWind (Tailwind CSS), paletas Dark e Light, tokens de cor, tipografia e tratamento de SafeArea. |
| [📦 Compilação e Deploy](build-and-deployment.md) | Configurações do EAS Build (`eas.json`), compilação nativa em nuvem (AAB/APK para Android, IPA para iOS) e publicação. |

---

## ⚡ Visão Geral Rápida do Projeto

- **Framework**: [React Native 0.88.1](https://reactnative.dev/)
- **Core UI**: [React 19.3.0](https://react.dev/)
- **Ecossistema**: [Expo SDK 58 (~58.0.25)](https://docs.expo.dev/)
- **Roteamento**: [Expo Router (~58.0.31)](https://docs.expo.dev/router/introduction/)
- **Estilização**: [NativeWind v4 (~4.2.7)](https://www.nativewind.dev/) + [Tailwind CSS 3.4.19](https://tailwindcss.com/)
- **Ícones**: [Lucide React Native](https://lucide.dev/) + SVGs nativos dedicados
- **Imagens**: [Expo Image (~58.0.18)](https://docs.expo.dev/versions/latest/sdk/image/)
- **Persistência**: Camada híbrida unificada (`localStorage` na Web + cache em memória e Event Bus)
