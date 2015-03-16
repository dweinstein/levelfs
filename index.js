var fuse = require('fuse-bindings');
var db = require('./lib/db');
var cfg = require('./lib/rc');

module.exports = function levelfs(opts) {
  opts = opts || {};
  opts.path = opts.path || cfg.path || './mnt';

  fuse.mount(opts.path, {
    readdir: function (path, cb) {
      console.log('readdir(%s)', path);
      var keys = [];
      if (path === '/') {
        db.createKeyStream()
        .on('data', function (key) {
          keys.push(key);
        })
        .on('end', function() {
          return cb(0, keys);
        })
        .on('error', function(err) {
          console.log(err);
          cb(1);
        });
      } else {
      }
    },
    getattr: function (path, cb) {
      console.log('getattr(%s)', path);
      if (path === '/') {
        return cb(0, {
          mtime: new Date(),
          atime: new Date(),
          ctime: new Date(),
          size: 100,
          mode: 16877,
          uid: process.getuid(),
          gid: process.getgid()
        });
      }

      var key = path.split('/').slice(1);
      db.get(key[0], function (err, val) {
        if (err) {
          console.log(err);
          return cb(fuse.ENOENT);
        }
        return cb(0, {
          mtime: new Date(),
          atime: new Date(),
          ctime: new Date(),
          size: val.length,
          mode: 33188,
          uid: process.getuid(),
          gid: process.getgid()
        });
      });

    },
    open: function (path, flags, cb) {
      console.log('open(%s, %d)', path, flags);
      cb(0, 42); // 42 is an fd
    },
    read: function (path, fd, buf, len, pos, cb) {
      console.log('read(%s, %d, %d, %d)', path, fd, len, pos);
      var key = path.split('/').slice(1);
      db.get(key[0], function (err, val) {
        var str = val.slice(pos);
        if (!str) { return cb(0); }
        buf.write(str);
        return cb(str.length);
      });
    }
  });

  process.on('SIGINT', function () {
    fuse.unmount(opts.path, function () {
      process.exit();
    });
  });

  return {
  };
};
//


