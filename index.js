const express = require('express')
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path')
const multer = require('multer')
const sharp = require('sharp')
const PORT = process.env.PORT || 5000

const storage = multer.diskStorage({
  destination: './public/images',
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
  }
})

const upload = multer({ storage }).single('image')

express()
  .use(express.static(path.join(__dirname, 'public')))
  .use(cors())
  .use(bodyParser.urlencoded({ extended: false }))
  .use(bodyParser.json())
  .get("/", express.static(path.join(__dirname, "./public")))
  .post("/upload", function (req, res, err) {
    upload(req, res, (err) => {
      if (err) {
        console.log('hata');
      } else {
        console.log(req.file)

        const filePath = '/images/output' + new Date().getTime() + '.jpg'
        sharp(req.file.path)
        .resize({ width: 100 })
        .toFormat('jpeg')
        .toFile('./public' + filePath)
        .then(() => {
          res.json({ path: '.' + filePath })
        }).catch(err => console.log(err));
      }
    })
  })
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))
