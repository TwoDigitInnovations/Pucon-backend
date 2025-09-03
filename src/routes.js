const categoryRoutes = require("./routes/categoryRoutes");
const contentRoutes = require("./routes/contentRoutes");
const countryRoutes = require("./routes/countryRoutes");
const languageRoutes = require("./routes/languageRoutes");
const subcategoryRoutes = require("./routes/subcategoryRoutes");
const supercategoryRoutes = require("./routes/supercategoryRoutes");
const userRoutes = require("./routes/user");
const carouselRoutes = require("./routes/carouselRoutes");

module.exports = (app) => {
  app.use('/api/categories', categoryRoutes);
  app.use('/api/content', contentRoutes);
  app.use('/api/countries', countryRoutes);
  app.use('/api/languages', languageRoutes);
  app.use('/api/subcategories', subcategoryRoutes);
  app.use('/api/supercategories', supercategoryRoutes);
  app.use('/api/user', userRoutes);
  app.use('/api/carousel', carouselRoutes);
};
