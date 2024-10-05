document.addEventListener("DOMContentLoaded", () => {
  // Получение элементов из DOM
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

  let filesArray = []; // Массив для хранения загруженных файлов
  let selectedImages = []; // Массив для хранения выбранных изображений
  let matches = []; // Массив для хранения совпадений

  // Событие изменения для input файла
  fileInput.addEventListener("change", function () {
    fileList.innerHTML = ""; // Очистка списка файлов
    filesArray = Array.from(fileInput.files); // Преобразование файлов в массив
    filesArray.forEach((file) => {
      const li = document.createElement("li");
      li.textContent = file.name; // Добавление имени файла в список
      fileList.appendChild(li);
    });
  });

  // Функция транслитерации
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
      .map((char) => ruToEn[char] || char) // Транслитерация каждого символа
      .join("");
  };

  // Функция проверки введённых чисел
  const handleCheck = () => {
    const separators = /[\s,;:]+/; // Сепараторы для разделения чисел
    const numbers = numberInput.value
      .split(separators)
      .map((num) => num.trim())
      .filter((num) => num); // Очищаем введённые числа

    if (numbers.length === 0) {
      console.log("Нет введённых чисел для проверки."); // Проверка на наличие чисел
      return;
    }

    matches = []; // Сбросить массив совпадений
    const duplicates = new Set(); // Для хранения дубликатов
    const seenNames = new Set(); // Для отслеживания уже увиденных имен файлов

    const normalizedNumbers = numbers.map((num) => transliterate(num)); // Транслитерация введённых чисел

    filesArray.forEach((file) => {
      const fileName = file.name;
      const normalizedFileName = transliterate(fileName); // Транслитерация имени файла

      normalizedNumbers.forEach((num) => {
        const regex = new RegExp(num, "i"); // Регулярное выражение для поиска
        if (regex.test(normalizedFileName)) {
          matches.push(fileName); // Добавление совпадения
          highlightMatch(fileName); // Подсветка совпадения
        }
      });

      if (seenNames.has(fileName)) {
        duplicates.add(fileName); // Добавление в дубликаты
        highlightDuplicate(fileName); // Подсветка дубликата
      } else {
        seenNames.add(fileName); // Заполнение уже увиденного
      }
    });

    const inputNumbersDuplicates = numbers.filter(
      (num, index) => numbers.indexOf(num) !== index // Находите дубликаты введённых чисел
    );
    inputNumbersDuplicates.forEach((duplicateNum) => {
      highlightDuplicate(duplicateNum); // Подсветка дубликатов чисел
    });

    const totalMatches = matches.length; // Общее количество совпадений
    const totalDuplicates = duplicates.size + inputNumbersDuplicates.length; // Общее количество дубликатов

    // Обновление пользовательского интерфейса с результатами
    matchesDiv.innerHTML = "Совпадения: " + matches.join(", ");
    statsDiv.innerHTML = `Общее количество совпадений: ${totalMatches} <br> Количество дубликатов: ${totalDuplicates}`;
    downloadButton.style.display = totalMatches > 0 ? "block" : "none"; // Показать/скрыть кнопку загрузки
    resetButton.style.display = "block"; // Показать кнопку сброса
    previewButton.style.display = totalMatches > 0 ? "block" : "none"; // Показать/скрыть кнопку предпросмотра

    numberInput.value = ""; // Очистка ввода чисел
  };

  // Функция для показа предпросмотра изображений
  const showPreview = () => {
    fileList.style.display = "none"; // Скрыть список файлов
    previewContainer.innerHTML = ""; // Очистка контейнера предпросмотра
    previewContainer.style.display = "flex";
    previewContainer.style.flexWrap = "wrap";

    filesArray.forEach((file) => {
      const imgElement = document.createElement("img"); // Создание элемента изображения
      imgElement.alt = file.name;

      // Создание объекта URL для оригинального изображения
      const url = URL.createObjectURL(file);

      // Создание элемента `canvas` для уменьшения размера изображения
      const img = new Image();
      img.src = url;

      img.onload = () => {
        // Устанавливаем желаемые размеры превью
        const MAX_WIDTH = 200; // Максимальная ширина
        const MAX_HEIGHT = 200; // Максимальная высота

        // Установка размеров при сохранении пропорций
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

        // Устанавливаем размеры для канваса
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        // Рисуем изображение в канвасе
        ctx.drawImage(img, 0, 0, width, height);

        // Обновляем источник изображения на сжатое изображение
        imgElement.src = canvas.toDataURL("image/jpeg", 0.7); // Выбор формата JPEG и уменьшение качества до 70%

        // Устанавливаем стиль для предотвращения искажения
        imgElement.style.maxWidth = "200px";
        imgElement.style.maxHeight = "200px";
        imgElement.style.objectFit = "contain"; // Сохранение пропорций при отображении

        imgElement.classList.add("preview-img");
        imgElement.onclick = () => toggleSelectImage(file, imgElement); // Добавление обработчика клика для выбора изображения
        previewContainer.appendChild(imgElement);

        if (matches.includes(file.name)) {
          imgElement.classList.add("matched"); // Подсветка совпадений
        }
      };
    });

    updateMatchCount(); // Обновление счётчика совпадений
  };

  // Функция для переключения выбора изображения
  const toggleSelectImage = (file, imgElement) => {
    const index = selectedImages.indexOf(file.name);
    if (index > -1) {
      selectedImages.splice(index, 1); // Удаление из выбранных
      imgElement.classList.remove("selected");
    } else {
      selectedImages.push(file.name); // Добавление в выбранные
      imgElement.classList.add("selected");
    }

    updateMatchCount(); // Обновление счётчика совпадений
  };

  // Функция для обновления счётчика совпадений
  const updateMatchCount = () => {
    const uniqueSelectedImages = Array.from(
      new Set([...matches, ...selectedImages]) // Объединение и удаление дубликатов
    );
    matchesDiv.innerHTML = "Совпадения: " + uniqueSelectedImages.join(", ");
    statsDiv.innerHTML = `Общее количество совпадений: ${uniqueSelectedImages.length}`;
  };

  // Функция для загрузки выбранных файлов
  const downloadSelectedFiles = () => {
    const zip = new JSZip(); // Создание zip-архива
    const folder = zip.folder("matched_files"); // Создание папки в архиве

    const allFilesToDownload = Array.from(
      new Set([...matches, ...selectedImages]) // Объединение совпадений и выбранных файлов
    );

    const fileReadPromises = allFilesToDownload
      .map((fileName) => {
        const file = filesArray.find((f) => f.name === fileName); // Поиск файла в массиве
        if (file) {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function (e) {
              folder.file(file.name, e.target.result); // Добавление файла в папку архива
              resolve();
            };
            reader.onerror = reject; // Обработка ошибок чтения
            reader.readAsArrayBuffer(file); // Чтение файла как ArrayBuffer
          });
        }
      })
      .filter(Boolean);

    // Генерация zip-архива
    Promise.all(fileReadPromises).then(() => {
      zip.generateAsync({ type: "blob" }).then(function (content) {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(content); // Создание ссылки для загрузки
        link.download = "Выбранные фото.zip"; // Имя для загружаемого файла
        link.click(); // Автоматический клик для начала загрузки
      });
    });
  };

  // Обработчики событий
  checkButton.addEventListener("click", handleCheck); // Кнопка проверки
  numberInput.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      handleCheck(); // Проверка по нажатию Enter
    }
  });

  previewButton.addEventListener("click", showPreview); // Кнопка предпросмотра
  downloadButton.addEventListener("click", downloadSelectedFiles); // Кнопка загрузки

  // Подсветка совпадения
  function highlightMatch(fileName) {
    fileList.querySelectorAll("li").forEach((li) => {
      if (li.textContent === fileName) {
        li.classList.add("match");
      }
    });
  }

  // Подсветка дубликата
  function highlightDuplicate(fileName) {
    fileList.querySelectorAll("li").forEach((li) => {
      if (li.textContent.includes(fileName)) {
        li.classList.add("duplicate");
      }
    });
  }

  // Обработчик сброса
  resetButton.addEventListener("click", function () {
    fileInput.value = ""; // Очистка инпутов
    fileList.innerHTML = "";
    matchesDiv.innerHTML = "";
    statsDiv.innerHTML = "";
    numberInput.value = "";
    downloadButton.style.display = "none"; // Скрыть кнопку загрузки
    resetButton.style.display = "none"; // Скрыть кнопку сброса
    previewButton.style.display = "none"; // Скрыть кнопку предпросмотра
    previewContainer.style.display = "none"; // Скрыть контейнер предпросмотра
    filesArray = []; // Сброс всех массивов
    selectedImages = [];
    matches = [];
  });
});
