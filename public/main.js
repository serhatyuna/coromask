let form = document.querySelector('.fileForm');
let imageFile = document.querySelector('.fileInput');
let image = document.querySelector('.image');
let errorP = document.querySelector('.error');
let fileName = document.querySelector('.file-name');
let loader = document.querySelector('.loader-wrapper');
let fileList;

form.addEventListener('submit', handleSubmit, false);
imageFile.addEventListener('change', handleInputChange);

const exts = ['png', 'jpg', 'jpeg'];

function handleSubmit(e) {
  e.preventDefault();

  errorP.innerHTML = '';
  image.src = '';

  if (!hasExtension(exts)) {
    errorP.innerHTML = 'Please upload a valid image file!';
    fileName.innerHTML = '';
    form.reset();
    return false;
  }

  loader.classList.add('is-active');

  let formData = new FormData();
  formData.append("image", imageFile.files[0]);

  axios.post('https://coromask.herokuapp.com/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
  })
  .then(function (response) {
    console.log(response.data.b64)
    let path = response.data.b64;
    path = path.substring(9,path.length);
    image.src = path;
  })
  .catch(function (error) {
    errorP.innerHTML = error.response.data.error;
  })
  .finally(function () {
    loader.classList.remove('is-active');
  });

  form.reset();
  return false;
}

function handleInputChange() {
  let fullPath = imageFile.value;
  if (fullPath) {
    let startIndex = (fullPath.indexOf('\\') >= 0 ? fullPath.lastIndexOf('\\') : fullPath.lastIndexOf('/'));
    let filename = fullPath.substring(startIndex);
    if (filename.indexOf('\\') === 0 || filename.indexOf('/') === 0) {
      filename = filename.substring(1);
    }
    fileName.innerHTML = filename;
  }
}

function hasExtension(exts) {
  let fileName = imageFile.value;
  return (new RegExp('(' + exts.join('|').replace(/\./g, '\\.') + ')$')).test(fileName);
}
