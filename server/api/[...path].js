const dotenv = require("dotenv");

dotenv.config();

const createApp = require("../src/app");
const connectDB = require("../src/config/db");

const app = createApp();

module.exports = async (req, res) => {
  await connectDB();
  return app(req, res);
};

module.exports.config = {
  api: {
    bodyParser: false,
  },
};