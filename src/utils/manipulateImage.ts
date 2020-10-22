
export function loadImage(file: File, onResizeCompleted) {
  const fileReader = new FileReader();
  fileReader.onload = (event) => {
    const result = event.target?.result;
    if (result == null) {
      return;
    }
    const img = new Image();
    img.src = result as string;

    onResizeCompleted(img);
  };
  fileReader.readAsDataURL(file)
}
