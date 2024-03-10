const cloudinary = require("cloudinary").v2;

const CloudinaryConfig = () => {
  cloudinary.config({
    cloud_name: "dbx7oqxpd",
    api_key: "624374648988369",
    api_secret: "BIE7yjNzf0PZQRkLmhdlahpp4po",
  });
};

module.exports = CloudinaryConfig;
