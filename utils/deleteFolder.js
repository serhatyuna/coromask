const fs = require('fs');
const path = require('path');

function deleteFolder(directory = './public/images') {
  return new Promise((resolve, reject) => {
    fs.readdir(directory, (err, files) => {
      if (err) reject(err)

      for (const file of files) {
        fs.unlink(path.join(directory, file), err => {
          if (err) reject(err)
          else resolve()
        });
      }
    });
  })
}
