import App  from './app'
require('dotenv').config()

const app = new App().app

const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const path = require("path");

const PORT = process.env.PORT || 4144

const swaggerDocument = YAML.load(path.join(__dirname, "docs", "openapi.yaml"))

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

    app.listen(PORT, () => {
      console.log('TMS API is now available on port: ' + PORT)
      console.log(`TMS API docs available at http://localhost:${PORT}/docs`);
    })