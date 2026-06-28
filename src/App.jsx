import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Search, Plus, X, Check, Pencil, Trash2, ChefHat, Carrot,
  BookOpen, ShoppingCart, ArrowLeftRight, ChevronDown, ChevronRight,
  ListPlus, Store, Layers, RotateCcw, TreePine,
} from "lucide-react";
import { cloudEnabled, cloudLoad, cloudSave } from "./cloud.js";

/* ----------------------------------------------------------------------------
   Pantree — a kitchen-on-hand board. Inventory, recipes, swaps, and a shopping
   list that all talk to each other so you know what you can cook today.
---------------------------------------------------------------------------- */

const STORE_KEY = "mise:data:v1";

const CATEGORIES = [
  "Produce", "Meat and Seafood", "Dairy and Cheese", "Breads and Wraps",
  "Canned and Packaged Goods", "Condiments and Spreads", "Herbs and Spices",
  "Fats and Oils", "Beverages", "Non-Food Item",
];
const STORAGES = ["Fridge", "Freezer", "Pantry", "Counter", "Cabinet"];
const STORES = ["Lidl", "Costco", "Harris Teeter", "Saigon Market", "Food Lion"];
const STOCK = ["out", "low", "in"];
const STOCK_LABEL = { out: "Out", low: "Low", in: "Stocked" };

const uid = () => Math.random().toString(36).slice(2, 9);
const norm = (s) => (s || "").trim().toLowerCase();

/* ------------------------------- seed data -------------------------------- */
// [name, category, storage, store, stock]
const SEED_ITEMS_RAW = [
  ["Sliced Baby Bellas", "Produce", "Fridge", "Lidl", "out"],
  ["Lettuce", "Produce", "Fridge", "Lidl", "out"],
  ["Baby Spinach", "Produce", "Fridge", "Lidl", "in"],
  ["Red Onion", "Produce", "Counter", "Lidl", "in"],
  ["Roma Tomatos", "Produce", "Fridge", "Lidl", "in"],
  ["White Onion", "Produce", "Counter", "Lidl", "in"],
  ["Carrot Chips", "Produce", "Fridge", "Lidl", "in"],
  ["Celery", "Produce", "Fridge", "Harris Teeter", "in"],
  ["Russet Potatoes", "Produce", "Pantry", "Lidl", "in"],
  ["Chinese Wok Veg", "Produce", "Freezer", "Lidl", "in"],
  ["Edamame", "Produce", "Freezer", "Lidl", "in"],
  ["Frozen Broccoli", "Produce", "Freezer", "Lidl", "in"],
  ["Baby Yellow Potatos", "Produce", "Counter", "Lidl", "in"],
  ["Fresh Garlic", "Produce", "Counter", "Lidl", "in"],
  ["Frozen Peas", "Produce", "Freezer", "Harris Teeter", "in"],
  ["Breakfast Sausage Links", "Meat and Seafood", "Fridge", "Lidl", "out"],
  ["Sliced Turkey", "Meat and Seafood", "Fridge", "Lidl", "out"],
  ["Chicken Sausage", "Meat and Seafood", "Fridge", "Lidl", "in"],
  ["Ground Beef 80/20", "Meat and Seafood", "Freezer", "Harris Teeter", "in"],
  ["Jamaican Beef Patties", "Meat and Seafood", "Freezer", "Costco", "in"],
  ["Smoked Oysters", "Meat and Seafood", "Pantry", "Lidl", "in"],
  ["Frozen Burger", "Meat and Seafood", "Freezer", "Lidl", "low"],
  ["Pepper Jack Cheese", "Dairy and Cheese", "Fridge", "Lidl", "out"],
  ["Cream Cheese", "Dairy and Cheese", "Fridge", "Lidl", "out"],
  ["Muenster Cheese", "Dairy and Cheese", "Fridge", "Lidl", "low"],
  ["Parmesan Cheese", "Dairy and Cheese", "Fridge", "Lidl", "in"],
  ["American Cheese", "Dairy and Cheese", "Fridge", "Lidl", "in"],
  ["Sour Cream", "Dairy and Cheese", "Fridge", "Lidl", "in"],
  ["Mexican Shredded Cheese", "Dairy and Cheese", "Fridge", "Lidl", "in"],
  ["Everything Bagels", "Breads and Wraps", "Counter", "Lidl", "out"],
  ["Large Tortillas", "Breads and Wraps", "Counter", "Lidl", "low"],
  ["Frozen Pancake", "Breads and Wraps", "Freezer", "Lidl", "low"],
  ["Sub Rolls", "Breads and Wraps", "Counter", "Lidl", "in"],
  ["Coconut Milk", "Canned and Packaged Goods", "Pantry", "Saigon Market", "out"],
  ["Dark Red Kidney Beans", "Canned and Packaged Goods", "Pantry", "Lidl", "low"],
  ["Diced Tomatoes", "Canned and Packaged Goods", "Pantry", "Lidl", "low"],
  ["Light Red Kidney Beans", "Canned and Packaged Goods", "Pantry", "Lidl", "low"],
  ["Green Curry Paste", "Canned and Packaged Goods", "Pantry", "Lidl", "low"],
  ["Coconut Cream", "Canned and Packaged Goods", "Pantry", "Saigon Market", "low"],
  ["Canned Corn", "Canned and Packaged Goods", "Pantry", "", "low"],
  ["White Rice", "Canned and Packaged Goods", "Pantry", "Lidl", "in"],
  ["Black Beans", "Canned and Packaged Goods", "Pantry", "Lidl", "in"],
  ["Chicken Stock", "Canned and Packaged Goods", "Pantry", "Lidl", "in"],
  ["Fettuccine", "Canned and Packaged Goods", "Pantry", "Lidl", "in"],
  ["Green Beans", "Canned and Packaged Goods", "Pantry", "Lidl", "in"],
  ["Dried Split Peas", "Canned and Packaged Goods", "Pantry", "Lidl", "in"],
  ["Hummus", "Condiments and Spreads", "Fridge", "Costco", "in"],
  ["Salsa", "Condiments and Spreads", "Fridge", "Lidl", "in"],
  ["Ketchup", "Condiments and Spreads", "Fridge", "Lidl", "in"],
  ["Ranch", "Condiments and Spreads", "Fridge", "Lidl", "in"],
  ["Tartar Sauce", "Condiments and Spreads", "Fridge", "Lidl", "in"],
  ["Sriracha", "Condiments and Spreads", "Fridge", "Lidl", "in"],
  ["Mirin", "Condiments and Spreads", "Cabinet", "Saigon Market", "in"],
  ["Dark Soy Sauce", "Condiments and Spreads", "Fridge", "", "in"],
  ["Light Soy Sauce", "Condiments and Spreads", "Fridge", "", "in"],
  ["Apple Cider Vinegar", "Condiments and Spreads", "Cabinet", "", "in"],
  ["Black Vinegar", "Condiments and Spreads", "Cabinet", "", "in"],
  ["Fish Sauce", "Condiments and Spreads", "Cabinet", "", "in"],
  ["Hoisin", "Condiments and Spreads", "Cabinet", "", "in"],
  ["Honey", "Condiments and Spreads", "Cabinet", "Food Lion", "in"],
  ["Oyster Sauce", "Condiments and Spreads", "Cabinet", "", "in"],
  ["Red Wine Vinegar", "Condiments and Spreads", "Cabinet", "", "in"],
  ["White Vinegar", "Condiments and Spreads", "Cabinet", "", "in"],
  ["Kewpie Mayo", "Condiments and Spreads", "Fridge", "Costco", "in"],
  ["Worcestershire Sauce", "Condiments and Spreads", "Cabinet", "Food Lion", "in"],
  ["Texas Pete Hot Sauce", "Condiments and Spreads", "Cabinet", "Harris Teeter", "in"],
  ["Sub Dressing", "Condiments and Spreads", "Fridge", "Lidl", "in"],
  ["Maggi Seasoning", "Condiments and Spreads", "Cabinet", "", "in"],
  ["Agave Nectar", "Condiments and Spreads", "Cabinet", "Lidl", "in"],
  ["Maple Syrup", "Condiments and Spreads", "Cabinet", "Lidl", "in"],
  ["Rice Vinegar", "Condiments and Spreads", "Cabinet", "Saigon Market", "in"],
  ["Corn Starch", "Herbs and Spices", "Cabinet", "Harris Teeter", "low"],
  ["Sesame Seeds", "Herbs and Spices", "Cabinet", "Saigon Market", "in"],
  ["Black Pepper", "Herbs and Spices", "Cabinet", "", "in"],
  ["Cayenne Pepper", "Herbs and Spices", "Cabinet", "", "in"],
  ["Chili Powder", "Herbs and Spices", "Cabinet", "", "in"],
  ["Coarse Salt", "Herbs and Spices", "Cabinet", "", "in"],
  ["Garlic Powder", "Herbs and Spices", "Cabinet", "", "in"],
  ["Gochugaru", "Herbs and Spices", "Cabinet", "", "in"],
  ["Ground Cumin", "Herbs and Spices", "Cabinet", "", "in"],
  ["Ground Ginger", "Herbs and Spices", "Cabinet", "", "in"],
  ["Onion Powder", "Herbs and Spices", "Cabinet", "", "in"],
  ["Paprika", "Herbs and Spices", "Cabinet", "", "in"],
  ["Smoked Paprika", "Herbs and Spices", "Cabinet", "", "in"],
  ["Turmeric", "Herbs and Spices", "Cabinet", "", "in"],
  ["Allspice", "Herbs and Spices", "Cabinet", "Harris Teeter", "in"],
  ["Dried Parsley", "Herbs and Spices", "Cabinet", "Harris Teeter", "in"],
  ["Crushed Red Pepper", "Herbs and Spices", "Cabinet", "Costco", "in"],
  ["Taco Seasoning", "Herbs and Spices", "Cabinet", "Costco", "in"],
  ["Chili Crisp", "Herbs and Spices", "Cabinet", "Saigon Market", "in"],
  ["Cumin Seeds", "Herbs and Spices", "Cabinet", "Saigon Market", "in"],
  ["Unsalted Butter", "Fats and Oils", "Fridge", "Lidl", "in"],
  ["Olive Oil", "Fats and Oils", "Cabinet", "Food Lion", "in"],
  ["Vegetable Oil", "Fats and Oils", "Cabinet", "Food Lion", "in"],
  ["Toasted Sesame Oil", "Fats and Oils", "Cabinet", "Saigon Market", "in"],
  ["Stok Cold Brew", "Beverages", "Fridge", "Costco", "in"],
  ["Water", "Beverages", "Counter", "Costco", "in"],
  ["Trash Bags", "Non-Food Item", "Cabinet", "Costco", "in"],
];

// [name, [ [ingredient, qty, unit, optional?] ... ]]
const SEED_RECIPES_RAW = [
  ["Bagel w/ Cream Cheese", [["Everything Bagels", 1, "bagel"], ["Cream Cheese", 1, "tbsp"]]],
  ["Bagel w/ Hummus", [["Everything Bagels", 1, "bagel"], ["Hummus", 1, "tbsp"]]],
  ["Baked Potato", [["Russet Potatoes", 1, "potato"]]],
  ["Cheese Quesadilla", [["Large Tortillas", 1, "tortilla"], ["Mexican Shredded Cheese", 2, "oz"]]],
  ["Cheesy Bean and Rice Burrito", [["Large Tortillas", 1, "tortilla"], ["Black Beans", 1, "can"], ["Mexican Shredded Cheese", 2, "oz"], ["White Rice", 0.5, "cup"]]],
  ["Chilli", [["Ground Beef 80/20", 1, "lb"], ["Dark Red Kidney Beans", 1, "can"], ["Light Red Kidney Beans", 1, "can"], ["Diced Tomatoes", 1, "can"], ["Sliced Baby Bellas", 1, "package", true]]],
  ["Turkey Sandwich", [["Sliced Turkey", 4, "slices"], ["Sub Rolls", 1, "roll"], ["Pepper Jack Cheese", 2, "slices"], ["Kewpie Mayo", 2, "tbsp"], ["Lettuce", 1, "handful", true], ["White Onion", 1, "handful", true], ["Pickled Jalapeno", 1, "handful", true], ["Pickled Banana Peppers", 1, "handful", true], ["Sub Dressing", 3, "dash", true]]],
  ["Beef Burrito", [["Ground Beef 80/20", 0.25, "lb"], ["Large Tortillas", 1, "tortilla"], ["Mexican Shredded Cheese", 1, "handful"], ["Lettuce", 1, "handful", true], ["White Onion", 1, "handful", true], ["Sour Cream", 1, "dollop", true]]],
  ["Chicken Sausage Dog", [["Chicken Sausage", 1, "sausage"], ["Sub Rolls", 1, "roll"]]],
  ["Beans and Rice", [["Black Beans", 1, "can"], ["White Rice", 0.5, "cup"]]],
  ["Spinach and Sausage Pasta", [["Baby Spinach", 1, "handful"], ["Parmesan Cheese", 0.5, "cup"], ["Chicken Sausage", 1, "handful"], ["Fettuccine", 0.25, "lb"]]],
  ["Baked Potato w/ Cheese", [["Russet Potatoes", 1, "potato"], ["Mexican Shredded Cheese", 1, "handful"]]],
  ["Baked Potato w/ Cheese & Sour Cream", [["Russet Potatoes", 1, "potato"], ["Mexican Shredded Cheese", 1, "handful"], ["Sour Cream", 1, "dollop"]]],
  ["Bagel Turkey Melt", [["Everything Bagels", 1, "bagel"], ["Sliced Turkey", 4, "slices"], ["Muenster Cheese", 2, "slices"]]],
  ["Asian Beef Bowl", [["Ground Beef 80/20", 0.5, "lb"], ["Frozen Broccoli", 1, "bunch"], ["White Rice", 0.5, "cup"], ["Light Soy Sauce", 0, ""], ["Dark Soy Sauce", 0, ""], ["Black Vinegar", 0, ""], ["Hoisin", 0, ""], ["Sesame Seeds", 0.5, "handful"]]],
  ["Vegetable Green Curry", [["Green Curry Paste", 1, "can"], ["Coconut Milk", 1, "can"], ["Chinese Wok Veg", 4, "cup"]]],
  ["Hummus w/ Celery", [["Hummus", 0.5, "cup"], ["Celery", 2, "stalks"]]],
  ["Bagel Breakfast Sandwich", [["Everything Bagels", 1, "bagel"], ["Cream Cheese", 2, "tbsp"], ["Breakfast Sausage Links", 2, "links"], ["American Cheese", 1, "slice"], ["Baby Spinach", 1, "handful", true], ["Red Onion", 1, "handful", true]]],
  ["Taco Bowl", [["Ground Beef 80/20", 0.25, "lb"], ["Mexican Shredded Cheese", 0.25, "lb"]]],
];

const SEED_SWAPS_RAW = [
  ["Kidney beans", ["Dark Red Kidney Beans", "Light Red Kidney Beans"]],
  ["Coconut base", ["Coconut Milk", "Coconut Cream"]],
  ["Cheese slices", ["American Cheese", "Pepper Jack Cheese", "Muenster Cheese"]],
];

function buildSeed() {
  const items = SEED_ITEMS_RAW.map(([name, category, storage, store, stock]) => ({
    id: uid(), name, category, storage, store, stock, qty: "", unit: "", price: "", notes: "",
  }));
  const recipes = SEED_RECIPES_RAW.map(([name, ings]) => ({
    id: uid(),
    name,
    ingredients: ings.map(([n, q, u, opt]) => ({ id: uid(), name: n, qty: q, unit: u, optional: !!opt })),
  }));
  const swaps = SEED_SWAPS_RAW.map(([label, members]) => ({ id: uid(), label, members }));
  return { items, recipes, swaps, extras: [], checked: {}, trip: [] };
}

/* --------------------------- makeability engine --------------------------- */
function useEngine(items, recipes, swaps) {
  return useMemo(() => {
    const byName = new Map();
    items.forEach((it) => byName.set(norm(it.name), it));

    // map each item-name to the set of interchangeable names (incl. itself)
    const swapMap = new Map();
    swaps.forEach((g) => {
      const ms = g.members.map(norm);
      ms.forEach((m) => {
        const set = swapMap.get(m) || new Set();
        ms.forEach((x) => set.add(x));
        swapMap.set(m, set);
      });
    });

    const stockOf = (name) => {
      const it = byName.get(norm(name));
      return it ? it.stock : "untracked";
    };
    const present = (name) => {
      const s = stockOf(name);
      return s === "in" || s === "low" || s === "untracked";
    };
    // returns the name of an in-stock substitute, or null
    const subFor = (name) => {
      // 1) per-item substitutes picked in the Pantry item editor
      const self = byName.get(norm(name));
      if (self && Array.isArray(self.subs)) {
        for (const subName of self.subs) {
          const it = byName.get(norm(subName));
          if (it && (it.stock === "in" || it.stock === "low")) return it.name;
        }
      }
      // 2) fall back to global swap groups
      const group = swapMap.get(norm(name));
      if (group) {
        for (const m of group) {
          if (m === norm(name)) continue;
          const it = byName.get(m);
          if (it && (it.stock === "in" || it.stock === "low")) return it.name;
        }
      }
      return null;
    };

    // map each normalized recipe name to its recipe, so an ingredient can be
    // satisfied by COOKING a same-named recipe (e.g. an ingredient "Pickled
    // Onions" can be made by a recipe also called "Pickled Onions").
    const recipeByName = new Map();
    recipes.forEach((r) => recipeByName.set(norm(r.name), r));

    // Can `name` be made from a same-named recipe whose own required
    // ingredients are all on hand (in stock, swappable, an assumed staple, or
    // themselves makeable)? Returns that recipe, or null. `stack` guards cycles
    // so two recipes that reference each other can't loop forever.
    const makeableFor = (name, stack) => {
      const sub = recipeByName.get(norm(name));
      if (!sub || stack.has(norm(name))) return null;
      const next = new Set(stack);
      next.add(norm(name));
      const ok = sub.ingredients.every((ing) => {
        if (ing.optional) return true;
        const st = stockOf(ing.name);
        if (st === "in" || st === "low") return true; // physically on hand
        if (st === "untracked") return true;          // assumed-on-hand staple
        if (subFor(ing.name)) return true;            // an in-stock substitute
        return !!makeableFor(ing.name, next);         // or make it too
      });
      return ok ? sub : null;
    };

    const analyzed = recipes.map((r) => {
      const lines = r.ingredients.map((ing) => {
        const stock = stockOf(ing.name);
        const inStock = stock === "in" || stock === "low";
        const untracked = stock === "untracked";
        // a stand-in only applies to a tracked item that's actually out
        const swap = stock === "out" ? subFor(ing.name) : null;
        // otherwise, see if a same-named recipe can make it
        const makeRecipe = !inStock && !swap ? makeableFor(ing.name, new Set([norm(r.name)])) : null;
        // an untracked staple counts as on-hand UNLESS we're making it
        const assumed = untracked && !makeRecipe;
        const have = inStock || assumed;
        const missing = !have && !swap && !makeRecipe;
        return { ...ing, stock, have, swap, makeRecipe, untracked, missing };
      });
      const reqMissing = lines.filter((l) => !l.optional && l.missing);
      const reqSwaps = lines.filter((l) => !l.optional && l.swap);
      const reqMakes = lines.filter((l) => !l.optional && l.makeRecipe);
      const optMissing = lines.filter((l) => l.optional && l.missing);

      let status;
      if (reqMissing.length === 0) {
        if (reqMakes.length) status = "make";
        else if (reqSwaps.length) status = "swap";
        else if (optMissing.length) status = "ready_extras";
        else status = "ready";
      } else status = reqMissing.length === 1 ? "short_one" : "shop";

      return { ...r, lines, status, reqMissing, reqSwaps, reqMakes, optMissing };
    });

    return { byName, stockOf, present, subFor, makeableFor, analyzed };
  }, [items, recipes, swaps]);
}

/* --------------------------------- styles --------------------------------- */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Hanken+Grotesk:wght@400;500;600;700&display=swap');

:root{
  --paper:#F4EEE1; --card:#FCFAF3; --ink:#23291F; --ink-soft:#5C6353;
  --line:#E2D9C6; --line-soft:#ECE5D6;
  --pine:#2F4A3A; --pine-deep:#243B2E; --sage:#7C8B6F;
  --fresh:#4F7A3C; --fresh-bg:#E3EFD6; --fresh-line:#C4DBB0;
  --amber:#A9711E; --amber-bg:#F6E6C8; --amber-line:#E6CD9C;
  --clay:#A8472C; --clay-bg:#F1DACE; --clay-line:#E1BCA9;
  --make:#3B6470; --make-bg:#DDE9EC; --make-line:#B5CDD4;
}
*{box-sizing:border-box}
.mise{font-family:'Hanken Grotesk',system-ui,sans-serif;color:var(--ink);
  background:var(--paper);min-height:100vh;line-height:1.45;-webkit-font-smoothing:antialiased}
.mise h1,.mise h2,.mise h3,.serif{font-family:'Fraunces',Georgia,serif}
.wrap{max-width:1080px;margin:0 auto;padding:0 20px}

/* header */
.top{position:sticky;top:0;z-index:30;background:var(--pine);color:#F4EEE1;
  border-bottom:3px solid var(--pine-deep)}
.top .wrap{display:flex;align-items:center;gap:18px;height:62px}
.mark{font-family:'Fraunces',serif;font-weight:600;font-size:25px;letter-spacing:.3px;
  display:flex;align-items:center;gap:9px;color:#FBF6EA}
.mark .dot{width:9px;height:9px;border-radius:50%;background:#C9D9B4;display:inline-block;margin-bottom:3px}
.tag{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#A9BE98;
  border-left:1px solid #45624F;padding-left:14px;margin-left:-4px}
.navd{margin-left:auto;display:flex;gap:4px}
.navd button{font:inherit;font-size:14px;font-weight:600;color:#C7D6B8;background:transparent;
  border:0;padding:9px 14px;border-radius:9px;cursor:pointer;display:flex;align-items:center;gap:7px}
.navd button:hover{background:#37533F;color:#fff}
.navd button.on{background:#FBF6EA;color:var(--pine-deep)}

/* bottom nav (mobile) */
.navm{display:none}
@media(max-width:760px){
  .navd{display:none}
  .navm{display:flex;position:fixed;bottom:0;left:0;right:0;z-index:40;background:var(--pine);
    border-top:3px solid var(--pine-deep);padding:6px 4px env(safe-area-inset-bottom)}
  .navm button{flex:1;background:transparent;border:0;color:#A9BE98;font:inherit;font-size:10.5px;
    font-weight:600;display:flex;flex-direction:column;align-items:center;gap:3px;padding:7px 2px;cursor:pointer}
  .navm button.on{color:#FBF6EA}
  .mise main{padding-bottom:74px}
}

/* page furniture */
.page{padding:26px 0 60px;animation:rise .25s ease both}
@keyframes rise{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.pagehead{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:6px;flex-wrap:wrap}
.pagehead h1{font-size:34px;font-weight:600;margin:0;letter-spacing:-.3px}
.lede{color:var(--ink-soft);font-size:15px;margin:2px 0 22px}
.eyebrow{font-size:11.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--sage);font-weight:700;margin:30px 0 13px}
.eyebrow:first-of-type{margin-top:6px}

/* buttons */
.btn{font:inherit;font-weight:600;font-size:14px;border-radius:10px;border:1px solid var(--line);
  background:var(--card);color:var(--ink);padding:9px 14px;cursor:pointer;display:inline-flex;
  align-items:center;gap:7px;transition:.12s}
.btn:hover{border-color:var(--sage);transform:translateY(-1px)}
.btn.primary{background:var(--pine);border-color:var(--pine);color:#FBF6EA}
.btn.primary:hover{background:var(--pine-deep)}
.btn.ghost{background:transparent;border-color:transparent;color:var(--ink-soft)}
.btn.ghost:hover{background:#00000008;color:var(--ink)}
.btn.sm{padding:6px 10px;font-size:13px;border-radius:8px}
.icon-btn{background:transparent;border:0;color:var(--sage);cursor:pointer;padding:6px;border-radius:8px;display:inline-flex}
.icon-btn:hover{background:#00000008;color:var(--ink)}

/* cards */
.card{background:var(--card);border:1px solid var(--line);border-radius:14px}
.recipe-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:14px}

/* recipe ticket */
.ticket{position:relative;background:var(--card);border:1px solid var(--line);border-radius:14px;
  padding:16px 16px 14px 19px;overflow:hidden;transition:.15s}
.ticket:hover{transform:translateY(-2px);box-shadow:0 8px 22px -14px #2f4a3a55}
.ticket .spine{position:absolute;left:0;top:0;bottom:0;width:6px}
.ticket h3{margin:0;font-size:20px;font-weight:600;letter-spacing:-.2px;padding-right:70px}
.ticket .when{display:flex;align-items:center;gap:6px;margin-top:9px;flex-wrap:wrap}
.ing-row{display:flex;align-items:center;gap:8px;font-size:13.5px;padding:3px 0;color:var(--ink-soft)}
.ing-row .nm{color:var(--ink)}
.ing-row.swappable{cursor:pointer;margin:0 -7px;padding-left:7px;padding-right:7px;border-radius:8px;transition:background .12s}
.ing-row.swappable:hover{background:#0000000a}
.add-swap{margin-left:auto;display:inline-flex;align-items:center;gap:4px;font-size:10.5px;font-weight:700;
  text-transform:uppercase;letter-spacing:.04em;color:var(--amber);opacity:.55}
.ing-row.swappable:hover .add-swap{opacity:1}
.make-tag{margin-left:auto;display:inline-flex;align-items:center;gap:4px;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:var(--make)}
.ing-list{margin-top:11px;border-top:1px dashed var(--line);padding-top:9px}
.dot{width:8px;height:8px;border-radius:50%;flex:none}
.d-in{background:var(--fresh)} .d-low{background:var(--amber)} .d-out{background:var(--clay)}
.d-untracked{background:#C7C0AE}
.swapnote{font-size:12.5px;color:var(--amber);background:var(--amber-bg);border:1px solid var(--amber-line);
  border-radius:8px;padding:6px 9px;margin-top:11px;display:flex;gap:7px;align-items:flex-start}
.makenote{font-size:12.5px;color:var(--make);background:var(--make-bg);border:1px solid var(--make-line);
  border-radius:8px;padding:6px 9px;margin-top:11px;display:flex;gap:7px;align-items:flex-start}
.shortnote{font-size:12.5px;color:var(--clay);background:var(--clay-bg);border:1px solid var(--clay-line);
  border-radius:8px;padding:6px 9px;margin-top:11px;display:flex;gap:8px;align-items:center;justify-content:space-between}

/* status pill */
.pill{position:absolute;top:15px;right:15px;font-size:11px;font-weight:700;letter-spacing:.04em;
  padding:4px 9px;border-radius:999px;text-transform:uppercase}
.pill.inline{position:static}
.p-ready{background:var(--fresh-bg);color:var(--fresh);border:1px solid var(--fresh-line)}
.p-swap{background:var(--amber-bg);color:var(--amber);border:1px solid var(--amber-line)}
.p-make{background:var(--make-bg);color:var(--make);border:1px solid var(--make-line)}
.p-short{background:var(--clay-bg);color:var(--clay);border:1px solid var(--clay-line)}

/* summary strip */
.strip{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:6px}
.stat{background:var(--card);border:1px solid var(--line);border-radius:13px;padding:15px 16px}
.stat .n{font-family:'Fraunces',serif;font-size:30px;font-weight:600;line-height:1}
.stat .l{font-size:12.5px;color:var(--ink-soft);margin-top:5px}
.stat.green{background:var(--fresh-bg);border-color:var(--fresh-line)} .stat.green .n{color:var(--fresh)}
.stat.amb{background:var(--amber-bg);border-color:var(--amber-line)} .stat.amb .n{color:var(--amber)}
.stat.cl{background:var(--clay-bg);border-color:var(--clay-line)} .stat.cl .n{color:var(--clay)}
@media(max-width:560px){.strip{grid-template-columns:1fr}}

/* toolbar */
.toolbar{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:18px}
.searchbox{position:relative;flex:1;min-width:200px}
.searchbox input{width:100%;font:inherit;font-size:14.5px;padding:10px 12px 10px 38px;border-radius:11px;
  border:1px solid var(--line);background:var(--card);color:var(--ink)}
.searchbox svg{position:absolute;left:12px;top:11px;color:var(--sage)}
.searchbox input:focus{outline:none;border-color:var(--pine)}
select.sel{font:inherit;font-size:13.5px;padding:9px 12px;border-radius:10px;border:1px solid var(--line);
  background:var(--card);color:var(--ink);cursor:pointer}
select.sel:focus{outline:none;border-color:var(--pine)}

/* pantry */
.cat-group{margin-bottom:8px}
.cat-head{display:flex;align-items:center;gap:10px;width:100%;background:transparent;border:0;
  font:inherit;cursor:pointer;padding:13px 4px 9px;color:var(--ink)}
.cat-head .ct{font-family:'Fraunces',serif;font-size:18px;font-weight:600}
.cat-head .cn{font-size:12px;color:var(--sage);background:#0000000a;padding:1px 8px;border-radius:999px}
.cat-head .ln{flex:1;height:1px;background:var(--line);margin:0 4px}
.item{display:flex;align-items:center;gap:12px;padding:10px 12px;border:1px solid var(--line-soft);
  border-radius:11px;background:var(--card);margin-bottom:7px}
.item .nm{font-weight:600;font-size:15px}
.item .meta{font-size:12px;color:var(--ink-soft);margin-top:1px;display:flex;gap:10px;flex-wrap:wrap}
.item .meta span{display:inline-flex;align-items:center;gap:4px}
.item-main{flex:1;min-width:0}
.item-actions{display:flex;align-items:center;gap:2px}

/* stock toggle */
.stk{display:inline-flex;border:1px solid var(--line);border-radius:9px;overflow:hidden;flex:none}
.stk button{font:inherit;font-size:11.5px;font-weight:700;border:0;background:var(--card);
  color:var(--sage);padding:5px 9px;cursor:pointer;letter-spacing:.02em}
.stk button+button{border-left:1px solid var(--line)}
.stk button.a.out{background:var(--clay);color:#fff}
.stk button.a.low{background:var(--amber);color:#fff}
.stk button.a.in{background:var(--fresh);color:#fff}

/* swaps */
.swap-card{padding:15px 16px}
.swap-card .lab{font-family:'Fraunces',serif;font-size:18px;font-weight:600;display:flex;align-items:center;gap:9px}
.chip{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:600;background:#0000000a;
  border:1px solid var(--line);border-radius:999px;padding:4px 6px 4px 11px;margin:5px 6px 0 0}
.chip .dot{margin-right:1px}
.chip button{background:transparent;border:0;cursor:pointer;color:var(--sage);display:inline-flex;padding:2px;border-radius:50%}
.chip button:hover{color:var(--clay);background:#00000010}

/* shopping */
.shop-store{margin-bottom:18px}
.shop-store h3{font-family:'Fraunces',serif;font-size:19px;font-weight:600;display:flex;align-items:center;gap:9px;margin:0 0 9px}
.shop-row{display:flex;align-items:center;gap:12px;padding:10px 13px;border:1px solid var(--line-soft);
  border-radius:11px;background:var(--card);margin-bottom:7px}
.check{width:23px;height:23px;border-radius:7px;border:1.5px solid var(--sage);background:var(--card);
  cursor:pointer;flex:none;display:flex;align-items:center;justify-content:center;color:#fff}
.check.on{background:var(--fresh);border-color:var(--fresh)}
.shop-row.done .nm{text-decoration:line-through;color:var(--sage)}
.shop-row .nm{font-weight:600;font-size:15px;flex:1}
.shop-tag{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;padding:2px 8px;border-radius:999px}
.t-out{background:var(--clay-bg);color:var(--clay)} .t-low{background:var(--amber-bg);color:var(--amber)}
.t-add{background:#0000000c;color:var(--ink-soft)}

/* shopping: suggestion + source zones */
.shop-add{display:flex;gap:8px;margin:4px 0 22px}
.shop-add input{flex:1;font:inherit;font-size:14.5px;padding:10px 12px;border-radius:11px;
  border:1px solid var(--line);background:var(--card);color:var(--ink)}
.shop-add input:focus{outline:none;border-color:var(--pine)}
.suggest{background:var(--fresh-bg);border:1px solid var(--fresh-line);border-radius:13px;padding:6px;margin-bottom:8px}
.suggest-row{display:flex;align-items:center;gap:11px;padding:9px 10px;border-radius:9px}
.suggest-row+.suggest-row{border-top:1px solid var(--fresh-line)}
.suggest-row .nm{font-weight:600;font-size:15px}
.suggest-row .unlocks{font-size:12px;color:var(--fresh);margin-top:1px}
.suggest-row .unlocks .needs{color:var(--amber)}
.suggest-main{flex:1;min-width:0}
.src-row{display:flex;align-items:center;gap:11px;padding:9px 12px;border:1px solid var(--line-soft);
  border-radius:10px;background:var(--card);margin-bottom:6px}
.src-row .nm{font-weight:600;font-size:14.5px;flex:1}
.src-toggle{display:flex;align-items:center;gap:8px;width:100%;background:transparent;border:0;font:inherit;
  cursor:pointer;padding:10px 4px 8px;color:var(--ink)}
.src-toggle .ct{font-family:'Fraunces',serif;font-size:17px;font-weight:600}
.src-toggle .cn{font-size:12px;color:var(--sage);background:#0000000a;padding:1px 8px;border-radius:999px}
.src-toggle .ln{flex:1;height:1px;background:var(--line);margin:0 4px}

/* modal */
.scrim{position:fixed;inset:0;background:#23291fbb;z-index:60;display:flex;align-items:flex-end;
  justify-content:center;padding:0;animation:fade .15s ease}
@media(min-width:620px){.scrim{align-items:center;padding:24px}}
@keyframes fade{from{opacity:0}to{opacity:1}}
.modal{background:var(--paper);border-radius:18px 18px 0 0;width:100%;max-width:560px;max-height:92vh;
  overflow:auto;border:1px solid var(--line);animation:up .22s cubic-bezier(.2,.7,.3,1)}
@media(min-width:620px){.modal{border-radius:18px}}
@keyframes up{from{transform:translateY(20px);opacity:.6}to{transform:none;opacity:1}}
.modal-head{position:sticky;top:0;background:var(--paper);display:flex;align-items:center;justify-content:space-between;
  padding:18px 20px 12px;border-bottom:1px solid var(--line);z-index:2}
.modal-head h2{margin:0;font-size:22px;font-weight:600}
.modal-body{padding:18px 20px 22px}
.field{margin-bottom:14px}
.field label{display:block;font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;
  color:var(--sage);margin-bottom:6px}
.field input,.field select{width:100%;font:inherit;font-size:15px;padding:10px 12px;border-radius:10px;
  border:1px solid var(--line);background:var(--card);color:var(--ink)}
.field input:focus,.field select:focus{outline:none;border-color:var(--pine)}
.row2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.row3{display:grid;grid-template-columns:1.4fr .8fr .8fr;gap:10px}
@media(max-width:520px){.row3{grid-template-columns:1fr}}

/* ingredient editor rows */
.ing-edit{display:grid;grid-template-columns:1fr 64px 78px auto auto;gap:8px;align-items:center;margin-bottom:8px}
.ing-edit input,.ing-edit select{font:inherit;font-size:14px;padding:8px 9px;border-radius:9px;border:1px solid var(--line);background:var(--card);width:100%}
.ing-edit .opt{display:flex;align-items:center;gap:5px;font-size:11.5px;font-weight:600;color:var(--sage);cursor:pointer;white-space:nowrap}
.ing-edit .opt input{width:15px;height:15px}
@media(max-width:560px){.ing-edit{grid-template-columns:1fr 56px 64px;gap:6px}.ing-edit .opt{grid-column:1/3}.ing-edit .del{grid-column:3}}

.empty{text-align:center;padding:48px 20px;color:var(--ink-soft)}
.empty svg{color:var(--sage);margin-bottom:10px}
.empty .e-t{font-family:'Fraunces',serif;font-size:21px;font-weight:600;color:var(--ink)}
.muted{color:var(--sage);font-size:13px}
.foot{text-align:center;padding:30px 0 10px;color:var(--sage);font-size:12.5px}
.foot button{background:none;border:0;color:var(--sage);text-decoration:underline;cursor:pointer;font:inherit}
@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
`;

/* ------------------------------ small bits -------------------------------- */
const stockDotClass = (s) =>
  s === "in" ? "d-in" : s === "low" ? "d-low" : s === "untracked" ? "d-untracked" : "d-out";

function StockToggle({ value, onChange }) {
  return (
    <div className="stk" role="group" aria-label="Stock level">
      {STOCK.map((s) => (
        <button key={s} className={value === s ? `a ${s}` : ""} onClick={() => onChange(s)}>
          {STOCK_LABEL[s]}
        </button>
      ))}
    </div>
  );
}

const PILL = {
  ready: ["p-ready", "Ready"],
  ready_extras: ["p-ready", "Ready"],
  swap: ["p-swap", "With a swap"],
  make: ["p-make", "Make ahead"],
  short_one: ["p-short", "1 short"],
  shop: ["p-short", "Needs a shop"],
};
const SPINE = {
  ready: "var(--fresh)", ready_extras: "var(--fresh)", swap: "var(--amber)",
  make: "var(--make)",
  short_one: "var(--clay)", shop: "var(--clay)",
};

/* ----------------------------- recipe ticket ------------------------------ */
function RecipeTicket({ r, onAddMissing, onCooked, onEdit, onSwapIngredient, onDelete }) {
  const [pc, pl] = PILL[r.status];
  return (
    <div className="ticket">
      <div className="spine" style={{ background: SPINE[r.status] }} />
      <span className={`pill ${pc}`}>{pl}</span>
      <h3>{r.name}</h3>

      <div className="ing-list">
        {r.lines.map((l) => {
          const canSwap = l.stock === "out" && !l.makeRecipe && !!onSwapIngredient;
          return (
            <div
              className={`ing-row ${canSwap ? "swappable" : ""}`}
              key={l.id}
              role={canSwap ? "button" : undefined}
              title={canSwap ? `Add a substitute for ${l.name}` : undefined}
              onClick={canSwap ? () => onSwapIngredient(l) : undefined}
            >
              <span className={`dot ${stockDotClass(l.stock)}`} />
              <span className="nm">{l.name}</span>
              {l.optional && <span className="muted" style={{ fontSize: 11 }}>optional</span>}
              {l.swap && <span className="muted" style={{ fontSize: 11, marginLeft: "auto" }}>↳ {l.swap}</span>}
              {!l.swap && l.makeRecipe && (
                <span className="make-tag"><ChefHat size={11} /> make</span>
              )}
              {canSwap && !l.swap && (
                <span className="add-swap"><ArrowLeftRight size={12} /> swap</span>
              )}
            </div>
          );
        })}
      </div>

      {r.reqSwaps.length > 0 && (
        <div className="swapnote">
          <ArrowLeftRight size={14} style={{ marginTop: 1, flex: "none" }} />
          <span>Swap in {r.reqSwaps.map((l) => l.swap).join(", ")} for {r.reqSwaps.map((l) => l.name).join(", ")}.</span>
        </div>
      )}

      {r.reqMakes.length > 0 && (
        <div className="makenote">
          <ChefHat size={14} style={{ marginTop: 1, flex: "none" }} />
          <span>Make {r.reqMakes.map((l) => l.name).join(", ")} first — you have what {r.reqMakes.length > 1 ? "they need" : "it needs"}.</span>
        </div>
      )}

      {(r.status === "short_one" || r.status === "shop") && (
        <div className="shortnote">
          <span>Missing {r.reqMissing.map((l) => l.name).join(", ")}</span>
          <button className="btn sm" onClick={() => onAddMissing(r)} style={{ flex: "none" }}>
            <ListPlus size={14} /> Add
          </button>
        </div>
      )}

      <div className="when">
        <button className="btn sm ghost" onClick={() => onEdit(r)}>
          <Pencil size={13} /> Edit
        </button>
        {onDelete && (
          <button className="btn sm ghost" title="Delete recipe"
            onClick={() => { if (window.confirm(`Delete "${r.name}"? This can't be undone.`)) onDelete(r.id); }}>
            <Trash2 size={13} /> Delete
          </button>
        )}
        {r.status === "ready_extras" && (
          <span className="muted" style={{ marginLeft: 2 }}>· skip {r.optMissing.map((l) => l.name).join(", ")}</span>
        )}
      </div>
    </div>
  );
}

/* -------------------------------- TODAY ----------------------------------- */
function TodayView({ engine, ...h }) {
  const a = engine.analyzed;
  const cookable = a.filter((r) => ["ready", "ready_extras", "swap", "make"].includes(r.status));
  const shortOne = a.filter((r) => r.status === "short_one");
  const bigShop = a.filter((r) => r.status === "shop");
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  const order = { ready: 0, ready_extras: 1, swap: 2, make: 3 };
  cookable.sort((x, y) => order[x.status] - order[y.status] || x.name.localeCompare(y.name));
  shortOne.sort((x, y) => x.name.localeCompare(y.name));
  bigShop.sort((x, y) => x.name.localeCompare(y.name));

  return (
    <div className="page">
      <div className="wrap">
        <div className="pagehead">
          <div>
            <h1>What's cooking</h1>
            <p className="lede" style={{ marginBottom: 18 }}>{today}</p>
          </div>
        </div>

        <div className="strip">
          <div className="stat green"><div className="n">{cookable.length}</div><div className="l">ready to cook right now</div></div>
          <div className="stat amb"><div className="n">{shortOne.length}</div><div className="l">one ingredient away</div></div>
          <div className="stat cl"><div className="n">{bigShop.length}</div><div className="l">need a bigger shop</div></div>
        </div>

        <div className="eyebrow">Ready to cook</div>
        {cookable.length ? (
          <div className="recipe-grid">
            {cookable.map((r) => <RecipeTicket key={r.id} r={r} {...h} />)}
          </div>
        ) : (
          <div className="empty card">
            <Carrot size={30} />
            <div className="e-t">Nothing's cookable yet</div>
            <div className="muted">Stock a few staples in your Pantry and meals will appear here.</div>
          </div>
        )}

        {shortOne.length > 0 && (
          <>
            <div className="eyebrow">One ingredient away</div>
            <div className="recipe-grid">
              {shortOne.map((r) => <RecipeTicket key={r.id} r={r} {...h} />)}
            </div>
          </>
        )}

        {bigShop.length > 0 && (
          <>
            <div className="eyebrow">Needs a shop</div>
            <div className="recipe-grid">
              {bigShop.map((r) => <RecipeTicket key={r.id} r={r} {...h} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* -------------------------------- PANTRY ---------------------------------- */
function PantryView({ items, setStock, onEdit, onAdd, onDelete }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [stk, setStk] = useState("");
  const [collapsed, setCollapsed] = useState({});

  const filtered = items.filter((it) => {
    if (q && !it.name.toLowerCase().includes(q.toLowerCase())) return false;
    if (cat && it.category !== cat) return false;
    if (stk && it.stock !== stk) return false;
    return true;
  });
  const groups = CATEGORIES.map((c) => [
    c,
    filtered.filter((i) => i.category === c).sort((x, y) => x.name.localeCompare(y.name)),
  ]).filter(([, l]) => l.length);

  return (
    <div className="page">
      <div className="wrap">
        <div className="pagehead">
          <div><h1>Pantry</h1></div>
          <button className="btn primary" onClick={onAdd}><Plus size={16} /> Add item</button>
        </div>
        <p className="lede">{items.length} items · tap a level to update stock as you cook and shop.</p>

        <div className="toolbar">
          <div className="searchbox">
            <Search size={17} />
            <input placeholder="Search the pantry…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select className="sel" value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="">All categories</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select className="sel" value={stk} onChange={(e) => setStk(e.target.value)}>
            <option value="">Any level</option>
            <option value="in">Stocked</option>
            <option value="low">Low</option>
            <option value="out">Out</option>
          </select>
        </div>

        {groups.length === 0 && (
          <div className="empty card"><Search size={28} /><div className="e-t">No items match</div><div className="muted">Try clearing a filter.</div></div>
        )}

        {groups.map(([c, list]) => {
          const open = !collapsed[c];
          return (
            <div className="cat-group" key={c}>
              <button className="cat-head" onClick={() => setCollapsed((p) => ({ ...p, [c]: open }))}>
                {open ? <ChevronDown size={17} color="var(--sage)" /> : <ChevronRight size={17} color="var(--sage)" />}
                <span className="ct">{c}</span>
                <span className="cn">{list.length}</span>
                <span className="ln" />
              </button>
              {open && list.map((it) => (
                <div className="item" key={it.id}>
                  <div className="item-main">
                    <div className="nm">{it.name}</div>
                    <div className="meta">
                      <span>{it.storage}</span>
                      {it.store && <span><Store size={11} /> {it.store}</span>}
                      {it.qty && <span>{it.qty} {it.unit}</span>}
                      {it.price && <span>${it.price}</span>}
                    </div>
                  </div>
                  <StockToggle value={it.stock} onChange={(s) => setStock(it.id, s)} />
                  <div className="item-actions">
                    <button className="icon-btn" onClick={() => onEdit(it)} aria-label="Edit"><Pencil size={15} /></button>
                    <button className="icon-btn" onClick={() => onDelete(it.id)} aria-label="Delete"><Trash2 size={15} /></button>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------- RECIPES --------------------------------- */
function RecipesView({ engine, swaps, items, onAddRecipe, onEditRecipe, onDeleteRecipe,
  onAddSwap, onEditSwap, onDeleteSwap, ...h }) {
  const [tab, setTab] = useState("recipes");
  const [q, setQ] = useState("");
  const a = engine.analyzed;

  // filter recipes by name OR by an ingredient name, then sort A→Z
  const needle = q.trim().toLowerCase();
  const filtered = needle
    ? a.filter((r) =>
        r.name.toLowerCase().includes(needle) ||
        r.ingredients.some((i) => i.name.toLowerCase().includes(needle)))
    : a;
  const shown = filtered.slice().sort((x, y) => x.name.localeCompare(y.name));

  return (
    <div className="page">
      <div className="wrap">
        <div className="pagehead">
          <div><h1>Recipes</h1></div>
          {tab === "recipes"
            ? <button className="btn primary" onClick={onAddRecipe}><Plus size={16} /> New recipe</button>
            : <button className="btn primary" onClick={onAddSwap}><Plus size={16} /> New swap group</button>}
        </div>

        <div className="toolbar" style={{ marginBottom: 22 }}>
          <button className={`btn ${tab === "recipes" ? "primary" : ""}`} onClick={() => setTab("recipes")}>
            <BookOpen size={15} /> Recipes <span className="muted" style={{ color: tab === "recipes" ? "#cdd9bf" : undefined }}>{a.length}</span>
          </button>
          <button className={`btn ${tab === "swaps" ? "primary" : ""}`} onClick={() => setTab("swaps")}>
            <ArrowLeftRight size={15} /> Swap groups <span className="muted" style={{ color: tab === "swaps" ? "#cdd9bf" : undefined }}>{swaps.length}</span>
          </button>
        </div>

        {tab === "recipes" ? (
          <>
            <div className="toolbar">
              <div className="searchbox">
                <Search size={17} />
                <input placeholder="Search recipes or an ingredient…" value={q}
                  onChange={(e) => setQ(e.target.value)} />
              </div>
            </div>
            {shown.length ? (
              <div className="recipe-grid">
                {shown.map((r) => <RecipeTicket key={r.id} r={r} onEdit={onEditRecipe} onDelete={onDeleteRecipe} {...h} />)}
              </div>
            ) : (
              <div className="empty card"><Search size={28} /><div className="e-t">No recipes match</div>
                <div className="muted">Try a different name or ingredient.</div></div>
            )}
          </>
        ) : (
          <>
            <p className="lede" style={{ marginTop: -8 }}>
              Items in a group count for each other. If a recipe needs one and it's out, any in-stock
              member fills in — and the recipe shows “with a swap.”
            </p>
            {swaps.map((g) => (
              <div className="card swap-card" key={g.id} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <div className="lab"><ArrowLeftRight size={17} color="var(--sage)" /> {g.label}</div>
                  <div style={{ marginLeft: "auto", display: "flex", gap: 2 }}>
                    <button className="icon-btn" onClick={() => onEditSwap(g)}><Pencil size={15} /></button>
                    <button className="icon-btn" onClick={() => onDeleteSwap(g.id)}><Trash2 size={15} /></button>
                  </div>
                </div>
                <div>
                  {g.members.map((m) => (
                    <span className="chip" key={m}>
                      <span className={`dot ${stockDotClass(engine.stockOf(m))}`} />
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            {swaps.length === 0 && (
              <div className="empty card"><ArrowLeftRight size={28} /><div className="e-t">No swap groups yet</div>
                <div className="muted">Group interchangeable items so recipes stay flexible.</div></div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------- SHOPPING --------------------------------- */
function ShoppingView({ items, trip, engine, addToTrip, removeFromTrip, toggleTripDone,
  clearTripDone }) {
  const [groupBy, setGroupBy] = useState("store");
  const [srcOpen, setSrcOpen] = useState(false);
  const [draft, setDraft] = useState("");

  // names already on the trip list (so we don't suggest them twice)
  const onTrip = new Set(trip.map((t) => norm(t.name)));

  // ---- Zone B: "Worth a trip" — out items that unlock a recipe ≤2 away ----
  // walk recipes that are 1 or 2 required-ingredients short; for each missing
  // item, record which recipes it helps and whether that recipe needs >1 thing.
  const unlockMap = new Map(); // norm(name) -> { name, store, category, recipes:[{name, needs}] }
  engine.analyzed.forEach((r) => {
    if (r.status !== "short_one" && r.status !== "shop") return;
    if (r.reqMissing.length > 2) return; // only ≤2 away
    const needs = r.reqMissing.length; // 1 or 2
    r.reqMissing.forEach((l) => {
      const key = norm(l.name);
      const it = items.find((i) => norm(i.name) === key);
      const entry = unlockMap.get(key) || {
        name: l.name, store: it?.store || "", category: it?.category || "", recipes: [],
      };
      entry.recipes.push({ name: r.name, needs });
      unlockMap.set(key, entry);
    });
  });
  const suggestions = [...unlockMap.values()]
    .filter((s) => !onTrip.has(norm(s.name)))
    .sort((a, b) => a.name.localeCompare(b.name));

  // ---- Zone C: "Also out" — every other out item not already suggested/on trip ----
  const alsoOut = items
    .filter((i) => i.stock === "out")
    .filter((i) => !onTrip.has(norm(i.name)) && !unlockMap.has(norm(i.name)))
    .sort((a, b) => a.name.localeCompare(b.name));

  // ---- Zone A: the trip list itself, grouped like before ----
  const buckets = {};
  trip.forEach((t) => {
    const k = (groupBy === "store" ? t.store : t.category) || "Anywhere";
    (buckets[k] = buckets[k] || []).push(t);
  });
  Object.values(buckets).forEach((list) => list.sort((a, b) => a.name.localeCompare(b.name)));
  const keys = Object.keys(buckets).sort();
  const doneCount = trip.filter((t) => t.done).length;

  const addDraft = () => {
    const v = draft.trim();
    if (!v) return;
    if (!onTrip.has(norm(v))) {
      const it = items.find((i) => norm(i.name) === norm(v));
      addToTrip({ name: v, store: it?.store || "", category: it?.category || "" });
    }
    setDraft("");
  };

  return (
    <div className="page">
      <div className="wrap">
        <div className="pagehead">
          <div><h1>Shopping</h1></div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn sm" onClick={() => setGroupBy(groupBy === "store" ? "category" : "store")}>
              {groupBy === "store" ? <Store size={14} /> : <Layers size={14} />}
              By {groupBy}
            </button>
            {doneCount > 0 && <button className="btn sm" onClick={clearTripDone}><RotateCcw size={14} /> Clear checked</button>}
          </div>
        </div>
        <p className="lede">
          {trip.length
            ? `${trip.length} on your list${doneCount ? ` · ${doneCount} checked off` : ""}.`
            : "Your list is empty — add what you're out of below, or build it from what's worth a trip."}
        </p>

        {/* manual add */}
        <div className="shop-add">
          <input
            placeholder="Add anything to the list…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addDraft())}
          />
          <button className="btn primary" onClick={addDraft} style={{ flex: "none" }}><Plus size={16} /> Add</button>
        </div>

        {/* ZONE A — the trip list */}
        {trip.length === 0 ? (
          <div className="empty card" style={{ marginBottom: 26 }}>
            <ShoppingCart size={30} /><div className="e-t">Nothing on the list yet</div>
            <div className="muted">Tap items from “Worth a trip” or “Also out” below to start building it.</div>
          </div>
        ) : keys.map((k) => (
          <div className="shop-store" key={k}>
            <h3>{groupBy === "store" ? <Store size={17} color="var(--sage)" /> : <Layers size={17} color="var(--sage)" />}{k}</h3>
            {buckets[k].map((t) => (
              <div className={`shop-row ${t.done ? "done" : ""}`} key={t.id}>
                <button className={`check ${t.done ? "on" : ""}`} onClick={() => toggleTripDone(t.id)} aria-label="Got it">
                  {t.done && <Check size={15} />}
                </button>
                <span className="nm">{t.name}</span>
                <button className="icon-btn" onClick={() => removeFromTrip(t.id)} aria-label="Remove"><X size={15} /></button>
              </div>
            ))}
          </div>
        ))}

        {/* ZONE B — worth a trip */}
        {suggestions.length > 0 && (
          <>
            <div className="eyebrow">Worth a trip</div>
            <div className="suggest">
              {suggestions.map((s) => (
                <div className="suggest-row" key={norm(s.name)}>
                  <div className="suggest-main">
                    <div className="nm">{s.name}</div>
                    <div className="unlocks">
                      {s.recipes.map((rc, i) => (
                        <span key={rc.name}>
                          {i > 0 && ", "}
                          {rc.name}{rc.needs > 1 && <span className="needs"> (needs 1 more)</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button className="btn sm" onClick={() => addToTrip({ name: s.name, store: s.store, category: s.category })}>
                    <Plus size={14} /> Add
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ZONE C — also out (collapsed) */}
        {alsoOut.length > 0 && (
          <>
            <button className="src-toggle" onClick={() => setSrcOpen((v) => !v)}>
              {srcOpen ? <ChevronDown size={17} color="var(--sage)" /> : <ChevronRight size={17} color="var(--sage)" />}
              <span className="ct">Also out</span>
              <span className="cn">{alsoOut.length}</span>
              <span className="ln" />
            </button>
            {srcOpen && alsoOut.map((it) => (
              <div className="src-row" key={it.id}>
                <span className={`dot ${stockDotClass("out")}`} />
                <span className="nm">{it.name}</span>
                <button className="btn sm" onClick={() => addToTrip({ name: it.name, store: it.store, category: it.category })}>
                  <Plus size={14} /> Add
                </button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------------------- item editor modal --------------------------- */
function ItemModal({ initial, itemNames, onSave, onClose }) {
  const [f, setF] = useState(() => {
    const base = initial || {
      name: "", category: "Produce", storage: "Fridge", store: "Lidl", stock: "in", qty: "", unit: "", price: "", notes: "",
    };
    return { ...base, subs: Array.isArray(base.subs) ? base.subs : [] };
  });
  const [subDraft, setSubDraft] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const addSub = () => {
    const v = subDraft.trim();
    if (v && norm(v) !== norm(f.name) && !f.subs.some((s) => norm(s) === norm(v))) {
      setF({ ...f, subs: [...f.subs, v] });
    }
    setSubDraft("");
  };
  const removeSub = (s) => setF({ ...f, subs: f.subs.filter((x) => x !== s) });
  const valid = f.name.trim().length > 0;
  return (
    <Scrim onClose={onClose}>
      <div className="modal-head">
        <h2>{initial ? "Edit item" : "Add item"}</h2>
        <button className="icon-btn" onClick={onClose}><X size={20} /></button>
      </div>
      <div className="modal-body">
        <div className="field">
          <label>Name</label>
          <input autoFocus value={f.name} onChange={set("name")} placeholder="e.g. Everything Bagels" />
        </div>
        <div className="row2">
          <div className="field"><label>Category</label>
            <select value={f.category} onChange={set("category")}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
          <div className="field"><label>Stock level</label>
            <select value={f.stock} onChange={set("stock")}>
              <option value="in">Stocked</option><option value="low">Low</option><option value="out">Out</option>
            </select></div>
        </div>
        <div className="row2">
          <div className="field"><label>Storage</label>
            <select value={f.storage} onChange={set("storage")}>{STORAGES.map((c) => <option key={c}>{c}</option>)}</select></div>
          <div className="field"><label>Store</label>
            <input list="stores" value={f.store} onChange={set("store")} placeholder="Where you buy it" />
            <datalist id="stores">{STORES.map((s) => <option key={s} value={s} />)}</datalist></div>
        </div>
        <div className="row3">
          <div className="field"><label>Qty</label><input value={f.qty} onChange={set("qty")} placeholder="1" /></div>
          <div className="field"><label>Unit</label><input value={f.unit} onChange={set("unit")} placeholder="bag" /></div>
          <div className="field"><label>Price</label><input value={f.price} onChange={set("price")} placeholder="1.98" /></div>
        </div>
        <div className="field">
          <label>Substitutes</label>
          <datalist id="itemnames-sub">{(itemNames || []).map((n) => <option key={n} value={n} />)}</datalist>
          <div style={{ display: "flex", gap: 8 }}>
            <input list="itemnames-sub" value={subDraft} onChange={(e) => setSubDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSub())}
              placeholder="An item that can stand in for this one" />
            <button className="btn" type="button" onClick={addSub} style={{ flex: "none" }}><Plus size={15} /></button>
          </div>
          <div style={{ marginTop: f.subs.length ? 4 : 0 }}>
            {f.subs.map((s) => (
              <span className="chip" key={s}>
                {s}
                <button type="button" onClick={() => removeSub(s)}><X size={13} /></button>
              </span>
            ))}
          </div>
          <div className="muted" style={{ marginTop: 6 }}>
            If this item runs out, recipes that need it will use any in-stock substitute and show “with a swap.”
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
          <button className="btn primary" disabled={!valid} style={{ opacity: valid ? 1 : .5 }}
            onClick={() => onSave({ ...f, name: f.name.trim() })}>
            <Check size={16} /> {initial ? "Save changes" : "Add to pantry"}
          </button>
          <button className="btn ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </Scrim>
  );
}

/* --------------------------- recipe editor modal -------------------------- */
function RecipeModal({ initial, itemNames, onSave, onClose }) {
  const [name, setName] = useState(initial?.name || "");
  const [ings, setIngs] = useState(
    initial?.ingredients?.map((i) => ({ ...i })) || [{ id: uid(), name: "", qty: "", unit: "", optional: false }]
  );
  const setIng = (id, k, v) => setIngs((p) => p.map((i) => (i.id === id ? { ...i, [k]: v } : i)));
  const addIng = () => setIngs((p) => [...p, { id: uid(), name: "", qty: "", unit: "", optional: false }]);
  const delIng = (id) => setIngs((p) => p.filter((i) => i.id !== id));
  const valid = name.trim() && ings.some((i) => i.name.trim());

  return (
    <Scrim onClose={onClose}>
      <div className="modal-head">
        <h2>{initial ? "Edit recipe" : "New recipe"}</h2>
        <button className="icon-btn" onClick={onClose}><X size={20} /></button>
      </div>
      <div className="modal-body">
        <div className="field">
          <label>Recipe name</label>
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Taco Bowl" />
        </div>
        <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--sage)", display: "block", marginBottom: 8 }}>Ingredients</label>
        <datalist id="itemnames">{itemNames.map((n) => <option key={n} value={n} />)}</datalist>
        {ings.map((i) => (
          <div className="ing-edit" key={i.id}>
            <input list="itemnames" value={i.name} placeholder="Ingredient" onChange={(e) => setIng(i.id, "name", e.target.value)} />
            <input value={i.qty} placeholder="Qty" onChange={(e) => setIng(i.id, "qty", e.target.value)} />
            <input value={i.unit} placeholder="Unit" onChange={(e) => setIng(i.id, "unit", e.target.value)} />
            <label className="opt">
              <input type="checkbox" checked={i.optional} onChange={(e) => setIng(i.id, "optional", e.target.checked)} />
              optional
            </label>
            <button className="icon-btn del" onClick={() => delIng(i.id)}><Trash2 size={15} /></button>
          </div>
        ))}
        <button className="btn sm" onClick={addIng} style={{ marginTop: 4 }}><Plus size={14} /> Add ingredient</button>
        <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
          <button className="btn primary" disabled={!valid} style={{ opacity: valid ? 1 : .5 }}
            onClick={() => onSave({
              id: initial?.id || uid(), name: name.trim(),
              ingredients: ings.filter((i) => i.name.trim()).map((i) => ({ ...i, name: i.name.trim() })),
            })}>
            <Check size={16} /> {initial ? "Save recipe" : "Create recipe"}
          </button>
          <button className="btn ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </Scrim>
  );
}

/* ----------------------------- swap editor modal -------------------------- */
function SwapModal({ initial, itemNames, onSave, onClose }) {
  const [label, setLabel] = useState(initial?.label || "");
  const [members, setMembers] = useState(initial?.members ? [...initial.members] : []);
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (v && !members.some((m) => norm(m) === norm(v))) setMembers([...members, v]);
    setDraft("");
  };
  const valid = label.trim() && members.length >= 2;
  return (
    <Scrim onClose={onClose}>
      <div className="modal-head">
        <h2>{initial ? "Edit swap group" : "New swap group"}</h2>
        <button className="icon-btn" onClick={onClose}><X size={20} /></button>
      </div>
      <div className="modal-body">
        <div className="field">
          <label>Group name</label>
          <input autoFocus value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Cheese slices" />
        </div>
        <div className="field">
          <label>Interchangeable items (2 or more)</label>
          <datalist id="itemnames-swap">{itemNames.map((n) => <option key={n} value={n} />)}</datalist>
          <div style={{ display: "flex", gap: 8 }}>
            <input list="itemnames-swap" value={draft} onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())} placeholder="Type an item, press Enter" />
            <button className="btn" onClick={add} style={{ flex: "none" }}><Plus size={15} /></button>
          </div>
        </div>
        <div>
          {members.map((m) => (
            <span className="chip" key={m}>
              {m}
              <button onClick={() => setMembers(members.filter((x) => x !== m))}><X size={13} /></button>
            </span>
          ))}
          {members.length === 0 && <span className="muted">No items yet.</span>}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
          <button className="btn primary" disabled={!valid} style={{ opacity: valid ? 1 : .5 }}
            onClick={() => onSave({ id: initial?.id || uid(), label: label.trim(), members })}>
            <Check size={16} /> {initial ? "Save group" : "Create group"}
          </button>
          <button className="btn ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </Scrim>
  );
}

/* --------------------- add-a-substitute-from-a-recipe modal --------------- */
function IngredientSwapModal({ item, itemNames, onSave, onClose }) {
  const [subs, setSubs] = useState(Array.isArray(item.subs) ? [...item.subs] : []);
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (v && norm(v) !== norm(item.name) && !subs.some((s) => norm(s) === norm(v))) setSubs([...subs, v]);
    setDraft("");
  };
  const remove = (s) => setSubs(subs.filter((x) => x !== s));
  return (
    <Scrim onClose={onClose}>
      <div className="modal-head">
        <h2>Substitute for {item.name}</h2>
        <button className="icon-btn" onClick={onClose}><X size={20} /></button>
      </div>
      <div className="modal-body">
        <p className="muted" style={{ marginTop: -2, marginBottom: 14 }}>
          Pick an item you can use instead. If it's in stock, recipes that need {item.name} become
          cookable “with a swap.” This is also saved on {item.name} in your Pantry.
        </p>
        <div className="field">
          <label>Stand-ins for {item.name}</label>
          <datalist id="itemnames-ingswap">{(itemNames || []).map((n) => <option key={n} value={n} />)}</datalist>
          <div style={{ display: "flex", gap: 8 }}>
            <input autoFocus list="itemnames-ingswap" value={draft} onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
              placeholder="An item that can stand in" />
            <button className="btn" type="button" onClick={add} style={{ flex: "none" }}><Plus size={15} /></button>
          </div>
          <div style={{ marginTop: subs.length ? 4 : 0 }}>
            {subs.map((s) => (
              <span className="chip" key={s}>
                {s}
                <button type="button" onClick={() => remove(s)}><X size={13} /></button>
              </span>
            ))}
            {subs.length === 0 && <span className="muted">No substitutes yet.</span>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
          <button className="btn primary" onClick={() => onSave(item.id, subs)}>
            <Check size={16} /> Save substitutes
          </button>
          <button className="btn ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </Scrim>
  );
}

function Scrim({ children, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true">{children}</div>
    </div>
  );
}

/* ---------------------------------- App ----------------------------------- */
const NAV = [
  ["today", "Today", ChefHat],
  ["pantry", "Pantry", Carrot],
  ["recipes", "Recipes", BookOpen],
  ["shopping", "Shopping", ShoppingCart],
];

export default function App() {
  const [data, setData] = useState(null);
  const [view, setView] = useState("today");
  const [modal, setModal] = useState(null); // {type, payload}
  const loaded = useRef(false);
  const dataRef = useRef(null);      // always-current data for event handlers
  const pendingSave = useRef(false); // a local change is waiting to upload
  const lastSynced = useRef("");     // JSON we last agreed on with the cloud

  // keep dataRef pointed at the latest data
  useEffect(() => { dataRef.current = data; }, [data]);

  // load — cloud first (so both devices share), local cache as fallback
  useEffect(() => {
    let alive = true;
    (async () => {
      if (cloudEnabled) {
        const remote = await cloudLoad();
        if (!alive) return;
        if (remote) { lastSynced.current = JSON.stringify(remote); setData(remote); loaded.current = true; return; }
        // nothing in the cloud yet — seed it and push the first copy up
        const seed = buildSeed();
        lastSynced.current = JSON.stringify(seed);
        setData(seed); loaded.current = true;
        cloudSave(seed);
        return;
      }
      // no cloud configured — use this device's saved copy
      try {
        const raw = localStorage.getItem(STORE_KEY);
        if (raw) { setData(JSON.parse(raw)); loaded.current = true; return; }
      } catch (e) { /* corrupt or unavailable — fall through to seed */ }
      setData(buildSeed());
      loaded.current = true;
    })();
    return () => { alive = false; };
  }, []);

  // persist — always cache locally; push to cloud shortly after changes settle
  useEffect(() => {
    if (!data || !loaded.current) return;
    const js = JSON.stringify(data);
    try { localStorage.setItem(STORE_KEY, js); } catch (e) {}
    if (!cloudEnabled) return;
    if (js === lastSynced.current) return; // this state came from the cloud — don't bounce it back
    pendingSave.current = true;
    const t = setTimeout(async () => {
      await cloudSave(data);
      lastSynced.current = js;
      pendingSave.current = false;
    }, 600);
    return () => clearTimeout(t);
  }, [data]);

  // live sync — pull the latest when this device is focused, push when it's left
  useEffect(() => {
    if (!cloudEnabled) return;
    let alive = true;

    const pull = async () => {
      if (!alive || !loaded.current || pendingSave.current) return;
      const remote = await cloudLoad();
      if (!alive || !remote) return;
      const rs = JSON.stringify(remote);
      if (rs !== JSON.stringify(dataRef.current)) {
        lastSynced.current = rs;
        setData(remote);
      }
    };

    const flush = () => {
      if (!loaded.current || !dataRef.current) return;
      const js = JSON.stringify(dataRef.current);
      if (js !== lastSynced.current) { cloudSave(dataRef.current); lastSynced.current = js; }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") pull();
      else flush();
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", pull);
    window.addEventListener("pagehide", flush);
    const poll = setInterval(() => {
      if (document.visibilityState === "visible") pull();
    }, 15000);

    return () => {
      alive = false;
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", pull);
      window.removeEventListener("pagehide", flush);
      clearInterval(poll);
    };
  }, []);

  const engine = useEngine(data?.items || [], data?.recipes || [], data?.swaps || []);

  const itemNames = useMemo(() => {
    const s = new Set((data?.items || []).map((i) => i.name));
    (data?.recipes || []).forEach((r) => r.ingredients.forEach((i) => s.add(i.name)));
    return [...s].sort();
  }, [data]);

  if (!data) {
    return (
      <div className="mise"><style>{CSS}</style>
        <div className="empty" style={{ paddingTop: 120 }}>
          <ChefHat size={32} /><div className="e-t">Setting the table…</div>
        </div>
      </div>
    );
  }

  const patch = (p) => setData((d) => ({ ...d, ...p }));

  /* ---- inventory ops ---- */
  const setStock = (id, stock) => patch({ items: data.items.map((i) => (i.id === id ? { ...i, stock } : i)) });
  const saveItem = (it) => {
    if (it.id) patch({ items: data.items.map((x) => (x.id === it.id ? it : x)) });
    else patch({ items: [...data.items, { ...it, id: uid() }] });
    setModal(null);
  };
  const deleteItem = (id) => patch({ items: data.items.filter((i) => i.id !== id) });

  /* ---- recipe ops ---- */
  const saveRecipe = (r) => {
    const exists = data.recipes.some((x) => x.id === r.id);
    patch({ recipes: exists ? data.recipes.map((x) => (x.id === r.id ? r : x)) : [...data.recipes, r] });
    setModal(null);
  };
  const deleteRecipe = (id) => patch({ recipes: data.recipes.filter((r) => r.id !== id) });

  /* ---- swap ops ---- */
  const saveSwap = (g) => {
    const exists = data.swaps.some((x) => x.id === g.id);
    patch({ swaps: exists ? data.swaps.map((x) => (x.id === g.id ? g : x)) : [...data.swaps, g] });
    setModal(null);
  };
  const deleteSwap = (id) => patch({ swaps: data.swaps.filter((g) => g.id !== id) });

  /* ---- cooking: nudge required tracked ingredients down a level ---- */
  const cooked = (r) => {
    const drop = { in: "low", low: "out", out: "out" };
    const need = new Set(r.lines.filter((l) => !l.optional && l.have && !l.untracked).map((l) => norm(l.name)));
    patch({ items: data.items.map((i) => (need.has(norm(i.name)) ? { ...i, stock: drop[i.stock] } : i)) });
  };

  /* ---- shopping (trip list) ops ---- */
  const addToTrip = ({ name, store, category }) => {
    const cur = data.trip || [];
    if (cur.some((t) => norm(t.name) === norm(name))) return; // no duplicates
    patch({ trip: [...cur, { id: uid(), name, store: store || "", category: category || "", done: false }] });
  };
  const removeFromTrip = (id) => patch({ trip: (data.trip || []).filter((t) => t.id !== id) });
  const toggleTripDone = (id) =>
    patch({ trip: (data.trip || []).map((t) => (t.id === id ? { ...t, done: !t.done } : t)) });
  const clearTripDone = () => patch({ trip: (data.trip || []).filter((t) => !t.done) });

  // add a recipe's missing required items straight onto the trip list
  const addMissing = (r) => {
    const cur = data.trip || [];
    const have = new Set(cur.map((t) => norm(t.name)));
    const add = [];
    r.reqMissing.forEach((l) => {
      if (have.has(norm(l.name))) return;
      const it = data.items.find((i) => norm(i.name) === norm(l.name));
      add.push({ id: uid(), name: l.name, store: it?.store || "", category: it?.category || "", done: false });
      have.add(norm(l.name));
    });
    if (add.length) { patch({ trip: [...cur, ...add] }); setView("shopping"); }
  };

  const resetAll = () => {
    if (window.confirm("Reset everything back to the sample kitchen? This clears your changes.")) {
      const seed = buildSeed(); loaded.current = true; setData(seed);
    }
  };

  // open the substitute editor for a missing ingredient (writes to the pantry item's subs)
  const saveItemSubs = (itemId, subs) => {
    patch({ items: data.items.map((i) => (i.id === itemId ? { ...i, subs } : i)) });
    setModal(null);
  };
  const openIngredientSwap = (line) => {
    const it = data.items.find((i) => norm(i.name) === norm(line.name));
    if (it) setModal({ type: "ingredientSwap", payload: it });
  };

  const ticketHandlers = {
    onAddMissing: addMissing,
    onCooked: cooked,
    onEdit: (r) => setModal({ type: "recipe", payload: r }),
    onSwapIngredient: openIngredientSwap,
  };

  return (
    <div className="mise">
      <style>{CSS}</style>

      <header className="top">
        <div className="wrap">
          <div className="mark"><TreePine size={22} color="#C9D9B4" />Pantree</div>
          <div className="tag">kitchen on hand</div>
          <nav className="navd">
            {NAV.map(([k, label, Icon]) => (
              <button key={k} className={view === k ? "on" : ""} onClick={() => setView(k)}>
                <Icon size={16} /> {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main>
        {view === "today" && <TodayView engine={engine} {...ticketHandlers} />}
        {view === "pantry" && (
          <PantryView items={data.items} setStock={setStock}
            onEdit={(it) => setModal({ type: "item", payload: it })}
            onAdd={() => setModal({ type: "item", payload: null })}
            onDelete={deleteItem} />
        )}
        {view === "recipes" && (
          <RecipesView engine={engine} swaps={data.swaps} items={data.items}
            onAddRecipe={() => setModal({ type: "recipe", payload: null })}
            onEditRecipe={(r) => setModal({ type: "recipe", payload: r })}
            onDeleteRecipe={deleteRecipe}
            onAddSwap={() => setModal({ type: "swap", payload: null })}
            onEditSwap={(g) => setModal({ type: "swap", payload: g })}
            onDeleteSwap={deleteSwap}
            {...ticketHandlers} />
        )}
        {view === "shopping" && (
          <ShoppingView items={data.items} trip={data.trip || []} engine={engine}
            addToTrip={addToTrip} removeFromTrip={removeFromTrip}
            toggleTripDone={toggleTripDone} clearTripDone={clearTripDone} />
        )}

        <div className="wrap">
          <div className="foot">Pantree keeps everything on this device. <button onClick={resetAll}>Reset to sample kitchen</button></div>
        </div>
      </main>

      <nav className="navm">
        {NAV.map(([k, label, Icon]) => (
          <button key={k} className={view === k ? "on" : ""} onClick={() => setView(k)}>
            <Icon size={19} /> {label}
          </button>
        ))}
      </nav>

      {modal?.type === "item" && (
        <ItemModal initial={modal.payload} itemNames={itemNames} onSave={saveItem} onClose={() => setModal(null)} />
      )}
      {modal?.type === "recipe" && (
        <RecipeModal initial={modal.payload} itemNames={itemNames} onSave={saveRecipe} onClose={() => setModal(null)} />
      )}
      {modal?.type === "swap" && (
        <SwapModal initial={modal.payload} itemNames={itemNames} onSave={saveSwap} onClose={() => setModal(null)} />
      )}
      {modal?.type === "ingredientSwap" && (
        <IngredientSwapModal item={modal.payload} itemNames={itemNames} onSave={saveItemSubs} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
