// Swap this out per-venue. In a real deployment this would come from
// a `menu_items` / `menu_categories` query (see the schema doc) instead
// of a static file.

const VENUE = {
  name: "Ta' Rita",
  slug: "ta-rita"
};

const CATEGORIES = ["Starters", "Mains", "Sides", "Drinks"];

const MENU_ITEMS = [
  { id: 1, cat: "Starters", name: "Ħobż biż-Żejt", desc: "Crusty local bread, tomato, capers, olive oil, tuna on request", price: 6.50 },
  { id: 2, cat: "Starters", name: "Bigilla", desc: "Broad bean pâté, garlic, chilli, served with galletti", price: 5.00 },
  { id: 3, cat: "Starters", name: "Pastizzi (3pc)", desc: "Ricotta or mushy pea, straight from the oven", price: 4.50 },
  { id: 4, cat: "Mains", name: "Bragioli", desc: "Beef olives, slow braised in red wine, served with rice", price: 15.50 },
  { id: 5, cat: "Mains", name: "Fenkata", desc: "Rabbit stewed in wine and garlic, the Sunday classic", price: 17.00 },
  { id: 6, cat: "Mains", name: "Lampuki Pie", desc: "Seasonal when available — ask your waiter for today's catch", price: 14.00 },
  { id: 7, cat: "Sides", name: "Maltese Ftira Toast", desc: "Grilled, olive oil, oregano", price: 3.50 },
  { id: 8, cat: "Sides", name: "Roast Potatoes", desc: "Rosemary, sea salt", price: 3.00 },
  { id: 9, cat: "Drinks", name: "Kinnie", desc: "Ice cold, the local one", price: 2.50 },
  { id: 10, cat: "Drinks", name: "House Red — glass", desc: "Gozitan blend", price: 4.50 },
];
