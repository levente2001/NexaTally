// Optional sample catalog for testing. Nothing is written until the user presses Import.
export const DEMO_INGREDIENTS = [
  { name: "Citrom", quantity: 50, type: "db" },
  { name: "Víz", quantity: 150, type: "l" },
  { name: "Cukor", quantity: 20, type: "kg" },
  { name: "Menta", quantity: 100, type: "g" },
  { name: "Narancs", quantity: 30, type: "db" },
  { name: "Kávébab", quantity: 10, type: "kg" },
  { name: "Tej", quantity: 50, type: "l" },
  { name: "Tea", quantity: 120, type: "db" },
  { name: "Jég", quantity: 40, type: "kg" },
  { name: "Szénsavas víz", quantity: 80, type: "l" },
  { name: "Eper", quantity: 15, type: "kg" },
  { name: "Almalé", quantity: 40, type: "l" },
  { name: "Hamburger zsemle", quantity: 60, type: "db" },
  { name: "Marhahúspogácsa", quantity: 60, type: "db" },
  { name: "Sajt", quantity: 8, type: "kg" }
];

// All recipe quantities use the exact same stock units as the ingredient records.
export const DEMO_PRODUCTS = [
  { nev: "Limonádé 0,5 l", ar: 1490, cat: "Italok", ingredients: { Citrom: 1, Víz: 0.4, Cukor: 0.03, Jég: 0.1 } },
  { nev: "Mentás limonádé", ar: 1690, cat: "Italok", ingredients: { Citrom: 1, Víz: 0.4, Cukor: 0.03, Menta: 4, Jég: 0.1 } },
  { nev: "Narancsos limonádé", ar: 1690, cat: "Italok", ingredients: { Narancs: 1, Citrom: 0.5, Víz: 0.35, Cukor: 0.02, Jég: 0.1 } },
  { nev: "Szódavíz 0,5 l", ar: 590, cat: "Italok", ingredients: { "Szénsavas víz": 0.5 } },
  { nev: "Jeges tea 0,5 l", ar: 1190, cat: "Italok", ingredients: { Tea: 1, Víz: 0.4, Cukor: 0.02, Jég: 0.1 } },
  { nev: "Epres limonádé", ar: 1790, cat: "Italok", ingredients: { Eper: 0.1, Citrom: 1, Víz: 0.35, Cukor: 0.03, Jég: 0.1 } },
  { nev: "Almás frissítő", ar: 1290, cat: "Italok", ingredients: { Almalé: 0.3, "Szénsavas víz": 0.2, Jég: 0.1 } },
  { nev: "Espresso", ar: 690, cat: "Kávé", ingredients: { Kávébab: 0.009, Víz: 0.04 } },
  { nev: "Dupla espresso", ar: 1090, cat: "Kávé", ingredients: { Kávébab: 0.018, Víz: 0.08 } },
  { nev: "Americano", ar: 890, cat: "Kávé", ingredients: { Kávébab: 0.009, Víz: 0.2 } },
  { nev: "Cappuccino", ar: 1190, cat: "Kávé", ingredients: { Kávébab: 0.009, Tej: 0.15, Víz: 0.04 } },
  { nev: "Latte", ar: 1390, cat: "Kávé", ingredients: { Kávébab: 0.009, Tej: 0.25, Víz: 0.04 } },
  { nev: "Jeges latte", ar: 1590, cat: "Kávé", ingredients: { Kávébab: 0.009, Tej: 0.25, Víz: 0.04, Jég: 0.12 } },
  { nev: "Sajtos hamburger", ar: 3490, cat: "Ételek", ingredients: { "Hamburger zsemle": 1, Marhahúspogácsa: 1, Sajt: 0.05 } },
  { nev: "Dupla sajtos burger", ar: 4490, cat: "Ételek", ingredients: { "Hamburger zsemle": 1, Marhahúspogácsa: 2, Sajt: 0.08 } }
];

export async function importDemoCatalog(firebase, userId) {
  if (!userId) throw new Error("Nincs bejelentkezett felhasználó.");
  const database = firebase.database();
  const [warehouseSnapshot, productsSnapshot, categoriesSnapshot] = await Promise.all([
    database.ref("warehouse/" + userId).once("value"),
    database.ref("sale/" + userId).once("value"),
    database.ref("categories/" + userId).once("value")
  ]);
  const warehouse = warehouseSnapshot.val() || {};
  const products = productsSnapshot.val() || {};
  const categories = categoriesSnapshot.val() || {};
  const existingIngredients = new Set(Object.values(warehouse).filter(Boolean).map(x => x.name));
  const existingProducts = new Set(Object.values(products).filter(Boolean).map(x => x.nev));
  const existingCategories = new Set(Object.values(categories).filter(x => typeof x === "string"));
  const updates = {};
  let ingredientCount = 0, productCount = 0;
  DEMO_INGREDIENTS.forEach(item => {
    if (existingIngredients.has(item.name)) return;
    // Existing order logic addresses warehouse ingredients by their names as Firebase keys.
    updates["warehouse/" + userId + "/" + item.name] = item;
    ingredientCount += 1;
  });
  DEMO_PRODUCTS.forEach(item => {
    if (existingProducts.has(item.nev)) return;
    updates["sale/" + userId + "/" + database.ref("sale/" + userId).push().key] = item;
    productCount += 1;
  });
  ["Italok", "Kávé", "Ételek"].forEach(cat => {
    if (!existingCategories.has(cat)) {
      updates["categories/" + userId + "/" + database.ref("categories/" + userId).push().key] = cat;
    }
  });
  if (Object.keys(updates).length) await database.ref().update(updates);
  return { ingredientCount, productCount };
}
