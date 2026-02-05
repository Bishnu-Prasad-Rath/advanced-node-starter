 const mongoose = require('mongoose');
const requireLogin = require('../middlewares/requireLogin');
const cleanCache = require('../middlewares/cleanCache');  // ⭐ correct place
require('../services/cache');  // ⭐ enable mongoose caching

const Blog = mongoose.model('Blog');

module.exports = app => {

  // ⭐ GET single blog
  app.get('/api/blogs/:id', requireLogin, async (req, res) => {
    const blog = await Blog.findOne({
      _user: req.user.id,
      _id: req.params.id
    });

    res.send(blog);
  });

  // ⭐ GET ALL BLOGS — cached
  app.get('/api/blogs', requireLogin, async (req, res) => {

    const blogs = await Blog
      .find({ _user: req.user.id })
      .cache({ key: req.user.id });   // ⭐ now .cache() works

    res.send(blogs);
  });

  // ⭐ POST — create blog, then clear cache using middleware
  app.post(
    '/api/blogs',
    requireLogin,
    cleanCache,     // ⭐ automatically clears cache AFTER saving
    async (req, res) => {

      const { title, content } = req.body;

      const blog = new Blog({
        title,
        content,
        _user: req.user.id
      });

      try {
        await blog.save();
        res.send(blog);
      } catch (err) {
        res.status(400).send(err);
      }
    }
  );
};
