const express = require('express')
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path')
const multer = require('multer')
const sharp = require('sharp')
const fs = require('fs')
const PORT = process.env.PORT || 5000

require('@tensorflow/tfjs-node');
const canvas = require('canvas');
const faceapi = require('face-api.js');
const useTinyModel = true;

const { Canvas, Image, ImageData, loadImage } = canvas
faceapi.env.monkeyPatch({ Canvas, Image, ImageData })

const storage = multer.diskStorage({
  destination: './public/images',
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
  }
})

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
    }
  }
}).single('image')

async function loadModels() {
  await faceapi.nets.tinyFaceDetector.loadFromDisk('./public/models')
  await faceapi.nets.faceLandmark68TinyNet.loadFromDisk('./public/models')
}

loadModels()

express()
  .use(express.static(path.join(__dirname, 'public')))
  .use(cors())
  .use(bodyParser.urlencoded({ extended: false }))
  .use(bodyParser.json())
  .get("/", express.static(path.join(__dirname, "./public")))
  .post("/upload", function (req, res, err) {
    upload(req, res, async (err) => {
      if (err) {
        console.log('error');
      } else {
        console.log(req.file)
        fs.readdir('./public/images', (err, files) => {
          for (const file of files) {
            if (file !== '.keep') {
              const mtime = fs.statSync(path.join('./public/images', file)).mtime
              const now = new Date().getTime()
              if (now - new Date(mtime).getTime() >= 600000) {
                fs.unlink(path.join('./public/images', file), err => {
                  if (err) console.log('err')
                });
              }
            }
          }
        });

        loadImage(req.file.path).then(async (image) => {
          const detectionWithLandmarks = await faceapi.detectSingleFace(image,new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks(useTinyModel)
          if (!detectionWithLandmarks) {
            return res.status(400).json({ error: 'Something went wrong! Please try again with another photo.' })
          }
          let mouth = detectionWithLandmarks.landmarks.getMouth();
          let jawOutline = detectionWithLandmarks.landmarks.getJawOutline();
          if (!mouth || !jawOutline) {
            return res.status(400).json({ error: 'Something went wrong! Please try again with another photo.' })
          }

          let minX = Math.min.apply(Math, jawOutline.map(function (o) { return o._x; }));
          let maxX = Math.max.apply(Math, jawOutline.map(function (o) { return o._x; }));
          let minY = Math.min.apply(Math, mouth.map(function (o) { return o._y; }));
          let size = (maxX - minX) * 0.9;
          let maskPath = './public/images/mask-' + new Date().getTime() + '.png';
          let height =0;

          sharp('./public/mask.png')
            .resize(Math.floor(size))
            .toFile(maskPath)
            .then(() => {
              sharp(maskPath)
                .metadata()
                .then((metadata) => {
                  height = metadata.height;
                  let resultPath = './public/images/result-' + new Date().getTime() + '.jpg';
                  sharp(req.file.path)
                  .composite([{
                    input: maskPath,
                    top: Math.floor(minY-height/2),
                    left: Math.floor(minX+(size*0.1))
                  }])
                  .jpeg()
                  .toFile(resultPath)
                  .then(() => {
                    res.status(200).json({ b64: resultPath })
                  })
                })
          });
        })
      }
    })
  })
  .use(function (req, res) {
    res.sendFile(path.join(__dirname, './public/404.html'));
  })
  .listen(PORT, () => console.log(`Listening on ${PORT}`))
