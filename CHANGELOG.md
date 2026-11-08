# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

---

## [1.0.0] - 2026-11-08

### Adicionado

#### Infraestrutura & Configuração Mobile
- Adaptação completa da aplicação web **Musicpostr** para **React Native + Expo SDK 58** com roteamento baseado em arquivos via **Expo Router** (`src/app/`).
- Configuração de publicação e identidade mobile no `app.json` (`com.musicpostr.mobile`, scheme `musicpostr`, splash screen escura `#09090b`, suporte a iOS, Android e Web).
- Sistema de temas **Dark / Light Mode** (`src/context/ThemeContext.tsx`) com persistência local e paleta roxa/violeta (`#8b5cf6` / `#7c3aed`).
- Camada de armazenamento multiplataforma (`src/services/storage.ts`) compatível com memória nativa e `localStorage` na Web, acompanhada de barramento de eventos (`AppEvents`) para sincronização reativa entre telas.
- Integração com as APIs públicas **MusicBrainz** (`src/services/musicBrainz.service.ts`) e **Cover Art Archive** (`src/services/coverArt.service.ts`) combinadas com catálogo local mockado de alta velocidade (23 álbuns populares, tracklists pré-carregadas, 18 artistas em destaque, top faixas e avaliações da comunidade).

#### Componentes Globais
- **Header Mobile (`src/components/MobileHeader.tsx`)**:
  - Barra superior responsiva ao `SafeAreaInsets` com logo, atalho para Favoritos, alternador de tema Dark/Light e menu dropdown de perfil.
  - Modal de **Busca Global Instantânea** com abas de filtro (*Todos*, *Álbuns*, *Artistas*, *Músicas*, *Usuários*), combinando resultados imediatos do catálogo local com busca assíncrona no MusicBrainz.
- **CoverImage (`src/components/CoverImage.tsx`)**:
  - Wrapper otimizado sobre `expo-image` com transição suave e fallback visual automático para capas ausentes ou indisponíveis.

#### Navegação Principal por Abas (`src/app/(tabs)/`)
- **Início (`src/app/(tabs)/index.tsx`)**:
  - Hero Banner em destaque com seletor de miniaturas interativo.
  - Seções horizontais e grades para *Álbuns Populares da Semana*, *Novos Lançamentos*, *Melhores Avaliados*, *Explorar por Gênero* e *Top Músicas*.
- **Reviews (`src/app/(tabs)/reviews.tsx`)**:
  - Explorador completo de álbuns para avaliação com busca com *debounce*, filtro por gênero musical, filtro por ano de lançamento e paginação.
- **Rankings (`src/app/(tabs)/rankings.tsx`)**:
  - Pódio visual para o **Top 3** álbuns e listagem classificada com alternância entre *Melhores Avaliados*, *Mais Populares* e *Lançamentos*, além de filtro por gênero.
- **Artistas (`src/app/(tabs)/artists.tsx`)**:
  - Diretório de artistas e bandas com busca integrada ao MusicBrainz, paginação e botão rápido para seguir/deixar de seguir (*Ídolo*).
- **Timeline / Feed (`src/app/(tabs)/feed.tsx`)**:
  - Feed social de atividades da comunidade exibindo avaliações recentes, notas, curtidas interativas e seção expansível de comentários em tempo real.
- **Perfil (`src/app/(tabs)/profile.tsx`)**:
  - Página de perfil do usuário com banner customizável, avatar, bio, localização, links de redes sociais, compartilhamento nativo (`Share`), 6 cartões de estatísticas interativas e vitrine de álbuns/artistas favoritos.

#### Telas de Detalhes, Avaliações e Gestão de Conta (`src/app/`)
- **Detalhes do Álbum & Avaliação (`src/app/album/[id].tsx`)**:
  - Sistema interativo de avaliação de **1 a 10 estrelas** com frases dinâmicas de reação e envio imediato de resenhas.
  - Botões para marcar álbum como *Ouvido*, adicionar aos *Favoritos*, links diretos para plataformas de streaming (*Spotify*, *Apple Music*, *Deezer*, *Tidal*) e compartilhamento.
  - **Visualizador de Capa HD** em modal com suporte à alternância entre *Capa Frontal* e *Capa Traseira (Verso)* via Cover Art Archive.
  - Exibição completa da *Tracklist* com duração das faixas e mural de avaliações da comunidade com curtidas e respostas.
- **Detalhes do Artista (`src/app/artist/[id].tsx`)**:
  - Página dedicada com banner, contador de obras, botão de seguir (*Ídolo*) e discografia dividida entre *Álbuns de Estúdio* e *Singles & EPs*.
- **Autenticação (`src/app/login.tsx`)**:
  - Modal de Login e Cadastro de conta com validação de campos, feedback visual e atualização imediata do perfil ativo.
- **Minhas Reviews (`src/app/my-reviews.tsx`)**:
  - Histórico completo de avaliações publicadas pelo usuário com opção de exclusão e navegação direta para o álbum avaliado.
- **Favoritos (`src/app/favorites.tsx`)**:
  - Galeria dedicada aos álbuns favoritados pelo usuário com opção de remoção rápida.
- **Ídolos (`src/app/idols.tsx`)**:
  - Grade de artistas seguidos pelo usuário com acesso rápido à discografia e opção de deixar de seguir.
- **Listas (`src/app/lists.tsx`)**:
  - Gerenciamento de listas temáticas de álbuns e modal para criação de novas listas personalizadas.
- **Amigos (`src/app/friends.tsx`) & Perfil Público (`src/app/user/[username].tsx`)**:
  - Lista de amigos da comunidade e visualização de perfil público de outros membros.
- **Top Álbuns (`src/app/top-albuns.tsx`)**:
  - Tela dedicada ao ranking completo de álbuns em alta na plataforma.
- **Configurações (`src/app/settings.tsx`)**:
  - Painel completo para edição de nome, `@username`, e-mail, localização, bio, URLs de avatar/banner, redes sociais, preferências de privacidade, notificações e tema visual.
