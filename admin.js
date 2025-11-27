// ניהול מתכונים

document.addEventListener('DOMContentLoaded', async () => {
    await loadAdminRecipes();
    setupForm();
});

async function loadAdminRecipes() {
    const recipesList = document.getElementById('admin-recipes-list');
    const recipes = await loadRecipes();
    
    if (recipes.length === 0) {
        recipesList.innerHTML = '<div class="loading">אין מתכונים עדיין</div>';
        return;
    }
    
    recipesList.innerHTML = recipes.map(recipe => `
        <div class="admin-recipe-item">
            <h3>${recipe.name}</h3>
            <p>רכיבי קיט: ${recipe.kitIngredients.length}</p>
            <p>מים ל-10 ק"ג: ${recipe.waterAmount} ליטר</p>
            <p>תנור: ${recipe.ovenTemp}°C, ${recipe.ovenTime} דקות</p>
            <div class="admin-recipe-actions">
                <button class="btn-edit" onclick="editRecipe('${recipe.id}')">ערוך</button>
                <button class="btn-delete" onclick="deleteRecipe('${recipe.id}')">מחק</button>
            </div>
        </div>
    `).join('');
}

function setupForm() {
    const form = document.getElementById('add-recipe-form');
    const addIngredientBtn = document.getElementById('add-kit-ingredient');
    
    // הוספת רכיב קיט
    addIngredientBtn.addEventListener('click', () => {
        const container = document.getElementById('kit-ingredients-inputs');
        const newRow = document.createElement('div');
        newRow.className = 'ingredient-row';
        newRow.innerHTML = `
            <input type="text" placeholder="שם רכיב" class="ingredient-name">
            <input type="number" placeholder="כמות" class="ingredient-amount" step="0.01" min="0">
            <select class="ingredient-unit">
                <option value="גרם">גרם</option>
                <option value="ק"ג">ק"ג</option>
                <option value="מ"ל">מ"ל</option>
                <option value="ליטר">ליטר</option>
                <option value="כפיות">כפיות</option>
                <option value="כפות">כפות</option>
                <option value="כוסות">כוסות</option>
                <option value="יחידות">יחידות</option>
                <option value="חבילות">חבילות</option>
            </select>
            <button type="button" class="remove-ingredient" onclick="this.parentElement.remove()">×</button>
        `;
        container.appendChild(newRow);
    });
    
    // מחיקת רכיב
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-ingredient')) {
            e.target.parentElement.remove();
        }
    });
    
    // שליחת טופס
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('recipe-name-input').value;
        const waterAmount = parseFloat(document.getElementById('water-amount-input').value);
        const ovenTemp = parseInt(document.getElementById('oven-temp-input').value);
        const ovenTime = parseInt(document.getElementById('oven-time-input').value);
        const ovenNotes = document.getElementById('oven-notes-input').value;
        
        const ingredientRows = document.querySelectorAll('.ingredient-row');
        const kitIngredients = Array.from(ingredientRows).map(row => {
            const nameInput = row.querySelector('.ingredient-name');
            const amountInput = row.querySelector('.ingredient-amount');
            const unitSelect = row.querySelector('.ingredient-unit');
            
            if (!nameInput.value || !amountInput.value) return null;
            
            return {
                name: nameInput.value,
                amount: parseFloat(amountInput.value),
                unit: unitSelect ? unitSelect.value : 'גרם'
            };
        }).filter(ing => ing !== null);
        
        if (kitIngredients.length === 0) {
            alert('יש להוסיף לפחות רכיב קיט אחד');
            return;
        }
        
        const recipe = {
            id: generateId(),
            name,
            kitIngredients,
            waterAmount,
            ovenTemp,
            ovenTime,
            ovenNotes: ovenNotes || ''
        };
        
        const recipes = await loadRecipes();
        recipes.push(recipe);
        
        try {
            // הצגת הודעת טעינה
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'שומר...';
            submitBtn.disabled = true;
            
            await saveRecipes(recipes);
            
            alert('מתכון נשמר בהצלחה!');
            form.reset();
            
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        } catch (error) {
            console.error('שגיאה:', error);
            alert('שגיאה בשמירת המתכונים. נסה שוב.\n\nפרטים: ' + error.message);
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.textContent = 'שמור מתכון';
            return;
        }
        document.getElementById('kit-ingredients-inputs').innerHTML = `
            <div class="ingredient-row">
                <input type="text" placeholder="שם רכיב" class="ingredient-name">
                <input type="number" placeholder="כמות" class="ingredient-amount" step="0.01" min="0">
                <select class="ingredient-unit">
                    <option value="גרם">גרם</option>
                    <option value="ק"ג">ק"ג</option>
                    <option value="מ"ל">מ"ל</option>
                    <option value="ליטר">ליטר</option>
                    <option value="כפיות">כפיות</option>
                    <option value="כפות">כפות</option>
                    <option value="כוסות">כוסות</option>
                    <option value="יחידות">יחידות</option>
                    <option value="חבילות">חבילות</option>
                </select>
                <button type="button" class="remove-ingredient">×</button>
            </div>
        `;
        
        await loadAdminRecipes();
    });
}

async function deleteRecipe(recipeId) {
    if (!confirm('האם אתה בטוח שברצונך למחוק מתכון זה?')) {
        return;
    }
    
        const recipes = await loadRecipes();
        const filtered = recipes.filter(r => r.id !== recipeId);
        
        try {
            await saveRecipes(filtered);
            await loadAdminRecipes();
        } catch (error) {
            console.error('שגיאה:', error);
            alert('שגיאה במחיקת המתכון. נסה שוב.');
        }
}

async function editRecipe(recipeId) {
    const recipes = await loadRecipes();
    const recipe = recipes.find(r => r.id === recipeId);
    
    if (!recipe) return;
    
    // טעינת הנתונים לטופס
    document.getElementById('recipe-name-input').value = recipe.name;
    document.getElementById('water-amount-input').value = recipe.waterAmount;
    document.getElementById('oven-temp-input').value = recipe.ovenTemp;
    document.getElementById('oven-time-input').value = recipe.ovenTime;
    document.getElementById('oven-notes-input').value = recipe.ovenNotes || '';
    
    const container = document.getElementById('kit-ingredients-inputs');
    const units = ['גרם', 'ק"ג', 'מ"ל', 'ליטר', 'כפיות', 'כפות', 'כוסות', 'יחידות', 'חבילות'];
    container.innerHTML = recipe.kitIngredients.map(ing => {
        const unitOptions = units.map(unit => 
            `<option value="${unit}" ${unit === ing.unit ? 'selected' : ''}>${unit}</option>`
        ).join('');
        return `
        <div class="ingredient-row">
            <input type="text" placeholder="שם רכיב" class="ingredient-name" value="${ing.name}">
            <input type="number" placeholder="כמות" class="ingredient-amount" step="0.01" min="0" value="${ing.amount}">
            <select class="ingredient-unit">${unitOptions}</select>
            <button type="button" class="remove-ingredient">×</button>
        </div>
        `;
    }).join('');
    
    // מחיקת המתכון הישן ושמירת החדש
    const form = document.getElementById('add-recipe-form');
    const originalSubmit = form.onsubmit;
    
    form.onsubmit = async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('recipe-name-input').value;
        const waterAmount = parseFloat(document.getElementById('water-amount-input').value);
        const ovenTemp = parseInt(document.getElementById('oven-temp-input').value);
        const ovenTime = parseInt(document.getElementById('oven-time-input').value);
        const ovenNotes = document.getElementById('oven-notes-input').value;
        
        const ingredientRows = document.querySelectorAll('.ingredient-row');
        const kitIngredients = Array.from(ingredientRows).map(row => {
            const nameInput = row.querySelector('.ingredient-name');
            const amountInput = row.querySelector('.ingredient-amount');
            const unitSelect = row.querySelector('.ingredient-unit');
            
            if (!nameInput.value || !amountInput.value) return null;
            
            return {
                name: nameInput.value,
                amount: parseFloat(amountInput.value),
                unit: unitSelect ? unitSelect.value : 'גרם'
            };
        }).filter(ing => ing !== null);
        
        const updatedRecipe = {
            id: recipeId,
            name,
            kitIngredients,
            waterAmount,
            ovenTemp,
            ovenTime,
            ovenNotes: ovenNotes || ''
        };
        
        const recipes = await loadRecipes();
        const filtered = recipes.filter(r => r.id !== recipeId);
        filtered.push(updatedRecipe);
        
        try {
            await saveRecipes(filtered);
            alert('מתכון עודכן בהצלחה!');
            form.reset();
            form.onsubmit = originalSubmit;
            await loadAdminRecipes();
        } catch (error) {
            console.error('שגיאה:', error);
            alert('שגיאה בעדכון המתכון. נסה שוב.');
        }
    };
    
    // גלילה לטופס
    document.querySelector('.add-recipe-section').scrollIntoView({ behavior: 'smooth' });
}

