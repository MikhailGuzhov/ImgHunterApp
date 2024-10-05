// Ждем полной загрузки DOM
document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("fileInput"); // Ввод файла
  const fileList = document.getElementById("fileList"); // Список загруженных файлов
  const numberInput = document.getElementById("numberInput"); // Ввод чисел для проверки
  const checkButton = document.getElementById("checkButton"); // Кнопка для проверки
  const matchesDiv = document.getElementById("matches"); // Блок для отображения совпадений
  const statsDiv = document.getElementById("stats"); // Блок для отображения статистики
  const downloadButton = document.getElementById("downloadButton"); // Кнопка для загрузки файлов
  const resetButton = document.getElementById("resetButton"); // Кнопка сброса
  const previewButton = document.getElementById("previewButton"); // Кнопка для просмотра изображений
  const previewContainer = document.getElementById("previewContainer"); // Контейнер для отображения превью изображений

  let filesArray = []; // Массив для хранения загруженных файлов
  let selectedImages = []; // Массив для хранения выбранных изображений
  let matches = []; // Массив для хранения совпадений

  // Обработчик изменения входного файла
  fileInput.addEventListener("change", function () {
    fileList.innerHTML = ""; // Очистить список файлов
    filesArray = Array.from(fileInput.files); // Преобразовать файлы в массив
    filesArray.forEach((file) => {
      const li = document.createElement("li"); // Создать элемент списка для файла
      li.textContent = file.name; // Установить название файла в текст
      fileList.appendChild(li); // Добавить элемент списка в список
    });
  });

  // Функция для транслитерации русского текста в английский
  const transliterate = (text) => {
    const ruToEn = { /* карта русских букв в английские */ };
    return text
      .split("")
      .map((char) => ruToEn[char] || char) // Заменяем символы по карте
      .join(""); // Преобразуем массив обратно в строку
  };

  // Обработчик проверки чисел на совпадение с названиями файлов
  const handleCheck = () => {
    const separators = /[\s,;:]+/; // Разделители для чисел
    const numbers = numberInput.value
      .split(separators) // Разделяем ввод на числа
      .map((num) => num.trim()) // Убираем пробелы
      .filter((num) => num); // Фильтруем пустые значения

    if (numbers.length === 0) {
      console.log("Нет введённых чисел для проверки."); // Если нет чисел для проверки
      return;
    }

    matches = []; // Сбросить массив совпадений
    const duplicates = new Set(); // Множество для хранения дубликатов
    const seenNames = new Set(); // Множество для отслеживания уже увиденных имен файлов

    const normalizedNumbers = numbers.map((num) => transliterate(num)); // Транслитерируем введённые числа

    filesArray.forEach((file) => {
      const fileName = file.name; // Название файла
      const normalizedFileName = transliterate(fileName); // Транслитерируем название файла

      normalizedNumbers.forEach((num) => { // Для каждого числа
        const regex = new RegExp(num, "i"); // Регулярное выражение для проверки совпадения
        if (regex.test(normalizedFileName)) { // Если совпадение найдено
          matches.push(fileName); // Добавляем файл в массив совпадений
          highlightMatch(fileName); // Подсвечиваем совпадение
        }
      });

      if (seenNames.has(fileName)) { // Проверка на дубликат
        duplicates.add(fileName); // Если дубликат найден, добавляем его
        highlightDuplicate(fileName); // Подсвечиваем дубликат
      } else {
        seenNames.add(fileName); // Если нет, добавляем его в множество
      }
    });

    // Поиск дубликатов в введённых числах
    const inputNumbersDuplicates = numbers.filter(
      (num, index) => numbers.indexOf(num) !== index
    );
    inputNumbersDuplicates.forEach((duplicateNum) => {
      highlightDuplicate(duplicateNum); // Подсветка дублированных чисел
    });

    const uniqueMatches = Array.from(new Set(matches)); // Уникальные совпадения
    const totalMatches = uniqueMatches.length; // Общее количество совпадений
    const totalDuplicates = duplicates.size + inputNumbersDuplicates.length; // Подсчет всех дубликатов

    // Обновление интерфейса
    matchesDiv.innerHTML = "Совпадения: " + uniqueMatches.join(", ");
    statsDiv.innerHTML = `Общее количество совпадений: ${totalMatches} <br> Количество дубликатов: ${totalDuplicates}`;
    downloadButton.style.display = totalMatches > 0 ? "block" : "none"; // Показать кнопку загрузки, если есть совпадения
    resetButton.style.display = "block"; // Показать кнопку сброса
    previewButton.style.display = totalMatches > 0 ? "block" : "none"; // Показать кнопку просмотра, если есть совпадения

    numberInput.value = ""; // Очистить поле ввода чисел
  };

  // Функция для показа превью изображений
  const showPreview = () => {
    fileList.style.display = "none"; // Скрыть список файлов
    previewContainer.innerHTML = ""; // Очистить контейнер превью
    previewContainer.style.display = "flex"; // Показать контейнер для изображений
    previewContainer.style.flexWrap = "wrap"; // Оборачиваем изображения

    filesArray.forEach((file) => {
      const imgElement = document.createElement("img"); // Создаем элемент изображения
      imgElement.src = URL.createObjectURL(file); // Устанавливаем источник в объект URL файла
      imgElement.alt = file.name; // Устанавливаем атрибут alt с именем файла
      imgElement.classList.add("preview-img"); // Добавляем класс для стилей
      imgElement.onclick = () => toggleSelectImage(file, imgElement); // Обработчик для выбора изображения
      previewContainer.appendChild(imgElement); // Добавляем изображение в контейнер превью

      // Если файл совпадает с искомыми, подсвечиваем его
      if (matches.includes(file.name)) {
        imgElement.classList.add("matched");
      }
    });

    updateMatchCount(); // Обновляем счетчик совпадений
  };

  // Функция для выбора/отмены выбора изображения
  const toggleSelectImage = (file, imgElement) => {
    const index = selectedImages.indexOf(file.name); // Проверяем, выбран файл или нет
    if (index > -1) {
      selectedImages.splice(index, 1); // Если выбран, удаляем его
      imgElement.classList.remove("selected"); // Убираем выделение
    } else {
      selectedImages.push(file.name); // Если не выбран, добавляем его
      imgElement.classList.add("selected"); // Устанавливаем выделение
    }

    updateMatchCount(); // Обновляем счетчик
  };

  // Функция для обновления отображения совпадений
  const updateMatchCount = () => {
    const uniqueSelectedImages = Array.from(
      new Set([...matches, ...selectedImages]) // Уникальные выбранные изображения
    );
    matchesDiv.innerHTML = "Совпадения: " + uniqueSelectedImages.join(", "); // Обновляем блок с совпадениями
    statsDiv.innerHTML = `Общее количество совпадений: ${uniqueSelectedImages.length}`; // Обновляем статистику
  };

  // Функция для загрузки выбранных файлов в zip-архив
  const downloadSelectedFiles = () => {
    if (filesArray.length === 0 || matches.length === 0) {
      alert("Нет файлов для загрузки."); // Предупреждение, если нет файлов
      return; // Выход из функции
    }

    const zip = new JSZip(); // Создаем новый zip-архив
    const folder = zip.folder("matched_files"); // Создаем папку внутри архива

    const allFilesToDownload = Array.from(
      new Set([...matches, ...selectedImages]) // Уникальные файлы для загрузки
    );

    const fileReadPromises = allFilesToDownload
      .map((fileName) => {
        const file = filesArray.find((f) => f.name === fileName); // Находим файл в массиве
        if (file) {
          return new Promise((resolve, reject) => {
            const reader = new FileReader(); // Создаем новый FileReader
            reader.onload = function (e) {
              folder.file(file.name, e.target.result); // Добавляем файл в архив
              resolve(); // Успешное выполнение
            };
            reader.onerror = reject; // Обработка ошибки
            reader.readAsArrayBuffer(file); // Чтение файла как массива байтов
          });
        }
      })
      .filter(Boolean); // Фильтруем пустые значения

    Promise.all(fileReadPromises).then(() => {
      zip.generateAsync({ type: "blob" }).then(function (content) { // Генерация zip-файла
        const link = document.createElement("a"); // Создаем элемент ссылки
        link.href = URL.createObjectURL(content); // Устанавливаем URL для нашего zip
        link.download = "Выбранные фото.zip"; // Устанавливаем имя для загрузки
        link.click(); // Симулируем клик по ссылке для начала загрузки
      });
    });
  };

  // Обработчики событий для кнопок
  checkButton.addEventListener("click", handleCheck); // Проверка на совпадение
  numberInput.addEventListener("keypress", function (event) { // Проверка при нажатии клавиш
    if (event.key === "Enter") {
      handleCheck(); // Вызываем проверку при нажатии Enter
    }
  });

  previewButton.addEventListener("click", showPreview); // Показ превью изображений
  downloadButton.addEventListener("click", downloadSelectedFiles); // Загрузка файлов

  // Подсветка совпадений в списке
  function highlightMatch(fileName) {
    fileList.querySelectorAll("li").forEach((li) => {
      if (li.textContent === fileName) {
        li.classList.add("match"); // Добавляем класс для подсветки
      }
    });
  }

  // Подсветка дубликатов в списке
  function highlightDuplicate(fileName) {
    fileList.querySelectorAll("li").forEach((li) => {
      if (li.textContent.includes(fileName)) {
        li.classList.add("duplicate"); // Добавляем класс для дубликатов
      }
    });
  }

  // Обработчик кнопки сброса
  resetButton.addEventListener("click", function () {
    fileInput.value = ""; // Очистка поля ввода
    fileList.innerHTML = ""; // Очистка списка файлов
    matchesDiv.innerHTML = ""; // Очистка блока совпадений
    statsDiv.innerHTML = ""; // Очистка статистики
    numberInput.value = ""; // Очистка поля ввода чисел
    downloadButton.style.display = "none"; // Скрыть кнопку загрузки
    resetButton.style.display = "none"; // Скрыть кнопку сброса
    previewButton.style.display = "none"; // Скрыть кнопку превью
    previewContainer.style.display = "none"; // Скрыть контейнер превью
    filesArray = []; // Сброс массива файлов
    selectedImages = []; // Сброс массива выбранных изображений
    matches = []; // Сброс массива совпадений
  });
});
