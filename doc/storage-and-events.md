# 💾 Persistência, Cache e Eventos — Musicpostr Mobile

Este documento detalha o sistema de armazenamento de dados local (`Storage`), o ciclo de vida do cache e o barramento de eventos reativo (`AppEvents`) em `src/services/storage.ts`.

---

## 🗄️ 1. Abstração `Storage` Multiplataforma

Para garantir funcionamento uniforme entre navegadores Web e dispositivos móveis (Android e iOS) sem dependências nativas pesadas, o aplicativo implementa uma camada híbrida:

```typescript
export const Storage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};
```

### Comportamento por Plataforma

- **No Ambiente Web (`Platform.OS === 'web'`)**:
  - Utiliza o `localStorage` do navegador para persistência duradoura entre sessões.
  - Mantém uma cópia em memória (`memoryStore = new Map<string, string>()`) para leitura instantânea e síncrona.
- **Nos Dispositivos Móveis (iOS / Android)**:
  - Utiliza o mapa em memória ultrarrápido durante a execução da aplicação.
  - Não bloqueia a thread de renderização da UI.

---

## 🔑 2. Chaves de Armazenamento Utilizadas

O aplicativo centraliza seus identificadores no `musicBrainz.service.ts` e serviços auxiliares:

| Chave | Finalidade |
| :--- | :--- |
| `musicpostr_theme` | Guarda a preferência de tema do usuário (`dark` ou `light`). |
| `musicpostr_user_profile_v2` | Informações do perfil atual (nome, username, bio, avatar, banner). |
| `musicpostr_my_reviews_v3` | Histórico de avaliações e resenhas submetidas pelo usuário. |
| `musicpostr_favorites_v3` | Conjunto de IDs de álbuns favoritados pelo usuário. |
| `musicpostr_user_lists_v1` | Listas de álbuns criadas pelo usuário (incluindo "Quero Ouvir"). |
| `musicpostr_idols` | Array de identificadores de artistas seguidos como Ídolos. |
| `musicpostr_idols_data_v3` | Metadados cacheados dos artistas seguidos (foto, gênero, fãs). |
| `musicpostr_community_feed_v4` | Atividades públicas registradas na timeline social. |
| `musicpostr_artist_images_v1` | Dicionário serializado de fotos oficiais de artistas obtidas via Deezer. |
| `musicpostr_missing_covers_v2` | Lista de IDs cujas capas foram marcadas como inexistentes no CAA (cache negativo). |
| `musicpostr_coverart_v2_*` | Cache de URLs resolvidas do Cover Art Archive com TTL de 7 dias. |
| `musicpostr_mb_cache_v5_*` | Cache de respostas da API do MusicBrainz com TTL de 12 horas. |

---

## ⚡ 3. Barramento de Eventos Reativo (`AppEvents`)

O `AppEvents` implementa o padrão de projeto **Publish-Subscribe (Pub/Sub)**, permitindo que telas e componentes se comuniquem de forma totalmente desacoplada.

```typescript
export const AppEvents = {
  emit(event: string): void;
  on(event: string, listener: () => void): () => void;
};
```

### Exemplo Prático de Assinatura e Desinscrição

```tsx
import { useEffect } from 'react';
import { AppEvents } from '@/services/storage';

export function MinhaTela() {
  useEffect(() => {
    // Inscreve um ouvinte para o evento de atualização de álbuns
    const unsubscribe = AppEvents.on('albums_updated', () => {
      // Recarrega dados ou atualiza o estado local
      carregarDados();
    });

    // Cancela a inscrição ao desmontar o componente
    return unsubscribe;
  }, []);
}
```

### Eventos Principais Disparados

- `albums_updated`: Disparado sempre que uma nova avaliação é postada, um álbum é favoritado, adicionado/removido de listas ou quando um artista é seguido.
- `profile_updated`: Disparado ao editar informações pessoais, bio, foto ou capa nas configurações.
- `feed_updated`: Disparado quando uma nova atividade é registrada na timeline comunitária.
