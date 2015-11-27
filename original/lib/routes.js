'use strict';

const crud = require('./crud');
const chat = require('./chat');

const configRoutes = function (app, server) {
  app.get('/', function (req, res) {
    res.redirect('/spa.html');
  });

  app.all('/:obj_type/*?', function (req, res, next) {
    res.contentType('json');
    next();
  });

  app.get('/:obj_type/list', function (req, res) {
    crud.read(
      req.params.obj_type,
      {}, {},
      function (map_list) { res.send(map_list); }
    )
  });

  app.post('/:obj_type/create', function (req, res) {
    crud.construct(
      req.params.obj_type,
      req.body,
      function (result_map) { res.send(result_map); }
    );
  });

  app.get('/:obj_type/read/:id([0-9]+)', function (req, res) {
    crud.read(
      req.params.obj_type,
      {_id: makeMongoId(req.params.id)},
      {},
      function (map_list) { res.send(map_list); }
    );
  });

  app.post('/:obj_type/update/:id([0-9]+)', function (req, res) {
    crud.destroy(
      req.params.obj_type,
      {_id: makeMongoId(req.params.id)},
      function (result_map) { res.send(result_map); }
    );
  });

  app.post('/:obj_type/delete/:id([0-9]+)', function (req, res) {
    const find_map = {_id: makeMongoId(req.params.id)};

    dbHandle.collection(
      req.params.obj_type,
      function (err, collection) {
        const options = { w: 1, single: true };
        collection.remove(
          find_map,
          options,
          function (err, delete_count) {
            res.send({delete_count: delete_count});
          }
        );
      }
    );
  });

  chat.connect(server);
};

module.exports = {
  configRoutes: configRoutes
};

