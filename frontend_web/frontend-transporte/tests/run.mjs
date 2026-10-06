// Ejecuta la suite empaquetada simulando las APIs del navegador que
// usan los componentes al renderizarse (localStorage, window, document).
const almacen = new Map()

globalThis.localStorage = {
  getItem: (k) => (almacen.has(k) ? almacen.get(k) : null),
  setItem: (k, v) => almacen.set(k, String(v)),
  removeItem: (k) => almacen.delete(k)
}

// El historial que usa la navegación por flechas (hooks/useNavegacion.js).
const historia = {
  state: null,
  pushState(estado) { historia.state = estado },
  replaceState(estado) { historia.state = estado },
  back() {},
  forward() {}
}

globalThis.window = {
  location: { hash: '', reload() {} },
  history: historia,
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent() {},
  scrollTo() {},
  setTimeout,
  clearTimeout
}
globalThis.document = { addEventListener() {}, removeEventListener() {} }

await import('../.test-build/pruebas.js')
