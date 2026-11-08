# 🎵 Musicpostr Mobile

**Musicpostr Mobile** é a versão oficial para dispositivos móveis (**iOS**, **Android** e **Web**) da plataforma social de descoberta, catalogação e avaliação de álbuns musicais **Musicpostr**.

Construído com **React Native**, **Expo SDK 58** e **Expo Router**, o aplicativo permite que amantes de música cadastrem suas contas, descubram lançamentos, explorem discografias completas de artistas, criem listas temáticas e avaliem álbuns com notas de **1 a 10 estrelas** e resenhas compartilhadas com a comunidade.

---

## ✨ Principais Funcionalidades

- ⭐ **Sistema de Avaliação de Álbuns (1 a 10 Estrelas)**:
  - Dê notas de 1 a 10 com frases dinâmicas de reação para cada pontuação.
  - Escreva resenhas detalhadas, curta avaliações de outros membros e responda em comentários.
  - Marque álbuns como **Ouvidos** ou adicione-os aos seus **Favoritos**.
- 🖼️ **Visualizador de Capas em Alta Definição (Frente e Verso)**:
  - Integração com o *Cover Art Archive* para inspecionar a arte frontal e traseira dos álbuns em tela cheia.
- 🔍 **Busca Global Instantânea**:
  - Pesquise simultaneamente por **Álbuns**, **Artistas**, **Músicas** e **Usuários** da comunidade em qualquer tela do app.
- 🏆 **Rankings & Pódio Top 3**:
  - Acompanhe os álbuns *Melhores Avaliados*, *Mais Populares* e *Novos Lançamentos*, com filtros rápidos por gênero musical (*Rock*, *Pop*, *Hip-Hop*, *R&B*, *Indie*, *MPB*, *Eletrônica*, etc.).
- 🎤 **Diretório de Artistas & Discografias**:
  - Siga seus artistas favoritos (**Ídolos**) e navegue por seus álbuns de estúdio, EPs e singles oficiais.
- 💬 **Timeline da Comunidade**:
  - Feed social interativo com as últimas reviews publicadas pelos usuários que você acompanha, com suporte a curtidas e fios de comentários.
- 👤 **Perfil Customizável, Listas e Estatísticas**:
  - Personalize avatar, capa (banner), bio, localização e links sociais.
  - Crie **Listas Personalizadas** de álbuns (ex.: *Melhores do Ano*, *Clássicos Absolutos*).
  - Compartilhe seu perfil nativamente via menu de compartilhamento do sistema operacional.
- 🌗 **Modo Escuro & Modo Claro (Dark / Light Theme)**:
  - Interface adaptável com tema escuro padrão (`#09090b`) e tema claro (`#ffffff`), mantendo identidade visual roxa/violeta (`#8b5cf6`).

---

## 🛠️ Tecnologias Utilizadas

| Categoria | Tecnologia |
| :--- | :--- |
| **Framework Mobile** | [React Native 0.88](https://reactnative.dev/) + [React 19](https://react.dev/) |
| **Ecossistema & Build** | [Expo SDK 58](https://docs.expo.dev/) |
| **Roteamento & Navegação** | [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing) |
| **Linguagem** | [TypeScript](https://www.typescriptlang.org/) |
| **Ícones** | [Lucide React Native](https://lucide.dev/) |
| **Renderização de Imagens** | [Expo Image](https://docs.expo.dev/versions/latest/sdk/image/) |
| **APIs de Música & Capas** | [MusicBrainz API](https://musicbrainz.org/doc/MusicBrainz_API) + [Cover Art Archive](https://coverartarchive.org/) |

---

## 📂 Estrutura do Projeto

```text
musicpostr-mobile/
├── src/
│   ├── app/                        # Rotas e telas (Expo Router)
│   │   ├── (tabs)/                 # Navegação principal em abas inferiores
│   │   │   ├── _layout.tsx         # Configuração das 6 abas principais
│   │   │   ├── index.tsx           # Aba Início (Hero, Populares, Lançamentos, Top Músicas)
│   │   │   ├── reviews.tsx         # Aba Reviews (Catálogo, busca e filtros por gênero/ano)
│   │   │   ├── rankings.tsx        # Aba Rankings (Pódio Top 3 e tabela geral)
│   │   │   ├── artists.tsx         # Aba Artistas (Busca e botão de seguir Ídolo)
│   │   │   ├── feed.tsx            # Aba Timeline (Feed social da comunidade)
│   │   │   └── profile.tsx         # Aba Perfil do usuário logado
│   │   ├── album/
│   │   │   └── [id].tsx            # Detalhes do Álbum, avaliação 1-10, tracklist e capa HD
│   │   ├── artist/
│   │   │   └── [id].tsx            # Detalhes do Artista e discografia completa
│   │   ├── user/
│   │   │   └── [username].tsx      # Perfil público de outros usuários da comunidade
│   │   ├── _layout.tsx             # Stack Navigator raiz + ThemeProvider
│   │   ├── favorites.tsx           # Tela de Álbuns Favoritos
│   │   ├── friends.tsx             # Tela de Amigos da comunidade
│   │   ├── idols.tsx               # Tela de Ídolos (Artistas seguidos)
│   │   ├── lists.tsx               # Tela de Listas personalizadas de álbuns
│   │   ├── login.tsx               # Modal de Login e Cadastro
│   │   ├── my-reviews.tsx          # Histórico de Reviews do usuário
│   │   ├── settings.tsx            # Configurações de conta, perfil, privacidade e tema
│   │   └── top-albuns.tsx          # Ranking completo de Top Álbuns
│   ├── components/
│   │   ├── CoverImage.tsx          # Componente de capa com fallback inteligente
│   │   └── MobileHeader.tsx        # Header global + Modal de Busca Global + Menu de Perfil
│   ├── context/
│   │   └── ThemeContext.tsx        # Contexto de Tema (Dark/Light) e paleta de cores
│   └── services/
│       ├── coverArt.service.ts     # Cliente e cache do Cover Art Archive (Frente/Verso HD)
│       ├── musicBrainz.service.ts  # Catálogo mockado + integração com a API MusicBrainz
│       └── storage.ts              # Persistência local multiplataforma + Event Bus (AppEvents)
├── assets/                         # Ícones, imagens e splash screen
├── app.json                        # Configurações do Expo, iOS bundleIdentifier e Android package
├── CHANGELOG.md                    # Histórico de versões e mudanças do projeto
├── eslint.config.js                # Configuração do ESLint
├── package.json                    # Dependências e scripts
└── tsconfig.json                   # Configuração do TypeScript
```

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos

- **Node.js** (versão 18 ou superior recomendada)
- **npm**, **yarn** ou **bun**
- Aplicativo **Expo Go** instalado no seu celular (iOS ou Android) ou emulador configurado (**Android Studio** / **Xcode**)

### Passo a passo

1. **Instale as dependências do projeto:**

   ```bash
   npm install
   ```

2. **Inicie o servidor de desenvolvimento do Expo:**

   ```bash
   npx expo start
   ```

3. **Abra o aplicativo:**
   - 📱 **No celular físico**: Escaneie o QR Code exibido no terminal utilizando o aplicativo **Expo Go** (Android) ou a câmera do sistema (iOS).
   - 🤖 **No Emulador Android**: Pressione a tecla `a` no terminal (ou execute `npm run android`).
   - 🍎 **No Simulador iOS (macOS)**: Pressione a tecla `i` no terminal (ou execute `npm run ios`).
   - 🌐 **No Navegador Web**: Pressione a tecla `w` no terminal (ou execute `npm run web`).

---

## 🧪 Qualidade de Código (Lint & Typecheck)

Para verificar a tipagem estática do TypeScript e as regras de lint do Expo:

```bash
# Verificar regras do ESLint
npx expo lint

# Verificar tipagem TypeScript
npx tsc --noEmit

# Diagnosticar compatibilidade de pacotes do Expo SDK
npx expo-doctor
```

---

## 📦 Build e Publicação (Google Play & App Store)

O projeto já está pré-configurado em `app.json` com o identificador `com.musicpostr.mobile` para geração de builds nativos na nuvem utilizando o **EAS Build (Expo Application Services)**:

```bash
# Instalar/executar o EAS CLI e configurar o projeto
npx eas-cli@latest build:configure

# Gerar build para Android (Google Play - AAB / APK)
npx eas-cli@latest build --platform android

# Gerar build para iOS (App Store - IPA)
npx eas-cli@latest build --platform ios

# Enviar para as lojas oficiais
npx eas-cli@latest submit --platform all
```

---

## 📄 Licença

Este projeto é de uso privado e faz parte do ecossistema **Musicpostr**. Todos os direitos reservados.
