
const endpoint = 'https://script.google.com/macros/s/AKfycbx14GYGCC21TmkXyVtGR4M_2XKsW034_5kgJUESBxjX9yBBbVBovAYbyoCgH2dv_2B2/exec';
let pantryItems = [];
let currentSheet = 'Pantry'; // Default tab

function toggleDropdown() {
  const dropdown = document.getElementById("categoryDropdown");
  dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
}

function selectCategory(category) {
  currentSheet = category;
  document.getElementById("categoryDropdown").style.display = "none";
  loadPantry(currentSheet);
}

document.addEventListener("click", function (event) {
  const dropdown = document.getElementById("categoryDropdown");
  const button = document.querySelector(".dropbtn");
  if (!dropdown.contains(event.target) && !button.contains(event.target)) {
    dropdown.style.display = "none";
  }
});

function addClickEffect(button) {
  button.classList.add("click-effect");
  setTimeout(() => {
    button.classList.remove("click-effect");
  }, 150);
}
function formatDateToMonthDay(dateString) {
  const date = new Date(dateString);
  if (isNaN(date)) return '';
  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'long' });
  const suffix =
    day >= 11 && day <= 13 ? 'th' :
    day % 10 === 1 ? 'st' :
    day % 10 === 2 ? 'nd' :
    day % 10 === 3 ? 'rd' : 'th';
  return `${month} ${day}${suffix}`;
}

async function loadPantry(sheet = 'Pantry') {
  try {
    const res = await fetch(`${endpoint}?sheet=${encodeURIComponent(sheet)}`);
    document.getElementById('currentSheetLabel').textContent = currentSheet;

    pantryItems = await res.json();
    pantryItems.sort((a, b) => a.item.localeCompare(b.item));
    renderPantryList(pantryItems);
  } catch (error) {
    document.getElementById('pantryList').textContent = 'Failed to load pantry data.';
    console.error('Load error:', error);
  }
}

function renderPantryList(items) {
  const container = document.getElementById('pantryList');
  container.innerHTML = '';

  if (items.length === 0) {
    container.textContent = 'No items match your search.';
    return;
  }

  container.style.display = 'grid';
  container.style.gridTemplateColumns = 'repeat(auto-fit, minmax(300px, 1fr))';
  container.style.gap = '20px';

 items.forEach(({ item, quantity, category, timestamp }) => {
    const div = document.createElement('div');
    div.className = 'item';
    div.style.border = '1px solid #ccc';
    div.style.padding = '10px';
    div.style.borderRadius = '12px';

    div.innerHTML = `
      <div style="display: flex; align-items: center; gap: 20px;">
        <div style="text-align: left; width: 160px; word-wrap: break-word;">
          <strong>${item}</strong><br />
          <em style="color: gray;">${category}</em><br />
          Quantity: <span id="qty-${item}">${quantity}</span><br />
          ${currentSheet === 'Fridge' && timestamp ? `<span style="font-size: 12px; color: #888;">Last Added: ${(timestamp)}</span>` : ''}


        </div>
        <div style="text-align: center;">
          <div style="display: flex; align-items: center;">
            <button onclick="adjustItem('${item.replace(/'/g, "\\'")}', 'add'); addClickEffect(this);"
              style="background-image: linear-gradient(#F74902, #F74910); margin-right: 10px; border-radius: 12px; color:black; width: 55px; height: 55px; font-size: 24px;">+</button>
            <button onclick="adjustItem('${item.replace(/'/g, "\\'")}', 'subtract'); addClickEffect(this);"
              style="background-color: black; color:#F74902; width: 55px; height: 55px; font-size: 32px; padding-bottom: 5px; border-radius: 12px;">-</button>
          </div>
          <input type="number" id="input-${item}" placeholder="Amount" min="1"
            style="width: 75px; margin-top: 10px;" />
          <button onclick="deleteItem('${item.replace(/'/g, "\\'")}'); addClickEffect(this);" 
            style="background-color: red; color: white; border: none; width: 18px; height: 18px; font-size: 10px; margin-left: 4px; cursor: pointer;">
            ✕
          </button>
        </div>
      </div>
    `;

    container.appendChild(div);
  });
}

function deleteItem(itemName) {
  if (!confirm(`Are you sure you want to delete "${itemName}"?`)) return;

  const url = `${endpoint}?sheet=${encodeURIComponent(currentSheet)}&action=delete&item=${encodeURIComponent(itemName)}`;
  fetch(url)
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert(`"${itemName}" deleted successfully.`);
        loadPantry(currentSheet);
      } else {
        alert('Delete failed: ' + data.error);
      }
    })
    .catch(err => {
      console.error('Delete error:', err);
      alert('Something went wrong.');
    });
}

async function adjustItem(item, action) {
  const input = document.getElementById(`input-${item}`);
  const amount = Number(input.value);
  const validAmount = amount > 0 ? amount : 1;

  const url = `${endpoint}?sheet=${encodeURIComponent(currentSheet)}&item=${encodeURIComponent(item)}&action=${action}&amount=${validAmount}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.success) {
      loadPantry(currentSheet);
      input.value = '';
    } else {
      alert('Update failed: ' + data.error);
    }
  } catch (error) {
    alert('Failed to update item.');
    console.error(error);
  }
}

function addNewItem() {
  document.getElementById('addItemModal').style.display = 'block';
}

function closeModal() {
  document.getElementById('addItemModal').style.display = 'none';
}

async function submitNewItem() {
  const item = document.getElementById('newItemName').value.trim();
  const category = document.getElementById('newItemCategory').value.trim();

  if (!item) {
    alert("Item Name is required.");
    return;
  }

  const url = `${endpoint}?sheet=${encodeURIComponent(currentSheet)}&action=addNew&item=${encodeURIComponent(item)}&category=${encodeURIComponent(category)}`;
  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.success) {
      pantryItems.push({ item, quantity: 1, category });
      pantryItems.sort((a, b) => a.item.localeCompare(b.item));
      renderPantryList(pantryItems);
      closeModal();
    } else {
      alert("Error: " + data.error);
    }
  } catch (error) {
    alert("Error adding item.");
    console.error(error);
  }
}

// Search input handling
let pantryInterval = setInterval(() => loadPantry(currentSheet), 15000);
let resumeTimeout = null;

document.getElementById('searchBox').addEventListener('input', function () {
  const searchBox = this;
  const query = searchBox.value.trim().toLowerCase();

  clearInterval(pantryInterval);
  if (resumeTimeout) clearTimeout(resumeTimeout);

  resumeTimeout = setTimeout(() => {
    searchBox.value = '';
    renderPantryList(pantryItems);
    pantryInterval = setInterval(() => loadPantry(currentSheet), 15000);
  }, 20000);

  if (!query) {
    renderPantryList(pantryItems);
    return;
  }

  const filtered = pantryItems.filter(({ item, category }) =>
    item.toLowerCase().includes(query) ||
    (category && category.toLowerCase().includes(query))
  );

  renderPantryList(filtered);
});

// Initial load
loadPantry(currentSheet);
