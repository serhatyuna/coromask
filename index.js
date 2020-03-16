const express = require('express')
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path')
const multer = require('multer')
const sharp = require('sharp')
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

const upload = multer({ storage }).single('image')

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
        console.log('hata');
      } else {
        console.log(req.file)
        loadImage(req.file.path).then(async (image) => {
          const detectionWithLandmarks = await faceapi.detectSingleFace(image,new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks(useTinyModel)
          let mouth = detectionWithLandmarks.landmarks.getMouth();
          let jawOutline = detectionWithLandmarks.landmarks.getJawOutline();

          let minX = Math.min.apply(Math, jawOutline.map(function (o) { return o._x; }));
          let maxX = Math.max.apply(Math, jawOutline.map(function (o) { return o._x; }));
          let minY = Math.min.apply(Math, mouth.map(function (o) { return o._y; }));
          let size = maxX - minX;
          size*=0.9
          let maskPath = './public/images/mask' + new Date().getTime() + '.png';

          let height =0;
          sharp('./public/mask.png').resize(Math.floor(size)).toFile(maskPath).then(() => {
            sharp(maskPath).metadata().then((metadata)=>{
              height = metadata.height;
              let resultPath = './public/images/result' + new Date().getTime();
            sharp(req.file.path)
            .composite([{
              input: maskPath,
              top: Math.floor(minY-height/2),
              left: Math.floor(minX+(size*0.1))
            }])
            .jpeg()
            .toFile(resultPath)
            .then(() => {
              res.json({ b64: resultPath })
            })
            })

          });

        })

      }
    })
  })
  .listen(PORT, () => console.log(`Listening on ${PORT}`))
