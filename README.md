# 🎵 Musicpostr Mobile

**Musicpostr Mobile** é a versão oficial para dispositivos móveis (**iOS**, **Android** e **Web**) da plataforma social de descoberta, catalogação e avaliação de álbuns musicais **Musicpostr**.

Construído com **React Native 0.88**, **React 19**, **Expo SDK 58** e **Expo Router**, o aplicativo permite que amantes de música criem e personalizem seus perfis, descubram lançamentos, explorem discografias completas, criem listas temáticas e avaliem álbuns com notas de **1 a 10 estrelas**, resenhas aprofundadas e interações sociais com a comunidade.

---

## ✨ Principais Funcionalidades

- ⭐ **Sistema de Avaliação de Álbuns (1 a 10 Estrelas)**:
  - Dê notas de 1 a 10 com frases dinâmicas de reação personalizadas para cada pontuação.
  - Escreva resenhas completas, curta avaliações de outros membros e participe de comentários.
  - Marque álbuns como **Ouvidos** ou adicione-os aos seus **Favoritos**.
- 🖼️ **Visualizador de Capas em Alta Definição (Frente e Verso)**:
  - Integração com o *Cover Art Archive* para inspecionar a arte frontal e traseira dos álbuns em tela cheia com alternância dinâmica.
  - Fotos oficiais de artistas sincronizadas via *Deezer API* e fallbacks determinísticos via *Unsplash*.
- 🔍 **Busca Global Instantânea**:
  - Pesquise simultaneamente por **Álbuns**, **Artistas**, **Músicas** e **Usuários** da comunidade em tempo real.
- 🏆 **Rankings & Pódio Top 3**:
  - Acompanhe os álbuns *Melhores Avaliados*, *Mais Populares* e *Novos Lançamentos*, com filtros rápidos por gênero musical (*Rock*, *Pop*, *Hip-Hop*, *R&B*, *Indie*, *MPB*, *Eletrônica*, *Metal*, etc.).
- 🎤 **Diretório de Artistas & Discografias**:
  - Siga seus artistas favoritos (**Ídolos**) e navegue por suas discografias categorizadas em **Álbuns de Estúdio**, **EPs** e **Singles**.
- 💬 **Timeline Social da Comunidade**:
  - Feed interativo em tempo real com as últimas avaliações, novos favoritos, listas criadas e ídolos seguidos pelos usuários da plataforma.
- 👤 **Perfil Customizável, Listas e Estatísticas**:
  - Personalize avatar, imagem de capa (banner), bio e links para redes sociais.
  - Crie e compartilhe **Listas Temáticas** de álbuns (ex.: *Quero Ouvir*, *Melhores de Todos os Tempos*).
  - Compartilhe avaliações e perfis nativamente via menu do sistema ou Stories do Instagram.
- 🎧 **Links Diretos para Streaming**:
  - Acesso direto ao álbum no **Spotify**, **Apple Music**, **YouTube Music**, **Deezer**, **Tidal**, etc.
- 🌗 **Modo Escuro & Modo Claro (Dark / Light Theme)**:
  - Interface adaptável com tema escuro padrão (`#09090b`) e tema claro (`#ffffff`), mantendo a identidade visual violeta (`#8b5cf6`).

---

## 🛠️ Tecnologias Utilizadas

| Categoria | Tecnologia | Versão |
| :--- | :--- | :--- |
| **Framework Mobile** | [React Native](https://reactnative.dev/) | `0.88.1` |
| **Biblioteca de UI** | [React](https://react.dev/) | `19.3.0` |
| **Ecossistema & Ferramental** | [Expo SDK](https://docs.expo.dev/) | `~58.0.25` |
| **Roteamento & Navegação** | [Expo Router](https://docs.expo.dev/router/introduction/) | `~58.0.31` |
| **Linguagem** | [TypeScript](https://www.typescriptlang.org/) | `~6.0.3` |
| **Estilização** | [NativeWind](https://www.nativewind.dev/) + [Tailwind CSS](https://tailwindcss.com/) | `^4.2.7` / `^3.4.19` |
| **Ícones** | [Lucide React Native](https://lucide.dev/) + [React Native SVG](https://github.com/software-mansion/react-native-svg) | `^1.59.0` / `15.16.0` |
| **Renderização de Imagens** | [Expo Image](https://docs.expo.dev/versions/latest/sdk/image/) | `~58.0.18` |
| **APIs Externas** | [Cover Art Archive](https://coverartarchive.org/) + [Deezer API](https://developers.deezer.com/) + [MusicBrainz](https://musicbrainz.org/) | REST / JSON |
| **Build & Deploy na Nuvem** | [EAS CLI (Expo Application Services)](https://docs.expo.dev/eas/) | `>= 12.0.0` |

---

## 📚 Documentação Técnica Completa (`doc/`)

Uma suíte completa de documentação detalhada está disponível na pasta [`doc/`](doc/README.md):

- 🏛️ [Arquitetura do Sistema](doc/architecture.md): Estrutura de pastas, fluxo de dados, separação de camadas e reatividade.
- 🚀 [Guia de Início Rápido](doc/getting-started.md): Pré-requisitos detalhados, instalação e solução de problemas.
- 📱 [Telas e Rotas](doc/routes-and-screens.md): Especificação de todas as 6 abas principais, rotas dinâmicas e modais.
- 🧩 [Catálogo de Componentes](doc/components.md): Detalhamento do `CoverImage`, `MobileHeader`, ícones e elementos reutilizáveis.
- 🌐 [Serviços e APIs Externas](doc/services-and-apis.md): Integração com Cover Art Archive, Deezer, MusicBrainz e fallbacks.
- 💾 [Persistência, Cache e Eventos](doc/storage-and-events.md): Camada de storage híbrida, chaves de cache e o barramento `AppEvents`.
- 🎨 [Design System e Temas](doc/styling-and-theming.md): Tokens das paletas Dark e Light, NativeWind e SafeArea.
- 📦 [Compilação e Deploy (EAS)](doc/build-and-deployment.md): Geração de APK/AAB para Android e IPA para iOS.

---

## 📂 Estrutura do Projeto

```text
musicpostr-mobile/
├── assets/                         # Imagens estáticas, logotipos e splash screen
├── doc/                            # Documentação técnica detalhada da aplicação
├── docs/                           # Documentação auxiliar e guia de contribuição
├── scripts/                        # Scripts de manutenção (reset-project, etc.)
├── src/
│   ├── app/                        # Telas e rotas (Expo Router)
│   │   ├── (tabs)/                 # Abas inferiores com barra flutuante
│   │   │   ├── _layout.tsx         # Configuração da FloatingTabsBar
│   │   │   ├── index.tsx           # Aba Início (Hero, Populares, Lançamentos, Top Músicas)
│   │   │   ├── reviews.tsx         # Aba Comunidades (Catálogo e filtros de gênero)
│   │   │   ├── rankings.tsx        # Aba Rankings (Pódio Top 3 e tabela geral)
│   │   │   ├── artists.tsx         # Aba Buscar (Busca de artistas e botão de seguir Ídolo)
│   │   │   ├── profile.tsx         # Aba Perfil do usuário autenticado
│   │   │   └── feed.tsx            # Aba Timeline social da comunidade
│   │   ├── album/
│   │   │   └── [id].tsx            # Detalhes do Álbum (Capa frente/verso, nota 1-10, tracklist)
│   │   ├── artist/
│   │   │   └── [id].tsx            # Detalhes do Artista (Foto Deezer, discografia completa)
│   │   ├── list/
│   │   │   └── [id].tsx            # Detalhes de uma lista de álbuns específica
│   │   ├── user/
│   │   │   └── [username].tsx      # Perfil público de outro membro da comunidade
│   │   ├── _layout.tsx             # Stack raiz + Provedores de Tema e Header
│   │   ├── favorites.tsx           # Galeria de álbuns favoritados
│   │   ├── friends.tsx             # Lista de amigos da comunidade
│   │   ├── idols.tsx               # Artistas seguidos pelo usuário
│   │   ├── lists.tsx               # Gerenciador de listas temáticas
│   │   ├── login.tsx               # Modal de login e cadastro
│   │   ├── my-reviews.tsx          # Histórico de reviews do usuário logado
│   │   ├── settings.tsx            # Configurações de perfil, conta e alternância de tema
│   │   └── top-albuns.tsx          # Ranking estendido dos melhores álbuns
│   ├── components/                 # Componentes reutilizáveis
│   │   ├── ui/                     # Componentes atômicos de interface (Collapsible, etc.)
│   │   ├── CoverImage.tsx          # Capa otimizada com resolução dinâmica e fallback inteligente
│   │   ├── MobileHeader.tsx        # Cabeçalho global animado com controle de visibilidade
│   │   ├── SocialIcon.tsx          # Ícones vetoriais de redes sociais (Instagram, X, Bluesky, etc.)
│   │   └── StreamingIcon.tsx       # Ícones de streaming (Spotify, Apple Music, Deezer, etc.)
│   ├── constants/                  # Cores, tipografia, espaçamentos e limites de layout
│   ├── context/                    # Contextos globais (ThemeContext, HeaderVisibilityContext)
│   ├── hooks/                      # Hooks customizados React (useTheme, useColorScheme)
│   ├── services/                   # Camada de serviços, persistência e APIs
│   │   ├── artistImage.service.ts  # Resolução de fotos oficiais via Deezer API
│   │   ├── coverArt.service.ts     # Cliente do Cover Art Archive (HD frente/verso) + Cache
│   │   ├── musicBrainz.service.ts  # Catálogo musical, sistema de reviews, feed e listas
│   │   └── storage.ts              # Armazenamento híbrido e barramento reativo de eventos
│   └── utils/                      # Funções utilitárias (navegação segura, formatadores)
├── app.json                        # Configuração do Expo SDK, pacote Android e iOS
├── eas.json                        # Perfis de build do Expo Application Services (APK, AAB, IPA)
├── eslint.config.js                # Configuração do linter ESLint (Expo Flat Config)
├── package.json                    # Dependências, metadados e scripts
├── tailwind.config.js              # Configuração do Tailwind CSS / NativeWind
└── tsconfig.json                   # Configurações estritas do compilador TypeScript
```

---

## 🚀 Como Executar o Projeto Localmente

### 1. Pré-requisitos

- **Node.js**: Versão `>= 18.0.0` (recomendado Node 20 LTS ou 22 LTS).
- **Gerenciador de pacotes**: `npm`, `yarn`, `pnpm` ou `bun`.
- **Aplicativo Expo Go**: Instalado no celular ([Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent) para Android ou [App Store](https://apps.apple.com/app/expo-go/id982107779) para iOS) ou emuladores locais configurados (**Android Studio** / **Xcode**).

### 2. Instalação das Dependências

Clone o repositório e execute na raiz do projeto:

```bash
npm install
```

> [!TIP]
> Se você precisar instalar novos pacotes nativos ou utilitários, use sempre `npx expo install <pacote>` para assegurar compatibilidade estrita com a versão do Expo SDK 58.

### 3. Iniciar o Servidor de Desenvolvimento

Execute o comando:

```bash
npx expo start
```

Isso iniciará o Metro Bundler e apresentará o **QR Code** no terminal:

- 📱 **No celular físico (Android/iOS)**: Abra o app **Expo Go** e escaneie o QR Code (no iOS, use a câmera nativa). Certifique-se de que o aparelho esteja conectado à **mesma rede Wi-Fi** do computador.
- 🤖 **No Emulador Android**: Pressione `a` no terminal ou execute `npm run android`.
- 🍎 **No Simulador iOS (macOS)**: Pressione `i` no terminal ou execute `npm run ios`.
- 🌐 **No Navegador Web**: Pressione `w` no terminal ou execute `npm run web`.

---

## 🧪 Verificação de Qualidade e Tipagem

Para garantir que a base de código permaneça íntegra e sem erros de tipagem:

```bash
# Executa a verificação estática do ESLint
npm run lint

# Executa a checagem de tipos estáticos do TypeScript
npx tsc --noEmit

# Diagnostica a integridade das dependências com o Expo SDK
npx expo-doctor

# Corrige versões incompatíveis de dependências se necessário
npx expo install --fix
```

---

## 📦 Compilação e Publicação (EAS Build)

O projeto está configurado para empacotamento em nuvem com o identificador nativo `com.musicpostr.mobile`:

```bash
# 1. Configurar o projeto com sua conta Expo (apenas na primeira vez)
npx eas-cli@latest build:configure

# 2. Gerar APK direto para testes no Android (perfil preview)
npx eas-cli@latest build --profile preview --platform android

# 3. Gerar pacote de produção para Google Play (AAB)
npx eas-cli@latest build --profile production --platform android

# 4. Gerar pacote de produção para App Store (IPA)
npx eas-cli@latest build --profile production --platform ios

# 5. Enviar os builds gerados diretamente para as lojas
npx eas-cli@latest submit --platform all
```

---

## 🤝 Padrão de Commits

Para manter o histórico do repositório organizado, utilize o padrão semântico com a identificação da tarefa (ex.: `MPOSTR-XXXX`):

```text
feat:   feature/MPOSTR-0001_Titulo_Da_Funcionalidade
fix:    fix/MPOSTR-0002_Correcao_Do_Bug
docs:   docs/MPOSTR-0003_Atualizacao_Documentacao
```

---

## 📄 Licença

Este projeto é de uso privado e faz parte do ecossistema oficial **Musicpostr**. Todos os direitos reservados.
