// Babel solo lo usa Jest (npm test) para entender JSX e imports ES.
// Vite no lee este archivo: @vitejs/plugin-react trae su propia configuración.
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }]
  ],
  // src/api/api.js usa import.meta.env.VITE_API_URL (propio de Vite):
  // en Jest se traduce a process.env.VITE_API_URL.
  plugins: ['babel-plugin-transform-vite-meta-env']
}
