let form = document.querySelector('.fileForm');
let imageFile = document.querySelector('.file');
let image = document.querySelector('.image');
let fileList;

form.addEventListener("submit", handleSubmit, false);

function handleSubmit(e) {
  e.preventDefault();

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
    path = path.substring(9,path.length)
    image.src = path
  })
  .catch(function (error) {
    console.log(error);
  });

  return false;
}