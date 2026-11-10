import React, { createContext, useContext, useState } from 'react';

interface HeaderVisibilityContextData {
  isHeaderVisible: boolean;
  setIsHeaderVisible: (visible: boolean) => void;
}

const HeaderVisibilityContext = createContext<HeaderVisibilityContextData>({
  isHeaderVisible: true,
  setIsHeaderVisible: () => {},
});

export function HeaderVisibilityProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  return (
    <HeaderVisibilityContext.Provider
      value={{ isHeaderVisible, setIsHeaderVisible }}
    >
      {children}
    </HeaderVisibilityContext.Provider>
  );
}

export function useHeaderVisibility() {
  return useContext(HeaderVisibilityContext);
}
