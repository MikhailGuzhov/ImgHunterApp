document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("fileInput");
  const fileList = document.getElementById("fileList");
  const numberInput = document.getElementById("numberInput");
  const checkButton = document.getElementById("checkButton");
  const matchesDiv = document.getElementById("matches");
  const statsDiv = document.getElementById("stats");
  const downloadButton = document.getElementById("downloadButton");
  const resetButton = document.getElementById("resetButton");
  const previewButton = document.getElementById("previewButton");
  const previewContainer = document.getElementById("previewContainer");

  let filesArray = [];
  let selectedImages = [];
  let matches = [];

  fileInput.addEventListener("change", function () {
    fileList.innerHTML = "";
    filesArray = Array.from(fileInput.files);
    filesArray.forEach((file) => {
      const li = document.createElement("li");
      li.textContent = file.name;
      fileList.appendChild(li);
    });
  });

  const transliterate = (text) => {
    const ruToEn = {
      а: "a",
      б: "b",
      в: "v",
      г: "g",
      д: "d",
      е: "e",
      ё: "e",
      ж: "zh",
      з: "z",
      и: "i",
      й: "y",
      к: "k",
      л: "l",
      м: "m",
      н: "n",
      о: "o",
      п: "p",
      р: "r",
      с: "s",
      т: "t",
      у: "u",
      ф: "f",
      х: "kh",
      ц: "ts",
      ч: "ch",
      ш: "sh",
      щ: "shch",
      ъ: "",
      ы: "y",
      ь: "",
      э: "e",
      ю: "yu",
      я: "ya",
      А: "A",
      Б: "B",
      В: "V",
      Г: "G",
      Д: "D",
      Е: "E",
      Ё: "E",
      Ж: "Zh",
      З: "Z",
      И: "I",
      Й: "Y",
      К: "K",
      Л: "L",
      М: "M",
      Н: "N",
      О: "O",
      П: "P",
      Р: "R",
      С: "S",
      Т: "T",
      У: "U",
      Ф: "F",
      Х: "Kh",
      Ц: "Ts",
      Ч: "Ch",
      Ш: "Sh",
      Щ: "Shch",
      Ъ: "",
      Ы: "Y",
      Ь: "",
      Э: "E",
      Ю: "Yu",
      Я: "Ya",
    };
    return text
      .split("")
      .map((char) => ruToEn[char] || char)
      .join("");
  };

  const handleCheck = () => {
    const separators = /[\s,;:]+/;
    const numbers = numberInput.value
      .split(separators)
      .map((num) => num.trim())
      .filter((num) => num);

    if (numbers.length === 0) {
      console.log("Нет введённых чисел для проверки.");
      return;
    }

    matches = [];
    const duplicates = new Set();
    const seenNames = new Set();

    const normalizedNumbers = numbers.map((num) => transliterate(num));

    filesArray.forEach((file) => {
      const fileName = file.name;
      const normalizedFileName = transliterate(fileName);

      normalizedNumbers.forEach((num) => {
        const regex = new RegExp(num, "i");
        if (regex.test(normalizedFileName)) {
          matches.push(fileName);
          highlightMatch(fileName);
        }
      });

      if (seenNames.has(fileName)) {
        duplicates.add(fileName);
        highlightDuplicate(fileName);
      } else {
        seenNames.add(fileName);
      }
    });

    const inputNumbersDuplicates = numbers.filter(
      (num, index) => numbers.indexOf(num) !== index
    );
    inputNumbersDuplicates.forEach((duplicateNum) => {
      highlightDuplicate(duplicateNum);
    });

    const uniqueMatches = Array.from(new Set(matches));
    const totalMatches = uniqueMatches.length;
    const totalDuplicates = duplicates.size + inputNumbersDuplicates.length;

    matchesDiv.innerHTML = "Совпадения: " + uniqueMatches.join(", ");
    statsDiv.innerHTML = `Общее количество уникальных совпадений: ${totalMatches} <br> Количество дубликатов: ${totalDuplicates}`;
    downloadButton.style.display = totalMatches > 0 ? "block" : "none";
    resetButton.style.display = "block";
    previewButton.style.display = totalMatches > 0 ? "block" : "none";

    numberInput.value = "";
  };

  const showPreview = () => {
    fileList.style.display = "none";
    previewContainer.innerHTML = "";
    previewContainer.style.display = "flex";
    previewContainer.style.flexWrap = "wrap";

    filesArray.forEach((file) => {
      const imgElement = document.createElement("img");
      imgElement.alt = file.name;

      const url = URL.createObjectURL(file);
      const img = new Image();
      img.src = url;

      img.onload = () => {
        const MAX_WIDTH = 200;
        const MAX_HEIGHT = 200;

        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        ctx.drawImage(img, 0, 0, width, height);
        imgElement.src = canvas.toDataURL("image/jpeg", 0.7);
        imgElement.style.maxWidth = "200px";
        imgElement.style.maxHeight = "200px";
        imgElement.style.objectFit = "contain";
        imgElement.classList.add("preview-img");
        imgElement.onclick = () => toggleSelectImage(file, imgElement);
        previewContainer.appendChild(imgElement);

        if (matches.includes(file.name)) {
          imgElement.classList.add("matched");
        }
      };
    });

    updateMatchCount();
  };

  const toggleSelectImage = (file, imgElement) => {
    const index = selectedImages.indexOf(file.name);
    if (index > -1) {
      selectedImages.splice(index, 1);
      imgElement.classList.remove("selected");
    } else {
      selectedImages.push(file.name);
      imgElement.classList.add("selected");
    }

    updateMatchCount();
  };

  const updateMatchCount = () => {
    const uniqueSelectedImages = Array.from(
      new Set([...matches, ...selectedImages])
    );
    matchesDiv.innerHTML = "Совпадения: " + uniqueSelectedImages.join(", ");
    statsDiv.innerHTML = `Общее количество уникальных совпадений: ${
      new Set(uniqueSelectedImages).size
    }`;
  };

  const downloadSelectedFiles = () => {
    const zip = new JSZip();
    const folder = zip.folder("matched_files");

    const allFilesToDownload = Array.from(
      new Set([...matches, ...selectedImages])
    );

    const fileReadPromises = allFilesToDownload
      .map((fileName) => {
        const file = filesArray.find((f) => f.name === fileName);
        if (file) {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function (e) {
              folder.file(file.name, e.target.result);
              resolve();
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
          });
        }
      })
      .filter(Boolean);

    Promise.all(fileReadPromises).then(() => {
      zip.generateAsync({ type: "blob" }).then(function (content) {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(content);
        link.download = "Выбранные фото.zip";
        link.click();
      });
    });
  };

  checkButton.addEventListener("click", handleCheck);
  numberInput.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      handleCheck();
    }
  });

  previewButton.addEventListener("click", showPreview);
  downloadButton.addEventListener("click", downloadSelectedFiles);

  function highlightMatch(fileName) {
    fileList.querySelectorAll("li").forEach((li) => {
      if (li.textContent === fileName) {
        li.classList.add("match");
      }
    });
  }

  function highlightDuplicate(fileName) {
    fileList.querySelectorAll("li").forEach((li) => {
      if (li.textContent.includes(fileName)) {
        li.classList.add("duplicate");
      }
    });
  }

  resetButton.addEventListener("click", function () {
    fileInput.value = ""; // Сброс выбора файлов
    fileList.innerHTML = ""; // Удаление списка файлов
    matchesDiv.innerHTML = ""; // Очистка совпадений
    statsDiv.innerHTML = ""; // Очистка статистики
    numberInput.value = ""; // Сброс ввода номеров
    downloadButton.style.display = "none"; // Скрытие кнопки загрузки
    resetButton.style.display = "none"; // Скрытие кнопки сброса
    previewButton.style.display = "none"; // Скрытие кнопки предварительного просмотра
    previewContainer.style.display = "none"; // Скрытие контейнера предварительного просмотра
    filesArray = []; // Очистка массива файлов
    selectedImages = []; // Сброс выбранных изображений
    matches = []; // Сброс совпадений
    fileInput.dispatchEvent(new Event("change")); // Перезапуск события изменения для обновления состояния
  });
});
