'use strict';

const mongodb = require('mongodb')
const fs = require('fs');
const JSV = require('JSV').JSV;

const MongoClient = mongodb.MongoClient;
const validator = JSV.createEnvironment();
const objTypeMap = {user: {}};

let dbHandle;

const loadSchema = function (schema_name, schema_path) {
  fs.readFile(schema_path, 'utf8', function (err, data) {
    objTypeMap[schema_name] = JSON.parse(data);
  });
};

const checkSchema = function (obj_type, obj_map, callback) {
  let schema_map = objTypeMap[obj_type];
  let report_map = validator.validate(obj_map, schema_map);

  callback(report_map.errors);
};

const clearIsOnline = function () {
  updateObj(
    'user',
    {is_online: true},
    {is_online: false},
    function (response_map) {
      console.log('All users set to offline', response_map);
    });
};

const checkType = function (obj_type) {
  if(!objTypeMap[obj_type]) {
    return ({ error_msg: 'Object type "' + obj_type
              + '" is not supported.'
            });
  }
  return null;
};

const constructObj = function (obj_type, obj_map, callback) {
  const type_check_map = checkType(obj_type);
  if (type_check_map) {
    callback(type_check_map);
    return;
  }

  checkSchema(
    obj_type, obj_map,
    function (error_list) {
      if (error_list.length === 0) {
        dbHandle.collection(
          obj_type,
          function (err, collection) {
            const options = {w: 1};
            collection.insert(
              obj_map,
              options,
              function (err, result_map) {
                callback(result_map.ops);
              }
            );
          }
        );
      } else {
        callback({
          error_msg: 'Input document not valid',
          error_list: error_list
        });
      }
    });
};

const readObj = function (obj_type, find_map, fields_map, callback) {
  const type_check_map = checkType(obj_type);
  if (type_check_map) {
    callback(type_check_map);
    return;
  }

  dbHandle.collection(
    obj_type,
    function (err, collection) {
      collection.find(find_map, fields_map).toArray(
        function (err, map_list) {
          callback(map_list);
        }
      );
    });
};

const updateObj = function (obj_type, find_map, set_map, callback) {
  const type_check_map = checkType(obj_type);
  if (type_check_map) {
    callback(type_check_map);
    return;
  }

  checkSchema(
    obj_type, set_map,
    function (error_list) {
      if (error_list.length === 0) {
        dbHandle.collection(
          obj_type,
          function (err, collection) {
            const sort_order = [];
            const options = {
              'new': true, upsert: false, w: 1
            };
            collection.update(
              find_map,
              {$set: set_map},
              {w: 1, multi: true, upsert: false},
              function (err, update_count) {
                callback({update_count: update_count});
              }
            );
          }
        );
      } else {
        callback({
          error_msg: 'Input document not valid',
          error_list: error_list
        });
      }
    });
};

const destroyObj = function (obj_type, find_map, callback) {
  const type_check_map = checkType(obj_type);
  if (type_check_map) {
    callback(type_check_map);
    return;
  }

  dbHandle.collection(
    obj_type,
    function (err, collection) {
      let options = {w: 1, single: true};

      collection,remove(
        find_map, options,
        function (err, delete_count) {
          callback({delete_count: delete_count});
        });
    });
};

MongoClient.connect('mongodb://192.168.99.100:27017/spa', {
  db: {
    w: 1
  }
}, function (err, db) {
  dbHandle = db;
});

(function () {
  for (let schema_name in objTypeMap) {
    if (objTypeMap.hasOwnProperty(schema_name)) {
      const schema_path = __dirname + '/' + schema_name + '.json';
      loadSchema(schema_name, schema_path);
    }
  }
}());

module.exports = {
  makeMongoId: mongodb.ObjectID,
  checkType: checkType,
  construct: constructObj,
  read: readObj,
  update: updateObj,
  destroy: destroyObj
};
