let form = document.querySelector('.fileForm');
let imageFile = document.querySelector('.file');
let image = document.querySelector('.image');
let fileList;

form.addEventListener("submit", handleSubmit, false);

function handleSubmit(e) {
  e.preventDefault();

  let formData = new FormData();
  formData.append("image", imageFile.files[0]);

  axios.post('http://localhost:5000/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
  })
  .then(function (response) {
    console.log(response.data.path)
    image.src = response.data.path
  })
  .catch(function (error) {
    console.log(error);
  });

  return false;
}
