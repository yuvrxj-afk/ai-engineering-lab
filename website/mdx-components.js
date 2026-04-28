export function useMDXComponents(components) {
  return {
    wrapper({ children }) {
      return children
    },
    ...components
  }
}

