// Deterministic multi-app seed generator for "El Loco Casaca"
// Produces 5 idempotent SQL seed files (sellerapp, buyerapp, paymentapp, shippingapp, feedbackapp)
// that share the same clerkIds / order keys so the 5 databases tell one consistent story.
import { randomUUID } from "node:crypto";
import { writeFileSync, mkdirSync } from "node:fs";

// ---------- deterministic PRNG ----------
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20260701);
const rf = () => rng();
const ri = (min, max) => Math.floor(rng() * (max - min + 1)) + min; // inclusive
const rfloat = (min, max) => rng() * (max - min) + min;
const pick = (arr) => arr[Math.floor(rng() * arr.length)];
const chance = (p) => rng() < p;
const pad = (n, w) => String(n).padStart(w, "0");
const round2 = (n) => Math.round(n * 100) / 100;

function esc(s) {
  if (s === null || s === undefined) return "NULL";
  return "'" + String(s).replace(/'/g, "''") + "'";
}
function jsonLit(obj) {
  return "'" + JSON.stringify(obj).replace(/'/g, "''") + "'";
}
function arrLit(arr) {
  return "ARRAY[" + arr.map((x) => esc(x)).join(",") + "]";
}
function ts(d) {
  return "'" + d.toISOString().replace("T", " ").replace("Z", "+00") + "'";
}
function addDays(d, days) {
  return new Date(d.getTime() + days * 86400000);
}

// ---------- time window ----------
const NOW = new Date("2026-06-30T20:00:00.000Z");
const WINDOW_START = new Date("2026-04-02T00:00:00.000Z"); // ~90 days of history
const WINDOW_DAYS = (NOW - WINDOW_START) / 86400000;

function randomOrderDate() {
  // slight recency bias so the last few days still have "fresh" orders too,
  // but overall roughly uniform across the 90-day window
  const t = rf();
  const dayOffset = t * WINDOW_DAYS;
  const hourJitter = ri(7, 22);
  const minuteJitter = ri(0, 59);
  const d = addDays(WINDOW_START, dayOffset);
  d.setUTCHours(hourJitter, minuteJitter, ri(0, 59), 0);
  return d;
}

// ================================================================
// Reference data
// ================================================================
const TEAMS = [
  "Boca Juniors", "River Plate", "Racing Club", "Independiente", "San Lorenzo",
  "Talleres", "Estudiantes de La Plata", "Velez Sarsfield", "Argentina Seleccion",
  "Brasil Seleccion", "FC Barcelona", "Real Madrid", "Manchester United",
  "Manchester City", "Liverpool FC", "Paris Saint-Germain", "Juventus",
  "AC Milan", "Inter de Milan", "Bayern Munich", "Inter Miami CF", "Flamengo",
];
const SEASONS = ["2023/24", "2024/25", "2025/26"];
const VERSIONS = ["RETRO", "HOME", "AWAY"];
const SIZES = ["S", "M", "L", "XL", "XXL"];
const CITIES = [
  "Buenos Aires", "La Plata", "Rosario", "Cordoba", "Mendoza", "Mar del Plata",
  "Salta", "San Miguel de Tucuman", "Santa Fe", "Neuquen", "Bahia Blanca", "Resistencia",
];
const STREETS = [
  "Av. Corrientes", "Av. Rivadavia", "Av. Cabildo", "Calle San Martin", "Av. Belgrano",
  "Calle Mitre", "Av. Independencia", "Calle Sarmiento", "Av. Colon", "Calle Peru",
];
const COURIERS = ["courier_andreani", "courier_oca", "courier_correo_arg", "courier_via_cargo"];

const FIRST_NAMES_M = ["Juan", "Martin", "Nicolas", "Facundo", "Lucas", "Federico", "Ezequiel", "Ignacio", "Tomas", "Santiago", "Gonzalo", "Agustin", "Bruno", "Diego"];
const FIRST_NAMES_F = ["Sofia", "Camila", "Valentina", "Julieta", "Martina", "Agustina", "Florencia", "Micaela", "Lucia", "Rocio", "Carla", "Milagros", "Antonella", "Paula"];
const LAST_NAMES = ["Gomez", "Fernandez", "Rodriguez", "Perez", "Gonzalez", "Sosa", "Romero", "Diaz", "Alvarez", "Torres", "Ruiz", "Molina", "Acosta", "Benitez", "Suarez", "Ledesma", "Ferreyra", "Ibarra", "Paez", "Cabrera"];

function personName() {
  const isM = chance(0.5);
  const first = pick(isM ? FIRST_NAMES_M : FIRST_NAMES_F);
  const last = pick(LAST_NAMES);
  return { first, last, full: `${first} ${last}` };
}

function fakeClerkId(prefix, n) {
  return `user_seed_${prefix}${pad(n, 3)}xxDEMO${pad(n, 4)}`;
}

// ================================================================
// SQL buffers per app
// ================================================================
const sql = { seller: [], buyer: [], payment: [], shipping: [], feedback: [] };
function header(app, title) {
  sql[app].push(`-- ${title}`);
}

// ================================================================
// 1) Users: sellers + buyers (shared clerkIds across all 5 DBs)
// ================================================================
const CANON_BUYER = "user_3EZ24f4ckNuGNicwvUv60v16df5";
const CANON_SELLER = "user_3EZ21jRpTuRcgSfKa94ytFJM1Eq";
const CANON_MODERATOR = "user_3EY16ziKMUxsmaAXntfuJajRpIR";
const CANON_ADMIN = "user_3EY1BlufGgMT4Sbl0VIjABwoIUe";

const NUM_SELLERS = 8;
const NUM_BUYERS = 25;

const sellers = [];
for (let i = 0; i < NUM_SELLERS; i++) {
  const clerkId = i === 0 ? CANON_SELLER : fakeClerkId("s", i);
  const name = personName();
  const storeName = i === 0
    ? "El Loco Casaca Oficial"
    : `${pick(["Retro", "Camisetas", "Futbol", "Casaca"])} ${name.last} Store`;
  sellers.push({
    clerkId,
    email: i === 0 ? "seller.feedback@example.com" : `vendedor${pad(i, 2)}@elolococasaca-demo.com`,
    name: storeName,
    description: `Tienda de indumentaria de futbol con ${ri(1, 12)} anios de trayectoria. Envios a todo el pais.`,
    isVerified: i === 0 ? true : chance(0.7),
    createdAt: addDays(WINDOW_START, -ri(30, 400)),
  });
}

const buyers = [];
for (let i = 0; i < NUM_BUYERS; i++) {
  const clerkId = i === 0 ? CANON_BUYER : fakeClerkId("b", i);
  const p = personName();
  const city = pick(CITIES);
  const street = pick(STREETS);
  buyers.push({
    clerkId,
    email: i === 0 ? "buyer.feedback@example.com" : `${p.first.toLowerCase()}.${p.last.toLowerCase()}${i}@elolococasaca-demo.com`,
    name: p.full,
    address: {
      street: `${street} ${ri(100, 4800)}`,
      city,
      province: city === "Buenos Aires" ? "CABA" : city,
      zip: `${ri(1000, 9999)}`,
      country: "Argentina",
      recipient: p.full,
    },
    createdAt: addDays(WINDOW_START, -ri(0, 300)),
  });
}

// ================================================================
// 2) Categories + Products + ProductImages (sellerapp)
// ================================================================
const CATEGORY_DEFS = [
  { id: "cat_titular", name: "Camisetas Titular" },
  { id: "cat_suplente", name: "Camisetas Suplente" },
  { id: "cat_retro", name: "Camisetas Retro" },
  { id: "cat_shorts", name: "Shorts y Conjuntos" },
  { id: "cat_accesorios", name: "Accesorios" },
];

const products = [];
const NUM_PRODUCTS = 45;
let prodN = 0;
for (let i = 0; i < NUM_PRODUCTS; i++) {
  prodN++;
  const seller = sellers[i % sellers.length];
  const team = pick(TEAMS);
  const season = pick(SEASONS);
  const roll = rf();
  let version, categoryId, kind;
  if (roll < 0.12) {
    version = pick(VERSIONS);
    categoryId = "cat_shorts";
    kind = "Short";
  } else if (roll < 0.2) {
    version = pick(VERSIONS);
    categoryId = "cat_accesorios";
    kind = "Accesorio";
  } else if (roll < 0.4) {
    version = "RETRO";
    categoryId = "cat_retro";
    kind = "Camiseta Retro";
  } else if (roll < 0.7) {
    version = "HOME";
    categoryId = "cat_titular";
    kind = "Camiseta Titular";
  } else {
    version = "AWAY";
    categoryId = "cat_suplente";
    kind = "Camiseta Suplente";
  }
  const size = pick(SIZES);
  const price = round2(rfloat(34900, 129900));
  const stock = ri(0, 60);
  products.push({
    id: `prod_${pad(prodN, 4)}`,
    sellerId: seller.clerkId,
    title: `${kind} ${team} ${season}`,
    description: `${kind} oficial de ${team}, temporada ${season}. Tela premium, escudo bordado.`,
    price,
    stock,
    categoryId,
    season,
    team,
    size,
    version,
    createdAt: addDays(seller.createdAt, ri(5, 60)),
  });
}
const productImages = products.map((p, idx) => ({
  id: `img_${pad(idx + 1, 4)}`,
  url: `https://picsum.photos/seed/elococasaca-${p.id}/640/640`,
  productId: p.id,
}));

// ================================================================
// 3) Orders + OrderDetails, driven purely by elapsed time vs NOW
// ================================================================
const NUM_ORDERS = 150;
const orders = [];

function productsOfSeller(sellerId) {
  return products.filter((p) => p.sellerId === sellerId);
}

// guarantee coverage: every buyer >=1 order, every seller has products already ensures sales spread
const buyerOrderCounts = new Array(buyers.length).fill(0);
for (let i = 0; i < NUM_ORDERS; i++) {
  // weight early indices to ensure everyone gets at least one order first pass
  let buyerIdx;
  if (i < buyers.length) buyerIdx = i;
  // extra weight toward the canonical demo buyer (index 0) so the one account with
  // a real Clerk login has enough order history to exercise the buyer flow manually
  else if (chance(0.2)) buyerIdx = 0;
  else buyerIdx = ri(0, buyers.length - 1);
  buyerOrderCounts[buyerIdx]++;

  const buyer = buyers[buyerIdx];
  const seller = pick(sellers);
  const sellerProducts = productsOfSeller(seller.clerkId);
  const lineCount = chance(0.55) ? 1 : chance(0.8) ? 2 : 3;
  const lines = [];
  const usedProductIds = new Set();
  for (let l = 0; l < lineCount; l++) {
    let prod = pick(sellerProducts);
    if (usedProductIds.has(prod.id) && sellerProducts.length > lineCount) {
      prod = sellerProducts.find((p) => !usedProductIds.has(p.id)) ?? prod;
    }
    usedProductIds.add(prod.id);
    const qty = chance(0.75) ? 1 : 2;
    lines.push({ product: prod, quantity: qty, unitPrice: prod.price, totalPrice: round2(prod.price * qty) });
  }
  const totalPrice = round2(lines.reduce((s, l) => s + l.totalPrice, 0));
  const createdAt = randomOrderDate();
  const daysAgo = (NOW - createdAt) / 86400000;

  const isCanceled = daysAgo >= 3 && chance(0.05);

  orders.push({
    id: `ord_${pad(i + 1, 4)}`,
    externalOrderId: `ord_ext_${pad(i + 1, 5)}`,
    buyer,
    seller,
    lines,
    totalPrice,
    createdAt,
    daysAgo,
    isCanceled,
  });
}
orders.sort((a, b) => a.createdAt - b.createdAt);

// ---- stage timeline per order ----
for (const o of orders) {
  const t0 = o.createdAt;
  if (o.isCanceled) {
    const cancelAt = addDays(t0, rfloat(0.3, 1.5));
    o.stages = [{ status: "PENDING", at: t0 }, { status: "CANCELED", at: cancelAt > NOW ? NOW : cancelAt }];
    o.finalStatus = "CANCELED";
    o.deliveredAt = null;
  } else {
    const t1 = addDays(t0, rfloat(0.5, 1.5));   // PREPARING
    const t2 = addDays(t1, rfloat(0.5, 1.5));   // SHIPPED
    const t3 = addDays(t2, rfloat(0.2, 1));     // IN_TRANSIT
    const t4 = addDays(t3, rfloat(1, 3));       // DELIVERED
    const candidates = [
      { status: "PENDING", at: t0 },
      { status: "PREPARING", at: t1 },
      { status: "SHIPPED", at: t2 },
      { status: "IN_TRANSIT", at: t3 },
      { status: "DELIVERED", at: t4 },
    ];
    const reached = candidates.filter((c) => c.at <= NOW);
    o.stages = reached;
    o.finalStatus = reached[reached.length - 1].status;
    o.deliveredAt = o.finalStatus === "DELIVERED" ? t4 : null;
  }
}

const ORDER_STATUS_MAP = {
  PENDING: "PENDING", PREPARING: "PREPARED", SHIPPED: "SHIPPED",
  IN_TRANSIT: "IN_TRANSIT", DELIVERED: "DELIVERED", CANCELED: "PENDING",
};

// ================================================================
// 4) Payment app: charges, payouts, balance_logs
// ================================================================
const COMMISSION_RATE = 0.12;
const charges = [];
const payouts = [];
const ledgerBySeller = new Map(); // clerkId -> [{at, type, amount, ref}]

for (const o of orders) {
  const chargeId = randomUUID();
  const status = o.isCanceled ? "refunded" : "approved";
  const productsSnapshot = o.lines.map((l) => ({
    productId: l.product.id, title: l.product.title, quantity: l.quantity, unitPrice: l.unitPrice,
  }));
  const charge = {
    id: chargeId,
    buyer_id: o.buyer.clerkId,
    order_id: o.externalOrderId,
    amount: o.totalPrice,
    status,
    mp_payment_id: `MP-${ri(100000000, 999999999)}`,
    products: productsSnapshot,
    shipping_address: o.buyer.address,
    created_at: o.createdAt,
  };
  charges.push(charge);
  o.charge = charge;

  if (o.isCanceled) continue;

  const netAmount = round2(o.totalPrice * (1 - COMMISSION_RATE));
  if (!ledgerBySeller.has(o.seller.clerkId)) ledgerBySeller.set(o.seller.clerkId, []);
  ledgerBySeller.get(o.seller.clerkId).push({
    at: o.createdAt, type: "venta", amountChange: netAmount, refId: chargeId,
  });

  // payout decision
  let payoutStatus = null;
  let payoutAt = null;
  if (o.daysAgo >= 14) {
    payoutStatus = "paid";
    payoutAt = addDays(o.createdAt, rfloat(5, 12));
  } else if (o.daysAgo >= 5 && chance(0.7)) {
    if (chance(0.8)) {
      payoutStatus = "paid";
      payoutAt = addDays(o.createdAt, rfloat(3, Math.max(3.2, o.daysAgo - 1)));
    } else {
      payoutStatus = "pending";
      payoutAt = addDays(NOW, -rfloat(0, 2));
    }
  }
  if (payoutAt && payoutAt > NOW) payoutAt = NOW;

  if (payoutStatus) {
    const payoutId = randomUUID();
    payouts.push({
      id: payoutId, seller_id: o.seller.clerkId, amount: netAmount,
      status: payoutStatus, charge_id: chargeId, created_at: payoutAt,
    });
    if (payoutStatus === "paid") {
      ledgerBySeller.get(o.seller.clerkId).push({
        at: payoutAt, type: "payout", amountChange: -netAmount, refId: payoutId,
      });
    }
  }
}

// build balance_logs sequentially per seller, and final balances
const balanceLogs = [];
const finalBalance = new Map();
let balanceLogId = 1;
for (const seller of sellers) {
  const events = (ledgerBySeller.get(seller.clerkId) ?? []).slice().sort((a, b) => a.at - b.at);
  let prev = 0;
  for (const ev of events) {
    const next = round2(prev + ev.amountChange);
    balanceLogs.push({
      id: balanceLogId++,
      user_id: seller.clerkId,
      amount_change: ev.amountChange,
      previous_balance: prev,
      new_balance: next,
      transaction_type: ev.type,
      reference_id: ev.refId,
      created_at: ev.at,
    });
    prev = next;
  }
  finalBalance.set(seller.clerkId, prev);
}
for (const buyer of buyers) finalBalance.set(buyer.clerkId, 0);

// ================================================================
// 5) Shipping app: Shipment + TrackingEvent
// ================================================================
const shipments = [];
const trackingEvents = [];
let trkEvtN = 0;
let trkCodeN = 0;

const LOCATION_DESCRIPTIONS = {
  PENDING: ["Pedido confirmado, en espera de preparacion"],
  PREPARING: ["Paquete en preparacion en deposito del vendedor"],
  SHIPPED: ["Paquete despachado, en camino al centro de distribucion"],
  IN_TRANSIT: ["Paquete en transito hacia destino"],
  DELIVERED: ["Paquete entregado al destinatario"],
  CANCELED: ["Envio cancelado, pedido no despachado"],
};

for (const o of orders) {
  trkCodeN++;
  const shipmentId = `ship_${pad(trkCodeN, 4)}`;
  const originCity = pick(CITIES);
  const destCity = o.buyer.address.city;
  const estimatedDelivery = addDays(o.createdAt, ri(4, 9));
  const shipment = {
    id: shipmentId,
    orderId: o.externalOrderId,
    chargeId: o.charge.id,
    buyerId: o.buyer.clerkId,
    sellerId: o.seller.clerkId,
    courierId: o.isCanceled ? null : pick(COURIERS),
    productIds: o.lines.map((l) => l.product.id),
    status: o.finalStatus,
    trackingCode: `TRK-2026-${pad(trkCodeN, 6)}`,
    estimatedDelivery,
    addressSnapshot: o.buyer.address,
    createdAt: o.createdAt,
    updatedAt: o.stages[o.stages.length - 1].at,
  };
  shipments.push(shipment);
  o.shipment = shipment;

  for (const stage of o.stages) {
    trkEvtN++;
    trackingEvents.push({
      id: `trkevt_${pad(trkEvtN, 5)}`,
      shipmentId,
      status: stage.status,
      location: stage.status === "DELIVERED" ? destCity
        : stage.status === "PENDING" ? originCity
        : stage.status === "CANCELED" ? originCity
        : `${originCity} -> ${destCity}`,
      description: pick(LOCATION_DESCRIPTIONS[stage.status]),
      timestamp: stage.at,
    });
  }
}

// ================================================================
// 6) Buyer app: Cart / CartItem / OrderShadow
// ================================================================
const carts = [];
const cartItems = [];
const orderShadows = [];
let cartN = 0;
let cartItemN = 0;

const SHADOW_STATUS_MAP = {
  PENDING: "pending", PREPARING: "preparing", SHIPPED: "shipped",
  IN_TRANSIT: "in_transit", DELIVERED: "delivered", CANCELED: "canceled",
};

for (const buyer of buyers) {
  cartN++;
  const cartId = `cart_${pad(cartN, 4)}`;
  const isActive = true;
  carts.push({ id: cartId, userId: buyer.clerkId, isActive, createdAt: addDays(NOW, -ri(0, 12)) });

  const itemCount = chance(0.4) ? 0 : ri(1, 3);
  for (let k = 0; k < itemCount; k++) {
    cartItemN++;
    const prod = pick(products);
    const img = productImages.find((im) => im.productId === prod.id);
    cartItems.push({
      id: `cartitem_${pad(cartItemN, 5)}`,
      cartId,
      productId: prod.id,
      productName: prod.title,
      productImage: img.url,
      priceAtAdded: prod.price,
      quantity: chance(0.8) ? 1 : 2,
      size: prod.size,
    });
  }

  if (chance(0.15)) {
    cartN++;
    const oldCartId = `cart_${pad(cartN, 4)}`;
    carts.push({ id: oldCartId, userId: buyer.clerkId, isActive: false, createdAt: addDays(NOW, -ri(30, 80)) });
  }
}

for (const o of orders) {
  orderShadows.push({
    id: `shadow_${o.id.replace("ord_", "")}`,
    externalOrderId: o.externalOrderId,
    userId: o.buyer.clerkId,
    cartId: null,
    status: SHADOW_STATUS_MAP[o.finalStatus],
    totalAmount: o.totalPrice,
    trackingId: o.shipment.trackingCode,
    createdAt: o.createdAt,
  });
}

// ================================================================
// 7) Feedback app: ReviewEligibility, Review, ReviewReport, RatingsCache
// ================================================================
const eligibilities = [];
const reviews = [];
const reports = [];
let eligN = 0;
let revN = 0;
let reportN = 0;

const COMMENTS = {
  5: [
    "Excelente camiseta, llego perfecta y en tiempo. El vendedor fue muy atento.",
    "Calidad excelente, tal como en las fotos. Totalmente recomendable.",
    "Llego antes de lo esperado y la talla fue exacta. Muy conforme.",
    "Hermosa camiseta, bordado impecable. Volveria a comprar sin dudarlo.",
  ],
  4: [
    "Muy buena calidad, fiel a las fotos. Demoro un poco mas de lo esperado pero llego bien.",
    "Cumple lo esperado, buena atencion del vendedor. Un detalle menor en el empaque.",
    "Buena camiseta, se ve como en la descripcion. Recomendada.",
  ],
  3: [
    "La camiseta era buena pero el talle no coincidia con la descripcion.",
    "Calidad aceptable, aunque esperaba mejor terminacion en el estampado.",
    "Cumple pero tardo bastante en llegar. El producto en si esta bien.",
  ],
  2: [
    "El bordado estaba mal hecho y el color no era el mismo que en las fotos.",
    "La tela se siente mas fina de lo que esperaba, un poco decepcionante.",
    "Demoro mucho el envio y el producto llego con el empaque danado.",
  ],
  1: [
    "Contenido inapropiado ocultado por moderacion.",
    "Producto totalmente distinto al de las fotos, muy decepcionante.",
    "Llego danado y el vendedor no respondio los mensajes.",
  ],
};

function moderationFor(rating) {
  const roll = rf();
  if (rating <= 2) {
    if (roll < 0.35) {
      return { status: "HIDDEN", isModerated: true, reason: `Moderacion automatica (local): REJECTED. Score local: ${ri(60, 90)}. Indicadores: ofensivo, spam.` };
    }
    return { status: "PUBLISHED", isModerated: true, reason: `Moderacion automatica (claude): APPROVED. Score local: ${ri(15, 40)}. Indicadores: lenguaje negativo.` };
  }
  if (rating === 3) {
    if (roll < 0.25) {
      return { status: "PUBLISHED", isModerated: true, reason: `Moderacion automatica (claude): APPROVED. Score local: ${ri(15, 30)}. Indicadores: spam.` };
    }
    return { status: "PUBLISHED", isModerated: false, reason: "Moderacion automatica (local): APPROVED. Score local: 0. Indicadores: sin indicadores locales." };
  }
  if (roll < 0.05) {
    return { status: "PUBLISHED", isModerated: true, reason: `Moderacion automatica (claude): APPROVED. Score local: ${ri(10, 20)}. Indicadores: link externo.` };
  }
  return { status: "PUBLISHED", isModerated: false, reason: "Moderacion automatica (local): APPROVED. Score local: 0. Indicadores: sin indicadores locales." };
}

function ratingRoll() {
  const r = rf();
  if (r < 0.45) return 5;
  if (r < 0.72) return 4;
  if (r < 0.86) return 3;
  if (r < 0.95) return 2;
  return 1;
}

for (const o of orders) {
  if (o.isCanceled || o.finalStatus !== "DELIVERED") continue;
  eligN++;
  const willReview = chance(0.6);
  const eligId = `elig_${pad(eligN, 4)}`;

  const rating = ratingRoll();
  const mod = willReview ? moderationFor(rating) : null;

  eligibilities.push({
    id: eligId,
    orderId: o.externalOrderId,
    shipmentId: o.shipment.id,
    buyerId: o.buyer.clerkId,
    sellerId: o.seller.clerkId,
    productIds: o.lines.map((l) => l.product.id),
    deliveredAt: o.deliveredAt,
    enabled: !willReview,
    createdAt: o.deliveredAt,
  });

  if (!willReview) continue;

  revN++;
  const reviewedProduct = pick(o.lines).product;
  const createdAt = addDays(o.deliveredAt, rfloat(0.5, 7));
  let status = mod.status;
  let updatedAt = createdAt;

  // small handful get admin-deleted later, for admin-view coverage
  if (status === "HIDDEN" && chance(0.25)) {
    status = "DELETED";
    updatedAt = addDays(createdAt, rfloat(1, 5));
  }

  const review = {
    id: `rev_${pad(revN, 4)}`,
    orderId: o.externalOrderId,
    buyerId: o.buyer.clerkId,
    sellerId: o.seller.clerkId,
    productId: reviewedProduct.id,
    ratingProduct: rating,
    comment: pick(COMMENTS[rating]),
    status,
    isModerated: mod.isModerated || status === "DELETED",
    moderationReason: mod.reason,
    createdAt,
    updatedAt,
  };
  reviews.push(review);
  o.review = review;
}

// ReviewReports: sample from HIDDEN/DELETED/low-rating PUBLISHED reviews
const reportable = reviews.filter((r) => r.status !== "PUBLISHED" || r.ratingProduct <= 2);
const reportPool = reportable.length > 0 ? reportable : reviews;
const NUM_REPORTS = Math.min(12, reportPool.length);
const shuffledReportable = reportPool.slice().sort(() => rf() - 0.5);
const REPORT_REASONS = [
  "El comentario contiene lenguaje ofensivo y datos personales.",
  "La resena describe un producto diferente al que fue comprado.",
  "Posible resena falsa.",
  "Contenido spam o publicidad no relacionada.",
  "Lenguaje inapropiado hacia el vendedor.",
];
for (let i = 0; i < NUM_REPORTS; i++) {
  reportN++;
  const review = shuffledReportable[i];
  const reporter = chance(0.5) ? pick([CANON_MODERATOR, CANON_ADMIN]) : pick(buyers).clerkId;
  const statusRoll = rf();
  const status = statusRoll < 0.4 ? "OPEN" : statusRoll < 0.8 ? "RESOLVED" : "DISMISSED";
  reports.push({
    id: `report_${pad(reportN, 3)}`,
    reviewId: review.id,
    reporterId: reporter,
    reason: pick(REPORT_REASONS),
    status,
    createdAt: addDays(review.createdAt, rfloat(0.2, 4)),
  });
}

// RatingsCache — replicate lib/ratings-cache.ts exactly
const publishedReviews = reviews.filter((r) => r.status === "PUBLISHED");
const productCache = new Map(); // productId -> {sum,count,sellerId}
for (const r of publishedReviews) {
  if (!productCache.has(r.productId)) productCache.set(r.productId, { sum: 0, count: 0, sellerId: r.sellerId });
  const c = productCache.get(r.productId);
  c.sum += r.ratingProduct;
  c.count += 1;
}
const ratingsCacheRows = [];
for (const [productId, c] of productCache.entries()) {
  ratingsCacheRows.push({
    targetId: productId, targetType: "PRODUCT",
    averageRating: round2(c.sum / c.count), totalReviews: c.count,
  });
}
const sellerProductAverages = new Map(); // sellerId -> [{avg,count}]
for (const [productId, c] of productCache.entries()) {
  if (!sellerProductAverages.has(c.sellerId)) sellerProductAverages.set(c.sellerId, []);
  sellerProductAverages.get(c.sellerId).push({ avg: round2(c.sum / c.count), count: c.count });
}
for (const [sellerId, arr] of sellerProductAverages.entries()) {
  const avgOfAvgs = round2(arr.reduce((s, x) => s + x.avg, 0) / arr.length);
  const totalReviews = arr.reduce((s, x) => s + x.count, 0);
  ratingsCacheRows.push({ targetId: sellerId, targetType: "SELLER", averageRating: avgOfAvgs, totalReviews });
}

// ================================================================
// SQL EMISSION
// ================================================================
function insertBlock(app, table, columns, rows, rowToValues, conflictCols, updateCols) {
  if (rows.length === 0) return;
  header(app, `${table} (${rows.length} filas)`);
  const CHUNK = 200;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const lines = chunk.map((r) => `  (${rowToValues(r).join(",")})`);
    let stmt = `INSERT INTO "${table}" (${columns.map((c) => `"${c}"`).join(",")})\nVALUES\n${lines.join(",\n")}`;
    if (conflictCols) {
      stmt += `\nON CONFLICT (${conflictCols.map((c) => `"${c}"`).join(",")}) DO UPDATE SET\n`;
      stmt += updateCols.map((c) => `  "${c}" = EXCLUDED."${c}"`).join(",\n");
    }
    stmt += ";";
    sql[app].push(stmt);
  }
  sql[app].push("");
}

// ---------- sellerapp.sql ----------
sql.seller.push(
  "-- Seed multi-app El Loco Casaca — SELLER APP",
  "-- Generado automaticamente (seeds/generate-seeds.mjs). Idempotente via ON CONFLICT.",
  "-- clerkIds sinteticos (user_seed_*) son placeholders: solo el seller canonico",
  "-- (seller.feedback@example.com) corresponde a una cuenta Clerk real de demo.",
  "",
);
insertBlock("seller", "Category", ["id", "name"], CATEGORY_DEFS,
  (c) => [esc(c.id), esc(c.name)], ["id"], ["name"]);

insertBlock("seller", "User", ["clerkId", "email", "name", "description", "isVerified", "createdAt"], sellers,
  (u) => [esc(u.clerkId), esc(u.email), esc(u.name), esc(u.description), u.isVerified, ts(u.createdAt)],
  ["clerkId"], ["email", "name", "description", "isVerified"]);

insertBlock("seller", "Product",
  ["id", "sellerId", "title", "description", "price", "stock", "categoryId", "season", "team", "size", "version", "createdAt"],
  products,
  (p) => [esc(p.id), esc(p.sellerId), esc(p.title), esc(p.description), p.price, p.stock, esc(p.categoryId), esc(p.season), esc(p.team), esc(p.size), esc(p.version), ts(p.createdAt)],
  ["id"], ["price", "stock", "team", "season"]);

insertBlock("seller", "ProductImage", ["id", "url", "productId"], productImages,
  (im) => [esc(im.id), esc(im.url), esc(im.productId)], ["id"], ["url"]);

insertBlock("seller", "Order", ["id", "externalOrderId", "buyerId", "sellerId", "totalPrice", "status", "createdAt"],
  orders,
  (o) => [esc(o.id), esc(o.externalOrderId), esc(o.buyer.clerkId), esc(o.seller.clerkId), o.totalPrice, esc(ORDER_STATUS_MAP[o.finalStatus]), ts(o.createdAt)],
  ["id"], ["status"]);

const orderDetailRows = [];
for (const o of orders) {
  for (const l of o.lines) {
    orderDetailRows.push({
      id: `detail_${o.id.replace("ord_", "")}_${l.product.id}`,
      productId: l.product.id, orderId: o.id, quantity: l.quantity,
      unitPrice: l.unitPrice, totalPrice: l.totalPrice, createdAt: o.createdAt,
    });
  }
}
insertBlock("seller", "OrderDetail", ["id", "productId", "orderId", "quantity", "unitPrice", "totalPrice", "createdAt"],
  orderDetailRows,
  (d) => [esc(d.id), esc(d.productId), esc(d.orderId), d.quantity, d.unitPrice, d.totalPrice, ts(d.createdAt)],
  ["id"], ["quantity", "totalPrice"]);

// ---------- buyerapp.sql ----------
sql.buyer.push(
  "-- Seed multi-app El Loco Casaca — BUYER APP",
  "-- Generado automaticamente (seeds/generate-seeds.mjs). Idempotente via ON CONFLICT.",
  "-- clerkIds sinteticos (user_seed_*) son placeholders: solo el buyer canonico",
  "-- (buyer.feedback@example.com) corresponde a una cuenta Clerk real de demo.",
  "",
);
insertBlock("buyer", "User", ["clerkId", "email", "name", "address", "createdAt", "updatedAt"], buyers,
  (u) => [esc(u.clerkId), esc(u.email), esc(u.name), esc(`${u.address.street}, ${u.address.city}, ${u.address.province}, ${u.address.country}`), ts(u.createdAt), ts(u.createdAt)],
  ["clerkId"], ["email", "name", "address"]);

insertBlock("buyer", "Cart", ["id", "userId", "isActive", "createdAt"], carts,
  (c) => [esc(c.id), esc(c.userId), c.isActive, ts(c.createdAt)], ["id"], ["isActive"]);

insertBlock("buyer", "CartItem", ["id", "cartId", "productId", "productName", "productImage", "priceAtAdded", "quantity", "size"], cartItems,
  (ci) => [esc(ci.id), esc(ci.cartId), esc(ci.productId), esc(ci.productName), esc(ci.productImage), ci.priceAtAdded, ci.quantity, esc(ci.size)],
  ["id"], ["quantity"]);

insertBlock("buyer", "OrderShadow", ["id", "externalOrderId", "userId", "cartId", "status", "totalAmount", "trackingId", "createdAt"], orderShadows,
  (os) => [esc(os.id), esc(os.externalOrderId), esc(os.userId), os.cartId === null ? "NULL" : esc(os.cartId), esc(os.status), os.totalAmount, esc(os.trackingId), ts(os.createdAt)],
  ["externalOrderId"], ["status", "trackingId"]);

// ---------- paymentapp.sql ----------
sql.payment.push(
  "-- Seed multi-app El Loco Casaca — PAYMENT APP",
  "-- Generado automaticamente (seeds/generate-seeds.mjs). Idempotente via ON CONFLICT.",
  "-- balance_logs usa ids explicitos (autoincrement); al final se resincroniza la secuencia.",
  "",
);
const paymentUsers = [
  ...sellers.map((s) => ({ clerk_id: s.clerkId, balance: finalBalance.get(s.clerkId) ?? 0, created_at: s.createdAt })),
  ...buyers.map((b) => ({ clerk_id: b.clerkId, balance: 0, created_at: b.createdAt })),
];
insertBlock("payment", "users", ["clerk_id", "balance", "created_at", "updated_at"], paymentUsers,
  (u) => [esc(u.clerk_id), u.balance, ts(u.created_at), ts(u.created_at)],
  ["clerk_id"], ["balance"]);

insertBlock("payment", "charges", ["id", "buyer_id", "order_id", "amount", "status", "mp_payment_id", "products", "shipping_address", "created_at"], charges,
  (c) => [esc(c.id), esc(c.buyer_id), esc(c.order_id), c.amount, esc(c.status), esc(c.mp_payment_id), jsonLit(c.products), jsonLit(c.shipping_address), ts(c.created_at)],
  ["id"], ["status"]);

insertBlock("payment", "payouts", ["id", "seller_id", "amount", "status", "charge_id", "created_at"], payouts,
  (p) => [esc(p.id), esc(p.seller_id), p.amount, esc(p.status), esc(p.charge_id), ts(p.created_at)],
  ["id"], ["status"]);

insertBlock("payment", "balance_logs", ["id", "user_id", "amount_change", "previous_balance", "new_balance", "transaction_type", "reference_id", "created_at"], balanceLogs,
  (b) => [b.id, esc(b.user_id), b.amount_change, b.previous_balance, b.new_balance, esc(b.transaction_type), esc(b.reference_id), ts(b.created_at)],
  ["id"], ["new_balance"]);
sql.payment.push(
  `SELECT setval(pg_get_serial_sequence('balance_logs','id'), GREATEST((SELECT MAX(id) FROM balance_logs), 1));`,
  "",
);

// ---------- shippingapp.sql ----------
sql.shipping.push(
  "-- Seed multi-app El Loco Casaca — SHIPPING APP",
  "-- Generado automaticamente (seeds/generate-seeds.mjs). Idempotente via ON CONFLICT.",
  "",
);
insertBlock("shipping", "shipments",
  ["id", "order_id", "charge_id", "buyer_id", "seller_id", "courierId", "productIds", "status", "tracking_code", "estimated_delivery", "address_snapshot", "created_at", "updated_at"],
  shipments,
  (s) => [esc(s.id), esc(s.orderId), esc(s.chargeId), esc(s.buyerId), esc(s.sellerId), s.courierId === null ? "NULL" : esc(s.courierId), arrLit(s.productIds), esc(s.status), esc(s.trackingCode), ts(s.estimatedDelivery), jsonLit(s.addressSnapshot), ts(s.createdAt), ts(s.updatedAt)],
  ["id"], ["status", "updated_at"]);

insertBlock("shipping", "tracking_events", ["id", "shipment_id", "status", "location", "description", "timestamp"], trackingEvents,
  (e) => [esc(e.id), esc(e.shipmentId), esc(e.status), esc(e.location), esc(e.description), ts(e.timestamp)],
  ["id"], ["status"]);

// ---------- feedbackapp (prisma/mock-feedback.sql) ----------
sql.feedback.push(
  "-- Mock seed for Feedback App — El Loco Casaca",
  "-- Generado automaticamente (seeds/generate-seeds.mjs) a partir de ~90 dias de",
  "-- actividad simulada y consistente con sellerapp / buyerapp / paymentapp / shippingapp.",
  "--",
  "-- Roles canonicos (cuentas Clerk reales de demo):",
  "--   buyer     -> buyer.feedback@example.com",
  "--   seller    -> seller.feedback@example.com",
  "--   moderator -> moderator.feedback@example.com",
  "--   admin     -> admin.feedback@example.com",
  "-- El resto de los clerkIds (user_seed_*) son placeholders sinteticos, no",
  "-- corresponden a cuentas reales de Clerk.",
  "--",
  "-- Run with:  npm run seed:mock",
  "",
);
insertBlock("feedback", "ReviewEligibility", ["id", "orderId", "shipmentId", "buyerId", "sellerId", "productIds", "deliveredAt", "enabled", "createdAt"], eligibilities,
  (e) => [esc(e.id), esc(e.orderId), esc(e.shipmentId), esc(e.buyerId), esc(e.sellerId), arrLit(e.productIds), ts(e.deliveredAt), e.enabled, ts(e.createdAt)],
  ["orderId"], ["buyerId", "sellerId", "productIds", "deliveredAt", "enabled"]);

insertBlock("feedback", "Review", ["id", "orderId", "buyerId", "sellerId", "productId", "ratingProduct", "comment", "status", "isModerated", "moderationReason", "createdAt", "updatedAt"], reviews,
  (r) => [esc(r.id), esc(r.orderId), esc(r.buyerId), esc(r.sellerId), esc(r.productId), r.ratingProduct, esc(r.comment), esc(r.status), r.isModerated, esc(r.moderationReason), ts(r.createdAt), ts(r.updatedAt)],
  ["orderId"], ["ratingProduct", "comment", "status", "isModerated", "moderationReason", "updatedAt"]);

insertBlock("feedback", "ReviewReport", ["id", "reviewId", "reporterId", "reason", "status", "createdAt"], reports,
  (r) => [esc(r.id), esc(r.reviewId), esc(r.reporterId), esc(r.reason), esc(r.status), ts(r.createdAt)],
  ["id"], ["reason", "status"]);

insertBlock("feedback", "RatingsCache", ["targetId", "targetType", "averageRating", "totalReviews"], ratingsCacheRows,
  (c) => [esc(c.targetId), esc(c.targetType), c.averageRating, c.totalReviews],
  ["targetId", "targetType"], ["averageRating", "totalReviews"]);

// ================================================================
// write files
// ================================================================
const outDir = process.argv[2];
mkdirSync(outDir, { recursive: true });
writeFileSync(`${outDir}/01-sellerapp.sql`, sql.seller.join("\n"));
writeFileSync(`${outDir}/02-buyerapp.sql`, sql.buyer.join("\n"));
writeFileSync(`${outDir}/03-paymentapp.sql`, sql.payment.join("\n"));
writeFileSync(`${outDir}/04-shippingapp.sql`, sql.shipping.join("\n"));
writeFileSync(`${outDir}/05-feedbackapp.sql`, sql.feedback.join("\n"));

// summary
console.log(JSON.stringify({
  sellers: sellers.length, buyers: buyers.length, categories: CATEGORY_DEFS.length,
  products: products.length, productImages: productImages.length,
  orders: orders.length, canceledOrders: orders.filter(o => o.isCanceled).length,
  orderDetails: orderDetailRows.length,
  charges: charges.length, payouts: payouts.length, balanceLogs: balanceLogs.length,
  carts: carts.length, cartItems: cartItems.length, orderShadows: orderShadows.length,
  shipments: shipments.length, trackingEvents: trackingEvents.length,
  eligibilities: eligibilities.length, reviews: reviews.length,
  publishedReviews: publishedReviews.length, reports: reports.length,
  ratingsCacheRows: ratingsCacheRows.length,
  finalSellerBalances: sellers.map(s => ({ seller: s.clerkId, balance: finalBalance.get(s.clerkId) })),
}, null, 2));
