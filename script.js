let csvData = [];
let selectedCategory = null;
let selectedProduct = null;
let selectedAction = null;
let stepCounter = 1; // Счетчик для нумерации шагов

// Загрузка CSV-файла
function loadCSV() {
    fetch('matrica.csv')
        .then(response => response.text())
        .then(text => {
            csvData = parseCSV(text);
            showCategorySelect();

        })
        .catch(error => console.error('Ошибка загрузки CSV:', error));

}

function parseCSV(text) {
    const result = [];
    
    let row = [];       // Текущая строка (массив из 5 полей)
    let field = "";     // Текущее накапливаемое значение поля
    let inQuotes = false;  // Флаг "мы сейчас внутри кавычек?"
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      // Проверяем кавычку
      if (char === '"') {
        // Если внутри кавычек и следующая тоже кавычка => это экранированная "
        if (inQuotes && i + 1 < text.length && text[i + 1] === '"') {
          field += '"'; // Добавляем в поле саму кавычку
          i++;          // Пропускаем следующую кавычку
        } else {
          // Переключаем состояние inQuotes
          inQuotes = !inQuotes;
        }
      }
      // Если встречаем запятую вне кавычек -> это граница поля
      else if (char === ',' && !inQuotes) {
        row.push(field);
        field = "";
      }
      // Если встречаем перенос строки (LF или CRLF) вне кавычек -> это граница записи
      else if ((char === '\n' || char === '\r') && !inQuotes) {
        // Если это \r и за ним \n - пропустим \n
        if (char === '\r' && i + 1 < text.length && text[i + 1] === '\n') {
          i++;
        }
        // Закрываем текущее поле
        row.push(field);
        field = "";
        // Сохраняем (если длина соответствует количеству полей)
        // Или можно не проверять, а просто добавлять
        if (row.length === 5) {
          result.push({
            category:    row[0],
            product:     row[1],
            action:      row[2],
            description: row[3],
            code:        row[4],
          });
        } else {
          // Можете добавить свою логику — что делать, если не 5 полей
          // (напр. пропустить или сохранить всё как есть)
          // console.warn("Found row with", row.length, "fields:", row);
        }
        // Обнуляем row
        row = [];
      }
      // Обычный символ (просто добавляем в field)
      else {
        field += char;
      }
    }
    
    // Если в конце строки не было переноса (или файл не заканчивается переносом) —
    // обрабатываем "хвост" (последнюю запись)
    if (field.length > 0 || row.length > 0) {
      row.push(field);
      if (row.length === 5) {
        result.push({
          category:    row[0],
          product:     row[1],
          action:      row[2],
          description: row[3],
          code:        row[4],
        });
      } else {
        // console.warn("Found row with", row.length, "fields at the end:", row);
      }
    }
    
    return result;
}
  
  

// Показать выбор категории
function showCategorySelect() {
    const categorySelect = document.getElementById('category-select');
    const categoryOptions = document.querySelector('.category-options');
    categoryOptions.innerHTML = '';

    // Получаем уникальные категории из CSV
    const categories = [...new Set(csvData.map(item => item.category))];

    if (categories.length > 0) {
        categories.forEach(category => {
            const categoryOption = document.createElement('div');
            categoryOption.classList.add('category-option');
            categoryOption.setAttribute('data-category', category);

            // Загружаем изображение из папки assets
            const img = document.createElement('img');
            img.src = `assets/${category.toLowerCase()}.webp`;
            img.alt = category;

            const p = document.createElement('p');
            p.textContent = category;

            categoryOption.appendChild(img);
            categoryOption.appendChild(p);

            categoryOption.addEventListener('click', () => {
                selectedCategory = category;
                clearSelection('.category-option');
                categoryOption.classList.add('selected');
                showProducts(category);
            });
            categoryOptions.appendChild(categoryOption);
        });
        categorySelect.classList.remove('hidden');
    }
}

// Функция для отображения продуктов
function showProducts(category) {
    const productSelect = document.getElementById('product-select');
    const productItems = document.querySelector('.product-items');
    productItems.innerHTML = '';

    const products = [...new Set(csvData
        .filter(item => item.category === category)
        .map(item => item.product)
    )];

    if (products.length > 0) {
        products.forEach(product => {
            const productItem = document.createElement('div');
            productItem.classList.add('product-item');
            productItem.textContent = product;
            productItem.addEventListener('click', () => {
                selectedProduct = product;
                clearSelection('.product-item');
                productItem.classList.add('selected');
                showActions(category, product);
            });
            productItems.appendChild(productItem);
        });
        productSelect.classList.remove('hidden');
    }
}

// Функция для отображения действий
function showActions(category, product) {
    const actionSelect = document.getElementById('action-select');
    const actionItems = document.querySelector('.action-items');
    actionItems.innerHTML = '';

    const actions = csvData
        .filter(item => item.category === category && item.product === product)
        .map(item => item.action);

    if (actions.length > 0) {
        actions.forEach(action => {
            const actionItem = document.createElement('div');
            actionItem.classList.add('action-item');
            actionItem.textContent = action;
            actionItem.addEventListener('click', () => {
                selectedAction = action;
                clearSelection('.action-item');
                actionItem.classList.add('selected');
                showRecipeText(category, product, action);
                document.getElementById('add-button').classList.remove('hidden');
            });
            actionItems.appendChild(actionItem);
        });
        actionSelect.classList.remove('hidden');
    }
}

// Функция для отображения текста рецепта
function showRecipeText(category, product, action) {
    const selectedData = csvData.find(item => 
        item.category === category &&
        item.product === product &&
        item.action === action
    );

    if (selectedData) {
        document.getElementById('recipe-text').textContent = selectedData.description;
        document.getElementById('selected-recipe').classList.remove('hidden');
    }
}

// Обработчик для добавления шага в рецепт старый обработчик
document.getElementById('add-button').addEventListener('click', () => {
    const selectedData = csvData.find(item => 
        item.category === selectedCategory &&
        item.product === selectedProduct &&
        item.action === selectedAction
    );

    if (selectedData) {
        const recipeSteps = document.getElementById('recipe-steps');
        if (recipeSteps.textContent === '') {
            recipeSteps.textContent = `${stepCounter})${selectedData.code}`;
        } else {
            recipeSteps.textContent += ` ${stepCounter})${selectedData.code}`;
        }
        stepCounter++;
        // Показываем блок рецепта и кнопки "Сохранить рецепт" и "Очистить рецепт"
        document.getElementById('recipe').classList.remove('hidden');
        document.getElementById('save-button').classList.remove('hidden');
        document.getElementById('clear-button').classList.remove('hidden');
        resetSelection();
    }
});


// // Обработчик для кнопки "Сохранить рецепт"
document.getElementById('save-button').addEventListener('click', () => {
    const recipeStepsElement = document.getElementById('recipe-steps');
    const recipeText = recipeStepsElement.textContent;
    const customKey = document.getElementById('save-key-input').value;
    if (recipeText.trim() !== '') {
        // Отправляем рецепт и ключ на backend через POST запрос
        fetch('http://localhost:3000/api/recipes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customKey: customKey, content: recipeText })
        })
        .then(response => response.json())
        .then(data => {
            console.log('Рецепт сохранён:', data);
            // loadRecipes(); Обновляем список сохранённых рецептов
            // Здесь не вызываем loadRecipes(), поэтому рецепт не будет сразу отображён
        })
        .catch(err => console.error('Ошибка сохранения рецепта:', err));
        
        // Очищаем рецепт, сбрасываем счетчик и скрываем блок
        recipeStepsElement.textContent = '';
        stepCounter = 1;
        document.getElementById('recipe').classList.add('hidden');
    } else {
        alert('Нет рецепта для сохранения!');
    }
});

// Обработчик для кнопки "Очистить рецепт"
document.getElementById('clear-button').addEventListener('click', () => {
    const recipeStepsElement = document.getElementById('recipe-steps');
    recipeStepsElement.textContent = '';
    stepCounter = 1;
    document.getElementById('recipe').classList.add('hidden');
});

// Обработчик для кнопки "Загрузить рецепт"
document.getElementById('load-button').addEventListener('click', () => {
    const key = document.getElementById('load-key-input').value;
    if (key.trim() === '') {
        alert('Введите ключ для загрузки');
        return;
    }
    fetch(`http://localhost:3000/api/recipes/key/${key}`)
      .then(response => response.json())
      .then(data => {
          if (data.error) {
              alert(data.error);
          } else {
              // Отображаем загруженный рецепт в блоке loaded-recipe
              document.getElementById('loaded-recipe').textContent = data.recipe.content;
          }
      })
      .catch(err => console.error('Ошибка загрузки рецепта:', err));
});

// Функция для загрузки всех сохранённых рецептов (опционально)
function loadRecipes() {
    fetch('http://localhost:3000/api/recipes')
        .then(response => response.json())
        .then(data => {
            const savedRecipesContainer = document.getElementById('saved-recipes');
            savedRecipesContainer.innerHTML = '';
            data.recipes.forEach(recipe => {
                const recipeItem = document.createElement('p');
                recipeItem.textContent = `Ключ: ${recipe.custom_key || '-'} | ${recipe.content}`;
                savedRecipesContainer.appendChild(recipeItem);
            });
        })
        .catch(err => console.error('Ошибка загрузки рецептов:', err));
}

// Функция для сброса выбора
function resetSelection() {
    selectedCategory = null;
    selectedProduct = null;
    selectedAction = null;
    clearSelection('.category-option');
    clearSelection('.product-item');
    clearSelection('.action-item');
    document.getElementById('product-select').classList.add('hidden');
    document.getElementById('action-select').classList.add('hidden');
    document.getElementById('add-button').classList.add('hidden');
    document.getElementById('selected-recipe').classList.add('hidden');
    showCategorySelect();
}

// Функция для очистки выделения
function clearSelection(selector) {
    document.querySelectorAll(selector).forEach(item => {
        item.classList.remove('selected');
    });
}

// Загрузка CSV при запуске
loadCSV();
// Загрузка сохранённых рецептов при открытии страницы
// window.addEventListener('DOMContentLoaded', loadRecipes);
