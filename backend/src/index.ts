import App  from './app'
require('dotenv').config()

const app = new App().app
const PORT = process.env.PORT || 4144

app.listen(PORT, () => {
  console.log('TMS API is now available on port: ' + PORT)
  console.log(`TMS API docs available at http://localhost:${PORT}/docs`);
})