// Catalogo di partenza. Viene copiato nel catalogo dell'utente al primo avvio:
// da lì in poi categorie e prodotti si possono modificare, aggiungere e cancellare.
// "Ripristina catalogo base" riaggiunge solo le voci mancanti, senza toccare le altre.

export const BASE_CATEGORIES = [
  { id: 'frutta-verdura', name: 'Frutta e verdura', icon: '🥦' },
  { id: 'pane-forno', name: 'Pane e forno', icon: '🥖' },
  { id: 'latticini', name: 'Latte, latticini e uova', icon: '🧀' },
  { id: 'carne', name: 'Carne', icon: '🥩' },
  { id: 'pesce', name: 'Pesce', icon: '🐟' },
  { id: 'salumi', name: 'Salumi e gastronomia', icon: '🥓' },
  { id: 'pasta-riso', name: 'Pasta, riso e cereali', icon: '🍝' },
  { id: 'dispensa', name: 'Dispensa e condimenti', icon: '🫙' },
  { id: 'colazione', name: 'Colazione e dolci', icon: '🥐' },
  { id: 'surgelati', name: 'Surgelati', icon: '🧊' },
  { id: 'bevande', name: 'Bevande', icon: '🧃' },
  { id: 'bimbi', name: 'Bambini', icon: '🍼' },
  { id: 'casa', name: 'Pulizia casa', icon: '🧽' },
  { id: 'persona', name: 'Igiene personale', icon: '🧴' },
  { id: 'animali', name: 'Animali', icon: '🐾' },
  { id: 'altro', name: 'Altro', icon: '🛒' },
];

const PRODUCTS_BY_CATEGORY = {
  'frutta-verdura': [
    'Mele', 'Pere', 'Banane', 'Arance', 'Mandarini', 'Limoni', 'Kiwi', 'Uva', 'Fragole',
    'Pesche', 'Albicocche', 'Melone', 'Anguria', 'Frutti di bosco', 'Pomodori', 'Pomodorini',
    'Insalata', 'Rucola', 'Spinaci', 'Zucchine', 'Melanzane', 'Peperoni', 'Carote', 'Patate',
    'Cipolle', 'Aglio', 'Sedano', 'Finocchi', 'Broccoli', 'Cavolfiore', 'Funghi', 'Cetrioli',
    'Zucca', 'Basilico', 'Prezzemolo', 'Avocado',
  ],
  'pane-forno': [
    'Pane', 'Pane in cassetta', 'Pane integrale', 'Grissini', 'Crackers', 'Fette biscottate',
    'Piadine', 'Focaccia', 'Pangrattato', 'Taralli',
  ],
  latticini: [
    'Latte', 'Latte senza lattosio', 'Yogurt', 'Yogurt greco', 'Burro', 'Panna da cucina',
    'Mozzarella', 'Parmigiano', 'Grana Padano', 'Ricotta', 'Stracchino', 'Formaggio a fette',
    'Mascarpone', 'Scamorza', 'Uova',
  ],
  carne: [
    'Petto di pollo', 'Cosce di pollo', 'Carne macinata', 'Fettine di vitello', 'Bistecca',
    'Salsicce', 'Arista di maiale', 'Hamburger', 'Wurstel', 'Tacchino',
  ],
  pesce: [
    'Salmone', 'Merluzzo', 'Orata', 'Branzino', 'Gamberi', 'Cozze', 'Vongole', 'Tonno fresco',
  ],
  salumi: [
    'Prosciutto cotto', 'Prosciutto crudo', 'Salame', 'Mortadella', 'Bresaola', 'Speck',
    'Pancetta', 'Affettato di tacchino',
  ],
  'pasta-riso': [
    'Spaghetti', 'Penne', 'Fusilli', 'Pasta corta', 'Pasta fresca', 'Lasagne', 'Gnocchi',
    'Tortellini', 'Riso', 'Riso basmati', 'Farro', 'Orzo', 'Cous cous', 'Farina',
    'Lievito', 'Cereali', 'Fiocchi d\'avena',
  ],
  dispensa: [
    'Olio extravergine', 'Olio di semi', 'Aceto', 'Aceto balsamico', 'Sale', 'Pepe',
    'Zucchero', 'Passata di pomodoro', 'Pelati', 'Concentrato di pomodoro', 'Tonno in scatola',
    'Legumi in scatola', 'Ceci', 'Fagioli', 'Lenticchie', 'Mais', 'Piselli', 'Olive',
    'Capperi', 'Pesto', 'Maionese', 'Ketchup', 'Senape', 'Dado', 'Brodo', 'Spezie',
  ],
  colazione: [
    'Caffè', 'Caffè in capsule', 'Tè', 'Tisane', 'Biscotti', 'Merendine', 'Cornetti',
    'Marmellata', 'Miele', 'Crema spalmabile', 'Cioccolato', 'Cacao', 'Gelato', 'Caramelle',
  ],
  surgelati: [
    'Verdure surgelate', 'Minestrone surgelato', 'Piselli surgelati', 'Spinaci surgelati',
    'Bastoncini di pesce', 'Pizza surgelata', 'Patatine surgelate', 'Cotolette', 'Ghiaccio',
  ],
  bevande: [
    'Acqua naturale', 'Acqua frizzante', 'Succhi di frutta', 'Bibite', 'Tè freddo', 'Birra',
    'Vino rosso', 'Vino bianco', 'Prosecco', 'Latte vegetale',
  ],
  bimbi: [
    'Pannolini', 'Salviette umidificate', 'Omogeneizzati', 'Pastina', 'Latte in polvere',
    'Biscotti per bambini', 'Crema per il cambio',
  ],
  casa: [
    'Detersivo piatti', 'Pastiglie lavastoviglie', 'Detersivo lavatrice', 'Ammorbidente',
    'Candeggina', 'Sgrassatore', 'Anticalcare', 'Detergente pavimenti', 'Spugne',
    'Carta da cucina', 'Carta igienica', 'Tovaglioli', 'Sacchi spazzatura', 'Pellicola',
    'Carta stagnola', 'Sacchetti gelo', 'Pile', 'Lampadine',
  ],
  persona: [
    'Shampoo', 'Balsamo', 'Bagnoschiuma', 'Sapone mani', 'Dentifricio', 'Spazzolini',
    'Filo interdentale', 'Deodorante', 'Rasoi', 'Assorbenti', 'Cotton fioc', 'Dischetti struccanti',
    'Crema solare', 'Fazzoletti', 'Cerotti',
  ],
  animali: [
    'Crocchette cane', 'Crocchette gatto', 'Umido cane', 'Umido gatto', 'Lettiera', 'Snack animali',
  ],
  altro: [],
};

export function slugify(text) {
  return text
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export const BASE_PRODUCTS = Object.entries(PRODUCTS_BY_CATEGORY).flatMap(
  ([categoryId, names]) => names.map((name) => ({ id: `p-${slugify(name)}`, name, categoryId })),
);
