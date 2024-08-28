const dayjs = require("dayjs");
const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");

module.exports = function (config) {
  // Pass-through images
  config.addPassthroughCopy("./src/images");

  // Add Date filters
  config.addFilter("date", (dateObj) => {
    return dayjs(dateObj).format("MMMM D, YYYY");
  });

  config.addFilter("sitemapDate", (dateObj) => {
    return dayjs(dateObj).toISOString();
  });

  config.addFilter("year", () => {
    return dayjs().format("YYYY");
  });

  // Add pages collection
  config.addCollection("posts", function (collections) {
    return collections.getFilteredByTag("post").sort(function (a, b) {
      return a.data.order - b.data.order;
    });
  });

  // plugins
  config.addPlugin(syntaxHighlight);

  return {
    markdownTemplateEngine: "njk",
    dir: {
      input: "src",
      layouts: './_layouts'
    },
  };
};
