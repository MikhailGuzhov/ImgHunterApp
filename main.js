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
      а: "a", б: "b", в: "v", г: "g", д: "d",
      е: "e", ё: "e", ж: "zh", з: "z", и: "i",
      й: "y", к: "k", л: "l", м: "m", н: "n",
      о: "o", п: "p", р: "r", с: "s", т: "t",
      у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch",
      ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "",
      э: "e", ю: "yu", я: "ya", А: "A", Б: "B",
      В: "V", Г: "G", Д: "D", Е: "E", Ё: "E",
      Ж: "Zh", З: "Z", И: "I", Й: "Y", К: "K",
      Л: "L", М: "M", Н: "N", О: "O", П: "P",
      Р: "R", С: "S", Т: "T", У: "U", Ф: "F",
      Х: "Kh", Ц: "Ts", Ч: "Ch", Ш: "Sh", Щ: "Shch",
      Ъ: "", Ы: "Y", Ь: "", Э: "E", Ю: "Yu", Я: "Ya",
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

    matches = []; // Сбросить массив совпадений
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

    const uniqueMatches = Array.from(new Set(matches)); // Уникальные совпадения
    const totalMatches = uniqueMatches.length;
    const totalDuplicates = duplicates.size + inputNumbersDuplicates.length;

    matchesDiv.innerHTML = "Совпадения: " + uniqueMatches.join(", ");
    statsDiv.innerHTML = `Общее количество совпадений: ${totalMatches} <br> Количество дубликатов: ${totalDuplicates}`;
    downloadButton.style.display = totalMatches > 0 ? "block" : "none";
    resetButton.style.display = "block";
    previewButton.style.display = totalMatches > 0 ? "block" : "none";

    numberInput.value = "";
  };

  const showPreview = () => {
    fileList.style.display = "none"; // Скрыть список файлов
    previewContainer.innerHTML = "";
    previewContainer.style.display = "flex";
    previewContainer.style.flexWrap = "wrap";

    filesArray.forEach((file) => {
      const imgElement = document.createElement("img");
      imgElement.src = URL.createObjectURL(file);
      imgElement.alt = file.name;
      imgElement.classList.add("preview-img");
      imgElement.onclick = () => toggleSelectImage(file, imgElement);
      previewContainer.appendChild(imgElement);

      if (matches.includes(file.name)) {
        imgElement.classList.add("matched");
      }
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
    statsDiv.innerHTML = `Общее количество совпадений: ${uniqueSelectedImages.length}`;
  };

  const downloadSelectedFiles = () => {
    if (filesArray.length === 0 || matches.length === 0) {
      alert("Нет файлов для загрузки.");
      return; // Проверка на наличие файлов
    }

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
    fileInput.value = "";
    fileList.innerHTML = "";
    matchesDiv.innerHTML = "";
    statsDiv.innerHTML = "";
    numberInput.value = "";
    downloadButton.style.display = "none";
    resetButton.style.display = "none";
    previewButton.style.display = "none";
    previewContainer.style.display = "none";
    filesArray = [];
    selectedImages = [];
    matches = [];
  });
});
