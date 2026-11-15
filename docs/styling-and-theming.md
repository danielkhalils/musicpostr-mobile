# 🎨 Design System e Temas — Musicpostr Mobile

Este documento descreve as decisões visuais, a configuração do **NativeWind / Tailwind CSS** e o sistema de alternância dinâmica entre **Modo Escuro (Dark Mode)** e **Modo Claro (Light Mode)**.

---

## 🌗 1. Sistema de Temas (`ThemeContext`)

O aplicativo disponibiliza suporte completo a tema escuro e claro através do `AppThemeProvider` em `src/context/ThemeContext.tsx`.

### Paletas de Cores Oficiais

| Token | Modo Escuro (Padrão) | Modo Claro | Uso Principal |
| :--- | :--- | :--- | :--- |
| `background` | `#09090b` (Zinc 950) | `#ffffff` | Fundo principal da aplicação e telas. |
| `foreground` | `#fafafa` (Zinc 50) | `#09090b` | Títulos e textos de primeiro plano. |
| `card` | `#18181b` (Zinc 900) | `#ffffff` | Superfícies elevadas, cards e listas. |
| `cardForeground` | `#fafafa` | `#09090b` | Textos dentro de cartões e modais. |
| `primary` | `#8b5cf6` (Violet 500) | `#7c3aed` (Violet 600) | Cor de destaque, botões principais e estrelas ativas. |
| `primaryForeground` | `#ffffff` | `#ffffff` | Texto em botões primários. |
| `secondary` | `#27272a` (Zinc 800) | `#f4f4f5` (Zinc 100) | Elementos secundários, badges e pills. |
| `muted` | `#27272a` | `#f4f4f5` | Fundos suaves e separadores. |
| `mutedForeground` | `#a1a1aa` (Zinc 400) | `#71717a` (Zinc 500) | Textos secundários, legendas e rótulos auxiliares. |
| `border` | `#27272a` | `#e4e4e7` (Zinc 200) | Contornos, divisores e bordas de inputs. |
| `destructive` | `#ef4444` (Red 500) | `#ef4444` | Alertas de erro, remoções e ações destrutivas. |
| `amber` | `#f59e0b` (Amber 500) | `#f59e0b` | Avaliações, estrelas e medalhas de ouro. |
| `emerald` | `#10b981` (Emerald 500) | `#10b981` | Indicadores de sucesso e tags positivas. |

---

## 🛠️ 2. Como Utilizar o Tema nos Componentes

O hook `useAppTheme()` expõe as propriedades do tema atual:

```tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';

export function CardExemplo() {
  const { colors, isDark, toggleTheme } = useAppTheme();

  return (
    <View style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }}>
      <Text style={{ color: colors.foreground }}>Título do Card</Text>
      <Text style={{ color: colors.mutedForeground }}>Subtítulo ou descrição</Text>
    </View>
  );
}
```

---

## 💨 3. NativeWind / Tailwind CSS

O projeto está configurado com **NativeWind v4** e **Tailwind CSS 3.4.19**.

- **Configuração (`tailwind.config.js`)**:
  ```javascript
  module.exports = {
    content: ["./src/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
      extend: {},
    },
    plugins: [],
  };
  ```
- **Babel & Metro**:
  - `babel.config.js` integra o preset `nativewind/babel`.
  - `metro.config.js` utiliza `withNativeWind` apontando para `src/global.css`.

---

## 📱 4. Área Segura e Barra de Navegação Flutuante

- Todas as telas levam em consideração as dimensões do recorte da tela (*notch*, *ilha dinâmica* e barras do sistema Android) utilizando `useSafeAreaInsets()`.
- A barra de navegação inferior flutuante (`FloatingTabsBar`) calcula dinamicamente o espaçamento inferior (`bottomOffset`) para garantir que o menu nunca sobreponha o indicador de gestos do iOS ou a barra de navegação do Android:
  ```typescript
  const bottomOffset = Math.max(insets.bottom, Platform.OS === 'ios' ? 14 : 10);
  ```
