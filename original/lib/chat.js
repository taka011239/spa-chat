'use strict';

const socket = require('socket.io')();
const crud = require('./crud');

const makeMongoId = crud.makeMongoId;

const emitUserList = function (io) {
  crud.read(
    'user',
    {is_online: true},
    {},
    function (result_list) {
      io.of('/chat')
          .emit('listchange', result_list);
    });
};

const signIn = function (io, user_map, socket) {
  crud.update(
    'user',
    {_id: user_map._id},
    {is_online: true},
    function (result_map) {
      emitUserList(io);
      user_map.is_online = true;
      socket.emit('userupdate', user_map);
    });

  chatterMap[user_map._id] = socket;
  socket.user_id = user_map._id;
};

const signOut = function (io, user_id) {
  crud.update(
    'user',
    {_id: user_id},
    {is_online: false},
    function (result_list) { emitUserList(io); }
  );
  delete chatterMap[user_id];
};

let chatterMap = {};

const chatObj = {
  connect: function (server) {
    var io = socket.listen(server);

    io.of('/chat')
        .on('connection', function (socket) {
          socket.on('adduser', function (user_map) {
            crud.read(
              'user',
              {name: user_map.name},
              {},
              function (result_list) {
                let result_map;
                const cid = user_map.cid;

                delete user_map.cid;

                if (result_list.length > 0) {
                  result_map = result_list[0];
                  result_map.cid = cid;
                  signIn(io, result_map, socket);
                } else {
                  user_map.is_online = true;
                  crud.construct(
                    'user',
                    user_map,
                    function (result_list) {
                      result_map = result_list[0];
                      result_map.cid = cid;
                      chatterMap[result_map._id] = socket;
                      socket.user_id = result_map._id;
                      socket.emit('userupdate', result_map);
                      emitUserList(io);
                    });
                }
              }
            );
          });
          socket.on('updatechat', function (chat_map) {
            if (chatterMap.hasOwnProperty(chat_map.dest_id)) {
              chatterMap[chat_map.dest_id].emit('updatechat', chat_map);
            } else {
              socket.emit('updatechat', {
                sender_id: chat_map.sender_id,
                msg_text: chat_map.dest_name + ' has gone offline.'
              });
            }
          });
          socket.on('leavechat', function () {
            console.log('** user %s logged out **', socket.user_id);
            signOut(io, socket.user_id);
          });
          socket.on('disconnect', function () {
            console.log('user %s closed browser window or tab **', socket.user_id);
            signOut(io, socket.user_id);
          });
          socket.on('updateavatar', function (avtr_map) {
            crud.update(
              'user',
              {_id: makeMongoId(avtr_map.person_id)},
              {css_map: avtr_map.css_map},
              function (result_list) { emitUserList(io); });
          });
        });

    return io;
  }
};

module.exports = chatObj;
