// הגדרת Google Apps Script
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyKkk1HaNBH74P550y0OF9piHpOkJUbBAYDW4HITrNGWBwpcVzU_Jv1gVgG1M8c3IVi6Q/exec';

// פונקציה לטעינת מתכונים
async function loadRecipes() {
    try {
        const response = await fetch(`${APPS_SCRIPT_URL}?action=get`);
        const data = await response.json();
        return data.recipes || [];
    } catch (error) {
        console.error('שגיאה בטעינת מתכונים:', error);
        return [];
    }
}

// פונקציה לשמירת מתכונים
async function saveRecipes(recipes) {
    try {
        console.log('שולח מתכונים לשמירה:', recipes);
        
        const payload = {
            action: 'save',
            recipes: recipes
        };
        
        // Google Apps Script דורש no-cors mode
        // עם no-cors אנחנו לא יכולים לראות את התשובה, אז נשלח ונחכה
        await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        // נחכה קצת כדי לוודא שהשמירה הסתיימה
        // Google Apps Script צריך זמן לעבד את הבקשה
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('מתכונים נשלחו לשמירה');
        return true;
        
    } catch (error) {
        console.error('שגיאה בשמירת מתכונים:', error);
        // גם אם יש שגיאה, ננסה לשלוח עם no-cors (זה לא יזרוק שגיאה)
        try {
            await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action: 'save', recipes: recipes })
            });
            await new Promise(resolve => setTimeout(resolve, 2000));
            return true;
        } catch (error2) {
            console.error('שגיאה גם בניסיון השני:', error2);
            throw new Error('לא הצלחנו לשמור את המתכונים. בדוק את הקונסול לפרטים נוספים.');
        }
    }
}

// טעינת מתכונים בדף הראשי
document.addEventListener('DOMContentLoaded', async () => {
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        await initMainPage();
    }
});

async function initMainPage() {
    const recipesList = document.getElementById('recipes-list');
    const quantitySelection = document.getElementById('quantity-selection');
    const backBtn = document.getElementById('back-btn');
    const refreshBtn = document.getElementById('refresh-btn');
    
    // פונקציה לטעינת והצגת מתכונים
    const loadAndDisplayRecipes = async () => {
        recipesList.innerHTML = '<div class="loading">טוען מתכונים...</div>';
        
        const recipes = await loadRecipes();
        
        if (recipes.length === 0) {
            recipesList.innerHTML = '<div class="loading">אין מתכונים. <a href="admin.html">הוסף מתכון חדש</a></div>';
            return;
        }
        
        // הצגת מתכונים
        recipesList.innerHTML = recipes.map(recipe => 
            `<div class="recipe-card" data-recipe-id="${recipe.id}">${recipe.name}</div>`
        ).join('');
        
        // הוספת מאזינים לכרטיסי מתכונים
        document.querySelectorAll('.recipe-card').forEach(card => {
            card.addEventListener('click', () => {
                const recipeId = card.dataset.recipeId;
                recipesList.style.display = 'none';
                quantitySelection.classList.remove('hidden');
                
                // שמירת recipeId ב-sessionStorage
                sessionStorage.setItem('selectedRecipeId', recipeId);
            });
        });
    };
    
    // טעינה ראשונית
    await loadAndDisplayRecipes();
    
    // כפתור רענון
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            await loadAndDisplayRecipes();
        });
    }
    
    // כפתורי כמות
    document.querySelectorAll('.quantity-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const quantity = parseInt(btn.dataset.quantity);
            const recipeId = sessionStorage.getItem('selectedRecipeId');
            window.location.href = `kit.html?recipeId=${recipeId}&quantity=${quantity}`;
        });
    });
    
    // כפתור חזרה
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            quantitySelection.classList.add('hidden');
            recipesList.style.display = 'grid';
        });
    }
}

// טעינת שלב קיט
async function loadKitStage(recipeId, quantity) {
    const recipes = await loadRecipes();
    const recipe = recipes.find(r => r.id === recipeId);
    
    if (!recipe) {
        window.location.href = 'index.html';
        return;
    }
    
    document.getElementById('recipe-name').textContent = recipe.name;
    document.getElementById('quantity-badge').textContent = `${quantity} ק"ג`;
    
    const multiplier = quantity / 10; // בסיס הוא 10 ק"ג
    const ingredientsList = document.getElementById('kit-ingredients');
    
    ingredientsList.innerHTML = recipe.kitIngredients.map(ing => {
        const calculatedAmount = (ing.amount * multiplier).toFixed(2);
        return `
            <div class="ingredient-item">
                <span class="ingredient-name">${ing.name}</span>
                <span class="ingredient-amount">${calculatedAmount} ${ing.unit}</span>
            </div>
        `;
    }).join('');
    
    // כפתור חזרה
    document.getElementById('back-to-selection').addEventListener('click', () => {
        window.location.href = 'index.html';
    });
    
    // כפתור לתנור
    document.getElementById('go-to-oven').addEventListener('click', () => {
        window.location.href = `oven.html?recipeId=${recipeId}&quantity=${quantity}`;
    });
}

// טעינת שלב תנור
async function loadOvenStage(recipeId, quantity) {
    const recipes = await loadRecipes();
    const recipe = recipes.find(r => r.id === recipeId);
    
    if (!recipe) {
        window.location.href = 'index.html';
        return;
    }
    
    document.getElementById('recipe-name').textContent = recipe.name;
    document.getElementById('quantity-badge').textContent = `${quantity} ק"ג`;
    
    const multiplier = quantity / 10;
    const waterAmount = (recipe.waterAmount * multiplier).toFixed(1);
    
    document.getElementById('water-amount').textContent = `${waterAmount} ליטר`;
    
    const settingsList = document.getElementById('oven-settings');
    settingsList.innerHTML = `
        <div class="setting-item">
            <div class="setting-label">טמפרטורה</div>
            <div class="setting-value">${recipe.ovenTemp}°C</div>
        </div>
        <div class="setting-item">
            <div class="setting-label">זמן אפייה</div>
            <div class="setting-value">${recipe.ovenTime} דקות</div>
        </div>
        ${recipe.ovenNotes ? `
        <div class="setting-item">
            <div class="setting-label">הוראות נוספות</div>
            <div class="setting-value">${recipe.ovenNotes}</div>
        </div>
        ` : ''}
    `;
    
    // כפתורי ניווט
    document.getElementById('back-to-kit').addEventListener('click', () => {
        window.location.href = `kit.html?recipeId=${recipeId}&quantity=${quantity}`;
    });
    
    document.getElementById('back-to-selection').addEventListener('click', () => {
        window.location.href = 'index.html';
    });
}

// יצירת ID ייחודי
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

