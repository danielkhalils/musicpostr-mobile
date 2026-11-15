# 🧩 Catálogo de Componentes — Musicpostr Mobile

Esta seção documenta os componentes reutilizáveis presentes em `src/components/`, suas propriedades, comportamentos e padrões de uso.

---

## 🖼️ 1. `CoverImage` (`src/components/CoverImage.tsx`)

Componente responsável pela renderização otimizada de capas de álbuns e fotos de artistas, com tratamento inteligente de cache e fallbacks progressivos.

### Propriedades (`CoverImageProps`)

| Propriedade | Tipo | Padrão | Descrição |
| :--- | :--- | :--- | :--- |
| `uri` | `string \| null` | `undefined` | URL primária da capa ou imagem. |
| `style` | `StyleProp<ImageStyle>` | `undefined` | Estilo da imagem interna. |
| `containerStyle` | `StyleProp<ViewStyle>` | `undefined` | Estilo do contêiner da imagem. |
| `fallbackType` | `'album' \| 'artist'` | `'album'` | Define o pool de fallback caso a imagem falhe. |
| `contentFit` | `'cover' \| 'contain'` | `'cover'` | Modo de preenchimento (`expo-image`). |
| `quality` | `'low' \| 'medium' \| 'high'` | `'low'` | Seleciona o sufixo de dimensão (250px ou 500px). |
| `artistName` | `string \| null` | `undefined` | Quando informado, resolve automaticamente a foto do artista via Deezer API com correspondência exata de nome. |

### Lógica de Fallback em Cascata

1. Se `artistName` for passado:
   - Consulta o cache local persistido de fotos de artistas.
   - Dispara requisição assíncrona para a API do Deezer.
   - Caso o artista não possua foto ou ocorra erro, exibe o ícone de estrela oficial do Musicpostr (`assets/icon_transparent_256x256.png`), nunca exibindo foto de outro artista.
2. Para álbuns:
   - Otimiza a URL para o Cover Art Archive.
   - Se a imagem principal falhar (`onError`), troca para o pool determinístico de imagens de alta resolução do Unsplash baseado no hash do título/ID.
   - Se ainda assim falhar, renderiza o ícone de disco com fundo adaptado ao tema atual.

---

## 🏷️ 2. `MobileHeader` (`src/components/MobileHeader.tsx`)

Barra de cabeçalho global localizada no topo da aplicação.

### Características

- **Identidade da Marca**: Exibe a logo oficial do Musicpostr e o título estilizado com tipografia de alta legibilidade.
- **Navegação Rápida**: Ao tocar na marca, redireciona o usuário para a tela inicial `(tabs)/index`.
- **Animação Conectada ao Scroll**: Consome o `HeaderVisibilityContext` para animar sua altura e opacidade (ocultando-se suavemente ao rolar telas longas e reaparecendo quando necessário).
- **Tratamento de Notch / Dynamic Island**: Utiliza `useSafeAreaInsets` do `react-native-safe-area-context` para garantir o espaçamento correto em qualquer aparelho iOS ou Android.

---

## 🎵 3. `StreamingIcon` (`src/components/StreamingIcon.tsx`)

Renderiza ícones vetoriais nativos em SVG dos principais serviços de streaming de música do mercado.

### Plataformas Suportadas

- `spotify` (Fundo verde oficial `#1DB954` com glifo branco)
- `apple` / `apple music` (Fundo vermelho `#FA2D48` com nota musical)
- `youtube` / `youtube music` (Fundo vermelho `#FF0000` com player)
- `tidal` (Glifo em forma de diamante)
- `deezer` (Cores e barras do equalizador do Deezer)
- `amazon music`
- `soundcloud`
- `bandcamp`

---

## 🌐 4. `SocialIcon` (`src/components/SocialIcon.tsx`)

Renderiza ícones vetoriais em SVG com desenho oficial para as principais redes sociais e perfis comunitários.

### Redes Suportadas

- `instagram`
- `twitter` / `x`
- `threads`
- `discord`
- `bluesky`
- `tiktok`
- `youtube`
- `github`
- `spotify`
- `lastfm`
- `website` (ícone de globo genérico)

---

## 🧱 5. Componentes Tipográficos e Estruturais

- **`ThemedText` (`src/components/themed-text.tsx`)**: Texto adaptado automaticamente à cor do tema ativo (`dark` / `light`).
- **`ThemedView` (`src/components/themed-view.tsx`)**: Contêiner com cor de fundo padrão alinhada ao tema.
- **`Collapsible` (`src/components/ui/collapsible.tsx`)**: Seção sanfona expansível com animação de seta para agrupamento de conteúdos secundários.
- **`HintRow` (`src/components/hint-row.tsx`)**: Faixa de dica e informações contextuais com ícone de ajuda.
