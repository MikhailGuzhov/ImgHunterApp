document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("fileInput");
  const fileList = document.getElementById("fileList");
  const numberInput = document.getElementById("numberInput");
  const checkButton = document.getElementById("checkButton");
  const matchesDiv = document.getElementById("matches");
  const statsDiv = document.getElementById("stats");
  const downloadButton = document.getElementById("downloadButton");
  const resetButton = document.getElementById("resetButton");

  if (
    !fileInput ||
    !fileList ||
    !numberInput ||
    !checkButton ||
    !matchesDiv ||
    !statsDiv ||
    !downloadButton ||
    !resetButton
  ) {
    console.error("Не удалось найти один или несколько элементов на странице.");
    return; // Предотвращаем выполнение дальнейшего кода, если элементы не найдены
  }

  let filesArray = [];

  fileInput.addEventListener("change", function () {
    fileList.innerHTML = "";
    filesArray = Array.from(fileInput.files);
    filesArray.forEach((file) => {
      const li = document.createElement("li");
      li.textContent = file.name; // Полное имя файла
      fileList.appendChild(li);
    });
  });

  const handleCheck = () => {
    const separators = /[\s,;:]+/; // Разделители: пробел, запятая, точка с запятой и двоеточие
    const numbers = numberInput.value
      .split(separators) // Разделяем по определенным разделителям
      .map((num) => num.trim())
      .filter((num) => num); // Убираем пустые строки

    // Если поле ввода пустое, просто ничего не делаем и выходим из функции
    if (numbers.length === 0) {
      return; // можно вывести сообщение об ошибке, если необходимо
    }

    const matches = [];
    const duplicates = new Set();
    const seenNames = new Set();

    // Определение совпадений и дубликатов
    filesArray.forEach((file) => {
      const fileName = file.name;
      const numericPart = fileName.slice(-8, -4); // Извлекаем последние 4 цифры перед расширением
      const fileNumber = fileName.match(/(\d+)/); // Извлекаем только числовую часть из имени файла
      const numberToCheck = fileNumber ? fileNumber[0] : null; // Проверяем, есть ли числовая часть

      // Поиск по числовым частям
      if (
        (numbers.includes(numericPart) && !matches.includes(fileName)) ||
        (numberToCheck &&
          numbers.includes(numberToCheck) &&
          !matches.includes(fileName))
      ) {
        matches.push(fileName);
        highlightMatch(fileName);
      }

      // Поиск по полным именам файлов
      numbers.forEach((num) => {
        if (fileName.includes(num) && !matches.includes(fileName)) {
          matches.push(fileName);
          highlightMatch(fileName);
        }
      });

      // Проверка на дубликат
      if (seenNames.has(fileName)) {
        duplicates.add(fileName);
        highlightDuplicate(fileName);
      } else {
        seenNames.add(fileName);
      }
    });

    // Проверка введенных значений на дубликаты
    const inputNumbersDuplicates = numbers.filter(
      (num, index) => numbers.indexOf(num) !== index
    );
    inputNumbersDuplicates.forEach((duplicateNum) => {
      highlightDuplicate(duplicateNum);
    });

    const totalMatches = matches.length;
    const totalDuplicates = duplicates.size + inputNumbersDuplicates.length;

    matchesDiv.innerHTML = "Совпадения: " + matches.join(", ");
    statsDiv.innerHTML = `Общее количество совпадений: ${totalMatches} <br> Количество дубликатов: ${totalDuplicates}`;
    downloadButton.style.display = totalMatches > 0 ? "block" : "none";
    resetButton.style.display = "block"; // Показываем кнопку сброса

    // Очищение инпута
    numberInput.value = "";

    downloadButton.onclick = function () {
      const zip = new JSZip();
      const folder = zip.folder("matched_files"); // Создание папки в архиве

      addFilesToZip(folder, matches.map((fileName) => {
        return filesArray.find((f) => f.name === fileName);
      })).then(() => {
        zip.generateAsync({ type: "blob" }).then(function (content) {
          const link = document.createElement("a");
          link.href = URL.createObjectURL(content); // Создаем URL для ZIP-архива
          link.download = "Выбранные фото.zip"; // Имя ZIP-архива
          link.click(); // Симулируем нажатие для загрузки
        });
      });
    };
  };

  const addFilesToZip = (folder, files) => {
    const addFileToZip = (index) => {
      if (index >= files.length) {
        return Promise.resolve(); // Все файлы добавлены
      } 
      const file = files[index];
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function (e) {
          folder.file(file.name, e.target.result); // Добавление файла в папку
          resolve(addFileToZip(index + 1)); // Заканчиваем текущее добавление и начинаем следующее
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file); // Читаем содержимое файла как ArrayBuffer
      });
    };
    
    return addFileToZip(0); // Начинаем добавление с первого файла
  };

  checkButton.addEventListener("click", handleCheck);
  numberInput.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      handleCheck();
    }
  });

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

  // Обработчик события для кнопки сброса
  resetButton.addEventListener("click", function () {
    // Сброс значений
    fileInput.value = "";
    fileList.innerHTML = "";
    matchesDiv.innerHTML = "";
    statsDiv.innerHTML = "";
    numberInput.value = "";
    downloadButton.style.display = "none";
    resetButton.style.display = "none";
    filesArray = [];
  });
});
