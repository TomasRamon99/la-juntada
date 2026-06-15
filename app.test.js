import { describe, it, expect } from "vitest";

// ── Funciones puras copiadas de app.js ──────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9);
const DEFAULT_RULES = [];

function normalize(s) {
  s.people = (s.people || []).map(p => ({
    id: p.id || uid(), name: p.name || "", toma: !!p.toma,
    postre: (p.postre !== false), alias: p.alias || ""
  }));
  s.items = (s.items || []).map(i => ({
    id: i.id || uid(), name: i.name || "", price: +i.price || 0,
    cat: ["comida", "bebida", "extras", "postre"].includes(i.cat) ? i.cat : "comida",
    payer: i.payer || ""
  }));
  s.rounding = [0, 500, 1000].includes(s.rounding) ? s.rounding : 0;
  s.rules = Array.isArray(s.rules) ? s.rules.filter(r => typeof r === "string") : DEFAULT_RULES.slice();
  s.planType = s.planType || "asado";
  s.planSplit = (s.planSplit !== false);
  s.planDrink = (s.planDrink !== false);
  s.planDessert = !!s.planDessert;
  s.planH = Number.isFinite(+s.planH) ? +s.planH : 4;
  s.planM = Number.isFinite(+s.planM) ? +s.planM : 3;
  s.planN = Number.isFinite(+s.planN) ? +s.planN : 7;
  const validPayers = new Set(s.people.map(p => p.id));
  s.items.forEach(i => { if (i.payer && !validPayers.has(i.payer)) i.payer = ""; });
  return s;
}

function compute(state) {
  const np = state.people.length;
  const sumCat = c => state.items.filter(i => i.cat === c).reduce((s, i) => s + (+i.price || 0), 0);
  const comida = sumCat("comida"), bebida = sumCat("bebida"), extras = sumCat("extras"), postre = sumCat("postre");
  let drinkers = state.people.filter(p => p.toma);
  if (drinkers.length === 0) drinkers = state.people.slice();
  const dset = new Set(drinkers.map(p => p.id));
  let eaters = state.people.filter(p => p.postre);
  if (eaters.length === 0) eaters = state.people.slice();
  const eset = new Set(eaters.map(p => p.id));
  const comidaShare = np ? comida / np : 0;
  const extrasShare = np ? extras / np : 0;
  const bebidaShare = drinkers.length ? bebida / drinkers.length : 0;
  const postreShare = eaters.length ? postre / eaters.length : 0;
  const pp = state.people.map(p => {
    const toma = dset.has(p.id);
    const come = eset.has(p.id);
    const rawShare = comidaShare + extrasShare + (toma ? bebidaShare : 0) + (come ? postreShare : 0);
    const paid = state.items.filter(i => i.payer === p.id).reduce((s, i) => s + (+i.price || 0), 0);
    return { id: p.id, name: p.name, toma, come, comidaShare, extrasShare, bebidaShare: toma ? bebidaShare : 0, postreShare: come ? postreShare : 0, share: rawShare, rawShare, paid, balance: paid - rawShare };
  });
  return { comida, bebida, extras, postre, total: comida + bebida + extras + postre, np, nDrinkers: drinkers.length, nEaters: eaters.length, comidaShare, bebidaShare, extrasShare, postreShare, pp };
}

function settle(pp) {
  const cr = pp.filter(p => p.balance > 0.5).map(p => ({ ...p, bal: p.balance })).sort((a, b) => b.bal - a.bal);
  const db = pp.filter(p => p.balance < -0.5).map(p => ({ ...p, bal: -p.balance })).sort((a, b) => b.bal - a.bal);
  const t = []; let i = 0, j = 0;
  while (i < db.length && j < cr.length) {
    const pay = Math.min(db[i].bal, cr[j].bal);
    t.push({ from: db[i].name, to: cr[j].name, amount: pay });
    db[i].bal -= pay; cr[j].bal -= pay;
    if (db[i].bal < 0.5) i++;
    if (cr[j].bal < 0.5) j++;
  }
  return t;
}

// ── Helpers para armar estado de prueba ──────────────────────────────────────
function mkPerson(name, { toma = true, postre = true } = {}) {
  return { id: name, name, toma, postre, alias: "" };
}
function mkItem(name, price, cat, payer = "") {
  return { id: uid(), name, price, cat, payer };
}

// ── Tests ────────────────────────────────────────────────────────────────────
describe("normalize()", () => {
  it("completa campos faltantes con defaults", () => {
    const s = normalize({ people: [{ name: "Ana" }], items: [] });
    expect(s.people[0].id).toBeTruthy();
    expect(s.people[0].toma).toBe(false);   // !!undefined = false
    expect(s.people[0].postre).toBe(true);  // postre !== false → true
    expect(s.rounding).toBe(0);
    expect(s.planH).toBe(4);
  });

  it("rechaza categoria invalida y usa 'comida' por defecto", () => {
    const s = normalize({ people: [], items: [{ name: "algo", price: 100, cat: "INVALIDA" }] });
    expect(s.items[0].cat).toBe("comida");
  });

  it("limpia payer huerfano si la persona no existe", () => {
    const s = normalize({
      people: [{ id: "p1", name: "Luis" }],
      items: [{ id: "i1", name: "Carne", price: 1000, cat: "comida", payer: "FANTASMA" }]
    });
    expect(s.items[0].payer).toBe("");
  });

  it("conserva payer valido", () => {
    const s = normalize({
      people: [{ id: "p1", name: "Luis" }],
      items: [{ id: "i1", name: "Carne", price: 1000, cat: "comida", payer: "p1" }]
    });
    expect(s.items[0].payer).toBe("p1");
  });
});

describe("compute()", () => {
  it("comida se divide entre todos por igual", () => {
    const state = {
      people: [mkPerson("A"), mkPerson("B"), mkPerson("C")],
      items: [mkItem("Carne", 3000, "comida")]
    };
    const c = compute(state);
    expect(c.comidaShare).toBeCloseTo(1000);
    c.pp.forEach(p => expect(p.comidaShare).toBeCloseTo(1000));
  });

  it("bebida solo entre los que toman", () => {
    const state = {
      people: [mkPerson("Toma", { toma: true }), mkPerson("NoToma", { toma: false })],
      items: [mkItem("Fernet", 2000, "bebida")]
    };
    const c = compute(state);
    expect(c.bebidaShare).toBeCloseTo(2000); // solo 1 toma
    expect(c.pp.find(p => p.name === "Toma").bebidaShare).toBeCloseTo(2000);
    expect(c.pp.find(p => p.name === "NoToma").bebidaShare).toBe(0);
  });

  it("postre solo entre los que comen postre", () => {
    const state = {
      people: [mkPerson("Come", { postre: true }), mkPerson("NoCome", { postre: false })],
      items: [mkItem("Helado", 1000, "postre")]
    };
    const c = compute(state);
    expect(c.pp.find(p => p.name === "Come").postreShare).toBeCloseTo(1000);
    expect(c.pp.find(p => p.name === "NoCome").postreShare).toBe(0);
  });

  it("si nadie toma, la bebida se divide entre todos", () => {
    const state = {
      people: [mkPerson("A", { toma: false }), mkPerson("B", { toma: false })],
      items: [mkItem("Agua", 1000, "bebida")]
    };
    const c = compute(state);
    expect(c.bebidaShare).toBeCloseTo(500);
  });

  it("total = comida + bebida + extras + postre", () => {
    const state = {
      people: [mkPerson("A")],
      items: [
        mkItem("Carne", 1000, "comida"),
        mkItem("Fernet", 500, "bebida"),
        mkItem("Carbon", 200, "extras"),
        mkItem("Helado", 300, "postre"),
      ]
    };
    const c = compute(state);
    expect(c.total).toBe(2000);
  });

  it("balance = lo que pago - lo que debe", () => {
    const pA = mkPerson("A");
    const state = {
      people: [pA, mkPerson("B")],
      items: [mkItem("Carne", 2000, "comida", "A")]  // A pago todo
    };
    const c = compute(state);
    const a = c.pp.find(p => p.name === "A");
    const b = c.pp.find(p => p.name === "B");
    expect(a.balance).toBeCloseTo(1000);   // pago 2000, debe 1000 → le deben 1000
    expect(b.balance).toBeCloseTo(-1000);  // pago 0, debe 1000 → debe 1000
  });
});

describe("settle()", () => {
  it("una transferencia simple entre dos personas", () => {
    const pp = [
      { name: "A", balance: 1000 },
      { name: "B", balance: -1000 },
    ];
    const t = settle(pp);
    expect(t).toHaveLength(1);
    expect(t[0].from).toBe("B");
    expect(t[0].to).toBe("A");
    expect(t[0].amount).toBeCloseTo(1000);
  });

  it("minimiza transferencias: 3 personas, 2 pagadores", () => {
    // A pago de mas, B pago de mas, C no pago nada
    const pp = [
      { name: "A", balance: 500 },
      { name: "B", balance: 500 },
      { name: "C", balance: -1000 },
    ];
    const t = settle(pp);
    expect(t).toHaveLength(2);
    const total = t.reduce((s, x) => s + x.amount, 0);
    expect(total).toBeCloseTo(1000);
  });

  it("sin pagos asignados no hay transferencias", () => {
    const pp = [
      { name: "A", balance: 0 },
      { name: "B", balance: 0 },
    ];
    expect(settle(pp)).toHaveLength(0);
  });

  it("balances casi cero (diferencia de centavos) no generan transferencia", () => {
    const pp = [
      { name: "A", balance: 0.3 },
      { name: "B", balance: -0.3 },
    ];
    expect(settle(pp)).toHaveLength(0);
  });
});
